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
import {locations as fallbackLocations, phones as fallbackPhones, services as fallbackServices} from './data'
import {sanityClient, sanityEnabled, sanityFreshClient} from './sanity/client'
import {
  ARTICLES_QUERY,
  BANNERS_QUERY,
  LOCATIONS_QUERY,
  PRODUCTS_QUERY,
  PROGRAMS_QUERY,
  REVIEWS_QUERY,
  SERVICES_QUERY,
  SETTINGS_QUERY,
} from './sanity/queries'

type Service = typeof fallbackServices[number] & {
  _id?: string
  price?: string
  duration?: string
  gallery?: string[]
}
type Banner = {_id?: string; title?: string; image?: string; imageUrl?: string; src?: string; alt?: string; link?: string; order?: number; active?: boolean; startAt?: string; endAt?: string}
type Article = {_id: string; title: string; slug: string; intent: string; summary?: string; body?: any[]; image?: string; seoTitle?: string; metaDescription?: string}
type Product = {_id: string; name: string; slug: string; brand?: string; category?: string; regularPrice?: number; salePrice?: number; sku?: string; stockQuantity?: number; size?: string; shortDescription?: string; description?: string; benefits?: string[]; ingredients?: string; howToUse?: string; images?: string[]}
type Location = {_id?: string; name: string; slug: string; address: string; note?: string; phone?: string; openingHours?: string[]; image?: string}
type Program = {_id: string; title: string; type: string; description?: string; priceText?: string; image?: string}
type Review = {_id: string; customerName: string; text: string; rating: number; source?: string}
type Settings = {businessName?: string; tagline?: string; phones?: string[]; whatsappNumber?: string; email?: string; instagram?: string; facebook?: string; seoTitle?: string; metaDescription?: string; logo?: string}

const fallbackBanners: Banner[] = [
  {src: './resources/pinksky-banner-1.jpg', alt: 'Pink Sky current promotion'},
  {src: './resources/pinksky-banner-2.jpg', alt: 'Pink Sky beauty offer'},
]

