import { useEffect, useRef, useState } from 'react'
import {
  fetchApplications,
  removeApplication,
  saveApplication,
  updateApplicationStatus,
} from '../services/applicationApi.js'

export default function useApplications() {
  const [state, setState] = useState({
    applications: [],
    loading: true,
    error: false,
  })
  const [reload, setReload] = useState(0)
  const [pending, setPending] = useState(new Set())
  const locks = useRef(new Set())
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setState((previous) => ({ ...previous, loading: true, error: false }))
    fetchApplications({ signal: controller.signal })
      .then((applications) => {
        if (active) setState({ applications, loading: false, error: false })
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError')
          setState((previous) => ({ ...previous, loading: false, error: true }))
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [reload])

  function refresh() {
    setReload((previous) => previous + 1)
  }

  async function mutate(key, operation, success, message) {
    // Serialize writes so a duplicate-triggered refresh cannot overwrite another in-flight change.
    if (locks.current.size > 0 || state.loading || state.error) return
    locks.current.add(key)
    setPending(new Set(locks.current))
    setActionError('')
    setNotice('')
    try {
      const result = await operation()
      setState((previous) => ({
        ...previous,
        applications: success(previous.applications, result),
      }))
      setNotice(message)
    } catch (error) {
      if (error.status === 409) {
        setNotice(
          'This internship is already in your tracker. Refreshing your list.',
        )
        refresh()
      } else if (error.status === 404) {
        setActionError(
          'This record is no longer available. Refresh your tracker and try again.',
        )
        refresh()
      } else {
        setActionError(
          "We couldn't save your change. Refresh your tracker to check the latest status, then try again.",
        )
      }
    } finally {
      locks.current.delete(key)
      setPending(new Set(locks.current))
    }
  }

  function save(internshipId) {
    return mutate(
      `save:${internshipId}`,
      () => saveApplication(internshipId),
      (applications, saved) => [
        saved,
        ...applications.filter((item) => item.internship.id !== internshipId),
      ],
      'Internship saved to My applications.',
    )
  }
  function update(id, status) {
    return mutate(
      `application:${id}`,
      () => updateApplicationStatus(id, status),
      (applications, updated) =>
        applications.map((item) => (item.id === id ? updated : item)),
      'Application status updated.',
    )
  }
  function remove(id) {
    return mutate(
      `application:${id}`,
      () => removeApplication(id),
      (applications) => applications.filter((item) => item.id !== id),
      'Application removed from your tracker.',
    )
  }
  return {
    ...state,
    pending,
    actionError,
    notice,
    refresh,
    save,
    update,
    remove,
  }
}
