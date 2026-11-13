import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { filterOptions, internships, pageResponse } from './test/fixtures.js'

function installApi() {
  const controls = { optionsFail: false, listFail: false }
  const response = (data) => ({ ok: true, json: async () => data })
  const fetch = vi.fn(async (url) => {
    if (url.startsWith('/api/applications')) return response([])
    if (url.startsWith('/api/internships/filter-options'))
      return controls.optionsFail
        ? { ok: false, status: 503 }
        : response(filterOptions)
    if (controls.listFail) return { ok: false, status: 503 }
    const params = new URL(url, 'http://localhost').searchParams
    const search = (params.get('search') || '').toLowerCase()
    return response(
      pageResponse(
        internships.filter((item) => {
          if (!`${item.title} ${item.company}`.toLowerCase().includes(search))
            return false
          return ['workMode', 'roleCategory', 'location'].every(
            (key) =>
              !params.get(key) ||
              item[key].toLowerCase() === params.get(key).toLowerCase(),
          )
        }),
        url,
      ),
    )
  })
  vi.stubGlobal('fetch', fetch)
  return { fetch, controls }
}
async function start() {
  const api = installApi()
  const user = userEvent.setup()
  render(<App />)
  await screen.findAllByRole('article')
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Work mode' })).toBeEnabled(),
  )
  return { ...api, user }
}

async function expectCards(count) {
  await waitFor(() =>
    expect(screen.getAllByRole('article')).toHaveLength(count),
  )
}

describe('internship discovery filters', () => {
  it('loads the available filter options without changing the three records', async () => {
    await start()
    expect(
      screen.getByRole('combobox', { name: 'Location' }).options,
    ).toHaveLength(4)
    expect(
      screen.getByRole('combobox', { name: 'Role category' }).options,
    ).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })
  it.each([
    ['Work mode', 'REMOTE', 'React Frontend Intern'],
    ['Role category', 'SOFTWARE', 'Software Engineering Intern'],
    ['Location', 'Bengaluru', 'Java Backend Intern'],
  ])('filters by %s', async (label, value, title) => {
    const { user } = await start()
    await user.selectOptions(
      screen.getByRole('combobox', { name: label }),
      value,
    )
    await expectCards(1)
    expect(screen.getByRole('heading', { name: title })).toBeVisible()
  })
  it('combines all three filters and a submitted search', async () => {
    const { user, fetch } = await start()
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Work mode' }),
      'HYBRID',
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Role category' }),
      'BACKEND',
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Location' }),
      'Bengaluru',
    )
    await user.type(screen.getByRole('searchbox'), 'JAVA{Enter}')
    await expectCards(1)
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/internships?search=JAVA&workMode=HYBRID&roleCategory=BACKEND&location=Bengaluru&page=0&size=6&sort=lastVerifiedDate%2Cdesc',
      expect.any(Object),
    )
  })
  it('clears every filter and search and restores all listings', async () => {
    const { user } = await start()
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Work mode' }),
      'HYBRID',
    )
    await user.type(screen.getByRole('searchbox'), 'Java{Enter}')
    await expectCards(1)
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    await expectCards(3)
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Work mode' })).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Role category' })).toHaveValue(
      '',
    )
    expect(screen.getByRole('combobox', { name: 'Location' })).toHaveValue('')
    expect(screen.getByRole('searchbox')).toHaveFocus()
  })
  it('shows an empty state for incompatible filters and can reset it', async () => {
    const { user } = await start()
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Work mode' }),
      'HYBRID',
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Role category' }),
      'FRONTEND',
    )
    expect(
      await screen.findByRole('heading', { name: 'No internships found' }),
    ).toBeVisible()
    expect(
      screen.getByRole('combobox', { name: 'Location' }).options,
    ).toHaveLength(4)
    await user.click(
      screen.getByRole('button', { name: 'Clear search and filters' }),
    )
    await expectCards(3)
  })
  it('clearing only the search preserves selected filters', async () => {
    const { user } = await start()
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Work mode' }),
      'REMOTE',
    )
    await user.type(screen.getByRole('searchbox'), 'Java{Enter}')
    await screen.findByRole('heading', { name: 'No internships found' })
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    await expectCards(1)
    expect(screen.getByRole('combobox', { name: 'Work mode' })).toHaveValue(
      'REMOTE',
    )
  })
  it('can retry option loading while keeping the existing list usable', async () => {
    const { controls } = installApi()
    controls.optionsFail = true
    const user = userEvent.setup()
    render(<App />)
    await screen.findAllByRole('article')
    expect(
      await screen.findByText(/Filter options couldn't be loaded/),
    ).toBeVisible()
    expect(screen.getByRole('combobox', { name: 'Work mode' })).toBeDisabled()
    controls.optionsFail = false
    await user.click(screen.getByRole('button', { name: 'Retry filters' }))
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Work mode' })).toBeEnabled(),
    )
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })
  it('retries a failed list request with the active filters intact', async () => {
    const { controls, user } = await start()
    controls.listFail = true
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Work mode' }),
      'REMOTE',
    )
    await screen.findByRole('alert')
    controls.listFail = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await expectCards(1)
    expect(screen.getByRole('combobox', { name: 'Work mode' })).toHaveValue(
      'REMOTE',
    )
  })
  it('ignores a late response from an earlier filter selection', async () => {
    const { fetch, user } = await start()
    let completeOld
    fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completeOld = resolve
        }),
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Work mode' }),
      'HYBRID',
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Work mode' }),
      'REMOTE',
    )
    await expectCards(1)
    await act(async () =>
      completeOld({
        ok: true,
        json: async () => pageResponse([internships[0]]),
      }),
    )
    expect(
      screen.getByRole('heading', { name: 'React Frontend Intern' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: 'Java Backend Intern' }),
    ).not.toBeInTheDocument()
  })
})
