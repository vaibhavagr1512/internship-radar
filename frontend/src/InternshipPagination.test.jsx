import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { internships, filterOptions, pageResponse } from './test/fixtures.js'

const records = Array.from({ length: 8 }, (_, index) => ({
  ...internships[0],
  id: index + 1,
  title: `[DEMO] Internship ${index + 1}`,
  company: '[DEMO] Example',
  workMode: index % 2 === 0 ? 'HYBRID' : 'REMOTE',
  location: index % 2 === 0 ? 'Bengaluru' : 'Remote',
  deadline: index < 6 ? `2026-12-0${index + 1}` : null,
  lastVerifiedDate: `2026-11-0${index + 1}`,
}))
function installApi() {
  const controls = { fail: false, limit: 8 }
  const fetch = vi.fn(async (url) => {
    if (url.startsWith('/api/applications'))
      return { ok: true, json: async () => [] }
    if (url.startsWith('/api/internships/filter-options'))
      return { ok: true, json: async () => filterOptions }
    if (controls.fail) return { ok: false, status: 503 }
    const params = new URL(url, 'http://localhost').searchParams
    let filtered = records
      .slice(0, controls.limit)
      .filter(
        (item) =>
          `${item.title} ${item.company}`
            .toLowerCase()
            .includes((params.get('search') || '').toLowerCase()) &&
          ['workMode', 'roleCategory', 'location'].every(
            (key) => !params.get(key) || item[key] === params.get(key),
          ),
      )
    const [field, direction] = (
      params.get('sort') || 'lastVerifiedDate,desc'
    ).split(',')
    filtered = [...filtered].sort((a, b) =>
      a[field] === null
        ? b[field] === null
          ? a.id - b.id
          : 1
        : b[field] === null
          ? -1
          : (direction === 'asc' ? 1 : -1) * a[field].localeCompare(b[field]) ||
            a.id - b.id,
    )
    return { ok: true, json: async () => pageResponse(filtered, url) }
  })
  vi.stubGlobal('fetch', fetch)
  return { controls, fetch }
}
async function start() {
  const api = installApi()
  const user = userEvent.setup()
  render(<App />)
  await screen.findAllByRole('article')
  return { ...api, user }
}
async function secondPage(user) {
  await user.click(screen.getByRole('button', { name: 'Next', exact: true }))
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
}

describe('paginated internship list', () => {
  it('returns to the last available page if records disappear', async () => {
    const { user, controls } = await start()
    controls.limit = 2
    await user.click(screen.getByRole('button', { name: 'Next', exact: true }))
    await waitFor(() => expect(screen.getByText('Page 1 of 1')).toBeVisible())
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(
      screen.queryByRole('heading', { name: 'No internships found' }),
    ).not.toBeInTheDocument()
  })

  it('shows six records, total count and first-page boundaries', async () => {
    await start()
    expect(screen.getAllByRole('article')).toHaveLength(6)
    expect(screen.getByRole('status')).toHaveTextContent('8 internships')
    expect(screen.getByText('Showing 1–6 of 8')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Next', exact: true }),
    ).toBeEnabled()
  })
  it('navigates to the partial last page and back', async () => {
    const { user } = await start()
    await secondPage(user)
    expect(screen.getByText('Showing 7–8 of 8')).toBeVisible()
    expect(screen.getByText('Page 2 of 2')).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Next', exact: true }),
    ).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Previous' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(6))
  })
  it('resets to page one when page size changes', async () => {
    const { user } = await start()
    await secondPage(user)
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Per page' }),
      '2',
    )
    await waitFor(() => expect(screen.getByText('Page 1 of 4')).toBeVisible())
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })
  it('sorts deadlines and resets page position', async () => {
    const { user } = await start()
    await secondPage(user)
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Sort by' }),
      'deadline,asc',
    )
    expect(
      await screen.findByRole('heading', { name: 'Internship 1' }),
    ).toBeVisible()
    expect(screen.getByText('Page 1 of 2')).toBeVisible()
    const headings = screen
      .getAllByRole('article')
      .map((item) => item.querySelector('h3').textContent)
    expect(headings[0]).toBe('Internship 1')
  })
  it('resets pagination when a filter changes', async () => {
    const { user } = await start()
    await secondPage(user)
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Work mode' }),
      'REMOTE',
    )
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(4))
    expect(screen.getByText('Page 1 of 1')).toBeVisible()
  })
  it('resets pagination on a submitted search', async () => {
    const { user } = await start()
    await secondPage(user)
    await user.type(screen.getByRole('searchbox'), 'Internship 8{Enter}')
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))
    expect(screen.getByText('Page 1 of 1')).toBeVisible()
  })
  it('shows zero pages and disables navigation when nothing matches', async () => {
    const { user } = await start()
    await user.type(screen.getByRole('searchbox'), 'missing{Enter}')
    await screen.findByRole('heading', { name: 'No internships found' })
    expect(screen.getByText('Page 0 of 0')).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Next', exact: true }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })
  it('retries a failed next page without losing pagination', async () => {
    const { user, controls } = await start()
    controls.fail = true
    await user.click(screen.getByRole('button', { name: 'Next', exact: true }))
    await screen.findByRole('alert')
    controls.fail = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.getByText('Page 2 of 2')).toBeVisible())
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })
  it('ignores a late response for a previous page after a filter change', async () => {
    const { user, fetch } = await start()
    let finish
    fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    await user.click(screen.getByRole('button', { name: 'Next', exact: true }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Work mode' }),
      'REMOTE',
    )
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(4))
    await act(async () =>
      finish({
        ok: true,
        json: async () =>
          pageResponse(records, '/api/internships?page=1&size=6'),
      }),
    )
    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(screen.getByText('Page 1 of 1')).toBeVisible()
  })
})
