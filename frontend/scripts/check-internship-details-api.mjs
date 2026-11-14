import assert from 'node:assert/strict'
import { fetchInternships, fetchInternshipDetails } from '../src/services/internshipApi.js'
const base = process.env.API_BASE_URL || 'http://localhost:8080'
const originalFetch = globalThis.fetch
let requests = 0
try {
  globalThis.fetch = (path, options) => { requests++; return originalFetch(new URL(path, base), options) }
  const records = await fetchInternships()
  assert.ok(records.length, 'At least one local listing is needed for this read-only check')
  const sample = records[0]
  const detail = await fetchInternshipDetails(String(sample.id))
  for (const key of ['id', 'title', 'company', 'location', 'workMode', 'roleCategory', 'eligibilityText', 'applicationUrl', 'deadline', 'lastVerifiedDate']) assert.deepEqual(detail[key], sample[key], key)
  const beforeInvalid = requests
  await assert.rejects(() => fetchInternshipDetails('../1'), (error) => error.status === 400)
  assert.equal(requests, beforeInvalid, 'Invalid IDs must not send an HTTP request')
  await assert.rejects(() => fetchInternshipDetails('9223372036854775807'), (error) => error.status === 404)
  console.log('Details API checks passed: complete database record, read-only access, invalid-ID rejection before fetch and unknown-ID 404.')
} finally { globalThis.fetch = originalFetch }
