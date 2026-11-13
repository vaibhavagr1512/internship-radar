import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'

export default function ApplicationDetailsEditor({
  application,
  disabled,
  onSave,
}) {
  const savedNotes = application.notes ?? ''
  const savedDate = application.appliedDate ?? ''
  const [notes, setNotes] = useState(savedNotes)
  const [appliedDate, setAppliedDate] = useState(savedDate)
  const title = application.internship.title.replace(/\[DEMO\]\s*/gi, '')
  // A status-only response must not discard a note draft. Sync only when saved details change.
  useEffect(() => {
    setNotes(savedNotes)
    setAppliedDate(savedDate)
  }, [savedNotes, savedDate])
  const dirty = notes !== savedNotes || appliedDate !== savedDate
  function cancel() {
    setNotes(savedNotes)
    setAppliedDate(savedDate)
  }
  return (
    <form
      className="application-details"
      onSubmit={(event) => {
        event.preventDefault()
        if (dirty && !disabled)
          onSave(application.id, { notes, appliedDate: appliedDate || null })
      }}
    >
      <h4>Application details</h4>
      <label htmlFor={`applied-date-${application.id}`}>
        Applied date
        <input
          id={`applied-date-${application.id}`}
          type="date" min="1000-01-01" max="9999-12-31"
          value={appliedDate}
          disabled={disabled}
          aria-label={`Applied date for ${title}`}
          onChange={(event) => setAppliedDate(event.target.value)}
        />
      </label>
      <label htmlFor={`application-notes-${application.id}`}>
        Notes
        <textarea
          id={`application-notes-${application.id}`}
          value={notes}
          maxLength={2000}
          rows={4}
          disabled={disabled}
          placeholder="Interview details, follow-ups, or things to remember…"
          aria-label={`Notes for ${title}`}
          aria-describedby={`notes-hint-${application.id}`}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      <div className="notes-meta">
        <span id={`notes-hint-${application.id}`}>
          Select Save details to keep your changes.
        </span>
        <span>{notes.length}/2000</span>
      </div>
      <div className="details-actions">
        <button
          className="primary-button"
          type="submit"
          disabled={disabled || !dirty}
          aria-label={`Save details for ${title}`}
        >
          <Save size={14} aria-hidden="true" />
          Save details
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={disabled || !dirty}
          onClick={cancel}
          aria-label={`Cancel details changes for ${title}`}
        >
          Cancel
        </button>
      </div>
      {dirty && <p className="unsaved-details">Unsaved changes</p>}
    </form>
  )
}
