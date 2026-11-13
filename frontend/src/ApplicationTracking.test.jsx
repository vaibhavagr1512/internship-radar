import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { internships, filterOptions } from './test/fixtures.js'

const record = (id = 51, internship = internships[0], status = 'SAVED') => ({
  id,
  internship,
  status,
  savedAt: '2026-11-12T10:00:00Z',
  updatedAt: '2026-11-12T10:00:00Z',
})

function installTrackingApi(initial = []) {
  let applications = initial.map((item) => ({ ...item }))
  const controls = {
    failGet: false,
    failWrite: false,
    externalSave: (item) => applications.push(item),
  }
  const response = (status, body) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(JSON.stringify(body)),
  })
  const fetch = vi.fn(async (url, options = {}) => {
    if (url.startsWith('/api/internships/filter-options'))
      return response(200, filterOptions)
    if (url.startsWith('/api/internships')) return response(200, internships)
    const method = options.method || 'GET'
    if (method === 'GET')
      return response(controls.failGet ? 503 : 200, applications)
    if (controls.failWrite) return response(503, {})
    if (method === 'POST') {
      const internshipId = JSON.parse(options.body).internshipId
      if (applications.some((item) => item.internship.id === internshipId))
        return response(409, {})
      const saved = record(
        100 + internshipId,
        internships.find((item) => item.id === internshipId),
      )
      applications = [saved, ...applications]
      return response(201, saved)
    }
    const id = Number(url.split('/').at(-1))
    const item = applications.find((item) => item.id === id)
    if (!item) return response(404, {})
    if (method === 'PATCH') {
      const updated = {
        ...item,
        status: JSON.parse(options.body).status,
        updatedAt: '2026-11-13T10:00:00Z',
      }
      applications = applications.map((item) =>
        item.id === id ? updated : item,
      )
      return response(200, updated)
    }
    applications = applications.filter((item) => item.id !== id)
    return response(204, null)
  })
  vi.stubGlobal('fetch', fetch)
  return { fetch, controls }
}

async function openTracker(user) {
  await user.click(screen.getByRole('button', { name: /My applications/ }))
  await screen.findByRole('heading', { name: /My applications/ })
}

