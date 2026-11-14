import { render,screen,waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe,expect,it,vi } from 'vitest'
import App from './App.jsx'
import { internships,filterOptions,pageResponse } from './test/fixtures.js'
function install(){
 let applications=[]
 const roles=[...internships,{...internships[0],id:4,title:'[DEMO] Fourth Role'}]
 const reply=(data,status=200)=>({ok:status<400,status,json:async()=>JSON.parse(JSON.stringify(data))})
 const fetch=vi.fn(async(url,options={})=>{
  if(url==='/api/internships/filter-options')return reply(filterOptions)
  if(/^\/api\/internships\/\d+$/.test(url)){const role=roles.find(r=>r.id===Number(url.split('/').at(-1)));return reply(role||{},role?200:404)}
  if(url.startsWith('/api/internships'))return reply(pageResponse(roles,url))
  if(options.method==='POST'){const id=JSON.parse(options.body).internshipId;const row={id:100+id,internship:roles.find(r=>r.id===id),status:'SAVED',notes:'',appliedDate:null,savedAt:'2026-11-14T00:00:00Z',updatedAt:'2026-11-14T00:00:00Z'};applications.push(row);return reply(row,201)}
  return reply(applications)
 });vi.stubGlobal('fetch',fetch);return {fetch,roles}
}
describe('details and comparison integrated with the existing app',()=>{
 it('opens a direct link, survives remount on that URL, saves and opens the shared tracker',async()=>{
  install();window.history.replaceState(null,'','/#/internships/1');let app=render(<App/>);const user=userEvent.setup()
  await screen.findByRole('heading',{name:'Java Backend Intern',level:1});await user.click(screen.getByRole('link',{name:'Skip to content'}));expect(window.location.hash).toBe('#/internships/1');app.unmount();app=render(<App/>);await screen.findByRole('heading',{name:'Java Backend Intern',level:1})
  const save=screen.getByRole('button',{name:'Save internship to tracker'});await waitFor(()=>expect(save).toBeEnabled());await user.click(save);expect(await screen.findByRole('button',{name:'Already in My applications'})).toBeDisabled()
  await user.click(screen.getByRole('button',{name:'Open My applications'}));expect(await screen.findByRole('combobox',{name:'Status for Java Backend Intern'})).toHaveValue('SAVED');expect(window.location.hash).toBe('#applications')
 })
 it('opens details from Explore and returns without resetting its search state',async()=>{
  install();render(<App/>);const user=userEvent.setup();await user.click(await screen.findByRole('link',{name:'Details for Java Backend Intern'}));expect(await screen.findByRole('heading',{name:'Java Backend Intern',level:1})).toBeVisible();expect(window.location.hash).toBe('#/internships/1')
  await user.click(screen.getByRole('button',{name:'Back to internships'}));expect(await screen.findByRole('heading',{name:'Explore internships.'})).toBeVisible();expect(window.location.hash).toBe('#explore')
 })
 it('selects three roles, blocks a fourth, and updates comparison count after removal',async()=>{
  install();render(<App/>);const user=userEvent.setup()
  for(const name of ['Java Backend Intern','React Frontend Intern','Software Engineering Intern'])await user.click(await screen.findByRole('button',{name:'Compare '+name,exact:true}))
  expect(screen.getByRole('button',{name:'Compare Fourth Role',exact:true})).toBeDisabled()
  await user.click(screen.getByRole('button',{name:'Compare roles (3/3)'}));expect(screen.getAllByRole('article')).toHaveLength(3)
  await user.click(screen.getByRole('button',{name:'Remove React Frontend Intern from comparison'}));expect(screen.getAllByRole('article')).toHaveLength(2);expect(screen.getByRole('button',{name:'Compare roles (2/3)'})).toBeVisible()
 })
 it('shows a missing direct-linked role without crashing the rest of navigation',async()=>{
  install();window.history.replaceState(null,'','/#/internships/999');render(<App/>);const user=userEvent.setup();await screen.findByRole('heading',{name:'Internship not found'});await user.click(screen.getByRole('button',{name:'Back to internships'}));expect(await screen.findByRole('link',{name:'Details for Java Backend Intern'})).toBeVisible()
 })
})
