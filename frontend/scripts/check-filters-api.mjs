import assert from 'node:assert/strict'
import {
  fetchFilterOptions,
  fetchInternships,
} from '../src/services/internshipApi.js'

const base = process.env.API_BASE_URL || 'http://localhost:8080'
const realFetch = globalThis.fetch
globalThis.fetch = (path, options) => realFetch(new URL(path, base), options)
try {
  const all = await fetchInternships()
  assert.equal(
    all.length,
    3,
    'Run this check against the three-record demo database',
  )
  const options = await fetchFilterOptions()
  assert.deepEqual(options.workModes, ['HYBRID', 'ONSITE', 'REMOTE'])
  assert.deepEqual(options.roleCategories, ['BACKEND', 'FRONTEND', 'SOFTWARE'])
  assert.deepEqual(options.locations, ['Bengaluru', 'Hyderabad', 'Remote'])
  for (const filters of [
    { workMode: 'REMOTE' },
    { roleCategory: 'BACKEND' },
    { location: 'Hyderabad' },
  ]) {
    const result = await fetchInternships(filters)
    assert.equal(result.length, 1)
    for (const [key, value] of Object.entries(filters))
      assert.equal(result[0][key].toLowerCase(), value.toLowerCase())
  }
  const combined = await fetchInternships({
    search: ' JAVA ',
    workMode: ' hybrid ',
    roleCategory: ' backend ',
    location: ' bengaluru ',
  })
  assert.equal(combined.length, 1)
  assert.ok(combined[0].title.includes('Java Backend'))
  assert.deepEqual(
    await fetchInternships({ workMode: 'HYBRID', roleCategory: 'FRONTEND' }),
    [],
  )
  assert.equal(
    (await fetchInternships({ workMode: ' ', roleCategory: '', location: ' ' }))
      .length,
    3,
  )
  assert.deepEqual(
    await fetchInternships({ search: '%', workMode: 'REMOTE' }),
    [],
  )
  console.log(
    'Live filter checks passed: database options, individual filters, combined search, case/whitespace, no matches, blank reset, and literal wildcard search.',
  )
} catch (error) {
  console.error(`Filter checks failed: ${error.message}`)
  process.exitCode = 1
} finally {
  globalThis.fetch = realFetch
}
