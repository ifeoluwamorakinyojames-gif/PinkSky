import {useEffect, useMemo, useState, type FormEvent} from 'react'
import {PortableText} from '@portabletext/react'
import AdminDashboard from './AdminDashboard'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Star,
  X,
} from 'lucide-react'

type Service = {
  _id?: string
  name: string
  slug: string
  eyebrow?: string
  short?: string
  description?: string
  price?: string
  duration?: string
  items?: string[]
  image?: string
  gallery?: string[]

  seoKeyword?: string
  seoIntent?: string
  seoFaqText?: string
  seoHeading?: string
  seoTitle?: string
  metaDescription?: string
}

type Banner = {
  _id?: string
  title?: string
  image?: string
  imageUrl?: string
  src?: string
  alt?: string
  link?: string
  order?: number
  active?: boolean
  startAt?: string
  endAt?: string
}

type Article = {
  _id: string
  title: string
  slug: string
  intent: string
  summary?: string
  body?: any[]
  image?: string
  seoTitle?: string
  metaDescription?: string
  seoKeyword?: string
  seoFaqText?: string
  authorName?: string
  publishedAt?: string
}

type Product = {
  _id: string
  name: string
  slug: string
  brand?: string
  category?: string
  regularPrice?: number
  salePrice?: number
  sku?: string
  stockQuantity?: number
  size?: string
  shortDescription?: string
  description?: string
  benefits?: string[]
  ingredients?: string
  howToUse?: string
  images?: string[]
}

// Use a price only when Sanity has a valid positive numeric value.
function pinkskyPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function PinkskyProductPrice({product}: {product: Product}) {
  const sale = pinkskyPrice(product.salePrice)
  const regular = pinkskyPrice(product.regularPrice)
  const price = sale ?? regular
  return <span className='pinksky-product-price'>{price === null
    ? 'Contact for price'
    : new Intl.NumberFormat('en-NG', {style: 'currency', currency: 'NGN', maximumFractionDigits: 0}).format(price)}
  </span>
}

type Location = {
  _id?: string
  name: string
  slug: string
  address: string
  note?: string
  phone?: string
  openingHours?: string[]
  image?: string
}

type Program = {
  _id: string
  title: string
  type: string
  description?: string
  priceText?: string
  image?: string
}

type Review = {
  _id: string
  customerName: string
  text: string
  rating: number
  source?: string
}

type Settings = {
  businessName?: string
  tagline?: string
  phones?: string[]
  whatsappNumber?: string
  email?: string
  instagram?: string
  facebook?: string
  seoTitle?: string
  metaDescription?: string
  logo?: string
}

// PINKSKY_PHASE3B: FAQs are shown to readers and only then described in JSON-LD.
function seoFaqs(value?: string) {
  return (value || '').split('\n').map(line => {
    const at = line.indexOf('|')
    return at < 0 ? null : {question: line.slice(0,at).trim(), answer: line.slice(at+1).trim()}
  }).filter((item): item is {question:string;answer:string} => !!item && !!item.question && !!item.answer).slice(0,12)
}

