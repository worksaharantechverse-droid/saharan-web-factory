import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import { ERROR_CODES, planWebsite } from '../planner.js'
import { normalizeSpec } from '../spec.js'
import { codingPrompt, repairPrompt, runOpenCode } from './opencode.js'
import { findFreePort } from './ports.js'
import { createProject, writeBuildInstructions } from './project.js'
import { runProcess, spawnLongRunning } from './process.js'

const MAX_LOGS = 500

const STATUS = {
  PLANNING: 'planning',
  CREATING: 'creating',
  CODING: 'coding',
  BUILDING: 'building',
  TESTING: 'testing',
  READY: 'ready',
  FAILED: 'failed',
}

function nowStamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class BuildManager {
  constructor() {
    this.builds = new Map()
    this.activeCount = 0
    this.usedPorts = new Set()
  }

  snapshot(buildId) {
    const build = this.builds.get(buildId)
    if (!build) return null

    if (build.status === STATUS.READY && build.previewExited) {
      build.status = STATUS.FAILED
      build.error = 'Preview server exited unexpectedly'
      this.log(build, 'preview server exited unexpectedly', 'err')
    }

    return {
      id: build.id,
      prompt: build.prompt,
      status: build.status,
      spec: build.spec,
      previewUrl: build.previewUrl,
      error: build.error,
      logs: build.logs,
    }
  }

  create(prompt) {
    if (this.activeCount >= config.build.maxConcurrentBuilds) {
      const err = new Error(
        `A build is already in progress (max ${config.build.maxConcurrentBuilds} concurrent build). Try again once it finishes.`,
      )
      err.code = 'BUILD_BUSY'
      err.status = 409
      throw err
    }

    const buildId = crypto.randomUUID()
    const build = {
      id: buildId,
      prompt,
      status: STATUS.PLANNING,
      spec: null,
      previewUrl: null,
      error: null,
      logs: [],
      codeDir: null,
      port: null,
      previewProc: null,
      previewExited: false,
    }
    this.builds.set(buildId, build)
    this.activeCount += 1
    this.runBuild(build).finally(() => {
      this.activeCount -= 1
    })
    return build
  }

  log(build, text, tone = 'muted') {
    build.logs.push({ time: nowStamp(), text: String(text).slice(0, 1000), tone })
    if (build.logs.length > MAX_LOGS) {
      build.logs = build.logs.slice(-MAX_LOGS)
    }
  }

  async runBuild(build) {
    try {
      await this.plan(build)
      await this.createProject(build)
      await this.code(build)
      await this.buildWithRepairs(build)
      await this.preview(build)
      build.status = STATUS.READY
      this.log(build, 'build complete — site is live', 'ok')
    } catch (err) {
      build.status = STATUS.FAILED
      build.error = err?.message ?? String(err)
      this.log(build, `build failed: ${build.error}`, 'err')
    }
  }

  async plan(build) {
    this.log(build, 'understanding request — querying Ollama / qwen2.5-coder:7b')
    const result = await planWebsite(build.prompt)
    const checked = normalizeSpec(result.spec)
    if (!checked.ok) {
      const err = new Error(`Spec re-validation failed: ${checked.errors.join('; ')}`)
      err.code = ERROR_CODES.INVALID_SPEC
      throw err
    }
    build.spec = checked.spec
    this.log(build, `spec generated — ${build.spec.projectName} (${result.latencyMs}ms)`, 'ok')
    this.log(build, `pages: ${build.spec.pages.join(', ').slice(0, 200)}`, 'ok')
    this.log(build, `components: ${build.spec.components.join(', ').slice(0, 200)}`, 'ok')
  }

  async createProject(build) {
    build.status = STATUS.CREATING
    this.log(build, 'scaffolding isolated Vite + React project')
    build.codeDir = await createProject(config.build.workspaceDir, build.id, build.spec)
    await writeBuildInstructions(build.codeDir, {
      prompt: build.prompt,
      spec: build.spec,
      buildId: build.id,
    })
    this.log(build, `project created at ${path.relative(process.cwd(), build.codeDir)}`, 'ok')
    this.log(build, 'BUILD_INSTRUCTIONS.md written (original request + spec)', 'ok')
  }

  async code(build) {
    build.status = STATUS.CODING
    this.log(build, `launching OpenCode agent (${config.opencode.bin})`)
    const res = await runOpenCode({
      cwd: build.codeDir,
      prompt: codingPrompt(),
      onLine: (text) => this.log(build, text),
    })
    if (res.exitCode === 0) {
      this.log(build, `opencode finished in ${res.timedOut ? 'timeout' : 'ok'}`, 'ok')
    } else {
      this.log(build, `opencode exited with code ${res.exitCode}`, 'err')
    }
  }

  async ensureBuilt(build, runInstall) {
    const filters = {
      install: (line) => {
        const l = line.toLowerCase()
        return (
          l.includes('error') ||
          l.includes('warn deprecated') ||
          l.includes('added') ||
          l.includes('removed') ||
          l.includes('up to date')
        )
      },
      build: (line) => {
        const l = line.toLowerCase()
        return (
          l.includes('error') ||
          l.includes('✗') ||
          l.includes('built in') ||
          l.includes('vite v') ||
          l.includes('warn')
        )
      },
    }

    if (runInstall) {
      this.log(build, 'npm install — installing dependencies')
      const install = await runProcess({
        cmd: 'npm',
        args: ['install'],
        cwd: build.codeDir,
        timeoutMs: config.build.installTimeoutMs,
        onLine: (chunk) => {
          for (const line of chunk.split(/\r?\n/)) {
            if (filters.install(line)) this.log(build, line.trim())
          }
        },
      })
      if (install.exitCode === 0) {
        this.log(build, 'dependencies installed', 'ok')
      } else {
        this.log(build, `npm install exited with code ${install.exitCode}`, 'err')
      }
    }

    this.log(build, 'npm run build — compiling production bundle')
    const buildResult = await runProcess({
      cmd: 'npm',
      args: ['run', 'build'],
      cwd: build.codeDir,
      timeoutMs: config.build.buildTimeoutMs,
      onLine: (chunk) => {
        for (const line of chunk.split(/\r?\n/)) {
          if (filters.build(line)) this.log(build, line.trim())
        }
      },
    })

    if (buildResult.exitCode === 0) {
      this.log(build, 'production build succeeded', 'ok')
      return { ok: true, tail: '' }
    }

    const tail = `${buildResult.stdout}\n${buildResult.stderr}`.trim().slice(-8000)
    this.log(build, `build failed (exit ${buildResult.exitCode}${buildResult.timedOut ? ', timed out' : ''})`, 'err')
    return { ok: false, tail }
  }

  async buildWithRepairs(build) {
    build.status = STATUS.BUILDING
    let result = await this.ensureBuilt(build, true)

    let repairs = 0
    while (!result.ok && repairs < config.build.maxRepairs) {
      repairs += 1
      this.log(build, `requesting agent repair (${repairs}/${config.build.maxRepairs})`, 'err')
      const res = await runOpenCode({
        cwd: build.codeDir,
        prompt: repairPrompt(result.tail),
        onLine: (text) => this.log(build, text),
      })
      if (res.exitCode !== 0) {
        this.log(build, `repair agent exited with code ${res.exitCode}`, 'err')
      }
      result = await this.ensureBuilt(build, true)
    }

    if (!result.ok) {
      const err = new Error('Production build failed after repairs')
      err.code = 'BUILD_FAILED'
      throw err
    }
  }

  async preview(build) {
    build.status = STATUS.TESTING
    const distIndex = path.join(build.codeDir, 'dist', 'index.html')
    try {
      await fs.access(distIndex)
      this.log(build, 'dist bundle verified', 'ok')
    } catch {
      throw new Error('dist/index.html not found — build output missing')
    }

    const port = await this.allocatePort()
    build.port = port
    this.log(build, `starting Vite dev server on 127.0.0.1:${port}`)

    const proc = spawnLongRunning({
      cmd: 'npm',
      args: ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)],
      cwd: build.codeDir,
      onLine: (chunk) => {
        for (const line of chunk.split(/\r?\n/)) {
          const l = line.toLowerCase()
          if (l.includes('error') || l.includes('ready') || l.includes('local:')) {
            this.log(build, line.trim())
          }
        }
      },
    })
    build.previewProc = proc
    proc.child.on('exit', () => {
      build.previewExited = true
    })

    const ok = await this.waitForPreview(port)
    if (!ok) {
      throw new Error(`Preview server did not respond on port ${port}`)
    }
    build.previewUrl = `http://127.0.0.1:${port}`
    this.log(build, `preview server reachable at ${build.previewUrl}`, 'ok')
  }

  async allocatePort() {
    const start = config.build.previewPortStart
    let next = start
    while (this.usedPorts.has(next)) next += 1
    const port = await findFreePort(next, start + 500)
    this.usedPorts.add(port)
    return port
  }

  async waitForPreview(port) {
    const deadline = Date.now() + config.build.previewStartTimeoutMs
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/`)
        if (res.status === 200) return true
      } catch {
        // server not up yet
      }
      await sleep(500)
    }
    return false
  }

  stopAll() {
    for (const build of this.builds.values()) {
      if (build.previewProc) build.previewProc.kill()
    }
  }
}

export const buildManager = new BuildManager()