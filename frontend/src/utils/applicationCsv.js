import { statusLabel } from '../services/applicationApi.js'
import { localDateKey } from './applicationDashboard.js'

function csvCell(value) {
  let text = value == null ? '' : String(value)
  // Quoting alone does not stop spreadsheets from evaluating formulas.
  if (/^[\s\u0000-\u001f]*[=+\-@＝＋－＠]/u.test(text) || /^[\t\r\n]/u.test(text)) {
    text = `'${text}`
  }
  return `"${text.replaceAll('"', '""')}"`
}

export function applicationsToCsv(applications) {
  const rows = [
    ['Role', 'Company', 'Status', 'Deadline', 'Applied date', 'Notes', 'Official application URL'],
    ...applications.map((application) => [
      application.internship.title,
      application.internship.company,
      statusLabel(application.status),
      application.internship.deadline,
      application.appliedDate,
      application.notes,
      application.internship.applicationUrl,
    ]),
  ]
  // BOM preserves Unicode in Excel; CRLF and quoting preserve multiline cells.
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

export function downloadApplicationsCsv(applications, status = 'ALL') {
  const blob = new Blob([applicationsToCsv(applications)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  try {
    anchor.href = url
    anchor.download = `internship-radar-applications-${status.toLowerCase()}-${localDateKey()}.csv`
    document.body.append(anchor)
    anchor.click()
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  } finally {
    anchor.remove()
  }
  // Let the browser start reading the download before releasing its URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
