import { localDateKey } from './applicationDashboard.js'

export const APPLICATION_SORTS = {
  'updatedAt,desc': 'Last updated: newest first',
  'updatedAt,asc': 'Last updated: oldest first',
  'appliedDate,desc': 'Applied date: newest first',
  'appliedDate,asc': 'Applied date: oldest first',
}
export const DEADLINE_FILTERS = {
  ALL: 'All deadlines',
  TODAY: 'Due today',
  NEXT7: 'Next 7 days (including today)',
  PAST: 'Past deadline',
  NONE: 'No recorded deadline',
}

export function selectApplications(applications, {
  status = 'ALL', search = '', sort = 'updatedAt,desc', deadline = 'ALL', today = localDateKey(),
} = {}) {
  const term = search.trim().toLocaleLowerCase('en-US')
  const lastDay = new Date(`${today}T00:00:00Z`)
  lastDay.setUTCDate(lastDay.getUTCDate() + 6)
  const windowEnd = lastDay.toISOString().slice(0, 10)
  const selected = applications.filter((application) => {
    const role = application.internship
    if (status !== 'ALL' && application.status !== status) return false
    if (term && ![role.title, role.company].some((text) => text.toLocaleLowerCase('en-US').includes(term))) return false
    const date = role.deadline
    if (deadline === 'NONE') return !date
    if (deadline === 'TODAY') return date === today
    if (deadline === 'NEXT7') return Boolean(date && date >= today && date <= windowEnd)
    if (deadline === 'PAST') return Boolean(date && date < today)
    return true
  })
  const safeSort = Object.hasOwn(APPLICATION_SORTS, sort) ? sort : 'updatedAt,desc'
  const [field, direction] = safeSort.split(',')
  return selected.sort((a, b) => {
    const left = a[field] ? Date.parse(a[field]) : NaN
    const right = b[field] ? Date.parse(b[field]) : NaN
    if (Number.isNaN(left) && Number.isNaN(right)) return a.id - b.id
    if (Number.isNaN(left)) return 1
    if (Number.isNaN(right)) return -1
    return (left - right) * (direction === 'desc' ? -1 : 1) || a.id - b.id
  })
}
