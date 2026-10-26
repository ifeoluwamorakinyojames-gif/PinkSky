import type { ReactNode } from 'react'
import { ArrowRight, CalendarDays, MapPin, MessageCircle, Sparkles, Star } from 'lucide-react'
import './luxe-homepage.css'

type Service = {
  _id?: string
  name: string
  slug: string
  short?: string
  image?: string
  price?: string
}

type Review = {
  _id: string
  customerName: string
  text: string
  rating: number
  source?: string
}

type Product = {
  _id: string
  name: string
  slug: string
  images?: string[]
}

type Article = {
  _id: string
  title: string
  slug: string
  summary?: string
  image?: string
}

type Location = {
  _id?: string
  name: string
  slug: string
  address: string
  note?: string
}

type Program = {
  _id: string
  title: string
  description?: string
  image?: string
  priceText?: string
}

type LuxeHomepageProps = {
  promotion: ReactNode
  services: Service[]
  reviews: Review[]
  products: Product[]
  articles: Article[]
  locations: Location[]
  programs: Program[]
  loading: boolean
  onBook: (serviceName?: string, locationName?: string) => void
}

const fallbackLocations: Location[] = [
  {
    name: 'Airport Road, Warri',
    slug: 'airport-road',
    address: 'Magnifique House, 67 Airport Road, near Union Bank, opposite Christ Embassy, Warri',
  },
  {
    name: 'Delta Mall, Effurun',
    slug: 'delta-mall',
    address: 'Shop 20/23, Delta Mall, Effurun, Delta State',
  },
]

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkText,
}: {
  eyebrow: string
  title: string
  description?: string
  href?: string
  linkText?: string
}) {
  return (
    <div className='luxe-heading'>
      <div>
        <span className='luxe-kicker'>{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && linkText && (
        <a className='luxe-text-link' href={href}>
          {linkText} <ArrowRight size={17} aria-hidden='true' />
        </a>
      )}
    </div>
  )
}

