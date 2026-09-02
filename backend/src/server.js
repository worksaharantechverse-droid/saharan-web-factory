import http from 'node:http'
import { config } from './config.js'
import { buildManager } from './build/manager.js'
import { listOllamaModels } from './ollama.js'
import { ERROR_CODES, planWebsite } from './planner.js'

const MAX_BODY_BYTES = 64 * 1024

function originAllowed(origin) {
  if (!origin) return false
  return config.corsOrigins.includes(origin)
}

function applyCors(req, res) {
  const origin = req.headers.origin
  if (origin && originAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body too large'), { code: 'BODY_TOO_LARGE' }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw.trim()) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(Object.assign(new Error('Request body must be valid JSON'), { code: 'BAD_JSON' }))
      }
    })
    req.on('error', reject)
  })
}

function mapError(err) {
  const detail = {
    error: {
      code: err.code || 'INTERNAL',
      message: err.message || 'Unexpected server error',
    },
  }
  if (err.status) return { status: err.status, detail }
  if (err.code === 'BODY_TOO_LARGE') return { status: 413, detail }
  if (err.code === 'BAD_JSON' || err.code === 'BAD_REQUEST') return { status: 400, detail }
  return { status: 500, detail }
}

async function handlePlan(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch (err) {
    const { status, detail } = mapError(err)
    sendJson(res, status, detail)
    return
  }

  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) {
    sendJson(res, 400, {
      error: { code: ERROR_CODES.BAD_REQUEST, message: 'prompt must be a non-empty string' },
    })
    return
  }
  if (prompt.length > config.plan.maxPromptLength) {
    sendJson(res, 413, {
      error: {
        code: ERROR_CODES.BAD_REQUEST,
        message: `prompt too long (max ${config.plan.maxPromptLength} characters)`,
      },
    })
    return
  }

  try {
    const result = await planWebsite(prompt)
    sendJson(res, 200, { prompt, ...result })
  } catch (err) {
    const { status, detail } = mapError(err)
    sendJson(res, status, detail)
  }
}

async function handleHealth(_req, res) {
  let models = []
  let online = false
  try {
    models = await listOllamaModels()
    online = true
  } catch {
    online = false
  }

  sendJson(res, 200, {
    status: 'ok',
    api: 'saharan-web-factory',
    version: '0.1.0',
    ollama: {
      host: config.ollama.host,
      online,
      model: config.ollama.model,
      installed: online ? models.some((m) => (m.name ?? m.model) === config.ollama.model) : false,
      models: models.map((m) => m.name ?? m.model),
    },
  })
}

async function handleBuildCreate(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch (err) {
    const { status, detail } = mapError(err)
    sendJson(res, status, detail)
    return
  }

  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) {
    sendJson(res, 400, {
      error: { code: ERROR_CODES.BAD_REQUEST, message: 'prompt must be a non-empty string' },
    })
    return
  }
  if (prompt.length > config.plan.maxPromptLength) {
    sendJson(res, 413, {
      error: {
        code: ERROR_CODES.BAD_REQUEST,
        message: `prompt too long (max ${config.plan.maxPromptLength} characters)`,
      },
    })
    return
  }

  try {
    const build = buildManager.create(prompt)
    sendJson(res, 200, { buildId: build.id, status: build.status })
  } catch (err) {
    const { status, detail } = mapError(err)
    sendJson(res, status, detail)
  }
}

async function handleBuildGet(req, res, buildId) {
  const snapshot = buildManager.snapshot(buildId)
  if (!snapshot) {
    sendJson(res, 404, { error: { code: 'NOT_FOUND', message: 'Build not found' } })
    return
  }
  sendJson(res, 200, snapshot)
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)

  applyCors(req, res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    await handleHealth(req, res)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/plan') {
    await handlePlan(req, res)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/build') {
    await handleBuildCreate(req, res)
    return
  }

  const buildMatch = url.pathname.match(/^\/api\/build\/([^/]+)$/)
  if (req.method === 'GET' && buildMatch) {
    await handleBuildGet(req, res, decodeURIComponent(buildMatch[1]))
    return
  }

  sendJson(res, 404, { error: { code: 'NOT_FOUND', message: 'Route not found' } })
}

const server = http.createServer((req, res) => {
  route(req, res).catch((err) => {
    const { status, detail } = mapError(err)
    sendJson(res, status, detail)
  })
})

server.listen(config.port, config.host, () => {
  console.log(`──────────────────────────────────────────────`)
  console.log(`  Saharan Web Factory backend`)
  console.log(`  API       http://${config.host}:${config.port}`)
  console.log(`  Ollama    ${config.ollama.host}  (model: ${config.ollama.model})`)
  console.log(`  CORS      ${config.corsOrigins.join(', ')}`)
  console.log(`  Builds    workspace=${config.build.workspaceDir}`)
  console.log(`  OpenCode  ${config.opencode.bin}  (model: ${config.opencode.model})`)
  console.log(`──────────────────────────────────────────────`)
})

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down preview servers`)
  buildManager.stopAll()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 2000)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))