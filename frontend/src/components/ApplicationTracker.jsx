import { useEffect, useState } from 'react'
import { Bookmark, RefreshCw } from 'lucide-react'
import InternshipCard from './InternshipCard.jsx'
import ApplicationDetailsEditor from './ApplicationDetailsEditor.jsx'
import ApplicationCsvExport from './ApplicationCsvExport.jsx'
import ApplicationRemoval from './ApplicationRemoval.jsx'
import ApplicationPagination from './ApplicationPagination.jsx'
import { selectApplications, APPLICATION_SORTS, DEADLINE_FILTERS } from '../utils/applicationView.js'
import { localDateKey } from '../utils/applicationDashboard.js'
import {
  APPLICATION_STATUSES,
  statusLabel,
} from '../services/applicationApi.js'

function displayTimestamp(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not specified'
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
}

export default function ApplicationTracker({ tracker, onExplore }) {
  const [status, setStatus] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('updatedAt,desc')
  const [deadline, setDeadline] = useState('ALL')
  const [requestedPage, setPage] = useState(0)
  const [size, setSize] = useState(6)
  const [today, setToday] = useState(localDateKey)
  useEffect(() => {
    const update = () => setToday(localDateKey())
    const timer = setInterval(update, 60_000)
    window.addEventListener('focus', update)
    return () => { clearInterval(timer); window.removeEventListener('focus', update) }
  }, [])
  const visible = selectApplications(tracker.applications, { status, search, sort, deadline, today })
  const lastPage = Math.max(0, Math.ceil(visible.length / size) - 1)
  const page = Math.min(requestedPage, lastPage)
  useEffect(() => { setPage((current) => Math.min(current, lastPage)) }, [lastPage])
  const pageRows = visible.slice(page * size, (page + 1) * size)
  function resetView() {
    setStatus('ALL'); setSearch(''); setDeadline('ALL'); setSort('updatedAt,desc'); setPage(0)
  }
  return (
    <section
      className="application-tracker"
      id="applications"
      aria-labelledby="tracker-heading"
    >
      <p className="eyebrow">ONE PLACE FOR EVERY NEXT STEP</p>
      <h1 id="tracker-heading" tabIndex={-1}>
        My applications<span className="heading-dot">.</span>
      </h1>
      <p className="tracker-intro">
        Keep the roles you care about close. Track your progress, one
        opportunity at a time.
      </p>
      <p className="tracking-note">
        This is your local, single-user tracker. Saving a role or changing its
        status does not submit an application. Apply on the company's official
        website.
      </p>
      <p className="tracking-note">Save note/date changes before changing filters, sorting, or pages.</p>
      <div className="tracker-view-controls">
        <label htmlFor="application-search">Search applications
          <input id="application-search" type="search" value={search} placeholder="Search by role or company" onChange={(event) => { setSearch(event.target.value); setPage(0) }} />
        </label>
        <label htmlFor="application-sort">Sort applications
          <select id="application-sort" aria-label="Sort applications" value={sort} onChange={(event) => { setSort(event.target.value); setPage(0) }}>
            {Object.entries(APPLICATION_SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label htmlFor="application-deadline">Filter applications by deadline
          <select id="application-deadline" aria-label="Filter applications by deadline" value={deadline} onChange={(event) => { setDeadline(event.target.value); setPage(0) }}>
            {Object.entries(DEADLINE_FILTERS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button className="secondary-button" type="button" onClick={resetView}>Reset application view</button>
      </div>
      <div className="tracker-toolbar">
        <label htmlFor="application-status-filter">
          Filter by status
          <select
            id="application-status-filter"
            aria-label="Filter by status"
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(0) }}
          >
            <option value="ALL">All statuses</option>
            {APPLICATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <button
          className="secondary-button"
          type="button"
          onClick={tracker.refresh}
          disabled={tracker.loading || tracker.pending.size > 0}
        >
          <RefreshCw size={15} aria-hidden="true" />
          Refresh tracker
        </button>
      </div>
      <ApplicationCsvExport
        applications={visible}
        status={status}
        disabled={tracker.loading || tracker.error || tracker.pending.size > 0}
      />
      {tracker.loading ? (
        <p role="status">Loading your applications…</p>
      ) : tracker.error ? (
        <div className="empty-state" role="alert">
          <h2>We couldn't load your applications</h2>
          <p>Please try again to retrieve your saved progress.</p>
          <button
            className="primary-button"
            type="button"
            onClick={tracker.refresh}
          >
            Retry tracker
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Bookmark size={26} aria-hidden="true" />
          </span>
          <h2>
            {tracker.applications.length === 0
              ? 'Your next step starts with a save'
              : search.trim() || deadline !== 'ALL' ? 'No applications match these filters' : 'No applications with this status'}
          </h2>
          <p>
            {tracker.applications.length === 0
              ? 'Explore internships and save a role to start tracking your progress.'
              : 'Reset the application view or change your filters to see more applications.'}
          </p>
          <button
            className="primary-button"
            type="button"
            onClick={
              tracker.applications.length === 0
                ? onExplore
                : resetView
            }
          >
            {tracker.applications.length === 0
              ? 'Explore internships'
              : search.trim() || deadline !== 'ALL' ? 'Clear application filters' : 'Show all statuses'}
          </button>
        </div>
      ) : (
        <>
          <p className="tracker-count" role="status">
            {visible.length}{' '}
            {visible.length === 1 ? 'application' : 'applications'}
            {status !== 'ALL' ? ` · ${statusLabel(status)}` : ''}
          </p>
          <ApplicationPagination page={page} size={size} total={visible.length}
            disabled={tracker.loading || tracker.error || tracker.pending.size > 0}
            onPage={setPage} onSize={(value) => { setSize(value); setPage(0) }} />
          <div className="internship-grid">
            {pageRows.map((application) => {
              const busy = tracker.pending.has(`application:${application.id}`)
              const title = application.internship.title.replace(
                /\[DEMO\]\s*/gi,
                '',
              )
              return (
                <InternshipCard
                  key={application.id}
                  internship={application.internship}
                >
                  <div className="tracking-controls">
                    <label htmlFor={`application-status-${application.id}`}>
                      Application status
                      <select
                        id={`application-status-${application.id}`}
                        value={application.status}
                        disabled={
                          busy || tracker.loading || tracker.pending.size > 0
                        }
                        aria-label={`Status for ${title}`}
                        onChange={(event) =>
                          tracker.update(application.id, event.target.value)
                        }
                      >
                        {APPLICATION_STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {statusLabel(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <ApplicationDetailsEditor
                      application={application}
                      disabled={
                        busy || tracker.loading || tracker.pending.size > 0
                      }
                      onSave={tracker.updateDetails}
                    />
                    <p className="tracking-timestamps">
                      Saved {displayTimestamp(application.savedAt)}
                      <br />
                      Updated {displayTimestamp(application.updatedAt)}
                    </p>
                    <ApplicationRemoval
                      application={application}
                      disabled={busy || tracker.loading || tracker.pending.size > 0}
                      onRemove={tracker.remove}
                    />
                  </div>
                </InternshipCard>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
