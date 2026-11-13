import assert from 'node:assert/strict'
import { fetchInternshipPage } from '../src/services/internshipApi.js'
const base=process.env.API_BASE_URL||'http://localhost:8080'
const original=globalThis.fetch
globalThis.fetch=(path,options)=>original(new URL(path,base),options)
try {
 const profile={degree:'BTECH',year:3,cgpa:'8.50'}
 const all=await fetchInternshipPage({profile});assert.equal(all.totalElements,3)
 assert.equal(all.content.filter(row=>row.eligibility.status==='MATCHES').length,2)
 assert.equal(all.content.filter(row=>row.eligibility.status==='CHECK_OFFICIAL').length,1)
 const matches=await fetchInternshipPage({profile,matchesOnly:true,size:1,page:1});assert.equal(matches.totalElements,2);assert.equal(matches.totalPages,2);assert.equal(matches.content.length,1)
 const low=await fetchInternshipPage({profile:{...profile,cgpa:'6.50'},matchesOnly:true});assert.equal(low.totalElements,1);assert.ok(low.content[0].title.includes('React'))
 const young=await fetchInternshipPage({profile:{...profile,year:1},matchesOnly:true});assert.equal(young.totalElements,0)
 const invalid=await original(new URL('/api/internships?studentDegree=BTECH',base));assert.equal(invalid.status,400)
 console.log('Live eligibility checks passed: two matches, unknown excluded from matching, low CGPA mismatch, no-minimum role, year mismatch, profile validation and filtered pagination.')
}catch(error){console.error(error.message);process.exitCode=1}finally{globalThis.fetch=original}
