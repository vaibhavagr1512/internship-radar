import { useEffect, useState } from 'react'
import { internshipLink } from '../utils/internshipNavigation.js'

export default function CopyInternshipLink({ id }) {
  const [message, setMessage] = useState('')
  const [manual, setManual] = useState(false)
  const link = internshipLink(id)
  useEffect(() => { setMessage(''); setManual(false) }, [id])
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(link)
      setMessage('Internship link copied.')
      setManual(false)
    } catch {
      setManual(true)
      setMessage('Automatic copy is unavailable. Select and copy the link below.')
    }
  }
  return <div className="copy-internship-link">
    <button type="button" className="secondary-button" onClick={copy}>Copy internship link</button>
    {message && <p role="status">{message}</p>}
    {manual && <label>Internship link<input aria-label="Internship link" readOnly value={link} onFocus={(event) => event.target.select()} /></label>}
    <p className="small">A localhost link works only where this backend is running; it is not a public deployment.</p>
  </div>
}
