import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { internships, filterOptions, pageResponse } from './test/fixtures.js'

function installApi() {
  const fetch = vi.fn(async (url) => {
    if (url.startsWith('/api/internships/filter-options'))
      return { ok: true, json: async () => filterOptions }
    if (url.startsWith('/api/applications'))
      return { ok: true, json: async () => [] }
    const search =
      new URL(url, 'http://localhost').searchParams
        .get('search')
        ?.toLowerCase() || ''
    return {
      ok: true,
      json: async () =>
        pageResponse(
          internships.filter((record) =>
            `${record.title} ${record.company}`.toLowerCase().includes(search),
          ),
          url,
        ),
    }
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}
async function searchFor(user, term) {
  const input = screen.getByRole('searchbox', {
    name: 'Search by role or company',
  })
  await user.clear(input)
  await user.type(input, term)
  await user.click(screen.getByRole('button', { name: 'Search', exact: true }))
}

describe('internship discovery', () => {
  it('announces loading while the request is pending', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Finding opportunities',
    )
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
  it('loads all three cards and displays the demo warning', async () => {
    installApi()
    render(<App />)
    expect(await screen.findAllByRole('article')).toHaveLength(3)
    expect(screen.getByRole('note')).toHaveTextContent(
      'not active opportunities',
    )
    expect(screen.getAllByText('Demo listing')).toHaveLength(3)
    expect(screen.getByRole('status')).toHaveTextContent(
      '3 internships to explore',
    )
  })
  it.each(['java', 'JAVA'])(
    'searches both role and company for %s',
    async (term) => {
      const fetch = installApi()
      const user = userEvent.setup()
      render(<App />)
      await screen.findAllByRole('article')
      await searchFor(user, term)
      await waitFor(() =>
        expect(screen.getAllByRole('article')).toHaveLength(2),
      )
      expect(
        screen.getByRole('heading', { name: 'Software Engineering Intern' }),
      ).toBeVisible()
      expect(
        screen.queryByRole('heading', { name: 'React Frontend Intern' }),
      ).not.toBeInTheDocument()
      expect(fetch).toHaveBeenLastCalledWith(
        `/api/internships?search=${term}&page=0&size=6&sort=lastVerifiedDate%2Cdesc`,
        expect.any(Object),
      )
    },
  )
  it('submits on Enter and supports quick-search suggestions', async () => {
    installApi()
    const user = userEvent.setup()
    render(<App />)
    await screen.findAllByRole('article')
    await user.type(screen.getByRole('searchbox'), 'React{Enter}')
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))
    expect(
      screen.getByRole('heading', { name: 'React Frontend Intern' }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Java', exact: true }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
    expect(screen.getByRole('searchbox')).toHaveValue('Java')
  })
  it('shows empty results and resets to all listings', async () => {
    installApi()
    const user = userEvent.setup()
    render(<App />)
    await screen.findAllByRole('article')
    await searchFor(user, 'unmatched')
    expect(
      await screen.findByRole('heading', { name: 'No internships found' }),
    ).toBeVisible()
    await user.click(
      screen.getByRole('button', { name: 'View all internships' }),
    )
    expect(await screen.findAllByRole('article')).toHaveLength(3)
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('searchbox')).toHaveFocus()
  })
  it('clears an active search and restores all listings', async () => {
    installApi()
    const user = userEvent.setup()
    render(<App />)
    await screen.findAllByRole('article')
    await searchFor(user, 'React')
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(await screen.findAllByRole('article')).toHaveLength(3)
  })
  it('shows a connection error and recovers on retry', async () => {
    const fetch = installApi()
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't load internships",
    )
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findAllByRole('article')).toHaveLength(3)
  })
  it('treats HTTP errors as failures rather than no matches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    )
    render(<App />)
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(screen.queryByText('No internships found')).not.toBeInTheDocument()
  })
  it('ignores late results from a previous search', async () => {
    let completeOldRequest
    const fetch = installApi()
    const user = userEvent.setup()
    render(<App />)
    await screen.findAllByRole('article')
    fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completeOldRequest = resolve
        }),
    )
    await user.click(screen.getByRole('button', { name: 'Java', exact: true }))
    await user.click(screen.getByRole('button', { name: 'React', exact: true }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))
    await act(async () =>
      completeOldRequest({
        ok: true,
        json: async () => pageResponse(internships),
      }),
    )
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(
      screen.getByRole('heading', { name: 'React Frontend Intern' }),
    ).toBeVisible()
  })
  it('cancels pending requests on unmount', async () => {
    const fetch = installApi()
    const { unmount } = render(<App />)
    const signal = fetch.mock.calls[0][1].signal
    unmount()
    expect(signal.aborted).toBe(true)
  })
})
