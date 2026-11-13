export const APPLICATION_STATUSES = [
  'SAVED',
  'APPLIED',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
]

export function statusLabel(status) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export class ApplicationApiError extends Error {
  constructor(status) {
    super(`Application request failed (${status})`)
    this.status = status
  }
}

async function request(path, options = {}) {
  const response = await fetch(`/api/applications${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  if (!response.ok) throw new ApplicationApiError(response.status)
  return response.status === 204 ? undefined : response.json()
}

export async function fetchApplications({ signal } = {}) {
  const data = await request('', { signal })
  if (!Array.isArray(data)) throw new Error('Unexpected applications response')
  return data
}

export function saveApplication(internshipId) {
  return request('', { method: 'POST', body: JSON.stringify({ internshipId }) })
}

export function updateApplicationStatus(id, status) {
  return request(`/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function removeApplication(id) {
  return request(`/${id}`, { method: 'DELETE' })
}
