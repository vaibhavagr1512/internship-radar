import { useEffect, useRef, useState } from 'react'
import { fetchInternshipDetails } from '../services/internshipApi.js'
import { comparisonToCsv } from '../utils/internshipComparison.js'
import { downloadCsvText } from '../utils/applicationCsv.js'
import { localDateKey } from '../utils/applicationDashboard.js'
import { formatDate, safeApplicationUrl } from './InternshipCard.jsx'
import { listingNotices } from '../utils/listingNotices.js'

export default function InternshipComparison({ roles, onReplace, onRemove, onClear, onExplore, onDetails }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const request = useRef(null)
  const heading = useRef(null)
  const key = roles.map((role) => role.id).join(',')
  useEffect(() => { heading.current?.focus() }, [])
  useEffect(() => {
    setMessage(''); setBusy(false)
    return () => request.current?.abort()
  }, [key])
  async function refresh() {
    request.current?.abort()
    const controller = new AbortController(); request.current = controller
    setBusy(true); setMessage('')
    const results = await Promise.allSettled(roles.map((role) => fetchInternshipDetails(role.id, { signal: controller.signal })))
    if (controller.signal.aborted) return
    onReplace(results.map((result, i) => result.status === 'fulfilled' ? result.value : { ...roles[i], comparisonError: result.reason.status === 404 ? 'Listing no longer available. Remove it from comparison.' : 'Refresh failed. Values below are the previous selection snapshot.' }))
    setMessage(results.every((result) => result.status === 'fulfilled') ? 'Comparison refreshed from the API.' : 'Some listings could not be refreshed. Check the warning in each column.')
    setBusy(false)
  }
  function exportCsv() {
    try { downloadCsvText(comparisonToCsv(roles), `internship-radar-comparison-${localDateKey()}.csv`); setMessage('Comparison CSV download requested.') }
    catch { setMessage('Comparison download failed. Please try again.') }
  }
  return <section id="comparison" className="internship-comparison" aria-labelledby="comparison-heading">
    <h1 id="comparison-heading" ref={heading} tabIndex={-1}>Compare internships</h1>
    <p>Choose up to three roles from Explore or details. Selections are kept in memory for this tab and clear on page reload. Values are a selection snapshot; refresh for current API data and verify the official listings.</p>
    {roles.length === 0 ? <div className="empty-state"><h2>Choose roles to compare</h2><button className="primary-button" type="button" onClick={onExplore}>Explore internships</button></div> : <>
      <div className="dashboard-actions"><button className="secondary-button" type="button" disabled={busy} onClick={refresh}>Refresh comparison</button><button className="secondary-button" type="button" disabled={busy} onClick={exportCsv}>Export comparison CSV</button><button className="secondary-button" type="button" disabled={busy} onClick={() => { onClear(); heading.current?.focus() }}>Clear comparison</button></div>
      {busy && <p role="status">Refreshing selected internships…</p>}
      {message && <p role="status">{message}</p>}
      <div className="comparison-grid">{roles.map((role) => {
        const url = safeApplicationUrl(role.applicationUrl)
        return <article key={role.id} className="comparison-column">
          <h2>{role.title.replace(/\[DEMO\]\s*/gi, '')}</h2>
          <p>{role.company}</p>
          {role.comparisonError && <p className="tracking-action-error" role="alert">{role.comparisonError}</p>}
          <dl><dt>Location</dt><dd>{role.location}</dd><dt>Work mode</dt><dd>{role.workMode}</dd><dt>Category</dt><dd>{role.roleCategory}</dd><dt>Eligibility</dt><dd>{role.eligibilityText}</dd><dt>Deadline</dt><dd>{formatDate(role.deadline)}</dd><dt>Last verified / demo date</dt><dd>{formatDate(role.lastVerifiedDate)}</dd></dl>
          {listingNotices(role).map((notice) => <p className="comparison-notice" key={notice}>{notice}</p>)}
          {url ? <a className="details-official" href={url} target="_blank" rel="noopener noreferrer">Official listing (opens in a new tab)</a> : <p>Official link unavailable.</p>}
          <div className="dashboard-actions"><button className="secondary-button" type="button" onClick={() => onDetails(role.id)}>Details for {role.title.replace(/\[DEMO\]\s*/gi, '')}</button><button className="remove-button" type="button" disabled={busy} onClick={() => { onRemove(role); heading.current?.focus() }}>Remove {role.title.replace(/\[DEMO\]\s*/gi, '')} from comparison</button></div>
        </article>
      })}</div>
    </>}
  </section>
}
