import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ApplicationDashboard from './components/ApplicationDashboard.jsx'
import { localDateKey, summarizeApplications } from './utils/applicationDashboard.js'
import App from './App.jsx'
import { internships, filterOptions, pageResponse } from './test/fixtures.js'

const row = (id, status = 'SAVED', deadline = null) => ({
  id, status, internship: { ...internships[0], id, title: `Role ${id}`, deadline },
})
const tracker = (applications = [], overrides = {}) => ({
  applications, loading: false, error: false, pending: new Set(), refresh: vi.fn(), ...overrides,
})
function open(applications = [], overrides = {}) {
  const props = { tracker: tracker(applications, overrides), onTracker: vi.fn(), onExplore: vi.fn() }
  return { ...render(<ApplicationDashboard {...props} />), ...props }
}
const stat = (label) => screen.getByText(label, { selector: 'dt' }).parentElement.querySelector('dd').textContent

describe('application dashboard', () => {
  it('counts total and every current status without overlap', () => {
    const data = ['SAVED','APPLIED','INTERVIEW','OFFER','REJECTED','SAVED'].map((s, i) => row(i, s))
    expect(summarizeApplications(data, '2026-11-14').counts).toEqual({ SAVED: 2, APPLIED: 1, INTERVIEW: 1, OFFER: 1, REJECTED: 1 })
    open(data)
    expect(stat('Total tracked')).toBe('6')
    expect(stat('Saved')).toBe('2')
  })
  it('includes today, excludes expired/unknown/non-saved dates, and orders ties by ID', () => {
    const data = [row(9,'SAVED','2026-12-02'), row(3,'SAVED','2026-11-14'), row(2,'SAVED','2026-11-14'), row(1,'SAVED','2026-11-13'), row(4), row(5,'APPLIED','2026-11-15'), row(6,'REJECTED','2026-11-15')]
    expect(summarizeApplications(data,'2026-11-14').upcoming.map(x => x.id)).toEqual([2,3,9])
    expect(localDateKey(new Date(2026, 0, 2, 0, 5))).toBe('2026-01-02')
  })
  it('shows zero totals and working empty-state navigation', async () => {
    const p = open(); expect(stat('Total tracked')).toBe('0')
    await userEvent.click(screen.getByRole('button', { name: 'Explore internships' }))
    expect(p.onExplore).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Open application tracker' }))
    expect(p.onTracker).toHaveBeenCalledOnce()
  })
  it('hides stale totals while loading or failed and supports retry', async () => {
    const p = open([row(1)], { loading: true })
    expect(screen.getByRole('status')).toHaveTextContent('Loading your dashboard')
    expect(screen.queryByText('Total tracked')).not.toBeInTheDocument()
    p.rerender(<ApplicationDashboard {...p} tracker={{ ...p.tracker, loading: false, error: true }} />)
    expect(screen.getByRole('alert')).toHaveTextContent("couldn't load")
    expect(screen.queryByText('Total tracked')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry dashboard' }))
    expect(p.tracker.refresh).toHaveBeenCalledOnce()
  })
  it('limits deadlines to five and explains the full count', () => {
    open(Array.from({length: 7}, (_, i) => row(i, 'SAVED', '9999-12-31')))
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByText(/Showing the next 5 of 7/)).toBeInTheDocument()
  })
  it('recomputes totals after updates/removal and disables refresh during writes', () => {
    const p = open([row(1),row(2,'APPLIED')])
    p.rerender(<ApplicationDashboard {...p} tracker={tracker([row(1,'INTERVIEW')],{ pending: new Set(['application:1']) })} />)
    expect(stat('Total tracked')).toBe('1'); expect(stat('Interview')).toBe('1'); expect(stat('Saved')).toBe('0')
    expect(screen.getByRole('button', { name: 'Refresh dashboard' })).toBeDisabled()
  })
  it('marks deadlines due today', () => {
    open([row(1,'SAVED',localDateKey())])
    expect(screen.getByText('Due today')).toBeInTheDocument()
  })
  it('shares updated application data with the tracker through navigation', async () => {
    let applications = [row(1,'SAVED','9999-12-31')]
    vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
      let data
      if (url.startsWith('/api/internships/filter-options')) data = filterOptions
      else if (url.startsWith('/api/internships')) data = pageResponse(internships, url)
      else if (options.method === 'PATCH') { applications = [{ ...applications[0], status: JSON.parse(options.body).status }]; data = applications[0] }
      else data = applications
      return { ok: true, status: 200, json: async () => data }
    }))
    const user = userEvent.setup(); render(<App />)
    await user.click(screen.getByRole('button', { name: 'Dashboard', exact: true }))
    await screen.findByText('Total tracked'); expect(stat('Saved')).toBe('1')
    await user.click(screen.getByRole('button', { name: 'Open application tracker' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status for Role 1' }), 'APPLIED')
    await screen.findByText('Application status updated.')
    await user.click(screen.getByRole('button', { name: 'Dashboard', exact: true }))
    expect(stat('Applied')).toBe('1'); expect(stat('Saved')).toBe('0')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
