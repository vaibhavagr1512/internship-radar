import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { selectApplications } from './utils/applicationView.js'
import ApplicationTracker from './components/ApplicationTracker.jsx'
import ApplicationRemoval from './components/ApplicationRemoval.jsx'
import { internships } from './test/fixtures.js'
const row = (id, overrides = {}) => ({ id, status: 'SAVED', notes: '', appliedDate: null, savedAt: '2026-11-14T00:00:00Z', updatedAt: '2026-11-14T00:00:00Z', internship: { ...internships[0], id, title: `Role ${id}`, company: `Company ${id}` }, ...overrides })
const select = (data, options) => selectApplications(data, { today: '2026-11-14', ...options }).map(x => x.id)
const tracker = (applications, extra = {}) => ({ applications, loading: false, error: false, pending: new Set(), remove: vi.fn().mockResolvedValue(true), update: vi.fn(), updateDetails: vi.fn(), refresh: vi.fn(), ...extra })
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

describe('Day 12 search and sorting', () => {
 it('matches role or company ignoring case and outer whitespace and combines with status', () => {
  const data = [row(1,{ internship: {...internships[0],title:'JAVA Intern',company:'First'} }),row(2,{status:'APPLIED',internship:{...internships[1],title:'Developer',company:'Java Labs'}}),row(3)]
  expect(select(data,{search:'  jAvA  '})).toEqual([1,2]); expect(select(data,{search:'java',status:'APPLIED'})).toEqual([2]); expect(select(data,{search:'%'})).toEqual([])
 })
 it.each(['asc','desc'])('places missing applied dates last with stable ID ties (%s)', direction => {
  const data=[row(7),row(3,{appliedDate:'2026-11-12'}),row(2,{appliedDate:'2026-11-12'}),row(1,{appliedDate:'2026-11-13'}),row(6)]
  expect(select(data,{sort:`appliedDate,${direction}`})).toEqual(direction==='asc'?[2,3,1,6,7]:[1,2,3,6,7])
  expect(data.map(x=>x.id)).toEqual([7,3,2,1,6])
 })
 it('sorts actual timestamp instants and treats invalid/missing dates as unknown', () => {
  const data=[row(1,{updatedAt:'2026-11-14T10:30:00+05:30'}),row(2,{updatedAt:'2026-11-14T06:00:00Z'}),row(3,{updatedAt:null}),row(4,{updatedAt:'invalid'})]
  expect(select(data,{sort:'updatedAt,desc'})).toEqual([2,1,3,4]);expect(select(data,{sort:'updatedAt,asc'})).toEqual([1,2,3,4])
 })
 it('uses a safe default for unsupported sorts and supports blank search',()=>{
  expect(select([row(2),row(1)],{sort:'unknown',search:'  '})).toEqual([1,2])
 })
})
describe('Day 13 deadline filters',()=>{
 const data=[row(1,{internship:{...internships[0],deadline:'2026-11-13'}}),row(2,{internship:{...internships[0],deadline:'2026-11-14'}}),row(3,{internship:{...internships[0],deadline:'2026-11-20'}}),row(4,{internship:{...internships[0],deadline:'2026-11-21'}}),row(5)]
 it.each([['TODAY',[2]],['NEXT7',[2,3]],['PAST',[1]],['NONE',[5]],['ALL',[1,2,3,4,5]]])('filters %s at calendar boundaries', (deadline,ids)=>{expect(select(data,{deadline})).toEqual(ids)})
 it('handles leap days and year boundaries without daylight-saving duration arithmetic',()=>{
  const x=[row(1,{internship:{...internships[0],deadline:'2024-02-29'}}),row(2,{internship:{...internships[0],deadline:'2024-03-02'}})]
  expect(selectApplications(x,{today:'2024-02-25',deadline:'NEXT7'}).map(x=>x.id)).toEqual([1,2])
  expect(selectApplications([row(1,{internship:{...internships[0],deadline:'2027-01-02'}})],{today:'2026-12-29',deadline:'NEXT7'})).toHaveLength(1)
 })
 it('combines deadline, search, and status using AND',()=>{
  expect(select(data,{search:'Java',status:'SAVED',deadline:'TODAY'})).toEqual([2]); expect(select(data,{search:'Java',status:'APPLIED',deadline:'TODAY'})).toEqual([])
 })
})
describe('Day 14 tracker pagination and CSV',()=>{
 it('pages without repeated rows, resets on search/sort/size and clamps after removals',async()=>{
  const data=Array.from({length:7},(_,i)=>row(i+1));const state=tracker(data);const app=render(<ApplicationTracker tracker={state} onExplore={vi.fn()} />);const user=userEvent.setup()
  expect(screen.getAllByRole('article')).toHaveLength(6)
  await user.click(screen.getByRole('button',{name:'Next application page'}));expect(screen.getByRole('heading',{name:'Role 7'})).toBeVisible();expect(screen.getAllByRole('article')).toHaveLength(1)
  app.rerender(<ApplicationTracker tracker={tracker(data.slice(0,6))} onExplore={vi.fn()} />)
  expect(screen.getByText('Page 1 of 1')).toBeVisible()
  await user.selectOptions(screen.getByLabelText('Applications per page'),'2');await user.click(screen.getByRole('button',{name:'Next application page'}));expect(screen.getByText('Page 2 of 3')).toBeVisible()
  await user.type(screen.getByLabelText('Search applications'),'Role 1');expect(screen.getByText('Page 1 of 1')).toBeVisible()
  await user.click(screen.getByRole('button',{name:'Reset application view'}));expect(screen.getByText('Page 1 of 3')).toBeVisible()
  await user.click(screen.getByRole('button',{name:'Next application page'}));await user.selectOptions(screen.getByLabelText('Sort applications'),'appliedDate,asc');expect(screen.getByText('Page 1 of 3')).toBeVisible()
 })
 it('shows a recoverable no-match state and resets all filters',async()=>{
  render(<ApplicationTracker tracker={tracker([row(1)])} onExplore={vi.fn()} />);const user=userEvent.setup()
  await user.type(screen.getByLabelText('Search applications'),'missing')
  expect(screen.getByRole('heading',{name:'No applications match these filters'})).toBeVisible()
  expect(screen.getByRole('button',{name:'Export CSV'})).toBeDisabled()
  await user.click(screen.getByRole('button',{name:'Clear application filters'}));expect(screen.getAllByRole('article')).toHaveLength(1)
 })
 it('exports every filtered row in sorted order rather than only the current page',async()=>{
  let blob;vi.stubGlobal('URL',class extends URL{static createObjectURL=vi.fn(b=>{blob=b;return 'blob:export'});static revokeObjectURL=vi.fn()});vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{})
  const data=Array.from({length:7},(_,i)=>row(i+1,{appliedDate:`2026-11-${String(i+1).padStart(2,'0')}`}));render(<ApplicationTracker tracker={tracker(data)} onExplore={vi.fn()} />);const user=userEvent.setup()
  await user.type(screen.getByLabelText('Search applications'),'Role');await user.selectOptions(screen.getByLabelText('Sort applications'),'appliedDate,desc');await user.click(screen.getByRole('button',{name:'Next application page'}));await user.click(screen.getByRole('button',{name:'Export CSV'}))
  const csv=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsText(blob)})
  expect(csv.match(/"Role /g)).toHaveLength(7);expect(csv.indexOf('"Role 7"')).toBeLessThan(csv.indexOf('"Role 1"'))
 })
})
describe('Day 15 removal confirmation',()=>{
 it('does not remove on first click, focuses Keep, and restores focus with Escape',async()=>{
  const remove=vi.fn();render(<ApplicationRemoval application={row(1)} disabled={false} onRemove={remove} />);const user=userEvent.setup()
  await user.click(screen.getByRole('button',{name:'Remove Role 1 from tracker'}));expect(remove).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Keep application'})).toHaveFocus()
  await user.keyboard('{Escape}');expect(screen.getByRole('button',{name:'Remove Role 1 from tracker'})).toHaveFocus();expect(remove).not.toHaveBeenCalled()
 })
 it('calls the API only after confirmation and retains the record on failure',async()=>{
  const remove=vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);render(<><h1 id="tracker-heading" tabIndex={-1}>Tracker</h1><ApplicationRemoval application={row(1)} disabled={false} onRemove={remove} /></>);const user=userEvent.setup()
  await user.click(screen.getByRole('button',{name:'Remove Role 1 from tracker'}));await user.click(screen.getByRole('button',{name:'Confirm remove Role 1 from tracker'}));expect(remove).toHaveBeenCalledWith(1);expect(screen.getByRole('alert')).toHaveTextContent('Removal failed')
  await user.click(screen.getByRole('button',{name:'Confirm remove Role 1 from tracker'}));expect(remove).toHaveBeenCalledTimes(2);expect(screen.queryByRole('group')).not.toBeInTheDocument();expect(screen.getByRole('heading',{name:'Tracker'})).toHaveFocus()
 })
 it('prevents repeated confirms while a request is pending',async()=>{
  let finish;const remove=vi.fn(()=>new Promise(resolve=>{finish=resolve}));render(<ApplicationRemoval application={row(1)} disabled={false} onRemove={remove} />);const user=userEvent.setup()
  await user.click(screen.getByRole('button',{name:'Remove Role 1 from tracker'}));await user.click(screen.getByRole('button',{name:'Confirm remove Role 1 from tracker'}));expect(screen.getByRole('button',{name:'Keep application'})).toBeDisabled();expect(remove).toHaveBeenCalledOnce()
  await import('@testing-library/react').then(({act})=>act(async()=>{finish(false)}));expect(screen.getByRole('alert')).toBeVisible()
 })
})