describe('application tracking workflow', () => {
  it('disables overlapping writes until the first save is confirmed', async () => {
    const { fetch } = installTrackingApi()
    const user = userEvent.setup()
    render(<App />)
    const first = await screen.findByRole('button', {
      name: 'Save Java Backend Intern to tracker',
    })
    await waitFor(() => expect(first).toBeEnabled())
    let completeSave
    fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completeSave = resolve
        }),
    )
    await user.click(first)
    expect(
      screen.getByRole('button', {
        name: 'Save React Frontend Intern to tracker',
      }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', {
        name: 'Save Software Engineering Intern to tracker',
      }),
    ).toBeDisabled()
    await act(async () =>
      completeSave({ ok: true, status: 201, json: async () => record() }),
    )
    expect(
      await screen.findByRole('button', {
        name: 'Already tracked Java Backend Intern',
      }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', {
        name: 'Save React Frontend Intern to tracker',
      }),
    ).toBeEnabled()
    expect(
      fetch.mock.calls.filter(([, options]) => options.method === 'POST'),
    ).toHaveLength(1)
  })

  it('saves a role once and shows it in My applications', async () => {
    const { fetch } = installTrackingApi()
    const user = userEvent.setup()
    render(<App />)
    const save = await screen.findByRole('button', {
      name: 'Save Java Backend Intern to tracker',
    })
    await waitFor(() => expect(save).toBeEnabled())
    await user.dblClick(save)
    expect(
      await screen.findByRole('button', {
        name: 'Already tracked Java Backend Intern',
      }),
    ).toBeDisabled()
    expect(
      fetch.mock.calls.filter(([, options]) => options.method === 'POST'),
    ).toHaveLength(1)
    await openTracker(user)
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(
      screen.getByRole('combobox', { name: 'Status for Java Backend Intern' }),
    ).toHaveValue('SAVED')
    expect(screen.getByText(/does not submit an application/)).toBeVisible()
  })
  it('loads persisted tracking on a fresh render and keeps updates across remounts', async () => {
    installTrackingApi([record()])
    const user = userEvent.setup()
    const app = render(<App />)
    await screen.findByRole('button', {
      name: 'Already tracked Java Backend Intern',
    })
    await openTracker(user)
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Status for Java Backend Intern' }),
      'INTERVIEW',
    )
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', {
          name: 'Status for Java Backend Intern',
        }),
      ).toHaveValue('INTERVIEW'),
    )
    app.unmount()
    render(<App />)
    await screen.findByRole('button', {
      name: 'Already tracked Java Backend Intern',
    })
    await openTracker(user)
    expect(
      screen.getByRole('combobox', { name: 'Status for Java Backend Intern' }),
    ).toHaveValue('INTERVIEW')
  })
  it('filters by status and resets an empty filtered result', async () => {
    installTrackingApi([record(), record(52, internships[1], 'APPLIED')])
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('button', {
      name: 'Already tracked Java Backend Intern',
    })
    await openTracker(user)
    const filter = screen.getByRole('combobox', { name: 'Filter by status' })
    await user.selectOptions(filter, 'APPLIED')
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(
      screen.getByRole('heading', { name: 'React Frontend Intern' }),
    ).toBeVisible()
    await user.selectOptions(filter, 'OFFER')
    expect(
      screen.getByRole('heading', { name: 'No applications with this status' }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Show all statuses' }))
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })
  it('removes tracking, shows the empty state, and makes the role saveable again', async () => {
    installTrackingApi([record()])
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('button', {
      name: 'Already tracked Java Backend Intern',
    })
    await openTracker(user)
    await user.click(
      screen.getByRole('button', {
        name: 'Remove Java Backend Intern from tracker',
      }),
    )
    expect(
      await screen.findByRole('heading', {
        name: 'Your next step starts with a save',
      }),
    ).toBeVisible()
    await user.click(
      screen.getByRole('button', { name: 'Explore internships', exact: true }),
    )
    expect(
      screen.getByRole('button', {
        name: 'Save Java Backend Intern to tracker',
      }),
    ).toBeEnabled()
  })
  it('retains the prior status when an update fails', async () => {
    const { controls } = installTrackingApi([record()])
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('button', {
      name: 'Already tracked Java Backend Intern',
    })
    await openTracker(user)
    controls.failWrite = true
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Status for Java Backend Intern' }),
      'OFFER',
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "couldn't save your change",
    )
    expect(
      screen.getByRole('combobox', { name: 'Status for Java Backend Intern' }),
    ).toHaveValue('SAVED')
    expect(
      screen.getByRole('combobox', { name: 'Status for Java Backend Intern' }),
    ).toBeEnabled()
  })
  it('does not mark a failed save as successful', async () => {
    const { controls } = installTrackingApi()
    const user = userEvent.setup()
    render(<App />)
    const button = await screen.findByRole('button', {
      name: 'Save Java Backend Intern to tracker',
    })
    await waitFor(() => expect(button).toBeEnabled())
    controls.failWrite = true
    await user.click(button)
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(
      screen.getByRole('button', {
        name: 'Save Java Backend Intern to tracker',
      }),
    ).toBeEnabled()
    expect(
      screen.queryByRole('button', {
        name: 'Already tracked Java Backend Intern',
      }),
    ).not.toBeInTheDocument()
  })
  it('retains a record when removal fails', async () => {
    const { controls } = installTrackingApi([record()])
    const user = userEvent.setup()
    render(<App />)
    await screen.findByRole('button', {
      name: 'Already tracked Java Backend Intern',
    })
    await openTracker(user)
    controls.failWrite = true
    await user.click(
      screen.getByRole('button', {
        name: 'Remove Java Backend Intern from tracker',
      }),
    )
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })
  it('refreshes after a duplicate caused by another tab', async () => {
    const { controls } = installTrackingApi()
    const user = userEvent.setup()
    render(<App />)
    const save = await screen.findByRole('button', {
      name: 'Save Java Backend Intern to tracker',
    })
    await waitFor(() => expect(save).toBeEnabled())
    controls.externalSave(record())
    await user.click(save)
    expect(
      await screen.findByRole('button', {
        name: 'Already tracked Java Backend Intern',
      }),
    ).toBeDisabled()
    await openTracker(user)
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })
  it('recovers from a failed tracker load without showing it as empty', async () => {
    const { controls } = installTrackingApi([record()])
    controls.failGet = true
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText(/Your saved status couldn't be loaded/)
    expect(
      screen.getByRole('button', {
        name: 'Save Java Backend Intern to tracker',
      }),
    ).toBeDisabled()
    await openTracker(user)
    expect(screen.getByRole('alert')).toHaveTextContent(
      "couldn't load your applications",
    )
    controls.failGet = false
    await user.click(screen.getByRole('button', { name: 'Retry tracker' }))
    expect(
      await screen.findByRole('combobox', {
        name: 'Status for Java Backend Intern',
      }),
    ).toHaveValue('SAVED')
  })
})
