import { spawn } from 'node:child_process'

const MAX_CAPTURE = 120_000

function cap(str) {
  return str.length > MAX_CAPTURE ? str.slice(-MAX_CAPTURE) : str
}

function killTree(child, signal) {
  try {
    process.kill(-child.pid, signal)
  } catch {
    try {
      child.kill(signal)
    } catch {}
  }
}

export function runProcess({ cmd, args = [], cwd, timeoutMs = 60_000, env = {}, onLine }) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    })

    let stdout = ''
    let stderr = ''
    let settled = false
    let timedOut = false

    const timer = setTimeout(() => {
      if (settled) return
      timedOut = true
      killTree(child, 'SIGTERM')
      setTimeout(() => {
        if (!settled) killTree(child, 'SIGKILL')
      }, 1500)
    }, timeoutMs)

    const finish = (exitCode, extra = {}) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ exitCode, timedOut, stdout, stderr, ...extra })
    }

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      stdout = cap(stdout + text)
      onLine?.(text, 'out')
    })
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      stderr = cap(stderr + text)
      onLine?.(text, 'err')
    })
    child.on('error', (err) => finish(-1, { message: err.message }))
    child.on('exit', (code, signal) => finish(code ?? -1, { signal }))
  })
}

export function spawnLongRunning({ cmd, args = [], cwd, env = {}, onLine }) {
  const child = spawn(cmd, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })

  child.stdout.on('data', (chunk) => onLine?.(chunk.toString(), 'out'))
  child.stderr.on('data', (chunk) => onLine?.(chunk.toString(), 'err'))
  child.on('error', () => {})

  return {
    child,
    kill() {
      killTree(child, 'SIGTERM')
      setTimeout(() => killTree(child, 'SIGKILL'), 2500)
    },
  }
}