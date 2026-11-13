import { describe, expect, it, vi } from 'vitest'
import {
  fetchApplications,
  updateApplicationDetails,
  saveApplication,
  updateApplicationStatus,
  removeApplication,
} from './applicationApi.js'

function mockResponse(status = 200, data = []) {
  const json = vi.fn(async () => data)
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: status >= 200 && status < 300, status, json })
  vi.stubGlobal('fetch', fetch)
  return { fetch, json }
}

describe('application API client', () => {
  it('fetches saved records and passes an abort signal', async () => {
    const { fetch } = mockResponse()
    const signal = new AbortController().signal
    expect(await fetchApplications({ signal })).toEqual([])
    expect(fetch).toHaveBeenCalledWith('/api/applications', {
      signal,
      headers: { Accept: 'application/json' },
    })
  })
  it('sends only the internship ID when saving', async () => {
    const { fetch } = mockResponse(201, { id: 42 })
    expect(await saveApplication(7)).toEqual({ id: 42 })
    expect(fetch).toHaveBeenCalledWith('/api/applications', {
      method: 'POST',
      body: '{"internshipId":7}',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
  })
  it('patches a status without replacing the internship', async () => {
    const { fetch } = mockResponse(200, { id: 42, status: 'INTERVIEW' })
    expect(await updateApplicationStatus(42, 'INTERVIEW')).toEqual({
      id: 42,
      status: 'INTERVIEW',
    })
    expect(fetch.mock.calls[0]).toEqual([
      '/api/applications/42',
      expect.objectContaining({
        method: 'PATCH',
        body: '{"status":"INTERVIEW"}',
      }),
    ])
  })
  it('accepts an empty 204 delete response', async () => {
    const { fetch, json } = mockResponse(204)
    await expect(removeApplication(42)).resolves.toBeUndefined()
    expect(fetch.mock.calls[0]).toEqual([
      '/api/applications/42',
      expect.objectContaining({ method: 'DELETE' }),
    ])
    expect(json).not.toHaveBeenCalled()
  })
  it('preserves error status so the UI can reconcile a duplicate', async () => {
    mockResponse(409)
    await expect(saveApplication(7)).rejects.toMatchObject({ status: 409 })
  })
  it('rejects unexpected listing payloads', async () => {
    mockResponse(200, {})
    await expect(fetchApplications()).rejects.toThrow(
      'Unexpected applications response',
    )
  })
})

describe('application detail API', () => {
  it('uses PUT for replacing notes and applied date without a status field', async () => {
    const { fetch } = mockResponse(200, {
      id: 42,
      notes: 'Follow up',
      appliedDate: '2026-11-13',
    })
    await updateApplicationDetails(42, {
      notes: 'Follow up',
      appliedDate: '2026-11-13',
    })
    expect(fetch).toHaveBeenCalledWith(
      '/api/applications/42/details',
      expect.objectContaining({
        method: 'PUT',
        body: '{"notes":"Follow up","appliedDate":"2026-11-13"}',
      }),
    )
  })
  it('preserves null when clearing the date', async () => {
    const { fetch } = mockResponse()
    await updateApplicationDetails(42, { notes: '', appliedDate: null })
    expect(fetch.mock.calls[0][1].body).toBe('{"notes":"","appliedDate":null}')
  })
})
