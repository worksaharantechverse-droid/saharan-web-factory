import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

function loadDotEnv() {
  const envPath = path.join(moduleDir, '..', '.env')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) process.env[key] = value
  }
}

loadDotEnv()

function csv(value, fallback) {
  const str = value || fallback
  return str.split(',').map((s) => s.trim()).filter(Boolean)
}

function normalizeHost(value, fallback) {
  const host = value || fallback
  return host.replace(/\/+$/, '')
}

export const config = {
  port: Number(process.env.PORT) || 8787,
  host: process.env.HOST || '127.0.0.1',
  ollama: {
    host: normalizeHost(process.env.OLLAMA_HOST, 'http://127.0.0.1:11434'),
    model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b',
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS) || 180_000,
    temperature: Number(process.env.OLLAMA_TEMPERATURE) || 0.2,
    numCtx: Number(process.env.OLLAMA_NUM_CTX) || 8192,
  },
  corsOrigins: csv(
    process.env.CORS_ORIGINS,
    'http://localhost:5173,http://127.0.0.1:5173',
  ),
  plan: {
    retries: Number.isFinite(Number(process.env.PLAN_RETRIES))
      ? Math.max(0, Number(process.env.PLAN_RETRIES))
      : 1,
    maxPromptLength: 4000,
  },
  build: {
    // Kept OUTSIDE the repo tree: prevents the OpenCode agent's workspace-root
    // discovery from climbing into the monorepo, keeping each build isolated.
    workspaceDir:
      process.env.WORKSPACE_DIR ||
      path.resolve(moduleDir, '..', '..', '..', 'saharan-web-factory-workspace'),
    maxConcurrentBuilds: Number(process.env.MAX_CONCURRENT_BUILDS) || 1,
    maxRepairs: Number(process.env.MAX_REPAIRS) || 3,
    previewPortStart: Number(process.env.PREVIEW_PORT_START) || 4173,
    installTimeoutMs: Number(process.env.INSTALL_TIMEOUT_MS) || 10 * 60_000,
    buildTimeoutMs: Number(process.env.BUILD_TIMEOUT_MS) || 10 * 60_000,
    previewStartTimeoutMs: Number(process.env.PREVIEW_START_TIMEOUT_MS) || 45_000,
  },
  opencode: {
    bin: process.env.OPENCODE_BIN || '/opt/homebrew/bin/opencode',
    model: process.env.OPENCODE_MODEL || 'opencode/big-pickle',
    timeoutMs: Number(process.env.OPENCODE_TIMEOUT_MS) || 30 * 60_000,
  },
}