function SeoFaqSection({value}: {value?: string}) {
  const faqs = seoFaqs(value)
  return faqs.length ? <section className='pinksky-seo-faqs' aria-label='Frequently asked questions'>
    <h2>Frequently asked questions</h2>
    {faqs.map((faq,i) => <details key={i}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
  </section> : null
}

function routeValue() {
  const value = window.location.pathname.replace(/^\/+|\/+$/g, '')

  if (!value) {
    return {type: 'home', slug: ''}
  }

  const [type, slug = ''] = value.split('/')

  return {
    type: decodeURIComponent(type),
    slug: decodeURIComponent(slug),
  }
}

function go(value = '') {
  const path = value ? '/' + value : '/'

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({top: 0, behavior: 'smooth'})
}

function Img({
  src,
  alt,
  priority = false,
}: {
  src: string
  alt: string
  priority?: boolean
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding='async'
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )
}

function BannerCarousel({banners}: {banners: Banner[]}) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    setActive(0)

    if (banners.length < 2) {
      return
    }

    const timer = window.setInterval(() => {
      setActive(value => (value + 1) % banners.length)
    }, 6000)

    return () => window.clearInterval(timer)
  }, [banners])

  if (!banners.length) {
    return null
  }

  const banner = banners[active] || banners[0]
  const image = banner.image || banner.src || banner.imageUrl

  if (!image) {
    return null
  }

  const node = (
    <img
      src={image}
      alt={banner.alt || banner.title || 'Pinksky promotion'}
      loading='eager'
      decoding='async'
      fetchPriority='high'
    />
  )

  return (
    <section className='rollover-banner'>
      {banner.link ? <a href={banner.link}>{node}</a> : node}

      {banners.length > 1 && (
        <div className='banner-dots'>
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setActive(index)}
              className={index === active ? 'active' : ''}
              aria-label={`Show banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

const pinkSkyBranches = [
  {
    id: 'airport-road',
    name: 'Airport Road, Warri',
    whatsapp: '2348120147351',
    address:
      'Magnifique House, 67 Airport Road, near Union Bank, opposite Christ Embassy, Warri',
    otherPhone: '08037416330',
  },
  {
    id: 'delta-mall',
    name: 'Delta Mall, Effurun',
    whatsapp: '2348101214336',
    address: 'Shop 20/23, Delta Mall, Effurun, Delta State',
  },
] as const

function serviceWhatsAppUrl(
  serviceName: string,
  branch: (typeof pinkSkyBranches)[number],
) {
  const message =
    `Hello Pinksky, I would like to book ${serviceName} at your ` +
    `${branch.name} branch. Please send me the available times, ` +
    `price and booking details. Thank you.`

  return `https://wa.me/${branch.whatsapp}?text=${encodeURIComponent(message)}`
}

function ServiceWhatsAppLinks({serviceName}: {serviceName: string}) {
  return (
    <div
      className='actions'
      onClick={event => event.stopPropagation()}
    >
      {pinkSkyBranches.map(branch => (
        <a
          key={branch.id}
          className='secondary'
          href={serviceWhatsAppUrl(serviceName, branch)}
          target='_blank'
          rel='noreferrer'
          onClick={event => event.stopPropagation()}
        >
          <MessageCircle size={16} />
          {branch.name}
        </a>
      ))}
    </div>
  )
}
export default function App() {
  const [route, setRoute] = useState(routeValue())
  const [menu, setMenu] = useState(false)

  const [services, setServices] = useState<Service[]>([])
  const [contentLoading, setContentLoading] = useState(true)
  const [banners, setBanners] = useState<Banner[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [settings, setSettings] = useState<Settings>({})

  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingResult, setBookingResult] = useState('')
  useEffect(() => {
  const trackPage = () => {
    const gtag = (window as any).gtag

    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
      })
    }
  }

  trackPage()
  window.addEventListener('popstate', trackPage)

  return () => {
    window.removeEventListener('popstate', trackPage)
  }
}, [])
  const [bookingError, setBookingError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    location: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  })

  const refreshContent = async () => {
    try {
      const response = await fetch('/api/content', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Content API failed: ' + response.status)
      }

      const data = await response.json()

      const nextServices: Service[] = data.services || []
      const nextLocations: Location[] = data.locations || []

      setServices(nextServices)

      const mappedBanners: Banner[] = (data.banners || [])
        .filter((banner: Banner) => banner.active !== false)
        .filter(
          (banner: Banner) =>
            !!(banner.src || banner.image || banner.imageUrl),
        )
        .map((banner: Banner) => ({
          _id: banner._id,
          title: banner.title,
          src: banner.src || banner.image || banner.imageUrl,
          alt: banner.alt || banner.title || 'Pinksky promotion',
          link: banner.link,
          order: banner.order ?? 100,
          active: banner.active,
          startAt: banner.startAt,
          endAt: banner.endAt,
        }))
        .sort((a: Banner, b: Banner) => {
          return (a.order ?? 100) - (b.order ?? 100)
        })

      setBanners(mappedBanners)
      setArticles(data.articles || [])
      setProducts(data.products || [])
      setLocations(nextLocations)
      setSettings(data.settings || {})
      setPrograms(data.programs || [])
      setReviews(data.reviews || [])

      setForm(current => ({
        ...current,
        service:
          current.service ||
          nextServices[0]?.name ||
          '',
        location:
          current.location ||
          nextLocations[0]?.name ||
          '',
      }))
        } catch (error) {
      console.error('PinkSky content refresh failed', error)

      setServices([])
      setBanners([])
      setArticles([])
      setProducts([])
      setLocations([])
      setPrograms([])
      setReviews([])
      setSettings({})
    } finally {
      setContentLoading(false)
    }
  }

  useEffect(() => {
    refreshContent()

    const routeListener = () => {
      setRoute(routeValue())
    }

    const focusListener = () => {
      refreshContent()
    }

    window.addEventListener('popstate', routeListener)
    window.addEventListener('focus', focusListener)

    let channel: BroadcastChannel | undefined

    try {
      channel = new BroadcastChannel('pinksky-cms')
      channel.onmessage = () => refreshContent()
    } catch {
      // BroadcastChannel is optional.
    }

    return () => {
      window.removeEventListener('popstate', routeListener)
      window.removeEventListener('focus', focusListener)
      channel?.close()
    }
  }, [])