export default function LuxeHomepage({
  promotion,
  services,
  reviews,
  products,
  articles,
  locations,
  programs,
  loading,
  onBook,
}: LuxeHomepageProps) {
  const gallery = services.filter(item => Boolean(item.image)).slice(0, 3)
  const branches = locations.length ? locations.slice(0, 2) : fallbackLocations

  return (
    <main className='luxe-home' id='main-content'>
      <section className='luxe-hero' aria-labelledby='luxe-home-title'>
        <div className='luxe-hero-copy'>
          <span className='luxe-hero-label'>
            <Sparkles size={16} aria-hidden='true' /> Your beauty, our passion
          </span>
          <p className='luxe-kicker'>Pinksky Beauty & Wellness · Warri & Effurun</p>
          <h1 id='luxe-home-title'>
            Beauty & wellness, <em>reimagined for you.</em>
          </h1>
          <p className='luxe-hero-lead'>
            A welcoming beauty salon and spa for confident smiles, radiant skin, beautiful hair,
            expert nails and restorative self-care in Warri and Effurun, Delta State.
          </p>
          <div className='luxe-hero-actions'>
            <button type='button' className='luxe-btn luxe-btn-primary' onClick={() => onBook()}>
              <CalendarDays size={18} aria-hidden='true' /> Book your experience
            </button>
            <a className='luxe-btn luxe-btn-outline' href='/services'>
              Explore services <ArrowRight size={18} aria-hidden='true' />
            </a>
          </div>
          <div className='luxe-hero-proof' aria-label='Pinksky locations'>
            <MapPin size={18} aria-hidden='true' />
            <span>Two convenient locations: Airport Road, Warri & Delta Mall, Effurun</span>
          </div>
        </div>
        <div className='luxe-hero-art'>
          <div className='luxe-hero-photo-frame'>
            <img
              src='/resources/pinksky-home-banner.jpg'
              alt='Pinksky Beauty and Wellness salon experience'
              width={900}
              height={1125}
              loading='eager'
              decoding='async'
              fetchPriority='high'
            />
          </div>
          <div className='luxe-hero-stamp'>
            <Sparkles size={22} aria-hidden='true' />
            <span>Find your glow</span>
            <small>Salon · Spa · Wellness</small>
          </div>
        </div>
      </section>

      <div className='luxe-benefits' aria-label='Our specialities'>
        <span>Expert beauty services</span>
        <span>Relaxation & self-care</span>
        <span>Warri & Effurun branches</span>
      </div>

      <section className='luxe-section' id='luxe-services'>
        <SectionHeading
          eyebrow='Made for your moment'
          title='Explore our signature services'
          description='From a refreshing facial to a complete salon day, find the experience that feels right for you.'
          href='/services'
          linkText='View all services'
        />
        {services.length > 0 ? (
          <div className='luxe-service-grid'>
            {services.slice(0, 6).map(item => (
              <article className='luxe-service-card' key={item._id || item.slug}>
                <a href={'/service/' + item.slug} className='luxe-service-image'>
                  <img
                    src={item.image || '/resources/pinksky-logo.jpg'}
                    alt={item.name}
                    loading='lazy'
                    decoding='async'
                    width={640}
                    height={760}
                  />
                </a>
                <div className='luxe-service-body'>
                  <span className='luxe-card-label'>Pinksky treatment</span>
                  <h3><a href={'/service/' + item.slug}>{item.name}</a></h3>
                  {item.short && <p>{item.short}</p>}
                  <div className='luxe-service-actions'>
                    <a href={'/service/' + item.slug} className='luxe-text-link'>
                      Discover <ArrowRight size={16} aria-hidden='true' />
                    </a>
                    <button type='button' onClick={() => onBook(item.name)} className='luxe-book-link'>
                      <MessageCircle size={15} aria-hidden='true' /> Book
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : loading ? (
          <div className='luxe-service-grid' aria-label='Loading our services' aria-busy='true'>
            {[1, 2, 3].map(index => <div className='luxe-service-skeleton' key={index} />)}
          </div>
        ) : (
          <p className='luxe-empty'>Our service catalogue is being refreshed. Contact us to book your preferred treatment.</p>
        )}
      </section>

      {promotion && (
        <section className='luxe-promotion' aria-label='Special offers and announcements'>
          <div className='luxe-promotion-heading'>
            <span className='luxe-kicker'>From our studio</span>
            <h2>Latest from Pinksky</h2>
          </div>
          {promotion}
        </section>
      )}

      <section className='luxe-story' aria-labelledby='luxe-story-title'>
        <div className='luxe-story-content'>
          <span className='luxe-kicker'>More than a salon</span>
          <h2 id='luxe-story-title'>A little time for yourself makes all the difference.</h2>
          <p>
            Pinksky brings together salon artistry, beauty treatments and wellness experiences,
            with convenient locations to make taking care of yourself a pleasure.
          </p>
          <a className='luxe-btn luxe-btn-outline' href='/locations'>
            Find your nearest studio <ArrowRight size={17} aria-hidden='true' />
          </a>
        </div>
        {gallery.length > 0 && (
          <div className='luxe-story-gallery'>
            {gallery.map((item, index) => (
              <a href={'/service/' + item.slug} className={'luxe-story-image luxe-story-image-' + index} key={item._id || item.slug}>
                <img src={item.image} alt={item.name} width={620} height={700} loading='lazy' decoding='async' />
                <span>{item.name}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      {reviews.length > 0 && (
        <section className='luxe-section luxe-review-section'>
          <SectionHeading
            eyebrow='Kind words'
            title='Loved by our clients'
            description='Real feedback from people who have experienced Pinksky.'
          />
          <div className='luxe-review-grid'>
            {reviews.slice(0, 3).map(review => (
              <blockquote className='luxe-review-card' key={review._id}>
                <div className='luxe-stars' aria-label={String(review.rating) + ' out of 5 stars'}>
                  {Array.from({length: Math.min(5, Math.max(0, Math.round(review.rating || 0)))}, (_, index) => (
                    <Star key={index} size={17} fill='currentColor' aria-hidden='true' />
                  ))}
                </div>
                <p>“{review.text}”</p>
                <footer>
                  <strong>{review.customerName}</strong>
                  {review.source && <span>{review.source}</span>}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {programs.length > 0 && (
        <section className='luxe-section'>
          <SectionHeading eyebrow='A thoughtful extra' title='Packages & special experiences' href='/programs' linkText='View packages' />
          <div className='luxe-program-grid'>
            {programs.slice(0, 3).map(item => (
              <article className='luxe-program-card' key={item._id}>
                {item.image && <img src={item.image} alt={item.title} width={400} height={260} loading='lazy' />}
                <div>
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}
                  {item.priceText && <strong>{item.priceText}</strong>}
                  <button type='button' className='luxe-text-link' onClick={() => onBook(item.title)}>
                    Ask about this package <ArrowRight size={16} aria-hidden='true' />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className='luxe-section luxe-branches'>
        <SectionHeading
          eyebrow='Close to you'
          title='Find your Pinksky location'
          description='Choose the Warri or Effurun studio that works best for you.'
          href='/locations'
          linkText='All location details'
        />
        <div className='luxe-branch-grid'>
          {branches.map(branch => (
            <article className='luxe-branch-card' key={branch._id || branch.slug}>
              <MapPin size={24} aria-hidden='true' />
              <div>
                <h3>{branch.name}</h3>
                <p>{branch.address}</p>
                {branch.note && <small>{branch.note}</small>}
              </div>
              <button type='button' className='luxe-text-link' onClick={() => onBook(undefined, branch.name)}>
                Book this branch <ArrowRight size={17} aria-hidden='true' />
              </button>
            </article>
          ))}
        </div>
      </section>

      {products.length > 0 && (
        <section className='luxe-section luxe-products'>
          <SectionHeading eyebrow='The beauty edit' title='Bring the glow home' href='/shop' linkText='Shop all products' />
          <div className='luxe-product-grid'>
            {products.slice(0, 3).map(item => (
              <a className='luxe-product-card' href={'/product/' + item.slug} key={item._id}>
                <div className='luxe-product-visual'>
                  <img src={item.images?.[0] || '/resources/pinksky-logo.jpg'} alt={item.name} width={420} height={420} loading='lazy' decoding='async' />
                </div>
                <h3>{item.name}</h3>
                <span>View product <ArrowRight size={15} aria-hidden='true' /></span>
              </a>
            ))}
          </div>
        </section>
      )}

      {articles.length > 0 && (
        <section className='luxe-section'>
          <SectionHeading eyebrow='The Pinksky journal' title='Beauty tips & inspiration' href='/blog' linkText='Visit our blog' />
          <div className='luxe-article-grid'>
            {articles.slice(0, 3).map(article => (
              <a className='luxe-article-card' href={'/article/' + article.slug} key={article._id}>
                {article.image && <img src={article.image} alt={article.title} width={520} height={320} loading='lazy' decoding='async' />}
                <div>
                  <span className='luxe-card-label'>Beauty guide</span>
                  <h3>{article.title}</h3>
                  {article.summary && <p>{article.summary}</p>}
                  <span className='luxe-text-link'>Read article <ArrowRight size={16} aria-hidden='true' /></span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className='luxe-last-cta'>
        <Sparkles size={27} aria-hidden='true' />
        <span className='luxe-kicker'>Make time for yourself</span>
        <h2>Your next Pinksky experience awaits.</h2>
        <p>Pick the location that suits you and book directly with our team on WhatsApp.</p>
        <button type='button' className='luxe-btn luxe-btn-light' onClick={() => onBook()}>
          <MessageCircle size={19} aria-hidden='true' /> Book an appointment
        </button>
      </section>
    </main>
  )
}
