const API_HOST = import.meta.env?.VITE_API_HOST ?? 'http://localhost:8787'

async function request(path, options = {}) {
  const res = await fetch(`${API_HOST}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(
      detail?.error?.message || `API ${res.status}`,
      detail && { cause: detail.error?.code },
    )
  }
  return res.json()
}

export async function planWebsite(prompt) {
  return request('/api/plan', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })
}

export async function createBuild({ prompt, model }) {
  return request('/api/build', {
    method: 'POST',
    body: JSON.stringify({ prompt, model }),
  })
}

export async function getBuildStatus(buildId) {
  return request(`/api/build/${buildId}`)
}

export async function createDesignerRun({ prompt }) {
  return request('/api/designer/new', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })
}