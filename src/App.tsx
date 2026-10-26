import {useEffect, useMemo, useState} from 'react'
import {PortableText} from '@portabletext/react'
import AdminDashboard from './AdminDashboard'
import LuxeHomepage from './LuxeExactHomepage'
import BranchBookingModal from './BranchBookingModal'
import './luxe-nav.css'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Menu,
  MessageCircle,
  Sparkles,
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
      loading='lazy'
      decoding='async'
      fetchPriority='low'
    />
  )

  return (
    <section className='rollover-banner' aria-label='Featured promotions'>
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

function ServiceWhatsAppLinks({
  serviceName,
  onBook,
}: {
  serviceName: string
  onBook: (serviceName: string) => void
}) {
  return (
    <div className='actions' onClick={event => event.stopPropagation()}>
      <button
        className='primary'
        type='button'
        onClick={event => {event.stopPropagation(); onBook(serviceName)}}
      >
        <MessageCircle size={17} aria-hidden='true'/>
        Book {serviceName} · choose your branch
      </button>
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

  const [bookingSelection, setBookingSelection] = useState<{
    serviceName: string
    preferredBranchId?: string
  } | null>(null)
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

  const openBooking = (serviceName?: string, locationName?: string) => {
    const location = (locationName || '').toLowerCase()
    const preferredBranchId =
      /delta.mall|shop.mall|shopmall|effurun/.test(location) ? 'delta-mall' :
      /airport.road|warri/.test(location) ? 'airport-road' : undefined

    setBookingSelection({
      serviceName: serviceName?.trim() || 'an appointment',
      preferredBranchId,
    })
  }

  if (route.type === 'admin') {
    return <AdminDashboard onExit={() => go()} />
  }

  const header = (
    <>
      <div className='announcement ft-site-announcement'>
        <span>Pinksky Beauty & Wellness</span>
        <span>Two studios in Warri & Effurun, Delta State</span>
      </div>
      <header className='ft-site-header'>
        <nav className='ft-site-nav ft-nav-first' aria-label='Main left navigation'>
          <a href='/'>Home</a>
          <a href='/services'>Services</a>
          <a href='/shop'>Beauty Shop</a>
        </nav>
        <a href='/' className='ft-nav-logo' aria-label='Pinksky Beauty & Wellness home'>
          <img src={settings.logo || '/resources/pinksky-logo.jpg'} alt='Pinksky Beauty & Wellness' width={140} height={56}/>
        </a>
        <nav className='ft-site-nav ft-nav-second' aria-label='Main right navigation'>
          <a href='/blog'>Blog</a>
          <a href='/locations'>Locations</a>
          <a href='/programs'>Packages</a>
        </nav>
        <button className='ft-nav-book' type='button' onClick={() => openBooking()}>
          <Sparkles size={17} aria-hidden='true'/> Book Now
        </button>
        <button
          className='ft-nav-menu'
          type='button'
          aria-label={menu ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menu}
          aria-controls='ft-mobile-menu'
          onClick={() => setMenu(value => !value)}
        >
          {menu ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </header>
      {menu && (
        <nav id='ft-mobile-menu' className='ft-mobile-menu' aria-label='Mobile navigation'>
          {[
            ['Home',''],['Services','services'],['Beauty Shop','shop'],
            ['Blog','blog'],['Locations','locations'],['Packages','programs'],
          ].map(([label,path]) => (
            <a key={label} href={path ? '/' + path : '/'} onClick={() => setMenu(false)}>{label}</a>
          ))}
          <button type='button' onClick={() => {setMenu(false);openBooking()}}>
            <MessageCircle size={18}/> Book on WhatsApp
          </button>
        </nav>
      )}
    </>
  )

  const footer = (
    <footer>
      <img
        src={
          settings.logo ||
          '/resources/pinksky-logo.jpg'
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

  const bookingModal = bookingSelection && (
    <BranchBookingModal
      branches={pinkSkyBranches}
      serviceName={bookingSelection.serviceName}
      preferredBranchId={bookingSelection.preferredBranchId}
      onClose={() => setBookingSelection(null)}
    />
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
                  '/resources/pinksky-logo.jpg'
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
                    onBook={openBooking}
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
              <ServiceWhatsAppLinks serviceName={service.name} onBook={openBooking}/>
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
                      '/resources/pinksky-logo.jpg'
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

<ServiceWhatsAppLinks serviceName={item.name} onBook={openBooking} />
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
                      '/resources/pinksky-logo.jpg'
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
      <LuxeHomepage
        promotion={banners.length > 0 ? <BannerCarousel banners={banners} /> : null}
        services={services}
        reviews={reviews}
        products={products}
        articles={articles}
        locations={locations}
        programs={programs}
        loading={contentLoading}
        instagram={settings.instagram}
        onBook={openBooking}
      />
      {footer}
      {bookingModal}
    </div>
  )
}
