import { useCallback, useEffect, useState } from 'react'
import { readRoute } from '../utils/internshipNavigation.js'

export default function useHashView() {
  const [route, setRoute] = useState(() => readRoute(window.location.hash) || { view: 'explore', id: null })
  useEffect(() => {
    const changed = () => {
      const next = readRoute(window.location.hash)
      if (next) setRoute(next)
    }
    window.addEventListener('hashchange', changed)
    return () => window.removeEventListener('hashchange', changed)
  }, [])
  const navigate = useCallback((view, id = null) => {
    const hash = view === 'details' ? `#/internships/${id}` : view === 'compare' ? '#/compare' : `#${view}`
    setRoute({ view, id })
    if (window.location.hash !== hash) window.location.hash = hash
  }, [])
  return [route.view, navigate, route.id]
}
