import { generateJson, modelInstalled, listOllamaModels } from './ollama.js'
import { normalizeSpec, specSchemaExample } from './spec.js'
import { config } from './config.js'

const PLAN_SYSTEM_PROMPT = `You are a senior web architect and frontend planner. You convert a user's plain-language website request into a precise, buildable specification for a React + Vite single-page application.

Rules:
- Answer with ONLY one valid JSON object. No markdown, no code fences, no commentary.
- Use exactly this shape:

${specSchemaExample()}

Guidelines for a high quality spec:
- projectName: short, friendly, brandable name derived from the request.
- description: one paragraph describing purpose, audience and tone.
- framework must be "react" and buildTool must be "vite".
- pages: 5-12 focused pages appropriate to the type of site (e.g. Home, Catalogue, Product Detail, Cart, Checkout).
- components: 8-18 reusable components that map cleanly onto the pages.
- features: concrete functional capabilities drawn from the request (e.g. shopping cart, product filtering, reservation form, contact form).
- dependencies: only mainstream packages that work with React 19 and Vite. Leave empty if none are strictly needed.
- design: pick a clear style descriptor, 3-6 coherent colors as hex values, and one line for typography with specific font families.

The prompt request has a strong "AI" flavor. It is safe. Never fabricate a live backend or payment provider; keep dependencies realistic.
`

export const ERROR_CODES = {
  OLLAMA_OFFLINE: 'OLLAMA_OFFLINE',
  MODEL_MISSING: 'MODEL_MISSING',
  INVALID_SPEC: 'INVALID_SPEC',
  BAD_REQUEST: 'BAD_REQUEST',
}

function safeParseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    // tolerate markdown fences or surrounding prose around the JSON block
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  if (!candidate) return null
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

export async function planWebsite(prompt) {
  let ollamaAvailable = true
  let models = []

  try {
    models = await listOllamaModels()
  } catch {
    ollamaAvailable = false
  }

  if (!ollamaAvailable) {
    const err = new Error('Ollama is not reachable. Start it with "ollama serve" (http://127.0.0.1:11434).')
    err.code = ERROR_CODES.OLLAMA_OFFLINE
    err.status = 503
    throw err
  }

  if (!modelInstalled(models)) {
    const err = new Error(
      `Model ${config.ollama.model} is not installed. Pull it with: ollama pull ${config.ollama.model}`,
    )
    err.code = ERROR_CODES.MODEL_MISSING
    err.status = 422
    throw err
  }

  const attempts = config.plan.retries + 1
  let lastErrors = []
  const debugEnabled = process.env.DEBUG === '1'

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const startedAtMs = performance.now()

    const raw = await generateJson({
      system: PLAN_SYSTEM_PROMPT,
      prompt,
    })

    const parsed = safeParseJson(raw.response)
    if (debugEnabled) {
      console.log(`[plan] attempt ${attempt} raw head: ${raw.response.slice(0, 220)}`)
    }
    if (!parsed) {
      if (attempt < attempts) continue
      lastErrors.push(`output was not valid JSON (attempt ${attempt})`)
      break
    }

    const checked = normalizeSpec(parsed)
    if (checked.ok) {
      return {
        spec: checked.spec,
        model: config.ollama.model,
        latencyMs: Math.round(performance.now() - startedAtMs),
        attempts: attempt,
      }
    }

    lastErrors = checked.errors
    if (attempt < attempts) continue
  }

  const err = new Error(
    `Qwen returned a spec that failed validation: ${lastErrors.join('; ') || 'unknown'}`,
  )
  err.code = ERROR_CODES.INVALID_SPEC
  err.status = 502
  throw err
}