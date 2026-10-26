import {useCallback, useEffect, useMemo, useState} from 'react'
import {CalendarDays, CheckCircle2, Clock3, Loader2, MessageCircle, RefreshCw, Search, XCircle} from 'lucide-react'
import {adminApi, type AdminUser} from './api'
import {defaultBookingBranches, getBookingBranchId, type BookingLocationRecord} from '../bookingBranches'
import {whatsappUrl} from '../OnlineAppointmentForm'
import './booking-desk.css'

type Appointment = {
  _id: string
  bookingReference?: string
  branchId?: string
  name?: string
  phone?: string
  email?: string
  service?: string
  location?: string
  preferredDate?: string
  preferredTime?: string
  status?: string
  notes?: string
  internalNotes?: string
  createdAt?: string
  _createdAt?: string
}
const stages = [
  {value:'requested',label:'New request'},
  {value:'contacted',label:'Contacted'},
  {value:'confirmed',label:'Confirmed'},
  {value:'completed',label:'Completed'},
  {value:'cancelled',label:'Cancelled'},
]
const branchKey = (item: Appointment) =>
  item.branchId === 'airport-road' || item.branchId === 'delta-mall'
    ? item.branchId : getBookingBranchId({name:item.location}) || ''

export default function BookingDesk({user}: {user:AdminUser}) {
  const [appointments,setAppointments]=useState<Appointment[]>([])
  const [locations,setLocations]=useState<BookingLocationRecord[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [status,setStatus]=useState('all')
  const [branch,setBranch]=useState('all')
  const [search,setSearch]=useState('')
  const [selected,setSelected]=useState<Appointment|null>(null)
  const [saving,setSaving]=useState(false)
  const [success,setSuccess]=useState('')
  const [draftStatus,setDraftStatus]=useState('requested')
  const [staffNotes,setStaffNotes]=useState('')
  const canEdit=['owner','manager','editor'].includes(user.role)

  const refresh=useCallback(async(silent=false)=>{
    if(!silent)setLoading(true)
    setError('')
    try {
      const [all,locationRecords]=await Promise.all([
        adminApi.bookings(),
        adminApi.locations().catch(()=>[]),
      ])
      setAppointments(Array.isArray(all)?all:[])
      setLocations(Array.isArray(locationRecords)?locationRecords:[])
    } catch(e) {
      setError(e instanceof Error?e.message:'Could not load appointments.')
    } finally {setLoading(false)}
  },[])

  useEffect(()=>{
    void refresh()
    const refreshOnFocus=()=>void refresh(true)
    const interval=window.setInterval(()=>{
      if(document.visibilityState==='visible')void refresh(true)
    },60000)
    window.addEventListener('focus',refreshOnFocus)
    return ()=>{window.clearInterval(interval);window.removeEventListener('focus',refreshOnFocus)}
  },[refresh])

  const counts=useMemo(()=>({
    all:appointments.length,
    requested:appointments.filter(item=>(item.status||'requested')==='requested').length,
    confirmed:appointments.filter(item=>item.status==='confirmed').length,
    airport:appointments.filter(item=>branchKey(item)==='airport-road').length,
    mall:appointments.filter(item=>branchKey(item)==='delta-mall').length,
  }),[appointments])

  const results=useMemo(()=>{
    const query=search.trim().toLowerCase()
    return appointments.filter(item=>
      (status==='all'||(item.status||'requested')===status) &&
      (branch==='all'||branchKey(item)===branch) &&
      (!query||[item.name,item.phone,item.email,item.service,item.bookingReference,item.location]
        .some(value=>String(value||'').toLowerCase().includes(query))),
    ).sort((a,b)=>(b.preferredDate||'').localeCompare(a.preferredDate||'') ||
      (b.createdAt||b._createdAt||'').localeCompare(a.createdAt||a._createdAt||''))
  },[appointments,search,branch,status])

  function choose(item: Appointment) {
    setSelected(item)
    setDraftStatus(item.status||'requested')
    setStaffNotes(item.internalNotes||'')
    setSuccess('')
  }

  async function save() {
    if(!selected||!canEdit||saving)return
    setSaving(true);setError('');setSuccess('')
    try {
      await adminApi.update('bookings',selected._id,{status:draftStatus,internalNotes:staffNotes})
      setAppointments(items=>items.map(item=>item._id===selected._id
        ? {...item,status:draftStatus,internalNotes:staffNotes} : item))
      setSelected(item=>item&&item._id===selected._id
        ? {...item,status:draftStatus,internalNotes:staffNotes}:item)
      setSuccess('Appointment saved successfully.')
    } catch(e) {setError(e instanceof Error?e.message:'Could not save appointment status.')}
    finally{setSaving(false)}
  }

  const customerWhatsApp=selected?.phone&&selected.phone.replace(/\D/g,'').length>=10
    ? whatsappUrl(selected.phone,
      'Hello '+(selected.name||'')+', this is Pinksky Beauty & Wellness about your '+
      (selected.service||'appointment')+' request ('+
      (selected.bookingReference||selected._id)+') at '+
      (selected.location||'your selected branch')+' on '+
      (selected.preferredDate||'your preferred date')+' at '+
      (selected.preferredTime||'your preferred time')+'. Please reply to confirm the details. Thank you.')
    : ''
  const matchingLocation=locations.find(loc=>getBookingBranchId(loc)===branchKey(selected||{_id:''}))
  const branchPhones=matchingLocation?.whatsappNumbers?.length
    ? matchingLocation.whatsappNumbers
    : defaultBookingBranches.find(b=>b.id===branchKey(selected||{_id:''}))?.whatsappNumbers||[]

  return <div className='booking-desk'>
    <div className='booking-desk-header'>
      <div><span className='admin-kicker'>BOOKING OPERATIONS</span><h2>Appointment Requests</h2>
        <p>Customer requests are private. Confirm a time only after checking staff and branch availability.</p></div>
      <button className='admin-secondary' type='button' onClick={()=>void refresh()} disabled={loading}>
        <RefreshCw size={17}/> Refresh
      </button>
    </div>

    <div className='booking-desk-stats'>
      <button onClick={()=>{setStatus('all');setBranch('all')}}><CalendarDays size={23}/><strong>{counts.all}</strong><span>All appointments</span></button>
      <button onClick={()=>{setStatus('requested');setBranch('all')}}><Clock3 size={23}/><strong>{counts.requested}</strong><span>Needs attention</span></button>
      <button onClick={()=>{setStatus('confirmed');setBranch('all')}}><CheckCircle2 size={23}/><strong>{counts.confirmed}</strong><span>Confirmed</span></button>
      <button onClick={()=>{setBranch('airport-road');setStatus('all')}}><strong>{counts.airport}</strong><span>Airport Road</span></button>
      <button onClick={()=>{setBranch('delta-mall');setStatus('all')}}><strong>{counts.mall}</strong><span>ShopMall</span></button>
    </div>

    <div className='booking-desk-controls'>
      <label><span>Branch</span><select value={branch} onChange={e=>setBranch(e.target.value)}>
        <option value='all'>All branches</option>
        <option value='airport-road'>Airport Road, Warri</option>
        <option value='delta-mall'>ShopMall, Effurun</option>
      </select></label>
      <label><span>Status</span><select value={status} onChange={e=>setStatus(e.target.value)}>
        <option value='all'>All statuses</option>
        {stages.map(stage=><option value={stage.value} key={stage.value}>{stage.label}</option>)}
      </select></label>
      <label className='booking-desk-search'><span>Find appointment</span>
        <span className='booking-desk-search-input'><Search size={17}/>
          <input type='search' placeholder='Name, phone, reference, service…' value={search} onChange={e=>setSearch(e.target.value)}/>
        </span></label>
    </div>

    {loading&&<p className='booking-desk-message'><Loader2 className='spin'/> Loading bookings…</p>}
    {error&&<div className='admin-error' role='alert'>{error}</div>}
    {!loading&&!error&&results.length===0&&<p className='booking-desk-message'>No appointments match these filters.</p>}
    {!loading&&results.length>0&&<div className='booking-desk-table-wrap'>
      <table className='booking-desk-table'><thead><tr>
        <th>Customer / Reference</th><th>Service</th><th>Branch</th>
        <th>Requested date & time</th><th>Status</th><th>Action</th>
      </tr></thead><tbody>
        {results.map(item=><tr key={item._id}>
          <td><strong>{item.name||'Customer'}</strong><small>{item.bookingReference||item._id}</small></td>
          <td>{item.service||'—'}</td>
          <td>{branchKey(item)==='airport-road'?'Airport Road':branchKey(item)==='delta-mall'?'ShopMall':item.location||'—'}</td>
          <td><strong>{item.preferredDate||'—'}</strong><small>{item.preferredTime||'—'} WAT</small></td>
          <td><span className={'booking-status booking-status-'+(item.status||'requested')}>{item.status||'requested'}</span></td>
          <td><button type='button' className='admin-text-button' onClick={()=>choose(item)}>
            {canEdit?'Manage':'View'}
          </button></td>
        </tr>)}
      </tbody></table>
    </div>}
    {selected&&<div className='booking-desk-overlay' onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
      <section className='booking-desk-drawer' role='dialog' aria-modal='true' aria-labelledby='booking-desk-title'>
        <button type='button' className='booking-desk-close' onClick={()=>setSelected(null)} aria-label='Close appointment details'><XCircle size={25}/></button>
        <span className='admin-kicker'>PRIVATE BOOKING RECORD</span>
        <h2 id='booking-desk-title'>{selected.name||'Customer'}</h2>
        <p className='booking-desk-ref'>{selected.bookingReference||selected._id}</p>
        <dl className='booking-desk-details'>
          <dt>Service</dt><dd>{selected.service||'—'}</dd>
          <dt>Branch</dt><dd>{selected.location||'—'}</dd>
          <dt>Date</dt><dd>{selected.preferredDate||'—'}</dd>
          <dt>Time</dt><dd>{selected.preferredTime||'—'} (Nigeria)</dd>
          <dt>Phone</dt><dd>{selected.phone||'—'}</dd>
          <dt>Email</dt><dd>{selected.email||'—'}</dd>
          <dt>Customer notes</dt><dd>{selected.notes||'—'}</dd>
        </dl>
        <div className='booking-desk-contact'>
          {customerWhatsApp&&<a href={customerWhatsApp} target='_blank' rel='noopener noreferrer'>
            <MessageCircle size={17}/> Message customer
          </a>}
          {selected.phone&&<a href={'tel:'+selected.phone.replace(/[^+0-9]/g,'')}>Call customer</a>}
        </div>
        {!!branchPhones.length&&<p className='booking-desk-branch-phones'>
          Branch WhatsApp: {branchPhones.join(' · ')}
        </p>}
        <label className='booking-desk-field'>Booking status
          <select value={draftStatus} onChange={e=>setDraftStatus(e.target.value)} disabled={!canEdit}>
            {stages.map(stage=><option key={stage.value} value={stage.value}>{stage.label}</option>)}
          </select></label>
        <label className='booking-desk-field'>Staff notes (never shown to customer)
          <textarea rows={4} value={staffNotes} onChange={e=>setStaffNotes(e.target.value)} disabled={!canEdit}/></label>
        {success&&<div className='admin-success'>{success}</div>}
        {error&&<div className='admin-error' role='alert'>{error}</div>}
        {canEdit&&<button type='button' className='admin-primary booking-desk-save' onClick={()=>void save()} disabled={saving}>
          {saving?'Saving…':'Save booking changes'}
        </button>}
      </section>
    </div>}
  </div>
}
