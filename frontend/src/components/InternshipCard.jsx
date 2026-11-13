import EligibilityFeedback from './EligibilityFeedback.jsx'
import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Check,
  MapPin,
} from 'lucide-react'

export function formatDate(value, fallback = 'Not specified') {
  if (!value) return fallback
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function humanize(value) {
  if (!value) return 'Not specified'
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function safeApplicationUrl(value) {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}

export default function InternshipCard({
  internship,
  onSave,
  isTracked = false,
  saving = false,
  saveDisabled = false,
  children,
}) {
  const {
    title,
    company,
    location,
    workMode,
    roleCategory,
    eligibilityText,
    applicationUrl,
    deadline,
    lastVerifiedDate,
  } = internship
  const isDemo = /\[DEMO\]/i.test(`${title} ${company}`)
  const clean = (value = '') => value.replace(/\[DEMO\]\s*/gi, '')
  const companyName = clean(company)
  const url = safeApplicationUrl(applicationUrl)
  return (
    <article className="internship-card">
      <div className="card-topline">
        <div
          className={`company-avatar avatar-${(companyName.length % 3) + 1}`}
          aria-hidden="true"
        >
          {companyName.slice(0, 1)}
        </div>
        {isDemo && <span className="demo-tag">Demo listing</span>}
      </div>
      <p className="company-name">{companyName}</p>
      <h3>{clean(title)}</h3>
      <p className="card-location">
        <MapPin size={15} aria-hidden="true" />
        {location || 'Not specified'}
      </p>
      <div className="card-tags">
        <span>{humanize(workMode)}</span>
        <span>{humanize(roleCategory)}</span>
      </div>
      <div className="eligibility">
        <span className="detail-label">WHO CAN APPLY</span>
        <p>{eligibilityText || 'Eligibility not specified.'}</p>
      </div>
      <EligibilityFeedback assessment={internship.eligibility} />
      <div className="deadline">
        <CalendarDays size={15} aria-hidden="true" />
        <span>
          Deadline <strong>{formatDate(deadline)}</strong>
        </span>
      </div>
      <div className="card-footer">
        <p className="verified-date">
          <Check size={13} aria-hidden="true" />
          {isDemo ? 'Demo date' : 'Last verified'}
          <br />
          <span>{formatDate(lastVerifiedDate)}</span>
        </p>
        {url ? (
          <a
            className="apply-link"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${isDemo ? 'View demo link' : 'Apply'} for ${clean(title)} at ${companyName} (opens in a new tab)`}
          >
            {isDemo ? 'View demo' : 'Apply now'}{' '}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        ) : (
          <span className="unavailable-link">Link unavailable</span>
        )}
      </div>
      {onSave && (
        <button
          className={`save-button ${isTracked ? 'is-tracked' : ''}`}
          type="button"
          disabled={isTracked || saving || saveDisabled}
          onClick={onSave}
          aria-label={`${isTracked ? 'Already tracked' : 'Save'} ${clean(title)}${isTracked ? '' : ' to tracker'}`}
        >
          <Bookmark size={15} aria-hidden="true" />
          {saving
            ? 'Saving…'
            : isTracked
              ? 'In My applications'
              : 'Save to tracker'}
        </button>
      )}
      {children}
    </article>
  )
}
