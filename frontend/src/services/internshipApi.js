/** Requests stay on the same origin; Vite proxies /api only during development. */
export async function fetchInternships({
  search = '',
  workMode = '',
  roleCategory = '',
  location = '',
  signal,
} = {}) {
  const params = new URLSearchParams()
  for (const [name, value] of Object.entries({
    search,
    workMode,
    roleCategory,
    location,
  })) {
    const term = value.trim()
    if (term) params.set(name, term)
  }
  const query = params.toString()
  const response = await fetch(`/api/internships${query ? `?${query}` : ''}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!response.ok)
    throw new Error(`Internship request failed (${response.status})`)
  const data = await response.json()
  if (!Array.isArray(data)) throw new Error('Unexpected internship response')
  return data
}

export async function fetchFilterOptions({ signal } = {}) {
  const response = await fetch('/api/internships/filter-options', {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!response.ok)
    throw new Error(`Filter options request failed (${response.status})`)
  const data = await response.json()
  for (const key of ['workModes', 'roleCategories', 'locations']) {
    if (
      !Array.isArray(data?.[key]) ||
      data[key].some((value) => typeof value !== 'string')
    )
      throw new Error('Unexpected filter options response')
  }
  return data
}
