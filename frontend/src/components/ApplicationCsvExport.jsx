import { useState } from 'react'
import { Download } from 'lucide-react'
import { downloadApplicationsCsv } from '../utils/applicationCsv.js'

export default function ApplicationCsvExport({ applications, status, disabled }) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  function exportCsv() {
    setMessage('')
    setError(false)
    try {
      downloadApplicationsCsv(applications, status)
      setMessage(`CSV download requested for ${applications.length} ${applications.length === 1 ? 'application' : 'applications'}.`)
    } catch {
      setError(true)
      setMessage("We couldn't create the CSV download. Please try again.")
    }
  }
  return (
    <div className="application-csv-export">
      <button className="secondary-button" type="button" onClick={exportCsv} disabled={disabled || applications.length === 0} aria-describedby="csv-export-hint">
        <Download size={15} aria-hidden="true" /> Export CSV
      </button>
      <p id="csv-export-hint">Exports rows shown by your status filter, using saved details. Save note/date edits first.</p>
      {message && <p role={error ? 'alert' : 'status'}>{message}</p>}
    </div>
  )
}
