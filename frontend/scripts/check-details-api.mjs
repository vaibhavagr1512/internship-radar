import assert from 'node:assert/strict'
import { fetchInternships } from '../src/services/internshipApi.js'
import {
  fetchApplications,
  saveApplication,
  updateApplicationDetails,
  updateApplicationStatus,
  removeApplication,
} from '../src/services/applicationApi.js'
const base = process.env.API_BASE_URL || 'http://localhost:8080'
const original = globalThis.fetch
let createdId
globalThis.fetch = (path, options) => original(new URL(path, base), options)
try {
  const all = await fetchInternships()
  const tracked = await fetchApplications()
  const ids = new Set(tracked.map((x) => x.internship.id))
  const candidate = all.find(
    (x) => x.title.includes('[DEMO]') && !ids.has(x.id),
  )
  assert.ok(candidate, 'One untracked demo role is required')
  const saved = await saveApplication(candidate.id)
  createdId = saved.id
  assert.equal(saved.notes, '')
  assert.equal(saved.appliedDate, null)
  const details = await updateApplicationDetails(createdId, {
    notes: 'Interview preparation\nFollow up on Friday',
    appliedDate: '2026-11-13',
  })
  assert.equal(details.status, 'SAVED')
  assert.equal(details.appliedDate, '2026-11-13')
  const status = await updateApplicationStatus(createdId, 'APPLIED')
  assert.equal(status.notes, details.notes)
  assert.equal(status.appliedDate, '2026-11-13')
  const reloaded = (await fetchApplications()).find((x) => x.id === createdId)
  assert.equal(reloaded.notes, details.notes)
  await assert.rejects(
    () =>
      updateApplicationDetails(createdId, {
        notes: 'a'.repeat(2001),
        appliedDate: null,
      }),
    (error) => error.status === 400,
  )
  const cleared = await updateApplicationDetails(createdId, {
    notes: '',
    appliedDate: null,
  })
  assert.equal(cleared.notes, '')
  assert.equal(cleared.appliedDate, null)
  assert.equal(cleared.status, 'APPLIED')
  console.log(
    'Live detail checks passed: empty defaults, save/read, status preservation, length validation, and clearing both fields.',
  )
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  if (createdId !== undefined)
    try {
      await removeApplication(createdId)
    } catch (error) {
      console.error(`Cleanup failed for ${createdId}: ${error.message}`)
      process.exitCode = 1
    }
  globalThis.fetch = original
}
