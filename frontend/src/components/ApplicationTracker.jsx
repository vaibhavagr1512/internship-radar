import { useState } from 'react'
import { Bookmark, RefreshCw, Trash2 } from 'lucide-react'
import InternshipCard from './InternshipCard.jsx'
import ApplicationDetailsEditor from './ApplicationDetailsEditor.jsx'
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
  const visible = tracker.applications.filter(
    (item) => status === 'ALL' || item.status === status,
  )
  return (
    <section
      className="application-tracker"
      id="applications"
      aria-labelledby="tracker-heading"
    >
      <p className="eyebrow">ONE PLACE FOR EVERY NEXT STEP</p>
      <h1 id="tracker-heading">
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
      <div className="tracker-toolbar">
        <label htmlFor="application-status-filter">
          Filter by status
          <select
            id="application-status-filter"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
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
              : 'No applications with this status'}
          </h2>
          <p>
            {tracker.applications.length === 0
              ? 'Explore internships and save a role to start tracking your progress.'
              : 'Choose another status to see more of your applications.'}
          </p>
          <button
            className="primary-button"
            type="button"
            onClick={
              tracker.applications.length === 0
                ? onExplore
                : () => setStatus('ALL')
            }
          >
            {tracker.applications.length === 0
              ? 'Explore internships'
              : 'Show all statuses'}
          </button>
        </div>
      ) : (
        <>
          <p className="tracker-count" role="status">
            {visible.length}{' '}
            {visible.length === 1 ? 'application' : 'applications'}
            {status !== 'ALL' ? ` · ${statusLabel(status)}` : ''}
          </p>
          <div className="internship-grid">
            {visible.map((application) => {
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
                    <button
                      className="remove-button"
                      type="button"
                      disabled={
                        busy || tracker.loading || tracker.pending.size > 0
                      }
                      onClick={() => tracker.remove(application.id)}
                      aria-label={`Remove ${title} from tracker`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      {busy ? 'Saving change…' : 'Remove from tracker'}
                    </button>
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
