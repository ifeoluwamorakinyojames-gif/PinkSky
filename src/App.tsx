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

function routeValue() {
  const value = window.location.hash.replace(/^#\/?/, '')

  if (!value) {
    return {type: 'home', slug: ''}
  }

  const [type, slug = ''] = value.split('/')

  return {type, slug}
}

function go(value = '') {
  window.location.hash = value ? '#/' + value : '#/'
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
      alt={banner.alt || banner.title || 'Pink Sky promotion'}
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

export default function App() {
  const [route, setRoute] = useState(routeValue())
  const [menu, setMenu] = useState(false)

  const [services, setServices] = useState<Service[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
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
          alt: banner.alt || banner.title || 'Pink Sky promotion',
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

    window.addEventListener('hashchange', routeListener)
    window.addEventListener('focus', focusListener)

    let channel: BroadcastChannel | undefined

    try {
      channel = new BroadcastChannel('pinksky-cms')
      channel.onmessage = () => refreshContent()
    } catch {
      // BroadcastChannel is optional.
    }

    return () => {
      window.removeEventListener('hashchange', routeListener)
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
    document.title = service
      ? `${service.name} in Warri & Effurun | Pink Sky`
      : product
        ? `${product.name} | Pink Sky Beauty Shop`
        : article
          ? `${article.seoTitle || article.title} | Pink Sky`
          : settings.seoTitle ||
            'Pink Sky Beauty & Wellness | Warri & Effurun'

    const meta = document.querySelector(
      'meta[name="description"]',
    )

    if (meta) {
      meta.setAttribute(
        'content',
        article?.metaDescription ||
          settings.metaDescription ||
          'Pink Sky Beauty & Wellness in Warri and Effurun.',
      )
    }
  }, [service, product, article, settings])

  const openBooking = (
    serviceName?: string,
    locationName?: string,
  ) => {
    setBookingResult('')
    setBookingError('')

    setForm(current => ({
      ...current,
      service:
        serviceName ||
        current.service ||
        services[0]?.name ||
        '',
      location:
        locationName ||
        current.location ||
        locations[0]?.name ||
        '',
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
        Two Pink Sky locations in Warri & Effurun
      </div>

      <header>
        <button
          className='logo-button'
          onClick={() => go()}
        >
          <img
            src={
              settings.logo ||
              './resources/pinksky-logo.jpg'
            }
            alt='Pink Sky'
          />
        </button>

        <nav>
          <button onClick={() => go()}>Home</button>
          <button onClick={() => go('services')}>
            Services
          </button>
          <button onClick={() => go('shop')}>
            Beauty Shop
          </button>
          <button onClick={() => go('blog')}>
            Blog
          </button>
          <button onClick={() => go('locations')}>
            Locations
          </button>
          <button onClick={() => go('programs')}>
            Packages
          </button>
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
            ['', 'Home'],
            ['services', 'Services'],
            ['shop', 'Beauty Shop'],
            ['blog', 'Blog'],
            ['locations', 'Locations'],
            ['programs', 'Memberships & Packages'],
          ].map(([path, label]) => (
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

          <button
            onClick={() => {
              setMenu(false)
              openBooking()
            }}
          >
            Book Appointment
          </button>
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
        alt='Pink Sky'
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
              Book Pink Sky
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
                  ? 'Saving…'
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
              Pink Sky will confirm availability.
            </p>

            {whatsapp && (
              <a
                className='primary'
                href={`${whatsapp}?text=${encodeURIComponent(
                  `Hello Pink Sky, I submitted a booking request. Ref: ${bookingResult}`,
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

  if (service) {
    return (
      <div>
        {header}

        <main>
          <section className='detail-hero'>
            <button
              className='back'
              onClick={() => go('services')}
            >
              <ArrowLeft size={17} /> All services
            </button>

            <div className='detail-grid'>
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

                <h1>{service.name}</h1>

                {service.description && (
                  <p>{service.description}</p>
                )}

                {(service.price ||
                  service.duration) && (
                  <div className='facts'>
                    {service.price && (
                      <span>
                        <small>Price</small>
                        <strong>
                          {service.price}
                        </strong>
                      </span>
                    )}

                    {service.duration && (
                      <span>
                        <small>Duration</small>
                        <strong>
                          {service.duration}
                        </strong>
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

                <button
                  className='primary'
                  onClick={() =>
                    openBooking(service.name)
                  }
                >
                  Book this service
                </button>
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
                      alt={`${service.name} ${
                        index + 1
                      }`}
                    />
                  ))}
              </div>
            ) : null}
          </section>
        </main>

        {footer}
        {bookingModal}
      </div>
    )
  }

  if (product) {
    return (
      <div>
        {header}

        <main className='content'>
          <button
            className='back'
            onClick={() => go('shop')}
          >
            <ArrowLeft size={17} /> Beauty Shop
          </button>

          <div className='detail-grid'>
            <Img
              src={
                product.images?.[0] ||
                './resources/pinksky-logo.jpg'
              }
              alt={product.name}
              priority
            />

            <div>
              <span className='eyebrow'>
                {product.brand ||
                  product.category ||
                  'Pink Sky Beauty Shop'}
              </span>

              <h1>{product.name}</h1>

              <h2>
                ₦
                {Number(
                  product.salePrice ??
                    product.regularPrice ??
                    0,
                ).toLocaleString()}
              </h2>

              <p>
                {product.shortDescription ||
                  product.description}
              </p>

              <p>
                {(product.stockQuantity || 0) > 0
                  ? `In stock: ${product.stockQuantity}`
                  : 'Out of stock / contact Pink Sky'}
              </p>

              {whatsapp && (
                <a
                  className='primary'
                  href={`${whatsapp}?text=${encodeURIComponent(
                    'Hello Pink Sky, I am interested in ' +
                      product.name,
                  )}`}
                  target='_blank'
                  rel='noreferrer'
                >
                  Order / ask on WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className='product-info'>
            {product.description && (
              <article>
                <h2>About</h2>
                <p>{product.description}</p>
              </article>
            )}

            {product.benefits?.length ? (
              <article>
                <h2>Benefits</h2>

                {product.benefits.map(item => (
                  <p key={item}>✓ {item}</p>
                ))}
              </article>
            ) : null}

            {product.ingredients && (
              <article>
                <h2>
                  Ingredients / Specifications
                </h2>
                <p>{product.ingredients}</p>
              </article>
            )}

            {product.howToUse && (
              <article>
                <h2>How to use</h2>
                <p>{product.howToUse}</p>
              </article>
            )}
          </div>
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
          <button
            className='back'
            onClick={() => go('blog')}
          >
            <ArrowLeft size={17} /> Beauty Guides
          </button>

          {article.intent && (
            <span className='eyebrow'>
              {article.intent}
            </span>
          )}

          <h1>{article.title}</h1>

          {article.summary && (
            <p className='lead'>
              {article.summary}
            </p>
          )}

          {article.image && (
            <Img
              src={article.image}
              alt={article.title}
              priority
            />
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

          <button
            className='primary'
            onClick={() => openBooking()}
          >
            Book a Pink Sky service
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
            Pink Sky services
          </span>

          <h1>Find the service for you.</h1>

          {services.length ? (
            <div className='grid'>
              {services.map(item => (
                <article
                  className='card'
                  key={item._id || item.slug}
                  onClick={() =>
                    go('service/' + item.slug)
                  }
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

                    <button>
                      View service{' '}
                      <ArrowRight size={15} />
                    </button>
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
            Pink Sky Beauty Shop
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

                    <p>
                      ₦
                      {Number(
                        item.salePrice ??
                          item.regularPrice ??
                          0,
                      ).toLocaleString()}
                    </p>
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

          <h1>Helpful Pink Sky guides.</h1>

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

          <h1>Visit Pink Sky.</h1>

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
            More ways to experience Pink Sky
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
              Pink Sky Beauty & Wellness
            </span>

            <h1>
              Your beauty journey starts with{' '}
              <em>Pink Sky.</em>
            </h1>

            <p>
              Professional beauty and wellness
              services across Warri & Effurun.
            </p>

            <div className='actions'>
              <button
                className='primary'
                onClick={() => openBooking()}
              >
                <CalendarDays size={17} /> Book a
                Service
              </button>

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
            alt='Pink Sky Beauty & Wellness'
            priority
          />
        </section>

        <section className='content'>
          <span className='eyebrow'>
            Important services
          </span>

          <h2>
            Choose your next Pink Sky experience.
          </h2>

          {services.length ? (
            <div className='grid'>
              {services.slice(0, 6).map(item => (
                <article
                  className='card'
                  key={item._id || item.slug}
                  onClick={() =>
                    go('service/' + item.slug)
                  }
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
                  </div>
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

                  <p>“{review.text}”</p>

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