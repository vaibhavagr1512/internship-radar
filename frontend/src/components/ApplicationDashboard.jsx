import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { APPLICATION_STATUSES, statusLabel } from '../services/applicationApi.js'
import { localDateKey, summarizeApplications } from '../utils/applicationDashboard.js'

export default function ApplicationDashboard({ tracker, onTracker, onExplore }) {
  const [today, setToday] = useState(localDateKey)
  useEffect(() => {
    const update = () => setToday(localDateKey())
    const timer = setInterval(update, 60_000)
    window.addEventListener('focus', update)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', update)
    }
  }, [])
  const summary = summarizeApplications(tracker.applications, today)
  return (
    <section id="dashboard" className="application-dashboard" aria-labelledby="dashboard-heading">
      <p className="eyebrow">YOUR PROGRESS AT A GLANCE</p>
      <h1 id="dashboard-heading">Application dashboard<span className="heading-dot">.</span></h1>
      <p>Your current tracker totals and the next deadlines for roles you have saved.</p>
      <div className="dashboard-actions">
        <button className="primary-button" type="button" onClick={onTracker}>Open application tracker</button>
        <button className="secondary-button" type="button" onClick={tracker.refresh} disabled={tracker.loading || tracker.pending.size > 0}>
          <RefreshCw size={15} aria-hidden="true" /> Refresh dashboard
        </button>
      </div>
      {tracker.loading ? <p role="status">Loading your dashboard…</p> : tracker.error ? (
        <div className="empty-state" role="alert">
          <h2>We couldn't load your dashboard</h2>
          <p>Retry to retrieve your latest application totals.</p>
          <button className="primary-button" type="button" onClick={tracker.refresh}>Retry dashboard</button>
        </div>
      ) : (
        <>
          <dl className="dashboard-stats" aria-label="Application totals">
            <div><dt>Total tracked</dt><dd>{summary.total}</dd></div>
            {APPLICATION_STATUSES.map((status) => (
              <div key={status}><dt>{statusLabel(status)}</dt><dd>{summary.counts[status]}</dd></div>
            ))}
          </dl>
          {summary.total === 0 && (
            <div className="empty-state">
              <h2>Start with one saved internship</h2>
              <p>Save a role from Explore internships to begin tracking your progress.</p>
              <button className="primary-button" type="button" onClick={onExplore}>Explore internships</button>
            </div>
          )}
          <div className="dashboard-deadlines">
            <h2>Upcoming deadlines</h2>
            <p>Saved roles only, from today onward, ordered by deadline. Dates use your device's local calendar. Check the official listing before applying; demo dates are illustrative.</p>
            {summary.upcoming.length === 0 ? <p>No upcoming deadlines for saved roles with a recorded deadline.</p> : (
              <ul className="dashboard-deadline-list">
                {summary.upcoming.slice(0, 5).map((application) => (
                  <li key={application.id}>
                    <div><strong>{application.internship.title.replace(/\[DEMO\]\s*/gi, '')}</strong><p>{application.internship.company} · {statusLabel(application.status)}</p></div>
                    <div><time dateTime={application.internship.deadline}>{application.internship.deadline}</time>{application.internship.deadline === today && <span className="deadline-today">Due today</span>}</div>
                  </li>
                ))}
              </ul>
            )}
            {summary.upcoming.length > 5 && <p>Showing the next 5 of {summary.upcoming.length} upcoming deadlines. Open the tracker to see every saved role.</p>}
          </div>
        </>
      )}
    </section>
  )
}
