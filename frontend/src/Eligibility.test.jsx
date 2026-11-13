import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import EligibilityFeedback from './components/EligibilityFeedback.jsx'
import { internships, filterOptions, pageResponse } from './test/fixtures.js'

function installApi() {
  const fetch = vi.fn(async (url) => {
    if (url.startsWith('/api/applications'))
      return { ok: true, json: async () => [] }
    if (url.startsWith('/api/internships/filter-options'))
      return { ok: true, json: async () => filterOptions }
    const params = new URL(url, 'http://localhost').searchParams
    let rows = internships
    if (params.has('studentDegree')) {
      rows = rows.map((row, index) => ({
        ...row,
        eligibility: {
          status:
            index === 2
              ? 'CHECK_OFFICIAL'
              : index === 0 && Number(params.get('studentCgpa')) < 7
                ? 'DOES_NOT_MATCH'
                : 'MATCHES',
          reasons: [
            index === 2
              ? 'Requirements are unverified.'
              : 'Check all conditions on the official listing.',
          ],
          verified: index !== 2,
          degrees: ['BTECH'],
          studyYears: [3],
          minimumCgpa: index === 0 ? 7 : null,
        },
      }))
      if (params.get('matchesOnly') === 'true')
        rows = rows.filter((row) => row.eligibility.status === 'MATCHES')
    }
    return { ok: true, json: async () => pageResponse(rows, url) }
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}
async function apply(user, cgpa = '8.5') {
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Your degree' }),
    'BTECH',
  )
  fireEvent.change(
    screen.getByRole('spinbutton', { name: 'Your CGPA (out of 10)' }),
    { target: { value: cgpa } },
  )
  await user.click(screen.getByRole('button', { name: 'Apply profile' }))
}

describe('student eligibility checks', () => {
  it('leaves matching disabled before a profile is applied', async () => {
    installApi()
    render(<App />)
    await screen.findAllByRole('article')
    expect(
      screen.getByRole('checkbox', { name: 'Show matches only' }),
    ).toBeDisabled()
    expect(
      screen.queryByText('Matches listed requirements'),
    ).not.toBeInTheDocument()
  })
  it('applies profile parameters and displays matches alongside unknown requirements', async () => {
    const fetch = installApi()
    const user = userEvent.setup()
    render(<App />)
    await screen.findAllByRole('article')
    await apply(user)
    expect(
      await screen.findAllByText('Matches listed requirements'),
    ).toHaveLength(2)
    expect(screen.getByText('Check official requirements')).toBeVisible()
    const url = fetch.mock.calls
      .filter(([url]) => url.startsWith('/api/internships?'))
      .at(-1)[0]
    expect(url).toContain('studentDegree=BTECH')
    expect(url).toContain('studentYear=3')
    expect(url).toContain('studentCgpa=8.5')
  })
  it('filters matches only and clearing the profile restores all records', async () => {
    installApi()
    const user = userEvent.setup()
    render(<App />)
    await screen.findAllByRole('article')
    await apply(user)
    await screen.findByText('Check official requirements')
    await user.click(
      screen.getByRole('checkbox', { name: 'Show matches only' }),
    )
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
    await user.click(screen.getByRole('button', { name: 'Clear profile' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(3))
    expect(
      screen.queryByText('Matches listed requirements'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: 'Show matches only' }),
    ).toBeDisabled()
  })
  it('does not treat low CGPA or unknown metadata as a match', async () => {
    installApi()
    const user = userEvent.setup()
    render(<App />)
    await screen.findAllByRole('article')
    await apply(user, '6.5')
    expect(
      await screen.findByText('Doesn’t match listed requirements'),
    ).toBeVisible()
    expect(screen.getByText('Check official requirements')).toBeVisible()
    await user.click(
      screen.getByRole('checkbox', { name: 'Show matches only' }),
    )
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))
    expect(
      screen.getByRole('heading', { name: 'React Frontend Intern' }),
    ).toBeVisible()
  })
  it('clear filters removes matching-only but retains the applied profile', async () => {
    installApi()
    const user = userEvent.setup()
    render(<App />)
    await screen.findAllByRole('article')
    await apply(user)
    await screen.findByText('Check official requirements')
    await user.click(
      screen.getByRole('checkbox', { name: 'Show matches only' }),
    )
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(3))
    expect(screen.getByText(/Applied profile:/)).toBeVisible()
  })
  it('renders unverified results cautiously and keeps reasons as plain text', () => {
    const { container } = render(
      <EligibilityFeedback
        assessment={{
          status: 'CHECK_OFFICIAL',
          reasons: ['<script>unverified</script>'],
          verified: false,
          degrees: [],
          studyYears: [],
          minimumCgpa: null,
        }}
      />,
    )
    expect(screen.getByText('Check official requirements')).toBeVisible()
    expect(container.querySelector('script')).toBeNull()
  })
})