const phones = settings.phones || []

const whatsappNumber = useMemo(() => {
  const configured =
    settings.whatsappNumber ||
    phones[0] ||
    '08101214336'

  return configured
    .replace(/[^\d+]/g, '')
    .replace(/^\+/, '')
    .replace(/^0/, '234')
}, [settings.whatsappNumber, phones])

const whatsapp = 'https://wa.me/' + whatsappNumber

  const service =
    route.type === 'service'
      ? services.find(item => item.slug === route.slug)
      : undefined

  const product =
    route.type === 'product'
      ? products.find(item => item.slug === route.slug)
      : undefined

  const article =
    route.type === 'article'
      ? articles.find(item => item.slug === route.slug)
      : undefined

  useEffect(() => {
  const siteName = 'Pinksky Beauty & Wellness'
  const siteUrl = 'https://pinkskybeauty.com'

  const title = service
    ? service.seoTitle ||
      `${service.name} in Warri & Effurun | Pinksky`
    : product
      ? `${product.name} | Pinksky Beauty Shop`
      : article
        ? `${article.seoTitle || article.title} | Pinksky`
        : settings.seoTitle ||
          'Pinksky Beauty & Wellness | Warri & Effurun'

  const description = service
    ? service.metaDescription ||
      service.short ||
      service.description ||
      `${service.name} at Pinksky Beauty & Wellness in Warri and Effurun, Delta State.`
    : article?.metaDescription ||
      settings.metaDescription ||
      'Pinksky Beauty & Wellness in Warri and Effurun, Delta State.'

  document.title = title

  const setMeta = (
    selector: string,
    attribute: string,
    value: string,
  ) => {
    let element = document.querySelector(selector)

    if (!element) {
      element = document.createElement('meta')
      const match = selector.match(/\[(name|property)="([^"]+)"\]/)

      if (match) {
        element.setAttribute(match[1], match[2])
      }

      document.head.appendChild(element)
    }

    element.setAttribute(attribute, value)
  }

  setMeta(
    'meta[name="description"]',
    'content',
    description,
  )

  const canonicalUrl =
    siteUrl +
    (window.location.pathname === '/'
      ? ''
      : window.location.pathname.replace(/\/$/, ''))

  let canonical = document.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null

  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }

  canonical.href = canonicalUrl

  setMeta(
    'meta[property="og:title"]',
    'content',
    title,
  )

  setMeta(
    'meta[property="og:description"]',
    'content',
    description,
  )

  setMeta(
    'meta[property="og:url"]',
    'content',
    canonicalUrl,
  )

  setMeta(
    'meta[property="og:type"]',
    'content',
    service ? 'website' : article ? 'article' : 'website',
  )

  setMeta(
    'meta[property="og:site_name"]',
    'content',
    siteName,
  )

  setMeta(
    'meta[name="twitter:card"]',
    'content',
    'summary_large_image',
  )

  setMeta(
    'meta[name="twitter:title"]',
    'content',
    title,
  )

  setMeta(
    'meta[name="twitter:description"]',
    'content',
    description,
  )

  // Organization logo and blog metadata for search engines.
  document.getElementById('pinksky-brand-schema')?.remove()
  if (settings.logo) {
    const brandSchema = document.createElement('script')
    brandSchema.id = 'pinksky-brand-schema'
    brandSchema.type = 'application/ld+json'
    brandSchema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': siteUrl + '/#organization',
      name: siteName,
      url: siteUrl,
      logo: settings.logo,
      ...(settings.instagram ? {sameAs: [settings.instagram]} : {}),
    })
    document.head.appendChild(brandSchema)
  }

  document.getElementById('pinksky-article-schema')?.remove()
  if (article) {
    const articleSchema = document.createElement('script')
    articleSchema.id = 'pinksky-article-schema'
    articleSchema.type = 'application/ld+json'
    articleSchema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description,
      ...(article.authorName ? {author: {'@type':'Person',name:article.authorName}} : {}),
      ...(article.publishedAt ? {datePublished:article.publishedAt} : {}),
      mainEntityOfPage: canonicalUrl,
      url: canonicalUrl,
      ...(article.image ? {image: article.image} : {}),
      publisher: {
        '@type': 'Organization',
        name: siteName,
        url: siteUrl,
        ...(settings.logo ? {logo: {'@type': 'ImageObject', url: settings.logo}} : {}),
      },
    })
    document.head.appendChild(articleSchema)
  }

  document.getElementById('pinksky-faq-schema')?.remove()
  const pageFaqs = seoFaqs(service?.seoFaqText || article?.seoFaqText)
  if (pageFaqs.length) {
    const faqScript = document.createElement('script')
    faqScript.id = 'pinksky-faq-schema'
    faqScript.type = 'application/ld+json'
    faqScript.textContent = JSON.stringify({
      '@context':'https://schema.org', '@type':'FAQPage',
      mainEntity:pageFaqs.map(faq => ({'@type':'Question',name:faq.question,
        acceptedAnswer:{'@type':'Answer',text:faq.answer}}))
    })
    document.head.appendChild(faqScript)
  }

  const oldSchema = document.getElementById(
    'pinksky-service-schema',
  )

  oldSchema?.remove()

  if (service) {
    const schema = document.createElement('script')

    schema.id = 'pinksky-service-schema'
    schema.type = 'application/ld+json'

    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.name,
      description,
      url: canonicalUrl,
      image: service.image || undefined,
      provider: {
        '@type': 'BeautySalon',
        name: siteName,
        url: siteUrl,
        areaServed: [
          {
            '@type': 'City',
            name: 'Warri',
          },
          {
            '@type': 'Place',
            name: 'Effurun',
          },
        ],
      },
    })

    document.head.appendChild(schema)
  }

  return () => {
    document
      .getElementById('pinksky-service-schema')
      ?.remove()
    document.getElementById('pinksky-brand-schema')?.remove()
    document.getElementById('pinksky-article-schema')?.remove()
    document.getElementById('pinksky-faq-schema')?.remove()
  }
}, [service, product, article, settings])

    const openBooking = (
    serviceName?: string,
    locationName?: string,
  ) => {
    const serviceNameForMessage =
      serviceName ||
      form.service ||
      'an appointment'

    const matchingBranch = pinkSkyBranches.find(branch =>
      locationName
        ? branch.name
            .toLowerCase()
            .includes(locationName.toLowerCase()) ||
          locationName
            .toLowerCase()
            .includes(branch.name.toLowerCase())
        : false,
    )

    if (matchingBranch) {
      window.open(
        serviceWhatsAppUrl(
          serviceNameForMessage,
          matchingBranch,
        ),
        '_blank',
      )
      return
    }

    const selected = window.confirm(
      'Choose your closest Pinksky branch:\n\nOK - Airport Road, Warri\nCancel - Delta Mall, Effurun',
    )

    const branch = selected
      ? pinkSkyBranches[0]
      : pinkSkyBranches[1]

    window.open(
      serviceWhatsAppUrl(serviceNameForMessage, branch),
      '_blank',
    )
  }

  const submitBooking = async (event: FormEvent) => {
    event.preventDefault()

    setSubmitting(true)
    setBookingError('')

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed')
      }

      setBookingResult(data.id || 'received')
    } catch {
      setBookingError(
        'We could not save your request. Please use WhatsApp if this continues.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (route.type === 'admin') {
    return <AdminDashboard onExit={() => go()} />
  }

  const header = (
    <>
      <div className='announcement'>
        Two Pinksky locations in Warri & Effurun
      </div>

      <header>
        <a
          className='logo-button'
          href='/'
        >
          <img
            src={
              settings.logo ||
              './resources/pinksky-logo.jpg'
            }
            alt='Pinksky'
          />
        </a>

        <nav>
          <a href='/'>Home</a>
          <a href='/services'>
            Services
          </a>
          <a href='/shop'>
            Beauty Shop
          </a>
          <a href='/blog'>
            Blog
          </a>
          <a href='/locations'>
            Locations
          </a>
          <a href='/programs'>
            Packages
          </a>
        </nav>

        <button
          className='primary'
          onClick={() => openBooking()}
        >
          <CalendarDays size={16} /> Book
        </button>

        <button
          className='menu-button'
          onClick={() => setMenu(value => !value)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>

      {menu && (
        <div className='mobile-menu'>
          {[
  ['Home', 'home'],
  ['Services', 'services'],
  ['Shop', 'shop'],
  ['Locations', 'locations'],
].map(([label, path]) => (
  <button
    key={label}
    onClick={() => {
      go(path)
      setMenu(false)
    }}
  >
    {label}
  </button>
))}

<a
  className='primary'
  href='https://wa.me/2348101214336?text=Hello%20Pink%20Sky%2C%20I%20would%20like%20to%20book%20an%20appointment.%20Please%20send%20me%20the%20available%20services%2C%20times%2C%20prices%20and%20booking%20details.%20Thank%20you.'
  target='_blank'
  rel='noreferrer'
  onClick={() => setMenu(false)}
>
  <MessageCircle size={17} />
  Book Appointment on WhatsApp
</a>
            </div>
      )}
    </>
  )

  const footer = (
    <footer>
      <img
        src={
          settings.logo ||
          './resources/pinksky-logo.jpg'
        }
        alt='Pinksky'
      />

      <p>
        {settings.tagline ||
          'Beauty, wellness and confidence in Warri & Effurun.'}
      </p>

      {phones.length > 0 && (
        <div>
          {phones.map(phone => (
            <a
              key={phone}
              href={'tel:' + phone.replace(/\s/g, '')}
            >
              {phone}
            </a>
          ))}
        </div>
      )}
    </footer>
  )

  const bookingModal = bookingOpen && (
    <div className='modal-backdrop'>
      <div className='booking-modal'>
        <button
          className='modal-close'
          onClick={() => setBookingOpen(false)}
        >
          <X />
        </button>

        {!bookingResult ? (
          <>
            <span className='eyebrow'>
              Book Pinksky
            </span>

            <h2>Request an appointment</h2>

            <form onSubmit={submitBooking}>
              <label>
                Full name
                <input
                  required
                  value={form.name}
                  onChange={event =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Phone
                <input
                  required
                  value={form.phone}
                  onChange={event =>
                    setForm({
                      ...form,
                      phone: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Email
                <input
                  type='email'
                  value={form.email}
                  onChange={event =>
                    setForm({
                      ...form,
                      email: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Service
                <select
                  required
                  value={form.service}
                  onChange={event =>
                    setForm({
                      ...form,
                      service: event.target.value,
                    })
                  }
                >
                  <option value=''>
                    Select service
                  </option>

                  {services.map(item => (
                    <option
                      key={item._id || item.slug}
                      value={item.name}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Location
                <select
                  required
                  value={form.location}
                  onChange={event =>
                    setForm({
                      ...form,
                      location: event.target.value,
                    })
                  }
                >
                  <option value=''>
                    Select location
                  </option>

                  {locations.map(item => (
                    <option
                      key={item._id || item.slug}
                      value={item.name}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Preferred date
                <input
                  required
                  type='date'
                  value={form.preferredDate}
                  onChange={event =>
                    setForm({
                      ...form,
                      preferredDate:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Preferred time
                <select
                  required
                  value={form.preferredTime}
                  onChange={event =>
                    setForm({
                      ...form,
                      preferredTime:
                        event.target.value,
                    })
                  }
                >
                  <option value=''>Select</option>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                </select>
              </label>

              <label>
                Notes
                <textarea
                  value={form.notes}
                  onChange={event =>
                    setForm({
                      ...form,
                      notes: event.target.value,
                    })
                  }
                />
              </label>

              {bookingError && (
                <p className='form-error'>
                  {bookingError}
                </p>
              )}

              <button
                className='primary'
                disabled={submitting}
              >
                {submitting
                  ? 'Savingâ€¦'
                  : 'Request appointment'}
              </button>
            </form>
          </>
        ) : (
          <div className='success'>
            <Check />

            <h2>Request received</h2>

            <p>
              Your booking reference is{' '}
              <strong>{bookingResult}</strong>.
              Pinksky will confirm availability.
            </p>

            {whatsapp && (
              <a
                className='primary'
                href={`${whatsapp}?text=${encodeURIComponent(
                  `Hello Pinksky, I submitted a booking request. Ref: ${bookingResult}`,
                )}`}
                target='_blank'
                rel='noreferrer'
              >
                Continue on WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
     if (
    contentLoading &&
    ['service', 'product', 'article'].includes(route.type)
  ) {
    return (
      <div>
        {header}

        <main className='content'>
          <p>Loading Pinksky...</p>
        </main>

        {footer}
      </div>
    )
  }
   if (service) {
    return (
      <div>
        {header}

        <main>
          <section className='detail-hero pinksky-service-page'>
            <div className='pinksky-breadcrumb'>
              <a href='/'>Home</a><span>/</span>
              <a href='/services'>Services</a><span>/</span>
              <span>{service.name}</span>
            </div>
            <a
              className='back'
              href='/services'
            >
              <ArrowLeft size={17} /> All services
            </a>

            <div className='detail-grid pinksky-product-layout'>
              <Img
                src={
                  service.image ||
                  './resources/pinksky-logo.jpg'
                }
                alt={service.name}
                priority
              />

              <div>
                {service.eyebrow && (
                  <span className='eyebrow'>
                    {service.eyebrow}
                  </span>
                )}

                <h1>{service.seoHeading || service.name}</h1>
                {service.short && <p className='pinksky-service-intro'>{service.short}</p>}

                {service.description && (
                  <p>{service.description}</p>
                )}

                {(service.price || service.duration) && (
                  <div className='facts'>
                    {service.price && (
                      <span>
                        <small>Price</small>
                        <strong>{service.price}</strong>
                      </span>
                    )}

                    {service.duration && (
                      <span>
                        <small>Duration</small>
                        <strong>{service.duration}</strong>
                      </span>
                    )}
                  </div>
                )}

                {service.items?.length ? (
                  <div className='chips'>
                    {service.items.map(item => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                ) : null}

                <div className='service-booking'>
                  <strong>
                    Choose the Pinksky branch closest to you:
                  </strong>

                  <ServiceWhatsAppLinks
                    serviceName={service.name}
                  />
                </div>
              </div>
            </div>

            {service.gallery?.length ? (
              <div className='gallery'>
                {service.gallery
                  .filter(Boolean)
                  .map((image, index) => (
                    <Img
                      key={image + index}
                      src={image}
                      alt={`${service.name} ${index + 1}`}
                    />
                  ))}
              </div>
            ) : null}
            <section className='pinksky-service-info'>
              <h2>About {service.name}</h2>
              <p>{service.description || service.short || `Contact Pinksky to learn about ${service.name}, availability and service details.`}</p>
              {service.items?.length ? <><h3>Service options and highlights</h3>
                <ul>{service.items.map(item => <li key={item}>{item}</li>)}</ul></> : null}
              <SeoFaqSection value={service.seoFaqText}/>
              <h3>Book at your preferred Pinksky branch</h3>
              <p>Contact our team to confirm pricing, availability and appointment details.</p>
              <ServiceWhatsAppLinks serviceName={service.name}/>
            </section>
          </section>
          {services.some(item => item.slug !== service.slug) && (
            <section className='pinksky-related-services'>
              <div className='pinksky-related-heading'>
                <h2>Explore more Pinksky services</h2>
                <a className='secondary' href='/services'>All services <ArrowRight size={16}/></a>
              </div>
              <div className='pinksky-related-grid'>
                {services.filter(item => item.slug !== service.slug).slice(0,3).map(item => (
                  <article className='pinksky-related-card' key={item.slug}>
                    <a href={'/service/' + item.slug}>
                      <Img src={item.image || '/resources/pinksky-logo.jpg'} alt={item.name}/>
                      <span>{item.name}</span>
                      {item.short && <small>{item.short}</small>}
                      <strong>View service <ArrowRight size={16}/></strong>
                    </a>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>

        {footer}
        {bookingModal}
      </div>
    )
  }

  if (product) {
    const photos = (product.images || []).filter(Boolean)
    const inStock = typeof product.stockQuantity === 'number' && product.stockQuantity > 0
    return (
      <div>
        {header}
        <main className='content pinksky-product-detail'>
          <a className='back' href='/shop'>
            <ArrowLeft size={17} /> Back to Beauty Shop
          </a>
          <div className='pinksky-product-layout'>
            <div className='pinksky-product-gallery'>
              <Img src={photos[0] || '/resources/pinksky-logo.jpg'} alt={product.name} priority />
              {photos.length > 1 && <div className='pinksky-product-thumbnails'>
                {photos.slice(1, 5).map((photo, i) => <Img key={photo + i} src={photo} alt={`${product.name} — image ${i + 2}`} />)}
              </div>}
            </div>
            <div className='pinksky-product-summary'>
              <span className='eyebrow'>{product.brand || product.category || 'Pinksky Beauty Shop'}</span>
              <h1>{product.name}</h1>
              <h2><PinkskyProductPrice product={product} /></h2>
              {product.shortDescription && <p className='pinksky-product-intro'>{product.shortDescription}</p>}
              <p className='pinksky-product-stock'>{inStock ? `In stock: ${product.stockQuantity}` : 'Contact us to confirm availability'}</p>
              {(product.size || product.sku || product.category) && <dl className='pinksky-product-facts'>
                {product.size && <><dt>Size</dt><dd>{product.size}</dd></>}
                {product.sku && <><dt>Product code</dt><dd>{product.sku}</dd></>}
                {product.category && <><dt>Category</dt><dd>{product.category}</dd></>}
              </dl>}
              {whatsapp && <a className='primary pinksky-product-order'
                href={`${whatsapp}?text=${encodeURIComponent('Hello Pinksky, I would like to enquire about ' + product.name + ' and confirm the current price and availability.')}`}
                target='_blank' rel='noopener noreferrer'>
                <MessageCircle size={18} /> Order / ask on WhatsApp
              </a>}
            </div>
          </div>
          <div className='product-info pinksky-product-sections'>
            {product.description && <article><h2>About this product</h2><p>{product.description}</p></article>}
            {!!product.benefits?.length && <article><h2>Benefits</h2><ul className='pinksky-product-benefits'>
              {product.benefits.map((item, i) => <li key={`${i}-${item}`}><Check size={18} aria-hidden='true' /><span>{item}</span></li>)}
            </ul></article>}
            {product.ingredients && <article><h2>Ingredients / specifications</h2><p>{product.ingredients}</p></article>}
            {product.howToUse && <article><h2>How to use</h2><p>{product.howToUse}</p></article>}
          </div>
          {products.filter(item => item.slug !== product.slug).length > 0 && <section className='pinksky-product-related'>
            <h2>Explore more products</h2>
            <div className='grid'>{products.filter(item => item.slug !== product.slug).slice(0, 3).map(item =>
              <article className='card' key={item._id}>
                <a className='pinksky-product-related-link' href={'/product/' + item.slug}>
                  <Img src={item.images?.[0] || '/resources/pinksky-logo.jpg'} alt={item.name} />
                  <strong>{item.name}</strong><PinkskyProductPrice product={item} />
                </a>
              </article>)}</div>
          </section>}
        </main>
        {footer}
        {bookingModal}
      </div>
    )
  }

  if (article) {
    return (
      <div>
        {header}

        <main className='article-page'>
          <a
            className='back'
            href='/blog'
          >
            <ArrowLeft size={17} /> Beauty Guides
          </a>

          {article.image && (
            <Img
              src={article.image}
              alt={article.title}
              priority
            />
          )}

          {article.intent && (
            <span className='eyebrow'>
              {article.intent}
            </span>
          )}

          <h1>{article.title}</h1>
          {article.authorName && <p className='pinksky-byline'>By {article.authorName}</p>}

          {article.summary && (
            <p className='lead'>
              {article.summary}
            </p>
          )}

          

          <div className='article-body'>
            {article.body?.length ? (
              <PortableText value={article.body} />
            ) : (
              <p>
                More details will be added by Pink
                Sky.
              </p>
            )}
          </div>

          <SeoFaqSection value={article.seoFaqText}/>
          <button
            className='primary'
            onClick={() => openBooking()}
          >
            Book a Pinksky service
          </button>
        </main>

        {footer}
        {bookingModal}
      </div>
    )
  }

  if (route.type === 'services') {
    return (
      <div>
        {header}

        <main className='content'>
          <span className='eyebrow'>
            Pinksky services
          </span>

          <h1>Find the service for you.</h1>

          {services.length ? (
            <div className='grid'>
              {services.map(item => (
                <article
                  className='card'
                  key={item._id || item.slug}
                                 >
                  <Img
                    src={
                      item.image ||
                      './resources/pinksky-logo.jpg'
                    }
                    alt={item.name}
                  />

                  <div>
                    <h3>{item.name}</h3>

                    {item.short && (
                      <p>{item.short}</p>
                    )}

                    <a href={'/service/' + item.slug}>
  View service <ArrowRight size={15} />
</a>

<ServiceWhatsAppLinks serviceName={item.name} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>
              No services are currently published.
            </p>
          )}
        </main>

        {footer}
        {bookingModal}
      </div>
    )
  }

  if (route.type === 'shop') {
    return (
      <div>
        {header}

        <main className='content'>
          <span className='eyebrow'>
            Pinksky Beauty Shop
          </span>

          <h1>Take the glow home.</h1>

          {products.length ? (
            <div className='grid'>
              {products.map(item => (
                <article
                  className='card'
                  key={item._id}
                  onClick={() =>
                    go('product/' + item.slug)
                  }
                >
                  <Img
                    src={
                      item.images?.[0] ||
                      './resources/pinksky-logo.jpg'
                    }
                    alt={item.name}
                  />

                  <div>
                    <h3>{item.name}</h3>

                    <p><PinkskyProductPrice product={item} /></p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>
              Products will appear here when
              published in the CMS.
            </p>
          )}
        </main>

        {footer}
        {bookingModal}
      </div>
    )
  }

  if (route.type === 'blog') {
    return (
      <div>
        {header}

        <main className='content'>
          <span className='eyebrow'>
            Beauty knowledge hub
          </span>

          <h1>Helpful Pinksky guides.</h1>

          {articles.length ? (
            <div className='article-grid'>
              {articles.map(item => (
                <article key={item._id}>
                  {item.intent && (
                    <span>{item.intent}</span>
                  )}

                  <h3>{item.title}</h3>

                  {item.summary && (
                    <p>{item.summary}</p>
                  )}

                  <button
                    onClick={() =>
                      go('article/' + item.slug)
                    }
                  >
                    Read guide{' '}
                    <ArrowRight size={15} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p>
              Articles will appear here when
              published in the CMS.
            </p>
          )}
        </main>

        {footer}
        {bookingModal}
      </div>
    )
  }

  if (route.type === 'locations') {
    return (
      <div>
        {header}

        <main className='content'>
          <span className='eyebrow'>
            Our locations
          </span>

          <h1>Visit Pinksky.</h1>

          {locations.length ? (
            <div className='locations'>
              {locations.map(item => (
                <article
                  key={item._id || item.slug}
                >
                  <MapPin />

                  <h3>{item.name}</h3>

                  <p>{item.address}</p>

                  {item.note && <p>{item.note}</p>}

                  {item.phone && (
                    <p>{item.phone}</p>
                  )}

                  <button
                    className='secondary'
                    onClick={() =>
                      openBooking(
                        undefined,
                        item.name,
                      )
                    }
                  >
                    Book this branch
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p>
              Location information is currently
              unavailable.
            </p>
          )}
        </main>

        {footer}
        {bookingModal}
      </div>
    )
  }

  if (route.type === 'programs') {
    return (
      <div>
        {header}

        <main className='content'>
          <span className='eyebrow'>
            More ways to experience Pinksky
          </span>

          <h1>
            Memberships, Packages & Gift Cards.
          </h1>

          {programs.length ? (
            <div className='grid'>
              {programs.map(item => (
                <article
                  className='program-card'
                  key={item._id}
                >
                  {item.image && (
                    <Img
                      src={item.image}
                      alt={item.title}
                    />
                  )}

                  <div>
                    <span>{item.type}</span>
                    <h3>{item.title}</h3>

                    {item.description && (
                      <p>{item.description}</p>
                    )}

                    {item.priceText && (
                      <strong>
                        {item.priceText}
                      </strong>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>
              Packages will appear here when
              published in the CMS.
            </p>
          )}
        </main>

        {footer}
        {bookingModal}
      </div>
    )
  }

  return (
    <div>
      {header}

      <main>
        <BannerCarousel banners={banners} />

        <section className='hero'>
          <div>
            <span className='eyebrow'>
              Pinksky Beauty & Wellness
            </span>

            <h1>
              Your beauty journey starts with{' '}
              <em>Pinksky.</em>
            </h1>

            <p>
              Professional beauty and wellness
              services across Warri & Effurun.
            </p>

            <div className='actions'>
              <div className='hero-booking-options'>
                <span>Book a Service - Choose Your Branch</span>
                <ServiceWhatsAppLinks serviceName='an appointment' />
              </div>

              {whatsapp && (
                <a
                  className='secondary'
                  href={whatsapp}
                  target='_blank'
                  rel='noreferrer'
                >
                  <MessageCircle size={17} /> WhatsApp
                  Us
                </a>
              )}
            </div>
          </div>

          <Img
            src='./resources/pinksky-home-banner.jpg'
            alt='Pinksky Beauty & Wellness'
            priority
          />
        </section>

        <section className='content'>
          <span className='eyebrow'>
            Important services
          </span>

          <h2>
            Choose your next Pinksky experience.
          </h2>

          {services.length ? (
            <div className='grid'>
              {services.slice(0, 6).map(item => (
                <article
                  className='card'
                  key={item._id || item.slug}
                >
                  <a className='service-card-link' href={'/service/' + item.slug}>
                  <Img
                    src={
                      item.image ||
                      './resources/pinksky-logo.jpg'
                    }
                    alt={item.name}
                  />

                  <div>
                    <h3>{item.name}</h3>

                    {item.short && (
                      <p>{item.short}</p>
                    )}
                  </div>
                </a>
                </article>
              ))}
            </div>
          ) : (
            <p>
              No services are currently published.
            </p>
          )}
        </section>

        {reviews.length > 0 && (
          <section className='content reviews'>
            <span className='eyebrow'>
              Customer reviews
            </span>

            <h2>What clients are saying.</h2>

            <div className='review-grid'>
              {reviews.map(review => (
                <article key={review._id}>
                  <div>
                    {Array.from({
                      length: review.rating || 5,
                    }).map((_, index) => (
                      <Star
                        key={index}
                        size={15}
                      />
                    ))}
                  </div>

                  <p>â€œ{review.text}â€</p>

                  <strong>
                    {review.customerName}
                  </strong>

                  {review.source && (
                    <small>{review.source}</small>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section className='content contact'>
          <div>
            <Phone />

            <h2>Ready to book?</h2>

            <p>
              Call, WhatsApp or visit one of our
              branches.
            </p>
          </div>

          <button
            className='primary'
            onClick={() => openBooking()}
          >
            Book Appointment
          </button>
        </section>
      </main>

      {footer}
      {bookingModal}
    </div>
  )
}
