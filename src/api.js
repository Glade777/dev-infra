const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await response.json()
      if (body.error) message = body.error
    } else {
      const body = await response.text()
      if (body) message = body
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export const taskApi = {
  list: () => request('/tasks'),
  create: (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  update: (id, task) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(task) }),
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  health: () => request('/health'),
}
