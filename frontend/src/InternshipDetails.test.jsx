import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import InternshipDetails from './components/InternshipDetails.jsx'
import CopyInternshipLink from './components/CopyInternshipLink.jsx'
import { internships } from './test/fixtures.js'
import { listingNotices } from './utils/listingNotices.js'
import { readRoute, validInternshipId, internshipLink } from './utils/internshipNavigation.js'
const response=(data,status=200)=>({ok:status<400,status,json:async()=>data})
const tracker=(extra={})=>({applications:[],loading:false,error:false,pending:new Set(),save:vi.fn(),...extra})
function mount(extra={}){const props={id:'1',tracker:tracker(),onBack:vi.fn(),onTracker:vi.fn(),onCompare:vi.fn(),compared:false,comparisonFull:false,...extra};return {...render(<InternshipDetails {...props}/>),props}}

describe('navigation and ID validation',()=>{
 it.each(['0','-1','1.5','abc','1/2','01','9223372036854775808','1?search=x'])('rejects malformed IDs %s',id=>expect(validInternshipId(id)).toBe(false))
 it('accepts positive SQL Long IDs and recognizes details, comparison and root/back routes',()=>{
  expect(validInternshipId('9223372036854775807')).toBe(true);expect(validInternshipId('1')).toBe(true)
  expect(readRoute('#/internships/12')).toEqual({view:'details',id:'12'});expect(readRoute('#/compare').view).toBe('compare');expect(readRoute('').view).toBe('explore');expect(readRoute('#how-it-works')).toBeNull()
 })
 it('creates canonical hash links without unrelated query parameters',()=>{
  window.history.replaceState(null,'','/?private=omit#applications');expect(internshipLink(3)).toBe(window.location.origin+'/#/internships/3')
 })
})
describe('listing notices',()=>{
 it('distinguishes missing, today and past deadlines without claiming applications are closed',()=>{
  expect(listingNotices({deadline:null,lastVerifiedDate:'2026-11-14'},'2026-11-14')[0]).toMatch(/No valid deadline/)
  expect(listingNotices({deadline:'2026-11-14',lastVerifiedDate:'2026-11-14'},'2026-11-14')[0]).toMatch(/today/)
  expect(listingNotices({deadline:'2026-11-13',lastVerifiedDate:'2026-11-14'},'2026-11-14')[0]).toMatch(/has passed/)
 })
 it('handles freshness boundaries, invalid calendar dates and future verification dates',()=>{
  expect(listingNotices({deadline:'2026-12-31',lastVerifiedDate:'2026-10-15'},'2026-11-14')).toEqual([])
  expect(listingNotices({deadline:'2026-12-31',lastVerifiedDate:'2026-10-14'},'2026-11-14')[0]).toMatch(/over 30 days/)
  expect(listingNotices({deadline:'2026-02-30',lastVerifiedDate:'invalid'},'2026-11-14')).toHaveLength(2)
  expect(listingNotices({deadline:'2026-12-31',lastVerifiedDate:'2026-11-15'},'2026-11-14')[0]).toMatch(/future/)
 })
})
describe('internship details',()=>{
 it('fetches all recorded facts, focuses its heading and supports saving/comparing/navigation/printing',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>response(internships[0])));const print=vi.spyOn(window,'print').mockImplementation(()=>{});const p=mount();const user=userEvent.setup()
  expect(screen.getByRole('status')).toHaveTextContent('Loading internship details')
  const heading=await screen.findByRole('heading',{name:'Java Backend Intern',level:1});expect(heading).toHaveFocus()
  expect(screen.getByText(internships[0].eligibilityText)).toBeVisible();expect(screen.getByText(/not an active opportunity/)).toBeVisible()
  const link=screen.getByRole('link',{name:/https:\/\/example.com\/internships\/java/});expect(link).toHaveAttribute('rel','noopener noreferrer')
  await user.click(screen.getByRole('button',{name:'Save internship to tracker'}));expect(p.props.tracker.save).toHaveBeenCalledWith(1)
  await user.click(screen.getByRole('button',{name:'Add to comparison'}));expect(p.props.onCompare).toHaveBeenCalledWith(internships[0])
  await user.click(screen.getByRole('button',{name:'Open My applications'}));expect(p.props.onTracker).toHaveBeenCalledOnce()
  await user.click(screen.getByRole('button',{name:'Back to internships'}));expect(p.props.onBack).toHaveBeenCalledOnce()
  await user.click(screen.getByRole('button',{name:'Print internship details'}));expect(print).toHaveBeenCalledOnce()
 })
 it('does not fetch an invalid ID and distinguishes 404 from transient errors',async()=>{
  const fetch=vi.fn(async()=>response({},404));vi.stubGlobal('fetch',fetch);const p=mount({id:'../1'})
  expect(await screen.findByRole('heading',{name:'Invalid internship link'})).toBeVisible();expect(fetch).not.toHaveBeenCalled()
  p.rerender(<InternshipDetails {...p.props} id="2"/>);expect(await screen.findByRole('heading',{name:'Internship not found'})).toBeVisible();expect(screen.queryByRole('button',{name:'Retry details'})).not.toBeInTheDocument()
 })
 it('retries a failed request',async()=>{
  let attempts=0;vi.stubGlobal('fetch',vi.fn(async()=>++attempts===1?response({},503):response(internships[0])));mount();const user=userEvent.setup()
  await user.click(await screen.findByRole('button',{name:'Retry details'}));expect(await screen.findByRole('heading',{name:'Java Backend Intern'})).toBeVisible()
 })
 it('rejects a details response for the wrong internship',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>response(internships[1])));mount();expect(await screen.findByRole('button',{name:'Retry details'})).toBeVisible();expect(screen.queryByRole('button',{name:'Save internship to tracker'})).not.toBeInTheDocument()
 })
 it('ignores a late response for a previously selected internship',async()=>{
  let resolveFirst;vi.stubGlobal('fetch',vi.fn((url)=>url.endsWith('/1')?new Promise(resolve=>{resolveFirst=resolve}):Promise.resolve(response(internships[1]))));const p=mount()
  p.rerender(<InternshipDetails {...p.props} id="2"/>);await screen.findByRole('heading',{name:'React Frontend Intern'})
  await act(async()=>resolveFirst(response(internships[0])));expect(screen.queryByRole('heading',{name:'Java Backend Intern'})).not.toBeInTheDocument()
 })
 it('shows tracked status, prevents duplicate saves, caps comparison, and blocks unsafe official links',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>response({...internships[0],applicationUrl:'javascript:alert(1)'})))
  mount({tracker:tracker({applications:[{internship:internships[0],status:'APPLIED'}]}),comparisonFull:true})
  expect(await screen.findByRole('button',{name:'Already in My applications'})).toBeDisabled();expect(screen.getByText('Tracker status: APPLIED')).toBeVisible();expect(screen.getByRole('button',{name:'Add to comparison'})).toBeDisabled();expect(screen.getByText('Official link unavailable.')).toBeVisible()
 })
})
describe('copy internship links',()=>{
 it('copies the canonical link when clipboard access succeeds',async()=>{
  const user=userEvent.setup();const write=vi.spyOn(navigator.clipboard,'writeText').mockResolvedValue();render(<CopyInternshipLink id="1"/>);await user.click(screen.getByRole('button',{name:'Copy internship link'}));expect(write).toHaveBeenCalledWith(internshipLink(1));expect(screen.getByRole('status')).toHaveTextContent('copied')
 })
 it('provides a selectable manual fallback on clipboard rejection',async()=>{
  const user=userEvent.setup();vi.spyOn(navigator.clipboard,'writeText').mockRejectedValue(new Error('Denied'));render(<CopyInternshipLink id="2"/>);await user.click(screen.getByRole('button',{name:'Copy internship link'}));expect(screen.getByRole('textbox',{name:'Internship link'})).toHaveValue(internshipLink(2));expect(screen.getByRole('status')).toHaveTextContent('Select and copy')
 })
})
