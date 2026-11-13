import { describe, expect, it, vi } from 'vitest'
import { fetchInternships } from './internshipApi.js'
import { internships } from '../test/fixtures.js'

describe('internship API client', () => {
  it('loads real response data from the relative API path and passes cancellation', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => internships })
    vi.stubGlobal('fetch', fetch)
    const controller = new AbortController()
    expect(await fetchInternships({ signal: controller.signal })).toEqual(
      internships,
    )
    expect(fetch).toHaveBeenCalledWith('/api/internships', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
  })
  it('trims and encodes search parameters', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    vi.stubGlobal('fetch', fetch)
    await fetchInternships({ search: ' Java & SQL ' })
    expect(fetch.mock.calls[0][0]).toBe('/api/internships?search=Java+%26+SQL')
  })
  it('omits a blank search query', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    vi.stubGlobal('fetch', fetch)
    await fetchInternships({ search: '   ' })
    expect(fetch.mock.calls[0][0]).toBe('/api/internships')
  })
  it('rejects HTTP errors instead of presenting an empty successful result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    )
    await expect(fetchInternships()).rejects.toThrow('503')
  })
  it('rejects a malformed non-array payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ error: true }) }),
    )
    await expect(fetchInternships()).rejects.toThrow(
      'Unexpected internship response',
    )
  })
})
