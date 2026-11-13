import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { applicationsToCsv, downloadApplicationsCsv } from './utils/applicationCsv.js'
import ApplicationTracker from './components/ApplicationTracker.jsx'
import { internships } from './test/fixtures.js'

const row = (id = 1, status = 'SAVED', details = {}) => ({
  id, status, internship: internships[id - 1] || internships[0],
  notes: 'Saved note', appliedDate: null, savedAt: '2026-11-14T00:00:00Z', updatedAt: '2026-11-14T00:00:00Z', ...details,
})
function setup(applications = [row()], overrides = {}) {
  const blobs = []
  const create = vi.fn(blob => { blobs.push(blob); return 'blob:csv-test' })
  const revoke = vi.fn()
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = create
    static revokeObjectURL = revoke
  })
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  const tracker = { applications, loading: false, error: false, pending: new Set(), refresh: vi.fn(), update: vi.fn(), updateDetails: vi.fn(), remove: vi.fn(), ...overrides }
  return { ...render(<ApplicationTracker tracker={tracker} onExplore={vi.fn()} />), tracker, blobs, create, revoke, click }
}
function read(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsText(blob)
  })
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('CSV format', () => {
  it('writes a BOM, seven headers, CRLF, empty optional dates and all original fields', () => {
    const csv = applicationsToCsv([row()])
    expect(csv.charCodeAt(0)).toBe(0xFEFF)
    expect(csv).toMatch(/^\uFEFF"Role","Company","Status","Deadline","Applied date","Notes","Official application URL"\r\n/)
    expect(csv).toContain('"Saved","","","Saved note","https://example.com/internships/java"\r\n')
    expect(csv).toContain('"[DEMO] Java Backend Intern"')
  })
  it('escapes quotes/commas and preserves multiline and Unicode text without mutation', () => {
    const application = row(1, 'APPLIED', { notes: 'First, "hello"\r\nNext line — नमस्ते', appliedDate: '2026-11-14' })
    const before = JSON.stringify(application)
    expect(applicationsToCsv([application])).toContain('"First, ""hello""\r\nNext line — नमस्ते"')
    expect(applicationsToCsv([application])).toContain('"Applied","","2026-11-14"')
    expect(JSON.stringify(application)).toBe(before)
  })
  it.each(['=1+1', '+SUM(A1)', '-1+2', '@SUM(A1)', '  =1', '\t=1', '\r=1', '\n=1', '\u0000=1', '\uFEFF=1', '＝1', '＋1', '－1', '＠1', '\tplain'])('neutralizes spreadsheet formula/control prefixes: %j', value => {
    const csv = applicationsToCsv([row(1, 'SAVED', { notes: value })])
    expect(csv).toContain(`"'${value}"`)
  })
  it('protects role/company/URL text as well as notes and leaves ordinary text unchanged', () => {
    const application = row(); application.internship = { ...application.internship, title: '=ROLE', company: '+COMPANY', applicationUrl: '@URL' }
    const csv = applicationsToCsv([application])
    expect(csv).toContain('"\'=ROLE","\'+COMPANY"')
    expect(csv).toContain('"\'@URL"')
    expect(csv).toContain('"Saved note"')
  })
  it('can serialize an empty list as a header-only CSV', () => {
    expect(applicationsToCsv([]).split('\r\n')).toHaveLength(2)
  })
})

describe('tracker CSV download', () => {
  it('exports only the current status filter, with saved details and a CSV filename', async () => {
    const p = setup([row(),row(2,'APPLIED',{ appliedDate: '2026-11-14', notes: 'React saved note' })])
    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('Filter by status'),'APPLIED')
    await user.type(screen.getByLabelText('Notes for React Frontend Intern'), ' UNSAVED DRAFT')
    await user.click(screen.getByRole('button',{ name: 'Export CSV' }))
    expect(p.create).toHaveBeenCalledOnce()
    expect(p.blobs[0].type).toBe('text/csv;charset=utf-8')
    const csv = await read(p.blobs[0])
    expect(csv).toContain('React Frontend Intern'); expect(csv).not.toContain('Java Backend Intern')
    expect(csv).toContain('React saved note'); expect(csv).not.toContain('UNSAVED DRAFT')
    const anchor = p.click.mock.instances[0]
    expect(anchor.download).toMatch(/^internship-radar-applications-applied-\d{4}-\d{2}-\d{2}\.csv$/)
    expect(screen.getByText('CSV download requested for 1 application.')).toBeInTheDocument()
    expect(document.querySelector('a[download]')).toBeNull()
  })
  it('exports every status with All statuses selected', async () => {
    const p = setup([row(),row(2,'APPLIED')])
    await userEvent.click(screen.getByRole('button',{ name: 'Export CSV' }))
    const csv = await read(p.blobs[0]); expect(csv).toContain('Java Backend Intern'); expect(csv).toContain('React Frontend Intern')
  })
  it.each([{ loading: true }, { error: true }, { pending: new Set(['application:1']) }])('blocks export while tracker data is unavailable or changing: %j', overrides => {
    const p = setup([row()],overrides)
    expect(screen.getByRole('button',{ name: 'Export CSV' })).toBeDisabled()
    expect(p.create).not.toHaveBeenCalled()
  })
  it('disables empty and empty-filter exports', async () => {
    const p = setup([])
    expect(screen.getByRole('button',{ name: 'Export CSV' })).toBeDisabled()
    p.rerender(<ApplicationTracker tracker={{ ...p.tracker, applications: [row()] }} onExplore={vi.fn()} />)
    await userEvent.selectOptions(screen.getByLabelText('Filter by status'),'OFFER')
    expect(screen.getByRole('button',{ name: 'Export CSV' })).toBeDisabled()
  })
  it('shows a retryable download error and then succeeds', async () => {
    const p = setup(); p.create.mockImplementationOnce(() => { throw new Error('Download unavailable') })
    await userEvent.click(screen.getByRole('button',{ name: 'Export CSV' }))
    expect(screen.getByRole('alert')).toHaveTextContent("couldn't create the CSV")
    await userEvent.click(screen.getByRole('button',{ name: 'Export CSV' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(p.click).toHaveBeenCalledOnce()
  })
  it('exports the latest saved response after a details/status update', async () => {
    const p = setup()
    p.rerender(<ApplicationTracker tracker={{ ...p.tracker, applications: [row(1,'INTERVIEW',{ notes: 'Updated saved details' })] }} onExplore={vi.fn()} />)
    await userEvent.click(screen.getByRole('button',{ name: 'Export CSV' }))
    const csv = await read(p.blobs[0]); expect(csv).toContain('"Interview"'); expect(csv).toContain('Updated saved details')
  })
  it('releases object URLs after download and immediately if the click fails', () => {
    const p = setup(); vi.useFakeTimers()
    downloadApplicationsCsv([row()]); expect(p.revoke).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000); expect(p.revoke).toHaveBeenCalledOnce()
    p.click.mockImplementationOnce(() => { throw new Error('blocked') })
    expect(() => downloadApplicationsCsv([row()])).toThrow('blocked')
    expect(p.revoke).toHaveBeenCalledTimes(2)
    expect(document.querySelector('a[download]')).toBeNull()
  })
})
