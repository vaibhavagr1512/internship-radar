/** The Vite development proxy forwards same-origin /api requests to Spring Boot. */
export async function fetchInternships({ search = '', signal } = {}) {
  const term = search.trim()
  const params = new URLSearchParams()
  if (term) params.set('search', term)
  const response = await fetch(`/api/internships${term ? `?${params}` : ''}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!response.ok)
    throw new Error(`Internship request failed (${response.status})`)
  const data = await response.json()
  if (!Array.isArray(data)) throw new Error('Unexpected internship response')
  return data
}
