import { rowsToCsv } from './applicationCsv.js'

export function toggleComparison(current, role) {
  if (current.some((item) => item.id === role.id)) return current.filter((item) => item.id !== role.id)
  return current.length < 3 ? [...current, role] : current
}

export function comparisonToCsv(roles) {
  return rowsToCsv([
    ['Role', 'Company', 'Location', 'Work mode', 'Category', 'Eligibility', 'Deadline', 'Last verified', 'Official application URL', 'Data status'],
    ...roles.map((role) => [role.title, role.company, role.location, role.workMode, role.roleCategory, role.eligibilityText, role.deadline, role.lastVerifiedDate, role.applicationUrl, role.comparisonError || 'Selection snapshot; verify official listing']),
  ])
}
