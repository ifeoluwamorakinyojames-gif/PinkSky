import { useState, type ReactNode } from 'react'
import { ArrowRight, CalendarDays, ChevronRight, Gift, Heart, Instagram, MapPin, MessageCircle, Scissors, Sparkles, Star } from 'lucide-react'
import './luxe-exact-homepage.css'

type Service = {
  _id?: string
  name: string
  slug: string
  short?: string
  image?: string
  gallery?: string[]
  price?: string
  items?: string[]
}
type Review = { _id: string; customerName: string; text: string; rating: number; source?: string }
type Product = { _id: string; name: string; slug: string; images?: string[] }
type Article = { _id: string; title: string; slug: string; summary?: string; image?: string }
type Location = { _id?: string; name: string; slug: string; address: string; note?: string }
type Program = { _id: string; title: string; type: string; description?: string; image?: string; priceText?: string }
type Props = {
  promotion: ReactNode
  services: Service[]
  reviews: Review[]
  products: Product[]
  articles: Article[]
  locations: Location[]
  programs: Program[]
  instagram?: string
  loading: boolean
  onBook: (serviceName?: string, locationName?: string) => void
}

const fallbackBranches = [
  {name:'Airport Road, Warri',slug:'airport-road',address:'Magnifique House, 67 Airport Road, near Union Bank, opposite Christ Embassy, Warri'},
  {name:'Delta Mall, Effurun',slug:'delta-mall',address:'Shop 20/23, Delta Mall, Effurun, Delta State'},
]

function Heading({kicker, title, description}: {kicker:string;title:string;description?:string}) {
  return <div className='ft-heading'>
    <span className='ft-kicker'>{kicker}</span>
    <h2>{title}</h2>
    <span className='ft-flourish' aria-hidden='true'>✦</span>
    {description && <p>{description}</p>}
  </div>
}

function ButtonLink({href, children, outline=false}: {href:string;children:ReactNode;outline?:boolean}) {
  return <a className={'ft-button ' + (outline?'ft-outline':'ft-filled')} href={href}>{children}</a>
}

