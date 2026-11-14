import { useEffect, useRef, useState } from 'react'
import { fetchInternshipDetails } from '../services/internshipApi.js'
import { validInternshipId } from '../utils/internshipNavigation.js'
import { formatDate, safeApplicationUrl } from './InternshipCard.jsx'
import CopyInternshipLink from './CopyInternshipLink.jsx'
import { listingNotices } from '../utils/listingNotices.js'
import { localDateKey } from '../utils/applicationDashboard.js'

export default function InternshipDetails({ id, tracker, onBack, onTracker, onCompare, compared, comparisonFull }) {
  const [state, setState] = useState({ loading: true, data: null, status: null })
  const [reload, setReload] = useState(0)
  const [today, setToday] = useState(localDateKey)
  const [printError, setPrintError] = useState(false)
  const heading = useRef(null)
  useEffect(() => {
    const update = () => setToday(localDateKey())
    const timer = setInterval(update, 60_000)
    window.addEventListener('focus', update)
    return () => { clearInterval(timer); window.removeEventListener('focus', update) }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setState({ loading: true, data: null, status: null })
    setPrintError(false)
    if (!validInternshipId(id)) {
      setState({ loading: false, data: null, status: 400 })
      return () => controller.abort()
    }
    fetchInternshipDetails(id, { signal: controller.signal }).then((data) => {
      if (active) setState({ loading: false, data, status: null })
    }).catch((error) => {
      if (active && error.name !== 'AbortError') setState({ loading: false, data: null, status: error.status || 500 })
    })
    return () => { active = false; controller.abort() }
  }, [id, reload])
  useEffect(() => { if (!state.loading) heading.current?.focus() }, [state.loading, state.data, state.status])
  const role = state.data
  const tracked = tracker.applications.find((application) => String(application.internship.id) === String(id))
  const clean = (value) => value?.replace(/\[DEMO\]\s*/gi, '')
  const demo = role && /\[DEMO\]/i.test(role.title + role.company)
  const url = role && safeApplicationUrl(role.applicationUrl)
  return <section id="internship-details" className="internship-details" aria-labelledby="details-heading">
    <button className="secondary-button no-print" type="button" onClick={onBack}>Back to internships</button>
    {state.loading ? <p role="status">Loading internship details…</p> : !role ? <div className="empty-state" role="alert">
      <h1 id="details-heading" ref={heading} tabIndex={-1}>{state.status === 404 ? 'Internship not found' : state.status === 400 ? 'Invalid internship link' : "We couldn't load this internship"}</h1>
      <p>{state.status === 404 ? 'The listing may have been removed. Return to Explore internships.' : state.status === 400 ? 'Use a positive internship ID from a listing.' : 'Try again to retrieve the latest details.'}</p>
      {state.status >= 500 && <button type="button" className="primary-button" onClick={() => setReload((value) => value + 1)}>Retry details</button>}
    </div> : <>
      <p className="eyebrow">INTERNSHIP DETAILS</p>
      <h1 id="details-heading" ref={heading} tabIndex={-1}>{clean(role.title)}</h1>
      <p className="details-company">{clean(role.company)}</p>
      {demo && <p className="tracking-note">Demo listing — for learning and testing, not an active opportunity.</p>}
      <dl className="details-facts">
        <div><dt>Location</dt><dd>{role.location || 'Not specified'}</dd></div>
        <div><dt>Work mode</dt><dd>{role.workMode?.replaceAll('_', ' ') || 'Not specified'}</dd></div>
        <div><dt>Role category</dt><dd>{role.roleCategory?.replaceAll('_', ' ') || 'Not specified'}</dd></div>
        <div><dt>Deadline</dt><dd>{formatDate(role.deadline)}</dd></div>
        <div><dt>{demo ? 'Demo verification date' : 'Last verified'}</dt><dd>{formatDate(role.lastVerifiedDate)}</dd></div>
      </dl>
      <h2>Eligibility requirements</h2>
      <p className="details-eligibility">{role.eligibilityText || 'No eligibility requirements recorded. Check the official listing.'}</p>
      <p>Use the student profile in Explore for structured matching where verified criteria are available. Confirm requirements on the official listing.</p>
      <div className="listing-notices" aria-label="Listing date notices">{listingNotices(role, today).map((notice) => <p key={notice}>{notice}</p>)}</div>
      <h2>Official application URL</h2>
      {url ? <a className="details-official" href={url} target="_blank" rel="noopener noreferrer">{url}<span className="sr-only"> (opens in a new tab)</span></a> : <p>Official link unavailable.</p>}
      <p>Saving a role does not submit an application.</p>
      <div className="dashboard-actions no-print">
        <button className="primary-button" type="button" disabled={Boolean(tracked) || tracker.loading || tracker.error || tracker.pending.size > 0} onClick={() => tracker.save(role.id)}>{tracked ? 'Already in My applications' : 'Save internship to tracker'}</button>
        <button className="secondary-button" type="button" onClick={onTracker}>Open My applications</button>
        <button className="secondary-button" type="button" disabled={!compared && comparisonFull} onClick={() => onCompare(role)}>{compared ? 'Remove from comparison' : 'Add to comparison'}</button>
        <button className="secondary-button" type="button" onClick={() => { try { setPrintError(false); window.print() } catch { setPrintError(true) } }}>Print internship details</button>
      </div>
      {tracked && <p className="no-print">Tracker status: {tracked.status}</p>}
      {tracker.error && <p className="no-print">Tracker unavailable. Open My applications and retry before saving.</p>}
      {printError && <p role="alert">Printing is unavailable. Try your browser's Print command.</p>}
      <div className="no-print"><CopyInternshipLink key={id} id={id} /></div>
    </>}
  </section>
}
