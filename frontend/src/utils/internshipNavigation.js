export function validInternshipId(id) {
  return /^[1-9]\d{0,18}$/.test(String(id)) && BigInt(id) <= 9223372036854775807n
}

export function readRoute(hash) {
  if (hash.startsWith('#/internships/')) {
    return { view: 'details', id: hash.slice('#/internships/'.length) }
  }
  const views = { '': 'explore', '#': 'explore', '#explore': 'explore', '#applications': 'applications', '#dashboard': 'dashboard', '#/compare': 'compare' }
  return views[hash] ? { view: views[hash], id: null } : null
}

export function internshipLink(id) {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = `/internships/${id}`
  return url.href
}

