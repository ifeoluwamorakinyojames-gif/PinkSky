import {useState, type FormEvent} from 'react'
import {ArrowLeft, CalendarDays, CheckCircle2, Clock3, MessageCircle, Send} from 'lucide-react'

export type BookingBranch = {
  readonly id: string
  readonly name: string
  readonly address: string
  readonly whatsappNumbers: readonly string[]
}

export function whatsappUrl(number: string, message: string): string {
  const digits = number.replace(/\D/g, '')
  const international = digits.startsWith('0') ? '234' + digits.slice(1) : digits
  return 'https://wa.me/' + international + '?text=' + encodeURIComponent(message)
}

function lagosToday(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date())
  const extract = (type: string) => parts.find(part => part.type === type)?.value || ''
  return [extract('year'), extract('month'), extract('day')].join('-')
}

type FormData = {
  name: string
  phone: string
  email: string
  service: string
  date: string
  time: string
  notes: string
  website: string
}

export default function OnlineAppointmentForm({
  branch,
  initialService,
  services,
  onBack,
}: {
  branch: BookingBranch
  initialService: string
  services: string[]
  onBack: () => void
}) {
  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    service: initialService !== 'an appointment' ? initialService : '',
    date: '',
    time: '',
    notes: '',
    website: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const today = lagosToday()
  const serviceOptions = Array.from(new Set([
    ...(initialService && initialService !== 'an appointment' ? [initialService] : []),
    ...services,
  ]))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (form.date < today) {
      setError('Choose today or a future date.')
      return
    }
    if (!/^\+?[0-9\s()-]{10,20}$/.test(form.phone)) {
      setError('Enter a valid phone number so our team can contact you.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {'content-type': 'application/json', Accept: 'application/json'},
        cache: 'no-store',
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          service: form.service,
          branchId: branch.id,
          location: branch.name,
          preferredDate: form.date,
          preferredTime: form.time,
          notes: form.notes,
          website: form.website,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'We could not save your appointment request.')
      const ref = typeof data.reference === 'string' ? data.reference :
        typeof data.id === 'string' ? data.id : ''
      if (!ref) throw new Error('Your request was received but the booking reference could not be loaded. Please contact our team.')
      setReference(ref)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const followUpMessage = reference
    ? 'Hello Pinksky, I submitted an online appointment request. Reference: ' + reference +
      '. Branch: ' + branch.name + '. Service: ' + form.service +
      '. Preferred date: ' + form.date + ', time: ' + form.time +
      '. Please help me confirm availability. Thank you.'
    : ''

  if (reference) {
    return <div className='pinksky-online-confirmation' role='status'>
      <CheckCircle2 size={48} aria-hidden='true'/>
      <span className='pinksky-branch-step'>REQUEST RECEIVED</span>
      <h3>You're one step closer to your Pinksky visit.</h3>
      <p>We have saved your appointment request. Our {branch.id === 'airport-road' ? 'Airport Road' : 'ShopMall'} team will need to confirm the time before your booking is final.</p>
      <div className='pinksky-online-reference'>
        <span>Your booking reference</span>
        <strong>{reference}</strong>
      </div>
      <dl className='pinksky-online-summary'>
        <dt>Branch</dt><dd>{branch.name}</dd>
        <dt>Service</dt><dd>{form.service}</dd>
        <dt>Requested time</dt><dd>{form.date} at {form.time} (Nigeria time)</dd>
      </dl>
      <p>To follow up immediately, message either WhatsApp contact for this branch:</p>
      <div className='pinksky-online-whatsapp'>
        {branch.whatsappNumbers.map(number =>
          <a key={number} href={whatsappUrl(number, followUpMessage)} target='_blank' rel='noopener noreferrer'>
            <MessageCircle size={17} aria-hidden='true'/> {number}
          </a>,
        )}
      </div>
    </div>
  }

  return <section className='pinksky-online-form-panel' aria-labelledby='pinksky-online-title'>
    <button type='button' className='pinksky-online-back' onClick={onBack}>
      <ArrowLeft size={18} aria-hidden='true'/> Change branch
    </button>
    <span className='pinksky-branch-step'>ONLINE APPOINTMENT · STEP 2 OF 2</span>
    <h2 id='pinksky-online-title'>Request a {branch.id === 'airport-road' ? 'Airport Road' : 'ShopMall'} appointment</h2>
    <p className='pinksky-online-explainer'>Fill in your details and preferred time. Your request goes straight to the Pinksky booking dashboard. Staff will confirm availability before the appointment is final.</p>
    <form className='pinksky-online-form' onSubmit={submit}>
      <label>Full name *
        <input name='name' autoComplete='name' maxLength={120} required value={form.name}
          onChange={event => setForm({...form,name:event.target.value})} placeholder='Your full name'/>
      </label>
      <label>Phone or WhatsApp number *
        <input name='phone' autoComplete='tel' type='tel' maxLength={20} required value={form.phone}
          onChange={event => setForm({...form,phone:event.target.value})} placeholder='0800 000 0000'/>
      </label>
      <label>Email (optional)
        <input name='email' autoComplete='email' type='email' maxLength={180} value={form.email}
          onChange={event => setForm({...form,email:event.target.value})} placeholder='you@example.com'/>
      </label>
      <label>Choose service *
        <select name='service' required value={form.service} onChange={event => setForm({...form,service:event.target.value})}>
          <option value=''>Select service</option>
          {serviceOptions.map(name=><option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      <label>Preferred date *
        <span className='pinksky-input-icon'><CalendarDays size={18}/><input
          name='preferredDate' type='date' min={today} required value={form.date}
          onChange={event => setForm({...form,date:event.target.value})}/></span>
      </label>
      <label>Preferred time (Nigeria time) *
        <span className='pinksky-input-icon'><Clock3 size={18}/><input
          name='preferredTime' type='time' step='1800' required value={form.time}
          onChange={event => setForm({...form,time:event.target.value})}/></span>
      </label>
      <label className='pinksky-online-wide'>Additional details (optional)
        <textarea name='notes' rows={3} maxLength={1200} value={form.notes}
          onChange={event => setForm({...form,notes:event.target.value})} placeholder='Any service requests or questions?'/>
      </label>
      <input className='pinksky-booking-honeypot' name='website' tabIndex={-1} autoComplete='off'
        value={form.website} onChange={event=>setForm({...form,website:event.target.value})} aria-hidden='true'/>
      <p className='pinksky-online-privacy'>Your contact details will be shared with Pinksky staff only to process this appointment request. The selected time is a preference, not a guaranteed available slot.</p>
      {error && <p className='pinksky-online-error' role='alert'>{error}</p>}
      <button type='submit' disabled={submitting} className='pinksky-online-submit'>
        <Send size={18} aria-hidden='true'/>
        {submitting ? 'Submitting your request…' : 'Submit appointment request'}
      </button>
    </form>
  </section>
}
