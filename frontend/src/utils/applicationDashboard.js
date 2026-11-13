import { APPLICATION_STATUSES } from '../services/applicationApi.js'

// Compare calendar dates without UTC/local-midnight shifts or daylight-saving math.
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function summarizeApplications(applications, today = localDateKey()) {
  const counts = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0]))
  const upcoming = []
  for (const application of applications) {
    if (Object.hasOwn(counts, application.status)) counts[application.status]++
    const deadline = application.internship.deadline
    // The dashboard highlights roles still waiting for an application.
    if (application.status === 'SAVED' && deadline && deadline >= today) {
      upcoming.push(application)
    }
  }
  upcoming.sort((a, b) =>
    a.internship.deadline.localeCompare(b.internship.deadline) || a.id - b.id,
  )
  return { total: applications.length, counts, upcoming }
}
