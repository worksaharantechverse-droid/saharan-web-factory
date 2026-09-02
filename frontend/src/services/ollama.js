const OLLAMA_HOST = import.meta.env?.VITE_OLLAMA_HOST ?? 'http://localhost:11434'
const REQUEST_TIMEOUT_MS = 4000

function withTimeout(promise, ms = REQUEST_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Ollama request timed out'))
    }, ms)
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

export async function isOllamaReachable() {
  try {
    const res = await withTimeout(fetch(`${OLLAMA_HOST}/api/tags`))
    return res.ok
  } catch {
    return false
  }
}

export async function listOllamaModels() {
  const res = await withTimeout(fetch(`${OLLAMA_HOST}/api/tags`))
  if (!res.ok) throw new Error(`Ollama returned ${res.status}`)
  const data = await res.json()
  return data.models ?? []
}

export async function generateWithOllama({ model, prompt, stream = false }) {
  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream }),
  })
  if (!res.ok) throw new Error(`Ollama generate failed with ${res.status}`)
  return res.json()
}