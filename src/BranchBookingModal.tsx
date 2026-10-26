import {useEffect, useRef, useState} from 'react'
import {ArrowLeft, ArrowRight, ExternalLink, MapPin, MessageCircle, X} from 'lucide-react'
import OnlineAppointmentForm, {whatsappUrl, type BookingBranch} from './OnlineAppointmentForm'
import './branch-booking.css'

type Props = {
  branches: readonly BookingBranch[]
  serviceName: string
  preferredBranchId?: string | null
  services: string[]
  onClose: () => void
}

export default function BranchBookingModal({
  branches, serviceName, preferredBranchId, services, onClose,
}: Props) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const selectedBranch = branches.find(branch => branch.id === selectedBranchId)
  const dialog = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()

    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog.current) return
      const elements = [...dialog.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter(el => el.getClientRects().length > 0 && el.getAttribute('aria-hidden') !== 'true')
      if (!elements.length) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('keydown', keydown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onClose])

  const ordered = [...branches].sort((a,b)=>
    a.id===preferredBranchId?-1:b.id===preferredBranchId?1:0,
  )

  return <div className='pinksky-branch-overlay'
    onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
    <div className='pinksky-branch-dialog' ref={dialog} role='dialog' aria-modal='true'
      aria-labelledby={selectedBranch?'pinksky-online-title':'pinksky-branch-title'}
      aria-describedby={selectedBranch?undefined:'pinksky-branch-description'}>
      <button ref={closeButton} type='button' className='pinksky-branch-close'
        aria-label='Close booking' onClick={onClose}><X size={22}/></button>
      {selectedBranch ? (
        <OnlineAppointmentForm branch={selectedBranch} services={services}
          initialService={serviceName} onBack={()=>setSelectedBranchId(null)}/>
      ) : <>
        <div className='pinksky-branch-heading'>
          <span className='pinksky-branch-step'>BOOK APPOINTMENT · STEP 1 OF 2</span>
          <h2 id='pinksky-branch-title'>Which Pinksky branch is closer to you?</h2>
          <p id='pinksky-branch-description'>
            Select your preferred branch to book online. Or contact that location directly on its own WhatsApp number.
          </p>
          {serviceName !== 'an appointment' && <div className='pinksky-branch-service'>
            Your service: <strong>{serviceName}</strong>
          </div>}
        </div>
        <div className='pinksky-branch-options'>
          {ordered.map(branch=>{
            const airport=branch.id==='airport-road'
            const label=airport?'Airport Road':'ShopMall'
            const locality=airport?'Warri, Delta State':'Delta Mall, Effurun'
            const map='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(branch.address)
            const message='Hello Pinksky Beauty & Wellness, I would like to book '+
              serviceName+' at your '+label+' ('+locality+') branch. Please send available times and prices. Thank you.'
            return <article key={branch.id} className={'pinksky-branch-option'+
              (preferredBranchId===branch.id?' pinksky-branch-preferred':'')}>
              <div className='pinksky-branch-option-header'>
                <span className='pinksky-branch-pin'><MapPin size={22}/></span>
                <div><h3>{label}</h3><span>{locality}</span></div>
                {preferredBranchId===branch.id&&<span className='pinksky-branch-selected'>Your choice</span>}
              </div>
              <p className='pinksky-branch-address'>{branch.address}</p>
              <button type='button' className='pinksky-branch-choose'
                onClick={()=>setSelectedBranchId(branch.id)}>
                <ArrowRight size={18}/> Book Online at {label}
              </button>
              <div className='pinksky-branch-direct'>
                <span>Or WhatsApp this branch:</span>
                {branch.whatsappNumbers.map(number=><a key={number}
                  href={whatsappUrl(number,message)} target='_blank' rel='noopener noreferrer'
                  onClick={onClose}>
                  <MessageCircle size={16}/> {number}
                </a>)}
              </div>
              <a className='pinksky-branch-map' href={map} target='_blank' rel='noopener noreferrer'>
                View on map <ExternalLink size={14}/></a>
            </article>
          })}
        </div>
        <p className='pinksky-branch-note'>
          <MessageCircle size={16}/>
          Online requests are saved in Pinksky's booking dashboard. Our staff will confirm date and time availability.
        </p>
      </>}
    </div>
  </div>
}
