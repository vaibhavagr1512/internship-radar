import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import InternshipComparison from './components/InternshipComparison.jsx'
import { comparisonToCsv,toggleComparison } from './utils/internshipComparison.js'
import { internships } from './test/fixtures.js'
function mount(roles=internships){const props={roles,onReplace:vi.fn(),onRemove:vi.fn(),onClear:vi.fn(),onExplore:vi.fn(),onDetails:vi.fn()};return {...render(<InternshipComparison {...props}/>),props}}
describe('comparison selection and CSV',()=>{
 it('limits selection to three unique roles without mutation and removes selected roles',()=>{
  const selected=internships.slice();expect(toggleComparison(selected,{...internships[0],id:4})).toBe(selected);expect(toggleComparison(selected,internships[1]).map(x=>x.id)).toEqual([1,3]);expect(selected).toHaveLength(3);expect(toggleComparison([],internships[0])).toEqual([internships[0]])
 })
 it('exports recorded comparison fields and protects formulas/quotes/Unicode',()=>{
  const csv=comparisonToCsv([{...internships[0],title:'=ROLE',eligibilityText:'Java, "SQL"\nनमस्ते'}]);expect(csv.charCodeAt(0)).toBe(0xFEFF);expect(csv).toContain('"\'=ROLE"');expect(csv).toContain('"Java, ""SQL""\nनमस्ते"');expect(csv).toContain('"Data status"');expect(csv).not.toContain('"Notes"')
 })
})
describe('comparison view',()=>{
 it('explains an empty selection and navigates to Explore',async()=>{
  const p=mount([]);await userEvent.click(screen.getByRole('button',{name:'Explore internships'}));expect(p.props.onExplore).toHaveBeenCalledOnce();expect(screen.queryByRole('button',{name:'Export comparison CSV'})).not.toBeInTheDocument()
 })
 it('shows three roles with all facts and allows removal, details and clear',async()=>{
  const p=mount();const user=userEvent.setup();expect(screen.getAllByRole('article')).toHaveLength(3)
  await user.click(screen.getByRole('button',{name:'Details for Java Backend Intern'}));expect(p.props.onDetails).toHaveBeenCalledWith(1)
  await user.click(screen.getByRole('button',{name:'Remove React Frontend Intern from comparison'}));expect(p.props.onRemove).toHaveBeenCalledWith(internships[1])
  await user.click(screen.getByRole('button',{name:'Clear comparison'}));expect(p.props.onClear).toHaveBeenCalledOnce()
 })
 it('refreshes each selected ID and replaces snapshots with fresh API data',async()=>{
  const fetch=vi.fn(async url=>({ok:true,status:200,json:async()=>({...internships.find(x=>url.endsWith('/'+x.id)),company:'Updated company'})}));vi.stubGlobal('fetch',fetch);const p=mount()
  await userEvent.click(screen.getByRole('button',{name:'Refresh comparison'}));await screen.findByText('Comparison refreshed from the API.');expect(fetch).toHaveBeenCalledTimes(3);expect(p.props.onReplace.mock.calls[0][0].every(x=>x.company==='Updated company')).toBe(true)
 })
 it('marks removed/unavailable listings instead of silently treating snapshots as current',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,status:404,json:async()=>({})})));const p=mount([internships[0]])
  await userEvent.click(screen.getByRole('button',{name:'Refresh comparison'}));await screen.findByText(/Some listings could not be refreshed/);const updated=p.props.onReplace.mock.calls[0][0];expect(updated[0].comparisonError).toMatch(/no longer available/)
  p.rerender(<InternshipComparison {...p.props} roles={updated}/>);expect(screen.getByRole('alert')).toHaveTextContent('no longer available')
 })
 it('aborts pending refresh when the comparison view unmounts',async()=>{
  let signal;vi.stubGlobal('fetch',vi.fn((url,options)=>{signal=options.signal;return new Promise(()=>{})}));const p=mount([internships[0]])
  await userEvent.click(screen.getByRole('button',{name:'Refresh comparison'}));expect(screen.getByRole('button',{name:'Clear comparison'})).toBeDisabled();p.unmount();expect(signal.aborted).toBe(true);expect(p.props.onReplace).not.toHaveBeenCalled()
 })
})
