import {useEffect, useRef} from 'react'
import {ArrowRight, ExternalLink, MapPin, MessageCircle, X} from 'lucide-react'
import './branch-booking.css'

export type PinkskyBookingBranch = {
  readonly id: string
  readonly name: string
  readonly address: string
  readonly whatsapp: string
}

type BranchBookingModalProps = {
  branches: readonly PinkskyBookingBranch[]
  serviceName: string
  preferredBranchId?: string | null
  onClose: () => void
}

function branchDisplayName(branch: PinkskyBookingBranch): string {
  return branch.id === 'delta-mall' ? 'ShopMall — Delta Mall, Effurun' : branch.name
}

function bookingMessage(serviceName: string, branch: PinkskyBookingBranch) {
  return (
    'Hello Pinksky Beauty & Wellness, I would like to book ' +
    serviceName +
    ' at your ' +
    branchDisplayName(branch) +
    ' branch. Please confirm available dates/times, current price and how to complete my booking. Thank you.'
  )
}

export default function BranchBookingModal({
  branches,
  serviceName,
  preferredBranchId,
  onClose,
}: BranchBookingModalProps) {
  const dialog = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog.current) return
      const elements = Array.from(dialog.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter(el => el.getClientRects().length > 0)
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
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  const orderedBranches = [...branches].sort((a, b) =>
    a.id === preferredBranchId ? -1 : b.id === preferredBranchId ? 1 : 0,
  )

  return (
    <div
      className='pinksky-branch-overlay'
      onMouseDown={event => {if (event.target === event.currentTarget) onClose()}}
    >
      <div
        className='pinksky-branch-dialog'
        ref={dialog}
        role='dialog'
        aria-modal='true'
        aria-labelledby='pinksky-branch-title'
        aria-describedby='pinksky-branch-description'
      >
        <button
          ref={closeButton}
          type='button'
          className='pinksky-branch-close'
          aria-label='Close branch selection'
          onClick={onClose}
        >
          <X size={22} aria-hidden='true'/>
        </button>
        <div className='pinksky-branch-heading'>
          <span className='pinksky-branch-step'>BOOKING · STEP 1 OF 2</span>
          <h2 id='pinksky-branch-title'>Which Pinksky branch is closest to you?</h2>
          <p id='pinksky-branch-description'>
            Choose the location most convenient for you. We will connect you to that
            branch on WhatsApp so you can confirm your appointment.
          </p>
          {serviceName !== 'an appointment' && (
            <div className='pinksky-branch-service'>
              Your service: <strong>{serviceName}</strong>
            </div>
          )}
        </div>
        <div className='pinksky-branch-options'>
          {orderedBranches.map(branch => {
            const isAirport = branch.id === 'airport-road'
            const displayName = isAirport ? 'Airport Road' : 'ShopMall'
            const locality = isAirport ? 'Warri, Delta State' : 'Delta Mall, Effurun'
            const whatsappLink = 'https://wa.me/' + branch.whatsapp +
              '?text=' + encodeURIComponent(bookingMessage(serviceName, branch))
            const mapLink = 'https://www.google.com/maps/search/?api=1&query=' +
              encodeURIComponent(branch.address)
            return (
              <article
                key={branch.id}
                className={'pinksky-branch-option' + (branch.id === preferredBranchId ? ' pinksky-branch-preferred' : '')}
              >
                <div className='pinksky-branch-option-header'>
                  <span className='pinksky-branch-pin'><MapPin size={22} aria-hidden='true'/></span>
                  <div>
                    <h3>{displayName}</h3>
                    <span>{locality}</span>
                  </div>
                  {branch.id === preferredBranchId && (
                    <span className='pinksky-branch-selected'>Previously selected</span>
                  )}
                </div>
                <p className='pinksky-branch-address'>{branch.address}</p>
                <a
                  className='pinksky-branch-choose'
                  href={whatsappLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={onClose}
                  aria-label={'Book at ' + displayName + ' via WhatsApp'}
                >
                  <MessageCircle size={19} aria-hidden='true'/>
                  Book at {displayName}
                  <ArrowRight size={18} aria-hidden='true'/>
                </a>
                <a className='pinksky-branch-map' href={mapLink} target='_blank' rel='noopener noreferrer'>
                  View location on map <ExternalLink size={14} aria-hidden='true'/>
                </a>
              </article>
            )
          })}
        </div>
        <p className='pinksky-branch-note'>
          <MessageCircle size={16} aria-hidden='true'/>
          Selecting a branch opens WhatsApp with your request prepared. An appointment
          is confirmed only after the branch replies with an available time.
        </p>
      </div>
    </div>
  )
}