export default function LuxeHomepage({promotion,services,reviews,products,articles,locations,programs,instagram,loading,onBook}: Props) {
  const [galleryFilter,setGalleryFilter] = useState('All')
  const [lightbox,setLightbox] = useState<{src:string;alt:string}|null>(null)
  const branches = locations.length ? locations.slice(0,2) : fallbackBranches
  const visualServices = services.filter(s=>s.image)
  const gallery = services.flatMap(s=>[
    ...(s.image ? [{src:s.image,alt:s.name,slug:s.slug,name:s.name}] : []),
    ...(s.gallery||[]).filter(Boolean).map((src,index)=>({src,alt:s.name+' gallery photograph '+(index+1),slug:s.slug,name:s.name})),
  ]).slice(0,12)
  const filters = ['All',...Array.from(new Set(gallery.map(g=>g.name))).slice(0,5)]
  const galleryItems = galleryFilter==='All'?gallery:gallery.filter(g=>g.name===galleryFilter)
  const hair = services.find(s=>/hair|wig|braid|nail|lash|facial|skincare/i.test(s.name))
  const expertise = services.filter(s=>/hair|wig|nail|facial|skin|brow|barb|massage|lash/i.test(s.name)).slice(0,3)
  const featured = programs.filter(p=>!/(gift|loyal|member)/i.test(p.type+' '+p.title)).slice(0,3)
  const loyalty = programs.filter(p=>/(loyal|member)/i.test(p.type+' '+p.title))
  const gifts = programs.filter(p=>/gift/i.test(p.type+' '+p.title))
  const instagramUrl = instagram?.trim()
  return <main className='ft-home' id='main-content'>
    {/* Reference sequence: Hero → FeaturedServices → Portfolio → BeforeAfter → Stylists → Specials → Bridal → Booking → Reviews → Products → Loyalty → GiftCards → Instagram */}

    <section className='ft-hero' aria-labelledby='ft-hero-title'>
      <div className='ft-hero-glow ft-glow-one' aria-hidden='true'/>
      <div className='ft-hero-glow ft-glow-two' aria-hidden='true'/>
      <div className='ft-container ft-hero-inner'>
        <div className='ft-hero-content'>
          <div className='ft-eyebrow-pill'><Sparkles size={17}/> The Pinksky Experience</div>
          <h1 id='ft-hero-title'><span>Pinksky</span><span>Beauty & Wellness</span></h1>
          <p className='ft-hero-script'>Your beauty journey starts here.</p>
          <p className='ft-hero-description'>Experience beautifully considered salon, spa and wellness services in Warri and Effurun. Your moment to look and feel your best starts with us.</p>
          <div className='ft-hero-buttons'>
            <button className='ft-button ft-filled' type='button' onClick={()=>onBook()}>Book Your Appointment <ArrowRight size={18}/></button>
            <ButtonLink href='/services' outline>View Services</ButtonLink>
          </div>
          <div className='ft-hero-trust'><span><MapPin size={17}/> Two locations</span><span><Sparkles size={17}/> Salon & Spa</span></div>
        </div>
        <div className='ft-hero-picture'>
          <div className='ft-hero-picture-back' aria-hidden='true'/>
          <div className='ft-hero-picture-main'>
            <img src='/resources/pinksky-home-banner.jpg' alt='Pinksky Beauty and Wellness studio' width={800} height={1000} fetchPriority='high' loading='eager'/>
          </div>
          <div className='ft-floating-card'><Sparkles size={22}/><strong>2 Locations</strong><small>Warri & Effurun</small></div>
        </div>
      </div>
      <div className='ft-scroll-hint' aria-hidden='true'><span/></div>
    </section>

    <section className='ft-section ft-featured' aria-labelledby='ft-featured-title'>
      <div className='ft-container'>
        <Heading kicker='Signature Services' title='Most Loved' />
        <div className='ft-signatures'>
          {services.slice(0,5).map((service,index)=>{
            const icons=[Sparkles,Scissors,Heart,Star,Gift]
            const Icon=icons[index]
            return <a className='ft-signature' key={service._id||service.slug} href={'/service/'+service.slug}>
              <span className='ft-signature-icon'><Icon size={31}/></span>
              <h3>{service.name}</h3>
              {service.price && <span>{service.price}</span>}
              <ArrowRight size={20} aria-hidden='true'/>
            </a>
          })}
          {loading&&!services.length&&<p className='ft-loading' aria-live='polite'>Loading Pinksky services…</p>}
        </div>
        <div className='ft-center'><ButtonLink href='/services'>View Full Service Menu <ArrowRight size={18}/></ButtonLink></div>
      </div>
    </section>

    <section className='ft-section ft-portfolio' aria-label='Our work'>
      <div className='ft-container'>
        <Heading kicker='Our Work' title='The Portfolio' description='Explore Pinksky beauty treatments and services through our studio gallery.'/>
        {gallery.length>0 ? <>
          <div className='ft-filters' role='group' aria-label='Filter gallery by service'>
            {filters.map(filter=><button type='button' className={galleryFilter===filter?'active':''} onClick={()=>setGalleryFilter(filter)} key={filter}>{filter}</button>)}
          </div>
          <div className='ft-masonry'>
            {galleryItems.slice(0,8).map((photo,index)=><button className='ft-gallery-tile' key={photo.slug+'-'+index} type='button' onClick={()=>setLightbox({src:photo.src,alt:photo.alt})}>
              <img src={photo.src} alt={photo.alt} loading='lazy' width={520} height={650}/>
              <span>{photo.name} <ArrowRight size={17}/></span>
            </button>)}
          </div>
        </> : <p className='ft-info'>Our portfolio images will appear when they are published in the studio CMS.</p>}
      </div>
    </section>

    <section className='ft-section ft-transform' aria-label='Beauty transformations'>
      <div className='ft-container'>
        <Heading kicker='Transformations' title='Before & After' description='Discover how a personalised beauty service can fit your goals. Verified before-and-after comparisons will be added when available.'/>
        <div className='ft-transform-grid'>
          <div className='ft-transform-photo'>
            <img src={visualServices[0]?.image||'/resources/pinksky-home-banner.jpg'} alt='Beauty services at Pinksky' width={640} height={510} loading='lazy'/>
            <span>Beauty & confidence</span>
          </div>
          <div className='ft-transform-copy'>
            <Sparkles size={32}/>
            <h3>It's all about your next chapter of self-care.</h3>
            <p>Explore facials, hair, nails, brows, massage and more. Contact our studio to discuss your preferred result and the right service for you.</p>
            <ButtonLink href='/services' outline>Explore treatments <ArrowRight size={17}/></ButtonLink>
          </div>
        </div>
      </div>
    </section>

    <section className='ft-section ft-artists'>
      <div className='ft-container'>
        <Heading kicker='Meet The Artists' title='Our Beauty Specialities' description='Explore the services our team offers. Individual team profiles can be added once staff photographs and details are published.'/>
        <div className='ft-artists-grid'>
          {(expertise.length?expertise:services.slice(0,3)).map(s=><article className='ft-artist-card' key={s._id||s.slug}>
            <a href={'/service/'+s.slug} className='ft-artist-photo'><img src={s.image||'/resources/pinksky-logo.jpg'} alt={s.name} width={500} height={620} loading='lazy'/></a>
            <div><h3>{s.name}</h3><span>Pinksky salon & spa</span><button type='button' onClick={()=>onBook(s.name)}>Book this service <ArrowRight size={16}/></button></div>
          </article>)}
        </div>
      </div>
    </section>

    <section className='ft-section ft-specials'>
      <div className='ft-container'>
        <Heading kicker='Special Offers' title='Current Promotions' description='Special experiences and packages from Pinksky.'/>
        {promotion&&<div className='ft-promo-banner'>{promotion}</div>}
        {featured.length>0 ? <div className='ft-special-grid'>
          {featured.map(item=><article className='ft-special' key={item._id}>
            {item.image&&<img src={item.image} alt={item.title} width={500} height={350} loading='lazy'/>}
            <div><span className='ft-kicker'>Pinksky experience</span><h3>{item.title}</h3><p>{item.description}</p>{item.priceText&&<strong>{item.priceText}</strong>}
              <button onClick={()=>onBook(item.title)} type='button'>Enquire on WhatsApp <ArrowRight size={17}/></button>
            </div>
          </article>)}
        </div> : !promotion&&<p className='ft-info'>Check with our team for current packages and offers.</p>}
        <div className='ft-center'><ButtonLink href='/programs' outline>See Packages & Offers <ArrowRight size={18}/></ButtonLink></div>
      </div>
    </section>

    <section className='ft-section ft-bridal'>
      <div className='ft-container ft-bridal-inner'>
        <div className='ft-bridal-visual'>
          <img src={hair?.image||'/resources/pinksky-home-banner.jpg'} alt='Pinksky styling and special occasion beauty' width={720} height={850} loading='lazy'/>
          <div className='ft-bridal-note'><Heart size={26}/><strong>Beautiful moments</strong><span>Made more memorable</span></div>
        </div>
        <div className='ft-bridal-copy'><span className='ft-kicker'>Bridal & Special Events</span>
          <h2>Look and feel your best for every special moment.</h2>
          <p>Getting ready for a wedding, celebration or special occasion? Explore Pinksky's hair, nails, facials and beauty services and ask our team about a tailored appointment.</p>
          <ul><li>Hair and beauty styling</li><li>Facials, brows and nails</li><li>Appointments at our Warri or Effurun studio</li></ul>
          <button type='button' onClick={()=>onBook('special occasion beauty appointment')} className='ft-button ft-filled'>Enquire About Your Date <ArrowRight size={18}/></button>
        </div>
      </div>
    </section>

    <section className='ft-section ft-booking'>
      <div className='ft-container'>
        <Heading kicker='Ready To Glow?' title='Book Your Experience' description='Choose a Pinksky branch and continue straight to our booking team on WhatsApp.'/>
        <div className='ft-booking-panel'>
          <div className='ft-booking-intro'><CalendarDays size={34}/><h3>Your next appointment starts here.</h3><p>We will help you confirm services, prices and available times.</p></div>
          <div className='ft-booking-choices'>
            {branches.map(b=><button type='button' onClick={()=>onBook(undefined,b.name)} key={b.slug}><MapPin size={20}/><span><strong>{b.name}</strong><small>{b.address}</small></span><ChevronRight size={19}/></button>)}
          </div>
        </div>
      </div>
    </section>

    {reviews.length>0&&<section className='ft-section ft-testimonials'>
      <div className='ft-container'>
        <Heading kicker='Client Love' title='What Our Clients Say'/>
        <div className='ft-testimonial-grid'>{reviews.slice(0,3).map(r=><blockquote className='ft-testimonial' key={r._id}>
          <div aria-label={r.rating+' out of 5 stars'}>{Array.from({length:Math.max(0,Math.min(5,Math.round(r.rating||0)))},(_,i)=><Star size={17} fill='currentColor' key={i}/>)}</div>
          <p>“{r.text}”</p><footer><strong>{r.customerName}</strong>{r.source&&<span>{r.source}</span>}</footer>
        </blockquote>)}</div>
      </div>
    </section>}

    {products.length>0&&<section className='ft-section ft-products'>
      <div className='ft-container'>
        <Heading kicker='Products We Love' title='The Beauty Edit' description='Discover the products available through Pinksky.'/>
        <div className='ft-product-grid'>{products.slice(0,4).map(p=><a className='ft-product' href={'/product/'+p.slug} key={p._id}>
          <div><img src={p.images?.[0]||'/resources/pinksky-logo.jpg'} alt={p.name} width={420} height={420} loading='lazy'/></div>
          <h3>{p.name}</h3><span>Explore product <ArrowRight size={16}/></span>
        </a>)}</div>
        <div className='ft-center'><ButtonLink href='/shop' outline>Visit The Beauty Shop <ArrowRight size={18}/></ButtonLink></div>
      </div>
    </section>}

    <section className='ft-section ft-loyalty'>
      <div className='ft-container'>
        <Heading kicker='More Ways To Enjoy Pinksky' title='Memberships & Experiences' description='Explore our available beauty and wellness programmes.'/>
        <div className='ft-loyalty-tiles'>
          {(loyalty.length?loyalty:programs.slice(0,3)).map(p=><article key={p._id}>
            <Star size={28}/><h3>{p.title}</h3><p>{p.description||'Contact us for programme details.'}</p>
            {p.priceText&&<strong>{p.priceText}</strong>}
          </article>)}
          {!programs.length&&<article><Gift size={28}/><h3>Pinksky Packages</h3><p>Contact our team to ask about our current experiences and packages.</p></article>}
        </div>
        <div className='ft-center'><ButtonLink href='/programs'>Explore Packages <ArrowRight size={18}/></ButtonLink></div>
      </div>
    </section>

    <section className='ft-gift'>
      <div className='ft-container ft-gift-layout'>
        <div><span className='ft-kicker'>A Little Something Special</span><h2>Give the Gift of Self-Care</h2><p>Ask our team about gift cards and special beauty experiences for someone you care about.</p>
          <button type='button' onClick={()=>onBook(gifts[0]?.title||'a Pinksky gift card')} className='ft-button ft-light'>Enquire About Gift Cards <ArrowRight size={18}/></button>
        </div>
        <div className='ft-gift-visual'><Gift size={68}/><span>Pinksky</span><strong>Beauty & Wellness</strong><small>Warri · Effurun</small></div>
      </div>
    </section>

    <section className='ft-instagram'>
      <div className='ft-container'>
        <Instagram size={32}/>
        <span className='ft-kicker'>Follow Our Journey</span>
        <h2>Stay in the Pinksky Loop</h2>
        <p>See more beauty and wellness moments and get inspiration from our latest work.</p>
        {gallery.length>0&&<div className='ft-social-images'>
          {gallery.slice(0,5).map((g,i)=><a href={'/service/'+g.slug} key={i}><img src={g.src} alt={g.alt} width={280} height={280} loading='lazy'/></a>)}
        </div>}
        {instagramUrl && /^https:\/\//i.test(instagramUrl) ? <a className='ft-button ft-light' href={instagramUrl} target='_blank' rel='noopener noreferrer'><Instagram size={17}/> Visit Pinksky on Instagram</a> : <ButtonLink href='/blog'>Read Our Beauty Journal <ArrowRight size={18}/></ButtonLink>}
      </div>
    </section>

    {articles.length>0&&<section className='ft-section ft-journal'>
      <div className='ft-container'><Heading kicker='The Pinksky Journal' title='Beauty Guides & Inspiration'/>
        <div className='ft-journal-grid'>{articles.slice(0,3).map(a=><a href={'/article/'+a.slug} key={a._id}>
          {a.image&&<img src={a.image} alt={a.title} width={420} height={240} loading='lazy'/>}
          <h3>{a.title}</h3><p>{a.summary}</p><span>Read more <ArrowRight size={17}/></span>
        </a>)}</div>
      </div>
    </section>}
    {lightbox&&<div className='ft-lightbox' role='dialog' aria-modal='true' aria-label='Gallery image' onClick={()=>setLightbox(null)}>
      <button type='button' aria-label='Close gallery' onClick={()=>setLightbox(null)}>×</button>
      <img src={lightbox.src} alt={lightbox.alt} onClick={e=>e.stopPropagation()}/>
    </div>}
  </main>
}
