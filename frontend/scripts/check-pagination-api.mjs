import assert from 'node:assert/strict'
import { fetchInternshipPage } from '../src/services/internshipApi.js'
const base = process.env.API_BASE_URL || 'http://localhost:8080'
const original = globalThis.fetch
globalThis.fetch = (path, options) => original(new URL(path, base), options)
try {
  const first = await fetchInternshipPage({ page: 0, size: 2 })
  assert.equal(first.totalElements, 3)
  assert.equal(first.totalPages, 2)
  assert.equal(first.content.length, 2)
  assert.equal(first.first, true)
  assert.equal(first.last, false)
  const last = await fetchInternshipPage({ page: 1, size: 2 })
  assert.equal(last.content.length, 1)
  assert.equal(last.last, true)
  assert.equal(
    new Set([...first.content, ...last.content].map((x) => x.id)).size,
    3,
  )
  const sorted = await fetchInternshipPage({ sort: 'deadline,asc' })
  assert.equal(sorted.content[0].deadline, '2026-12-31')
  assert.equal(sorted.content.at(-1).deadline, null)
  const filtered = await fetchInternshipPage({
    search: 'JAVA',
    workMode: 'HYBRID',
    page: 0,
    size: 2,
  })
  assert.equal(filtered.totalElements, 1)
  const empty = await fetchInternshipPage({ search: 'missing' })
  assert.equal(empty.totalPages, 0)
  assert.deepEqual(empty.content, [])
  const invalid = await original(new URL('/api/internships?page=-1', base))
  assert.equal(invalid.status, 400)
  console.log(
    'Live pagination checks passed: page boundaries, totals, no repeated IDs, deadline sorting/nulls, filters, empty results, and validation.',
  )
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  globalThis.fetch = original
}
