import {useMemo, useState, type FormEvent} from 'react'
import {ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, Sparkles, Star} from 'lucide-react'
import './reviews-page.css'

export type PublicReview = {
  _id: string
  customerName: string
  text: string
  rating: number
  source?: string
  service?: string
  branchId?: string
  _createdAt?: string
}

type Props = {
  reviews: PublicReview[]
  services: string[]
  loading: boolean
  onBook: () => void
}

function Stars({rating,size=19}: {rating:number;size?:number}) {
  return <span className='pinksky-review-stars' aria-label={rating+' out of 5 stars'}>
    {Array.from({length:5},(_,i)=><Star key={i} size={size}
      fill={i<rating?'currentColor':'none'} aria-hidden='true'/>)}
  </span>
}

const branchLabel=(value?:string)=>
  value==='airport-road'?'Airport Road, Warri':
  value==='delta-mall'?'ShopMall, Effurun':''
const shortName=(fullName:string)=>{
  const parts=fullName.trim().split(/\s+/)
  return parts.slice(0,2).map(s=>s.charAt(0).toUpperCase()).join('')
}

export default function ReviewsPage({reviews,services,loading,onBook}: Props) {
  const [filter,setFilter]=useState(0)
  const [rating,setRating]=useState(0)
  const [customerName,setCustomerName]=useState('')
  const [service,setService]=useState('')
  const [branchId,setBranchId]=useState('')
  const [reviewText,setReviewText]=useState('')
  const [website,setWebsite]=useState('')
  const [submitting,setSubmitting]=useState(false)
  const [success,setSuccess]=useState(false)
  const [error,setError]=useState('')
  const validReviews=reviews.filter(review=>
    Number.isInteger(review.rating)&&review.rating>=1&&review.rating<=5&&
    Boolean(review.customerName)&&Boolean(review.text))
  const count=validReviews.length
  const average=count
    ? validReviews.reduce((total,item)=>total+item.rating,0)/count:0
  const counts=useMemo(()=>Array.from({length:5},(_,i)=>
    validReviews.filter(item=>item.rating===5-i).length),[reviews])
  const shown=validReviews
    .filter(item=>!filter||item.rating===filter)
    .sort((a,b)=>(b._createdAt||'').localeCompare(a._createdAt||''))

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if(rating<1||rating>5){setError('Please choose a star rating from 1 to 5.');return}
    if(customerName.trim().length<2){setError('Please enter your name.');return}
    if(reviewText.trim().length<20){setError('Please write at least 20 characters about your experience.');return}
    setSubmitting(true)
    try {
      const response=await fetch('/api/reviews',{
        method:'POST',
        headers:{'content-type':'application/json','Accept':'application/json'},
        cache:'no-store',
        body:JSON.stringify({customerName,rating,text:reviewText,service,branchId,website}),
      })
      const data=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(data.error||'Unable to submit your review right now.')
      setSuccess(true)
      setRating(0);setCustomerName('');setService('');setBranchId('');setReviewText('');setWebsite('')
    }catch(e){setError(e instanceof Error?e.message:'Unable to submit your review right now.')}
    finally{setSubmitting(false)}
  }

  return <main className='pinksky-reviews' id='main-content'>
    <section className='pinksky-reviews-hero'>
      <div className='pinksky-reviews-shell'>
        <span className='pinksky-reviews-kicker'><Sparkles size={18}/> CLIENT STORIES</span>
        <h1>Real experiences.<br/><em>Beautiful stories.</em></h1>
        <p>Hear from Pinksky Beauty & Wellness clients in Warri and Effurun. Share your own experience to help others discover the right treatment.</p>
        <div className='pinksky-reviews-hero-actions'>
          <a className='pinksky-reviews-primary' href='#write-review'>Write a review <ArrowRight size={18}/></a>
          <button type='button' className='pinksky-reviews-outline' onClick={onBook}>Book an appointment</button>
        </div>
      </div>
    </section>

    <section className='pinksky-reviews-shell pinksky-reviews-body' aria-label='Customer ratings and reviews'>
      <div className='pinksky-reviews-topline'>
        <span className='pinksky-reviews-kicker'>WHAT OUR CLIENTS THINK</span>
        <h2>Client reviews</h2>
        <p>Only approved reviews are shown here. We don't display invented testimonials or ratings.</p>
      </div>

      <div className='pinksky-reviews-overview'>
        <div className='pinksky-reviews-score'>
          <span className='pinksky-reviews-score-number'>{count?average.toFixed(1):'—'}</span>
          <Stars rating={count?Math.round(average):0} size={23}/>
          <span>{count===0?'No published reviews yet':count+' published '+(count===1?'review':'reviews')}</span>
        </div>
        <div className='pinksky-reviews-histogram' aria-label='Star rating distribution'>
          {counts.map((value,index)=><button type='button' key={5-index} className={filter===5-index?'selected':''}
            onClick={()=>setFilter(filter===5-index?0:5-index)}
            aria-pressed={filter===5-index}
            aria-label={'Filter '+(5-index)+' star reviews'}>
            <span>{5-index} <Star size={13} fill='currentColor' aria-hidden='true'/></span>
            <span className='pinksky-reviews-bar'><span style={{width:count?(100*value/count)+'%':'0%'}}/></span>
            <span>{value}</span>
          </button>)}
        </div>
        <div className='pinksky-reviews-summary-note'>
          <ShieldCheck size={28} aria-hidden='true'/>
          <h3>Your feedback matters.</h3>
          <p>Reviews are moderated for safety and relevance before publication. Ratings reflect approved customer feedback.</p>
          <a href='#write-review'>Share your experience <ArrowRight size={16}/></a>
        </div>
      </div>

      <div className='pinksky-reviews-list-heading'>
        <h2>What clients are saying</h2>
        <div>
          {filter!==0&&<button type='button' onClick={()=>setFilter(0)}>Clear {filter}-star filter</button>}
          <span>{shown.length} {shown.length===1?'review':'reviews'}</span>
        </div>
      </div>
      {loading&&<div className='pinksky-reviews-empty' role='status'>Loading reviews…</div>}
      {!loading&&shown.length>0&&<div className='pinksky-reviews-grid'>
        {shown.map(review=><article className='pinksky-review-card' key={review._id}>
          <Stars rating={review.rating}/>
          <p className='pinksky-review-quote'>“{review.text}”</p>
          {review.service&&<span className='pinksky-review-service'>{review.service}</span>}
          <div className='pinksky-review-person'>
            <span className='pinksky-review-avatar' aria-hidden='true'>{shortName(review.customerName)}</span>
            <div><strong>{review.customerName}</strong>
              <small>{branchLabel(review.branchId)||review.source||'Pinksky client'}</small>
            </div>
          </div>
        </article>)}
      </div>}
      {!loading&&shown.length===0&&<div className='pinksky-reviews-empty'>
        {filter?'No '+filter+'-star reviews have been published yet.':'Our first published customer reviews will appear here. Your experience could be the first!'}
      </div>}

      <section className='pinksky-reviews-submit' id='write-review' aria-labelledby='pinksky-write-review-title'>
        <div className='pinksky-reviews-submit-copy'>
          <span className='pinksky-reviews-kicker'>LEAVE YOUR FEEDBACK</span>
          <h2 id='pinksky-write-review-title'>How was your Pinksky experience?</h2>
          <p>Your feedback helps our team improve and guides future customers. Choose your stars and tell us about your visit.</p>
          <div className='pinksky-reviews-expectation'><MessageCircle size={19}/>
            <span>Reviews are submitted privately and become public only after staff approval.</span>
          </div>
        </div>
        <div className='pinksky-reviews-form-panel'>
          {success?<div className='pinksky-reviews-success' role='status'>
            <CheckCircle2 size={48} color='#3a9663'/>
            <h3>Thank you for sharing your experience!</h3>
            <p>Your review has been received and is awaiting moderation. It won't appear publicly until approved.</p>
            <button type='button' className='pinksky-reviews-primary' onClick={()=>setSuccess(false)}>Write another review</button>
          </div>:<form onSubmit={submit} className='pinksky-reviews-form'>
            <fieldset className='pinksky-review-rating-picker'>
              <legend>Your star rating *</legend>
              <div className='pinksky-reviews-pick-stars'>
                {[1,2,3,4,5].map(value=><button key={value} type='button' aria-label={'Give '+value+' '+(value===1?'star':'stars')}
                  aria-pressed={rating===value}
                  onClick={()=>setRating(value)}>
                  <Star size={34} fill={value<=rating?'currentColor':'none'}/>
                </button>)}
              </div>
              <small>{rating?rating+' out of 5 stars selected':'Select 1 to 5 stars'}</small>
            </fieldset>
            <label>Full name *<input required maxLength={80} autoComplete='name' value={customerName}
              onChange={e=>setCustomerName(e.target.value)} placeholder='Your name'/></label>
            <div className='pinksky-reviews-field-row'>
              <label>Service (optional)<select value={service} onChange={e=>setService(e.target.value)}>
                <option value=''>Choose a service</option>
                {services.map(name=><option key={name} value={name}>{name}</option>)}
              </select></label>
              <label>Branch (optional)<select value={branchId} onChange={e=>setBranchId(e.target.value)}>
                <option value=''>Choose a branch</option>
                <option value='airport-road'>Airport Road, Warri</option>
                <option value='delta-mall'>ShopMall, Effurun</option>
              </select></label>
            </div>
            <label>Your review *<textarea required rows={5} minLength={20} maxLength={1200}
              value={reviewText} onChange={e=>setReviewText(e.target.value)}
              placeholder='Tell us what you loved or how we can improve…'/></label>
            <input className='pinksky-reviews-honeypot' name='website' value={website}
              tabIndex={-1} aria-hidden='true' autoComplete='off'
              onChange={e=>setWebsite(e.target.value)}/>
            <p className='pinksky-reviews-consent'>By submitting, you agree that your name, star rating and review may be published on the Pinksky website after moderation. Please avoid including private contact information in your review.</p>
            {error&&<p className='pinksky-reviews-error' role='alert'>{error}</p>}
            <button className='pinksky-reviews-primary pinksky-reviews-submit-button' disabled={submitting} type='submit'>
              {submitting?'Submitting…':'Submit your review'} <ArrowRight size={18}/>
            </button>
          </form>}
        </div>
      </section>
    </section>
  </main>
}
