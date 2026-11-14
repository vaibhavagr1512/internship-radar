import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'

export default function ApplicationRemoval({ application, disabled, onRemove }) {
  const [confirming, setConfirming] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(false)
  const cancelRef = useRef(null)
  const triggerRef = useRef(null)
  const restoreFocus = useRef(false)
  const title = application.internship.title.replace(/\[DEMO\]\s*/gi, '')
  useEffect(() => {
    if (confirming) cancelRef.current?.focus()
    else if (restoreFocus.current) {
      triggerRef.current?.focus()
      restoreFocus.current = false
    }
  }, [confirming])
  function cancel() {
    if (working || disabled) return
    restoreFocus.current = true
    setConfirming(false)
    setError(false)
  }
  async function confirm() {
    if (working || disabled) return
    setWorking(true)
    setError(false)
    try {
      const result = await onRemove(application.id)
      if (result === false) setError(true)
      else {
        setConfirming(false)
        document.getElementById('tracker-heading')?.focus()
      }
    } catch {
      setError(true)
    } finally {
      setWorking(false)
    }
  }
  return confirming ? (
    <div className="removal-confirmation" role="group" aria-label={`Confirm removal of ${title}`} onKeyDown={(event) => {
      if (event.key === 'Escape') { event.preventDefault(); cancel() }
    }}>
      <p>Remove this application? Its saved notes and applied date will also be deleted. The internship listing stays available.</p>
      <div className="dashboard-actions">
        <button ref={cancelRef} className="secondary-button" type="button" disabled={disabled || working} onClick={cancel}>Keep application</button>
        <button className="remove-button" type="button" disabled={disabled || working} onClick={confirm} aria-label={`Confirm remove ${title} from tracker`}>{working ? 'Removing…' : 'Confirm removal'}</button>
      </div>
      {error && <p role="alert">Removal failed. Your application remains here; refresh the tracker to check its latest state before retrying.</p>}
    </div>
  ) : (
    <button ref={triggerRef} className="remove-button" type="button" disabled={disabled} onClick={() => setConfirming(true)} aria-label={`Remove ${title} from tracker`}>
      <Trash2 size={14} aria-hidden="true" /> Remove from tracker
    </button>
  )
}
