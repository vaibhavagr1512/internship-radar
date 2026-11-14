import { localDateKey } from './applicationDashboard.js'

function calendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null
}

export function listingNotices(internship, today = localDateKey()) {
  const notices = []
  const deadline = calendarDate(internship.deadline)
  if (!deadline) notices.push('No valid deadline recorded. Check the official listing.')
  else if (internship.deadline < today) notices.push('The recorded deadline has passed. Check whether applications are still accepted.')
  else if (internship.deadline === today) notices.push('Recorded deadline is today. Confirm the closing time on the official listing.')
  const verified = calendarDate(internship.lastVerifiedDate)
  if (!verified) notices.push('No valid verification date recorded.')
  else if (internship.lastVerifiedDate > today) notices.push('The verification date is in the future. Recheck the source.')
  else if ((calendarDate(today) - verified) / 86400000 > 30) notices.push('The verification date is over 30 days old. Recheck the official listing.')
  return notices
}