function routeValue() {
  const value = window.location.hash.replace(/^#\/?/, '')
  if (!value) return {type: 'home', slug: ''}
  const [type, slug = ''] = value.split('/')
  return {type, slug}
}

function go(value = '') {
  window.location.hash = value ? '#/' + value : '#/'
  window.scrollTo({top: 0, behavior: 'smooth'})
}

function Img({src, alt, priority = false}: {src: string; alt: string; priority?: boolean}) {
  return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding='async' fetchPriority={priority ? 'high' : 'auto'} />
}

function BannerCarousel({banners}: {banners: Banner[]}) {
  const [active, setActive] = useState(0)
  useEffect(() => {
    setActive(0)
    if (banners.length < 2) return
    const timer = window.setInterval(() => setActive(v => (v + 1) % banners.length), 6000)
    return () => window.clearInterval(timer)
  }, [banners])
  if (!banners.length) return null
  const banner = banners[active] || banners[0]
  const image = banner.image || banner.src || './resources/pinksky-banner-1.jpg'
  const node = <img src={image} alt={banner.alt || banner.title || 'Pink Sky promotion'} loading='eager' decoding='async' fetchPriority='high' />
  return <section className='rollover-banner'>
    {banner.link ? <a href={banner.link}>{node}</a> : node}
    {banners.length > 1 && <div className='banner-dots'>{banners.map((_, i) => <button key={i} onClick={() => setActive(i)} className={i === active ? 'active' : ''} aria-label={`Show banner ${i + 1}`} />)}</div>}
  </section>
}

export default function App() {
  const [route, setRoute] = useState(routeValue())
  const [menu, setMenu] = useState(false)
  const [services, setServices] = useState<Service[]>(fallbackServices)
  const [banners, setBanners] = useState<Banner[]>(fallbackBanners)
  const [articles, setArticles] = useState<Article[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>(fallbackLocations as Location[])
  const [programs, setPrograms] = useState<Program[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [settings, setSettings] = useState<Settings>({})
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingResult, setBookingResult] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    service: fallbackServices[0].name,
    location: fallbackLocations[0].name,
    preferredDate: '',
    preferredTime: '',
    notes: '',
  })

  const refreshSanity = async (fresh = false) => {
    const client = fresh ? sanityFreshClient : sanityClient
    if (!client) return
    try {
      const [serviceData, bannerData, articleData, productData, locationData, settingData, programData, reviewData] = await Promise.all([
        client.fetch(SERVICES_QUERY),
        client.fetch(BANNERS_QUERY),
        client.fetch(ARTICLES_QUERY),
        client.fetch(PRODUCTS_QUERY),
        client.fetch(LOCATIONS_QUERY),
        client.fetch(SETTINGS_QUERY),
        client.fetch(PROGRAMS_QUERY),
        client.fetch(REVIEWS_QUERY),
      ])
      if (serviceData?.length) setServices(serviceData)
      const mappedBanners = (bannerData || [])
        .filter((b: any) => b.active !== false)
        .filter((b: any) => {
          const now = Date.now()
          const startsOkay = !b.startAt || new Date(b.startAt).getTime() <= now
          const endsOkay = !b.endAt || new Date(b.endAt).getTime() >= now
          return startsOkay && endsOkay
        })
        .filter((b: any) => !!(b.src || b.image || b.imageUrl))
        .map((b: any) => ({
          id: b._id,
          src: b.src || b.image || b.imageUrl,
          alt: b.alt || b.title || 'Pink Sky promotion',
          link: b.link || '#/book',
          order: b.order ?? 100,
        }))
        .sort((a: any, b: any) => a.order - b.order)

      setBanners(mappedBanners.length ? mappedBanners : fallbackBanners)
      setArticles(articleData || [])
      setProducts(productData || [])
      if (locationData?.length) setLocations(locationData)
      setSettings(settingData || {})
      setPrograms(programData || [])
      setReviews(reviewData || [])
    } catch (error) {
      console.error('Sanity refresh failed', error)
    }
  }

  useEffect(() => {
    refreshSanity(false)
    const routeListener = () => setRoute(routeValue())
    window.addEventListener('hashchange', routeListener)
    window.addEventListener('focus', () => refreshSanity(true))

    let subscription: {unsubscribe: () => void} | undefined
    if (sanityFreshClient) {
      subscription = sanityFreshClient
        .listen('*[_type in ["service","banner","article","product","location","siteSettings","offerProgram","review"]]')
        .subscribe(() => refreshSanity(true))
    }
    let channel: BroadcastChannel | undefined
    try {
      channel = new BroadcastChannel('pinksky-cms')
      channel.onmessage = () => refreshSanity(true)
    } catch {}
    return () => {
      window.removeEventListener('hashchange', routeListener)
      subscription?.unsubscribe()
      channel?.close()
    }
  }, [])

  const phones = settings.phones?.length ? settings.phones : fallbackPhones
  const whatsappNumber = settings.whatsappNumber || phones[0].replace(/\s/g, '').replace(/^0/, '234')
  const whatsapp = useMemo(() => 'https://wa.me/' + whatsappNumber, [whatsappNumber])

  const service = route.type === 'service' ? services.find(x => x.slug === route.slug) : undefined
  const product = route.type === 'product' ? products.find(x => x.slug === route.slug) : undefined
  const article = route.type === 'article' ? articles.find(x => x.slug === route.slug) : undefined

  useEffect(() => {
    document.title = service
      ? `${service.name} in Warri & Effurun | Pink Sky`
      : product
        ? `${product.name} | Pink Sky Beauty Shop`
        : article
          ? `${article.seoTitle || article.title} | Pink Sky`
          : settings.seoTitle || 'Pink Sky Beauty & Wellness | Warri & Effurun'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', article?.metaDescription || settings.metaDescription || 'Pink Sky Beauty & Wellness in Warri and Effurun.')
  }, [service, product, article, settings])

  const openBooking = (serviceName?: string, locationName?: string) => {
    setBookingResult('')
    setBookingError('')
    setForm(v => ({
      ...v,
      service: serviceName || v.service,
      location: locationName || v.location,
    }))
    setBookingOpen(true)
  }

  const submitBooking = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setBookingError('')
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Booking failed')
      setBookingResult(data.id || 'received')
    } catch (error) {
      setBookingError('We could not save your request. Please use WhatsApp if this continues.')
    } finally {
      setSubmitting(false)
    }
  }

  if (route.type === 'admin') {
    return <AdminDashboard onExit={() => go()} />
  }

  const header = <>
    <div className='announcement'>Two Pink Sky locations in Warri & Effurun</div>
    <header>
      <button className='logo-button' onClick={() => go()}>
        <img src={settings.logo || './resources/pinksky-logo.jpg'} alt='Pink Sky' />
      </button>
      <nav>
        <button onClick={() => go()}>Home</button>
        <button onClick={() => go('services')}>Services</button>
        <button onClick={() => go('shop')}>Beauty Shop</button>
        <button onClick={() => go('blog')}>Blog</button>
        <button onClick={() => go('locations')}>Locations</button>
        <button onClick={() => go('programs')}>Packages</button>
      </nav>
      <button className='primary' onClick={() => openBooking()}><CalendarDays size={16}/> Book</button>
      <button className='menu-button' onClick={() => setMenu(v => !v)}>{menu ? <X/> : <Menu/>}</button>
    </header>
    {menu && <div className='mobile-menu'>
      {[
        ['','Home'],
        ['services','Services'],
        ['shop','Beauty Shop'],
        ['blog','Blog'],
        ['locations','Locations'],
        ['programs','Memberships & Packages'],
      ].map(([path, label]) => <button key={label} onClick={() => {go(path); setMenu(false)}}>{label}</button>)}
      <button onClick={() => {setMenu(false); openBooking()}}>Book Appointment</button>
    </div>}
  </>

  const footer = <footer>
    <img src={settings.logo || './resources/pinksky-logo.jpg'} alt='Pink Sky' />
    <p>{settings.tagline || 'Beauty, wellness and confidence in Warri & Effurun.'}</p>
    <div>{phones.map(p => <a key={p} href={'tel:' + p.replace(/\s/g, '')}>{p}</a>)}</div>
  </footer>

  const bookingModal = bookingOpen && <div className='modal-backdrop'>
    <div className='booking-modal'>
      <button className='modal-close' onClick={() => setBookingOpen(false)}><X/></button>
      {!bookingResult ? <>
        <span className='eyebrow'>Book Pink Sky</span>
        <h2>Request an appointment</h2>
        <form onSubmit={submitBooking}>
          <label>Full name<input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}/></label>
          <label>Phone<input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/></label>
          <label>Email<input type='email' value={form.email} onChange={e => setForm({...form, email: e.target.value})}/></label>
          <label>Service<select value={form.service} onChange={e => setForm({...form, service: e.target.value})}>{services.map(s => <option key={s.slug}>{s.name}</option>)}</select></label>
          <label>Location<select value={form.location} onChange={e => setForm({...form, location: e.target.value})}>{locations.map(l => <option key={l.slug}>{l.name}</option>)}</select></label>
          <label>Preferred date<input required type='date' value={form.preferredDate} onChange={e => setForm({...form, preferredDate: e.target.value})}/></label>
          <label>Preferred time<select required value={form.preferredTime} onChange={e => setForm({...form, preferredTime: e.target.value})}><option value=''>Select</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label>
          <label>Notes<textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}/></label>
          {bookingError && <p className='form-error'>{bookingError}</p>}
          <button className='primary' disabled={submitting}>{submitting ? 'Saving…' : 'Request appointment'}</button>
        </form>
      </> : <div className='success'>
        <Check/>
        <h2>Request received</h2>
        <p>Your booking reference is <strong>{bookingResult}</strong>. Pink Sky will confirm availability.</p>
        <a className='primary' href={`${whatsapp}?text=${encodeURIComponent(`Hello Pink Sky, I submitted a booking request. Ref: ${bookingResult}`)}`} target='_blank' rel='noreferrer'>Continue on WhatsApp</a>
      </div>}
    </div>
  </div>

  if (service) return <div>{header}<main>
    <section className='detail-hero'>
      <button className='back' onClick={() => go('services')}><ArrowLeft size={17}/> All services</button>
      <div className='detail-grid'>
        <Img src={service.image || './resources/pinksky-logo.jpg'} alt={service.name} priority />
        <div><span className='eyebrow'>{service.eyebrow}</span><h1>{service.name}</h1><p>{service.description}</p>
          {(service.price || service.duration) && <div className='facts'>{service.price && <span><small>Price</small><strong>{service.price}</strong></span>}{service.duration && <span><small>Duration</small><strong>{service.duration}</strong></span>}</div>}
          <div className='chips'>{service.items?.map(i => <span key={i}>{i}</span>)}</div>
          <button className='primary' onClick={() => openBooking(service.name)}>Book this service</button>
        </div>
      </div>
      {service.gallery?.length ? <div className='gallery'>{service.gallery.map((img, i) => <Img key={img + i} src={img} alt={`${service.name} ${i + 1}`}/>)}</div> : null}
    </section>
  </main>{footer}{bookingModal}</div>

  if (product) return <div>{header}<main className='content'>
    <button className='back' onClick={() => go('shop')}><ArrowLeft size={17}/> Beauty Shop</button>
    <div className='detail-grid'>
      <Img src={product.images?.[0] || './resources/pinksky-logo.jpg'} alt={product.name} priority />
      <div>
        <span className='eyebrow'>{product.brand || product.category || 'Pink Sky Beauty Shop'}</span>
        <h1>{product.name}</h1>
        <h2>₦{Number(product.salePrice ?? product.regularPrice ?? 0).toLocaleString()}</h2>
        <p>{product.shortDescription || product.description}</p>
        <p>{(product.stockQuantity || 0) > 0 ? `In stock: ${product.stockQuantity}` : 'Out of stock / contact Pink Sky'}</p>
        <a className='primary' href={`${whatsapp}?text=${encodeURIComponent('Hello Pink Sky, I am interested in ' + product.name)}`} target='_blank' rel='noreferrer'>Order / ask on WhatsApp</a>
      </div>
    </div>
    <div className='product-info'>
      {product.description && <article><h2>About</h2><p>{product.description}</p></article>}
      {product.benefits?.length ? <article><h2>Benefits</h2>{product.benefits.map(x => <p key={x}>✓ {x}</p>)}</article> : null}
      {product.ingredients && <article><h2>Ingredients / Specifications</h2><p>{product.ingredients}</p></article>}
      {product.howToUse && <article><h2>How to use</h2><p>{product.howToUse}</p></article>}
    </div>
  </main>{footer}{bookingModal}</div>

  if (article) return <div>{header}<main className='article-page'>
    <button className='back' onClick={() => go('blog')}><ArrowLeft size={17}/> Beauty Guides</button>
    <span className='eyebrow'>{article.intent}</span>
    <h1>{article.title}</h1>
    {article.summary && <p className='lead'>{article.summary}</p>}
    {article.image && <Img src={article.image} alt={article.title} priority/>}
    <div className='article-body'>{article.body?.length ? <PortableText value={article.body}/> : <p>More details will be added by Pink Sky.</p>}</div>
    <button className='primary' onClick={() => openBooking('Teeth Whitening')}>Book a Pink Sky service</button>
  </main>{footer}{bookingModal}</div>

  if (route.type === 'services') return <div>{header}<main className='content'>
    <span className='eyebrow'>Pink Sky services</span><h1>Find the service for you.</h1>
    <div className='grid'>{services.map(s => <article className='card' key={s.slug} onClick={() => go('service/' + s.slug)}><Img src={s.image || './resources/pinksky-logo.jpg'} alt={s.name}/><div><h3>{s.name}</h3><p>{s.short}</p><button>View service <ArrowRight size={15}/></button></div></article>)}</div>
  </main>{footer}{bookingModal}</div>

  if (route.type === 'shop') return <div>{header}<main className='content'>
    <span className='eyebrow'>Pink Sky Beauty Shop</span><h1>Take the glow home.</h1>
    {products.length ? <div className='grid'>{products.map(p => <article className='card' key={p._id} onClick={() => go('product/' + p.slug)}><Img src={p.images?.[0] || './resources/pinksky-logo.jpg'} alt={p.name}/><div><h3>{p.name}</h3><p>₦{Number(p.salePrice ?? p.regularPrice ?? 0).toLocaleString()}</p></div></article>)}</div> : <p>Products will appear here when published in Sanity Studio.</p>}
  </main>{footer}{bookingModal}</div>

  if (route.type === 'blog') return <div>{header}<main className='content'>
    <span className='eyebrow'>Beauty knowledge hub</span><h1>Helpful Pink Sky guides.</h1>
    {articles.length ? <div className='article-grid'>{articles.map(a => <article key={a._id}><span>{a.intent}</span><h3>{a.title}</h3><p>{a.summary}</p><button onClick={() => go('article/' + a.slug)}>Read guide <ArrowRight size={15}/></button></article>)}</div> : <p>Publish articles in Sanity Studio and they will appear here.</p>}
  </main>{footer}{bookingModal}</div>

  if (route.type === 'locations') return <div>{header}<main className='content'>
    <span className='eyebrow'>Our locations</span><h1>Two locations. One Pink Sky.</h1>
    <div className='locations'>{locations.map(l => <article key={l.slug}><MapPin/><h3>{l.name}</h3><p>{l.address}</p>{l.note && <p>{l.note}</p>}<button className='secondary' onClick={() => openBooking(undefined, l.name)}>Book this branch</button></article>)}</div>
  </main>{footer}{bookingModal}</div>

  if (route.type === 'programs') return <div>{header}<main className='content'>
    <span className='eyebrow'>More ways to experience Pink Sky</span><h1>Memberships, Packages & Gift Cards.</h1>
    <div className='grid'>{programs.map(p => <article className='program-card' key={p._id}>{p.image && <Img src={p.image} alt={p.title}/>}<div><span>{p.type}</span><h3>{p.title}</h3><p>{p.description}</p>{p.priceText && <strong>{p.priceText}</strong>}</div></article>)}</div>
  </main>{footer}{bookingModal}</div>

  return <div>{header}<main>
    <BannerCarousel banners={banners}/>
    <section className='hero'>
      <div><span className='eyebrow'>Pink Sky Beauty & Wellness</span><h1>Your beauty journey starts with <em>Pink Sky.</em></h1><p>Professional beauty and wellness services across Warri & Effurun.</p><div className='actions'><button className='primary' onClick={() => openBooking()}><CalendarDays size={17}/> Book a Service</button><a className='secondary' href={whatsapp} target='_blank' rel='noreferrer'><MessageCircle size={17}/> WhatsApp Us</a></div></div>
      <Img src='./resources/pinksky-home-banner.jpg' alt='Pink Sky Beauty & Wellness' priority/>
    </section>

    <section className='content'><span className='eyebrow'>Important services</span><h2>Choose your next Pink Sky experience.</h2><div className='grid'>{services.slice(0,6).map(s => <article className='card' key={s.slug} onClick={() => go('service/' + s.slug)}><Img src={s.image || './resources/pinksky-logo.jpg'} alt={s.name}/><div><h3>{s.name}</h3><p>{s.short}</p></div></article>)}</div></section>

    {reviews.length > 0 && <section className='content reviews'><span className='eyebrow'>Customer reviews</span><h2>What clients are saying.</h2><div className='review-grid'>{reviews.map(r => <article key={r._id}><div>{Array.from({length: r.rating || 5}).map((_, i) => <Star key={i} size={15}/>)}</div><p>“{r.text}”</p><strong>{r.customerName}</strong>{r.source && <small>{r.source}</small>}</article>)}</div></section>}

    <section className='content contact'><div><Phone/><h2>Ready to book?</h2><p>Call, WhatsApp or visit one of our branches.</p></div><button className='primary' onClick={() => openBooking()}>Book Appointment</button></section>

    {!sanityEnabled && <div className='sanity-notice'>Sanity is not connected yet. Copy <code>.env.example</code> to <code>.env</code> and add your Sanity project ID.</div>}
  </main>{footer}{bookingModal}</div>
}
