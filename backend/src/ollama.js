import { config } from './config.js'

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

export async function listOllamaModels() {
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(),
    Math.min(config.ollama.timeoutMs, 8_000),
  )
  try {
    const res = await fetch(`${config.ollama.host}/api/tags`, {
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Ollama returned HTTP ${res.status}`)
    const data = await res.json()
    return data.models ?? []
  } finally {
    clearTimeout(timer)
  }
}

export function modelInstalled(models, modelName = config.ollama.model) {
  return models.some((m) => (m.name ?? m.model) === modelName)
}

export async function generateJson({ system, prompt, temperature, numCtx }) {
  const response = await withTimeout(
    fetch(`${config.ollama.host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollama.model,
        system,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: temperature ?? config.ollama.temperature,
          num_ctx: numCtx ?? config.ollama.numCtx,
        },
      }),
    }),
    config.ollama.timeoutMs,
    `Ollama did not respond within ${config.ollama.timeoutMs}ms`,
  )

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Ollama generate failed (${response.status}): ${body.slice(0, 300)}`)
  }

  return response.json()
}