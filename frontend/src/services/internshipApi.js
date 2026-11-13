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

export async function fetchInternshipPage({
  search = '',
  workMode = '',
  roleCategory = '',
  location = '',
  page = 0,
  size = 6,
  sort = 'lastVerifiedDate,desc',
  signal,
} = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({
    search,
    workMode,
    roleCategory,
    location,
  }))
    if (value.trim()) params.set(key, value.trim())
  params.set('page', String(page))
  params.set('size', String(size))
  params.set('sort', sort)
  const response = await fetch(`/api/internships?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!response.ok)
    throw new Error(`Internship request failed (${response.status})`)
  const data = await response.json()
  if (
    !Array.isArray(data?.content) ||
    !Number.isInteger(data.page) ||
    data.page < 0 ||
    !Number.isInteger(data.size) ||
    data.size < 1 ||
    !Number.isInteger(data.totalElements) ||
    data.totalElements < 0 ||
    !Number.isInteger(data.totalPages) ||
    data.totalPages < 0 ||
    typeof data.first !== 'boolean' ||
    typeof data.last !== 'boolean'
  )
    throw new Error('Unexpected internship page response')
  return data
}
