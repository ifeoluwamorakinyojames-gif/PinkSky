import {createClient} from '@sanity/client'

type AdminRole = 'owner' | 'manager' | 'editor' | 'viewer'

type Env = {
  DB: {
    prepare: (sql: string) => any
    batch: (statements: any[]) => Promise<any>
  }
  SANITY_STUDIO_PROJECT_ID: string
  SANITY_STUDIO_DATASET?: string
  SANITY_API_WRITE_TOKEN: string
  PINKSKY_OWNER_EMAILS?: string
  PINKSKY_OWNER_NAME_1?: string
  PINKSKY_OWNER_NAME_2?: string
  PINKSKY_OWNER_PASSWORD_1?: string
  PINKSKY_OWNER_PASSWORD_2?: string
  PINKSKY_SESSION_SECRET?: string
}

type Ctx = {
  request: Request
  env: Env
  params: {path?: string | string[]}
}

const json = (body: unknown, status = 200, headers: Record<string,string> = {}) =>
  new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json; charset=utf-8', ...headers}})

const clean = (value: unknown, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const bytesToHex = (bytes: Uint8Array) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
const hexToBytes = (hex: string) => new Uint8Array(hex.match(/.{1,2}/g)?.map(x => parseInt(x, 16)) || [])

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign'])
  return bytesToHex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))))
}

async function derivePassword(password: string, saltHex: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations: 100000}, key, 256)
  return bytesToHex(new Uint8Array(bits))
}

function randomHex(bytes = 32) {
  const data = new Uint8Array(bytes)
  crypto.getRandomValues(data)
  return bytesToHex(data)
}

function cookieMap(request: Request) {
  const out: Record<string,string> = {}
  const cookie = request.headers.get('cookie') || ''
  for (const part of cookie.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k) out[k] = decodeURIComponent(rest.join('='))
  }
  return out
}

function ownerEmails(env: Env) {
  return (env.PINKSKY_OWNER_EMAILS || 'ifeoluwamorakinyojames@gmail.com,pinkskyccnt@gmail.com')
    .split(',').map(x => x.trim().toLowerCase()).filter(Boolean)
}

function safeUser(row: any) {
  return {id: row.id, email: row.email, name: row.name || '', role: row.role as AdminRole, status: row.status || 'active'}
}

function canWrite(role: string) {
  return ['owner', 'manager', 'editor'].includes(role)
}

function sanity(env: Env, write = false) {
  const projectId = String(env.SANITY_STUDIO_PROJECT_ID || '').trim()
  const dataset = String(env.SANITY_STUDIO_DATASET || 'production').trim()

  if (!projectId) {
    throw new Error('Missing SANITY_STUDIO_PROJECT_ID')
  }

  if (!/^[a-z0-9-]+$/i.test(projectId)) {
    throw new Error('Invalid Sanity project ID configuration')
  }

  if (!dataset) {
    throw new Error('Missing SANITY_STUDIO_DATASET')
  }

  if (write && !env.SANITY_API_WRITE_TOKEN) {
    throw new Error('Missing SANITY_API_WRITE_TOKEN')
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: '2026-10-04',
    useCdn: false,
    token: write ? env.SANITY_API_WRITE_TOKEN.trim() : undefined,
  })
}

async function ensureSchema(env: Env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS online_appointments (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      service TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      location TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'requested',
      internal_notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_online_appointments_date
      ON online_appointments(branch_id,preferred_date,preferred_time)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS review_submission_limits (
      fingerprint TEXT NOT NULL,
      submitted_at INTEGER NOT NULL
    )`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_review_limits
      ON review_submission_limits (fingerprint,submitted_at)`),
  ])
}

async function seedOwners(env: Env) {
  await ensureSchema(env)
  const emails = ownerEmails(env)
  const seeds = [
    {email: emails[0], name: env.PINKSKY_OWNER_NAME_1 || 'Ifeoluwa Morakinyo James', password: env.PINKSKY_OWNER_PASSWORD_1 || ''},
    {email: emails[1], name: env.PINKSKY_OWNER_NAME_2 || 'Pink Sky Owner', password: env.PINKSKY_OWNER_PASSWORD_2 || ''},
  ].filter(x => x.email)

  for (const seed of seeds) {
    const existing = await env.DB.prepare('SELECT * FROM admin_users WHERE email = ?').bind(seed.email).first()
    if (existing) {
      await env.DB.prepare("UPDATE admin_users SET role='owner', status='active', name=?, updated_at=? WHERE email=?")
        .bind(seed.name, new Date().toISOString(), seed.email).run()
      continue
    }
    if (!seed.password || seed.password.length < 8 || seed.password.startsWith('change-this')) continue
    const salt = randomHex(16)
    const hash = await derivePassword(seed.password, salt)
    await env.DB.prepare(`INSERT INTO admin_users (id,email,name,role,status,password_salt,password_hash,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)`)
      .bind('usr_' + crypto.randomUUID(), seed.email, seed.name, 'owner', 'active', salt, hash, new Date().toISOString(), new Date().toISOString()).run()
  }
}

async function currentUser(request: Request, env: Env) {
  await ensureSchema(env)
  const raw = cookieMap(request).pinksky_admin
  if (!raw) return null
  const secret = env.PINKSKY_SESSION_SECRET || 'pinksky-session-secret-must-be-configured'
  const tokenHash = await hmacHex(secret, raw)
  const row = await env.DB.prepare(`SELECT u.* FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.status='active'`).bind(tokenHash, Date.now()).first()
  return row || null
}

function cleanPayload(payload: any) {
  const out = {...payload}
  for (const key of ['_id','_rev','_createdAt','_updatedAt','_type','id','bookingReference']) delete out[key]
  if (typeof out.slug === 'string') out.slug = {_type: 'slug', current: out.slug}
  return out
}

const resourceMap: Record<string,string> = {
  services: 'service',
  products: 'product',
  banners: 'banner',
  articles: 'article',
  bookings: 'booking',
  locations: 'location',
  programs: 'offerProgram',
  reviews: 'review',
  settings: 'siteSettings',
}

async function parseJson(request: Request) {
  try { return await request.json() } catch { return {} }
}

export const onRequest = async (context: Ctx) => {
  const {request, env} = context
  const url = new URL(request.url)
  const method = request.method.toUpperCase()
  const path = url.pathname

  try {
    await ensureSchema(env)
if (path === '/api/content' && method === 'GET') {
  const client = sanity(env, false)

  const results = await Promise.allSettled([
    client.fetch(`*[_type == "service" && published == true] | order(order asc, name asc) {
  _id,
  name,
  "slug": slug.current,
  eyebrow,
  short,
  description,
  price,
  duration,
  items,
  seoKeyword,
  seoIntent,
  seoFaqText,
  seoHeading,
  seoTitle,
  metaDescription,
  "image": heroImage.asset->url + "?w=960&fm=webp&q=75",
  "gallery": gallery[].asset->url + "?w=800&fm=webp&q=75"
}`),

    client.fetch(`*[_type == "banner" && active == true &&
      (!defined(startAt) || startAt <= now()) &&
      (!defined(endAt) || endAt >= now())]
      | order(order asc, _createdAt desc) {
        _id, title, alt, link, order, active, startAt, endAt,
        "src": image.asset->url, "image": image.asset->url
      }`),

    client.fetch(`*[_type == "article" && published == true]
      | order(coalesce(publishedAt, _createdAt) desc) {
        _id, title, "slug": slug.current, intent, summary, body,
        seoTitle, metaDescription, seoKeyword, seoFaqText, authorName, publishedAt,
        "image": featuredImage.asset->url
      }`),

    client.fetch(`*[_type == "product" && published == true]
      | order(order asc, name asc) {
        _id, name, "slug": slug.current, brand, category,
        regularPrice, salePrice, sku, gtin, stockQuantity, size,
        variants, shortDescription, description, benefits,
        ingredients, howToUse, seoTitle, metaDescription, featured,
        "images": images[].asset->url
      }`),

    client.fetch(`*[_type == "location"]
      | order(order asc, name asc) {
        _id, name, "slug": slug.current, address, note, phone,
        bookingBranchId, whatsappNumbers, active,
        openingHours, "image": image.asset->url
      }`),

    client.fetch(`*[_type == "siteSettings" && _id == "siteSettings"][0] {
      businessName, tagline, phones, whatsappNumber, email,
      instagram, facebook, seoTitle, metaDescription,
      "logo": logo.asset->url
    }`),

    client.fetch(`*[_type == "offerProgram" && published == true]
      | order(order asc, title asc) {
        _id, title, type, description, priceText,
        "image": image.asset->url
      }`),

    client.fetch(`*[_type == "review" && published == true]
      | order(order asc, _createdAt desc) {
        _id, customerName, text, rating, source, service, branchId, _createdAt
      }`)
  ])
const names = [
  'services',
  'banners',
  'articles',
  'products',
  'locations',
  'settings',
  'programs',
  'reviews'
]

results.forEach((result, index) => {
  if (result.status === 'rejected') {
    console.error(`Sanity ${names[index]} query failed`, result.reason)
  }
})

const getResult = <T,>(index: number, fallback: T): T => {
  const result = results[index]
  return result.status === 'fulfilled'
    ? result.value as T
    : fallback
}

// Services are essential: report failures instead of hiding them.
if (results[0].status === 'rejected') {
  return json({
    error: 'Unable to load published services',
    code: 'SERVICES_QUERY_FAILED'
  }, 503)
}

const services = getResult<any[]>(0, [])
const banners = getResult<any[]>(1, [])
const articles = getResult<any[]>(2, [])
const products = getResult<any[]>(3, [])
const locations = getResult<any[]>(4, [])
const settings = getResult<Record<string, unknown>>(5, {})
const programs = getResult<any[]>(6, [])
const reviews = getResult<any[]>(7, [])

  return json({
    services,
    banners,
    articles,
    products,
    locations,
    settings: settings || {},
    programs,
    reviews
  })
}

    if (path === '/api/reviews' && method === 'POST') {
      // Public review submissions never set published=true: only staff can approve them.
      if (Number(request.headers.get('content-length') || 0)>10000) {
        return json({error:'Your review is too long.'},413,{'cache-control':'no-store'})
      }
      const contentType=request.headers.get('content-type')||''
      if (!contentType.includes('application/json')) {
        return json({error:'Please submit the review form.'},415,{'cache-control':'no-store'})
      }
      const body=await parseJson(request)
      if (clean(body.website)) return json({error:'Unable to submit this review.'},400,{'cache-control':'no-store'})
      const customerName=clean(body.customerName,80)
      const feedback=clean(body.text,1200)
      const rating=Number(body.rating)
      const service=clean(body.service,160)
      const branchId=clean(body.branchId,30)
      if (customerName.length<2 || feedback.length<20 || feedback.length>1200 ||
          !Number.isInteger(rating) || rating<1 || rating>5) {
        return json({error:'Please enter your name, 1–5 stars, and a review of at least 20 characters.'},
          400,{'cache-control':'no-store'})
      }
      if (branchId && branchId!=='airport-road' && branchId!=='delta-mall') {
        return json({error:'Please choose a valid branch.'},400,{'cache-control':'no-store'})
      }
      // A hashed network fingerprint limits bulk submissions without storing raw IPs.
      const ip=request.headers.get('CF-Connecting-IP')||''
      const fingerprint=await hmacHex(env.PINKSKY_SESSION_SECRET||'pinksky-review-limit',
        (ip||'unknown')+':'+(request.headers.get('user-agent')||'').slice(0,180))
      const now=Date.now()
      const limit=await env.DB.prepare(`SELECT COUNT(*) AS count FROM review_submission_limits
        WHERE fingerprint=? AND submitted_at>?`).bind(fingerprint,now-60*60*1000).first()
      if(Number(limit?.count||0)>=3) {
        return json({error:'Too many recent review submissions. Please try again later.'},
          429,{'cache-control':'no-store','retry-after':'3600'})
      }
      const doc=await sanity(env,true).create({
        _type:'review',
        customerName,
        text:feedback,
        rating,
        service,
        branchId:branchId||undefined,
        source:'Website',
        published:false,
        order:100,
      })
      await env.DB.prepare(`INSERT INTO review_submission_limits
        (fingerprint,submitted_at) VALUES (?,?)`).bind(fingerprint,now).run()
      return json({received:true,moderation:'pending',id:doc._id},201,{'cache-control':'no-store'})
    }

    if (path === '/api/bookings' && method === 'POST') {
      // Online appointment requests are stored privately in D1, never in a public CMS dataset.
      if (Number(request.headers.get('content-length') || '0') > 16000) {
        return json({error:'Booking request is too large.'},413,{'cache-control':'no-store'})
      }
      const body = await parseJson(request)
      if (clean(body.website)) return json({error:'Invalid booking submission.'},400,{'cache-control':'no-store'})
      const name = clean(body.name,120)
      const phone = clean(body.phone,25)
      const email = clean(body.email,180)
      const service = clean(body.service,160)
      const branchId = clean(body.branchId,30)
      const date = clean(body.preferredDate,30)
      const time = clean(body.preferredTime,40)
      const notes = clean(body.notes,1200)
      const branch = branchId === 'airport-road'
        ? 'Airport Road, Warri'
        : branchId === 'delta-mall'
        ? 'ShopMall — Delta Mall, Effurun'
        : ''
      if (!branch) return json({error:'Please select an available Pinksky branch.'},400,{'cache-control':'no-store'})
      if (name.length < 2 || !/^[+0-9() -]{10,25}$/.test(phone) ||
          phone.replace(/\D/g,'').length < 10 || !service || !date || !time) {
        return json({error:'Please enter your name, valid phone, service, date and time.'},400,{'cache-control':'no-store'})
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({error:'Please enter a valid email address.'},400,{'cache-control':'no-store'})
      }
      const dateIsValid = /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        !Number.isNaN(Date.parse(date)) && new Date(date+'T00:00:00Z').toISOString().slice(0,10) === date
      if (!dateIsValid || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        return json({error:'Please choose a valid preferred date and time.'},400,{'cache-control':'no-store'})
      }
      const parts = new Intl.DateTimeFormat('en-GB',{
        timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit',
      }).formatToParts(new Date())
      const part=(key:string)=>parts.find(item=>item.type===key)?.value || ''
      const localToday=[part('year'),part('month'),part('day')].join('-')
      const maxDate=new Date(Date.now()+1000*60*60*24*185).toISOString().slice(0,10)
      if(date<localToday || date>maxDate) {
        return json({error:'Please choose a date within the next six months.'},400,{'cache-control':'no-store'})
      }
      const id='appt_'+crypto.randomUUID()
      const reference='PS-'+randomHex(5).toUpperCase()
      const now=new Date().toISOString()
      await env.DB.prepare(`INSERT INTO online_appointments
        (id,reference,name,phone,email,service,branch_id,location,preferred_date,preferred_time,notes,status,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,'requested',?,?)`)
        .bind(id,reference,name,phone,email,service,branchId,branch,date,time,notes,now,now).run()
      return json({reference,status:'requested',branchId,preferredDate:date,preferredTime:time},201,
        {'cache-control':'no-store'})
    }

    if (path === '/api/admin/login' && method === 'POST') {
      await seedOwners(env)
      const body = await parseJson(request)
      const email = clean(body.email, 180).toLowerCase()
      const password = String(body.password || '')
      const row: any = await env.DB.prepare("SELECT * FROM admin_users WHERE email=? AND status='active'").bind(email).first()
      if (!row || !password) return json({error: 'Incorrect email or password.'}, 401)
      const hash = await derivePassword(password, row.password_salt)
      if (hash !== row.password_hash) return json({error: 'Incorrect email or password.'}, 401)
      const rawToken = randomHex(32)
      const secret = env.PINKSKY_SESSION_SECRET || 'pinksky-session-secret-must-be-configured'
      const tokenHash = await hmacHex(secret, rawToken)
      await env.DB.prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(row.id).run()
      await env.DB.prepare('INSERT INTO admin_sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)')
        .bind(tokenHash, row.id, Date.now() + 12*60*60*1000, new Date().toISOString()).run()
      const secure = url.protocol === 'https:' ? '; Secure' : ''
      return json({user: safeUser(row)}, 200, {'set-cookie': `pinksky_admin=${encodeURIComponent(rawToken)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure}`})
    }

    if (path === '/api/admin/logout' && method === 'POST') {
      const raw = cookieMap(request).pinksky_admin
      if (raw) {
        const secret = env.PINKSKY_SESSION_SECRET || 'pinksky-session-secret-must-be-configured'
        await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await hmacHex(secret, raw)).run()
      }
      const secure = url.protocol === 'https:' ? '; Secure' : ''
      return json({ok:true}, 200, {'set-cookie': `pinksky_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`})
    }

    if (path === '/api/admin/session' && method === 'GET') {
      const user = await currentUser(request, env)
      return json(user ? {authenticated:true, user:safeUser(user)} : {authenticated:false})
    }

    if (!path.startsWith('/api/admin/')) return json({error:'Not found'}, 404)

    const user: any = await currentUser(request, env)
    if (!user) return json({error:'Please sign in to Pink Sky Admin.'}, 401)

    if (path === '/api/admin/bookings' && method === 'GET') {
      // This route is behind the staff session check above.
      const rows=await env.DB.prepare(`SELECT
        id AS _id, reference AS bookingReference, name,phone,email,service,
        branch_id AS branchId,location,
        preferred_date AS preferredDate,preferred_time AS preferredTime,
        notes,status,internal_notes AS internalNotes,created_at AS createdAt
        FROM online_appointments ORDER BY created_at DESC LIMIT 500`).all()
      let legacy:any[]=[]
      try {
        legacy=await sanity(env,false).fetch(
          '*[_type == "booking"] | order(_createdAt desc)[0...200]{...}',
        )
      } catch(error) {console.warn('Unable to fetch legacy Sanity bookings',error)}
      return json([...(rows.results||[]),...legacy],200,{'cache-control':'no-store'})
    }

    if (path.startsWith('/api/admin/bookings/') && method === 'PUT') {
      if (!canWrite(user.role)) return json({error:'This role is read-only.'},403)
      const bookingId=decodeURIComponent(path.slice('/api/admin/bookings/'.length))
      if (bookingId.startsWith('appt_')) {
        const payload=await parseJson(request)
        const status=clean(payload.status,30)
        if (!['requested','contacted','confirmed','completed','cancelled'].includes(status)) {
          return json({error:'Invalid booking status.'},400)
        }
        const internalNotes=clean(payload.internalNotes,1500)
        const updated=await env.DB.prepare(`UPDATE online_appointments
          SET status=?,internal_notes=?,updated_at=? WHERE id=?`)
          .bind(status,internalNotes,new Date().toISOString(),bookingId).run()
        if (!updated.meta?.changes) return json({error:'Appointment not found.'},404)
        return json({id:bookingId,status,internalNotes})
      }
      // Older booking documents continue to use the existing Sanity admin handler below.
    }

    if (path === '/api/admin/uploads' && method === 'POST') {
      if (!canWrite(user.role)) return json({error:'This role cannot upload images.'},403)
      const body = await parseJson(request)
      const data = String(body.data || '')
      if (!data) return json({error:'Image data is required.'},400)
      const binary = Uint8Array.from(atob(data), c => c.charCodeAt(0))
      if (binary.byteLength > 8*1024*1024) return json({error:'Image must be under 8 MB.'},413)
     const contentType = clean(body.contentType, 80) || 'image/jpeg'

const rawFilename = clean(body.filename, 180)

const safeFilename =
  rawFilename &&
  !rawFilename.includes('http://') &&
  !rawFilename.includes('https://') &&
  !rawFilename.includes('","') &&
  !rawFilename.includes('\\"')
    ? rawFilename.replace(/[^a-zA-Z0-9._-]/g, '-')
    : `pinksky-image-${Date.now()}.jpg`

const asset = await sanity(env, true).assets.upload(
  'image',
  new Blob([binary], {type: contentType}),
  {
    filename: safeFilename,
    contentType,
  },
)
      return json({assetId:asset._id,url:asset.url,image:{_type:'image',asset:{_type:'reference',_ref:asset._id}}},201)
    }

    const parts = path.split('/').filter(Boolean)
    const resource = parts[2]
    const id = parts[3] ? decodeURIComponent(parts[3]) : ''

    if (resource === 'users') {
      if (user.role !== 'owner') return json({error:'Owner access required.'},403)
      const protectedOwners = ownerEmails(env)

      if (method === 'GET' && !id) {
        const result = await env.DB.prepare('SELECT id,email,name,role,status FROM admin_users ORDER BY created_at ASC').all()
        return json(result.results || [])
      }

      if (method === 'POST' && !id) {
        const body = await parseJson(request)
        const email = clean(body.email,180).toLowerCase()
        const password = String(body.password || '')
        const role = String(body.role || 'viewer')
        if (!email || password.length < 8 || !['owner','manager','editor','viewer'].includes(role)) return json({error:'Valid email, password (8+ characters), and role are required.'},400)
        if (await env.DB.prepare('SELECT id FROM admin_users WHERE email=?').bind(email).first()) return json({error:'This email already exists.'},409)
        const salt = randomHex(16)
        const hash = await derivePassword(password,salt)
        const created = {id:'usr_'+crypto.randomUUID(),email,name:clean(body.name,120),role,status:'active'}
        const now = new Date().toISOString()
        await env.DB.prepare(`INSERT INTO admin_users (id,email,name,role,status,password_salt,password_hash,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
          .bind(created.id,email,created.name,role,'active',salt,hash,now,now).run()
        return json(created,201)
      }

      const target: any = id ? await env.DB.prepare('SELECT * FROM admin_users WHERE id=?').bind(id).first() : null
      if (!target) return json({error:'Staff member not found.'},404)

      if (method === 'PUT') {
        const body = await parseJson(request)
        if (protectedOwners.includes(String(target.email).toLowerCase())) {
          if (body.role && body.role !== 'owner') return json({error:'Protected owner cannot be demoted.'},400)
          if (body.status && body.status !== 'active') return json({error:'Protected owner cannot be suspended.'},400)
        }
        const name = body.name !== undefined ? clean(body.name,120) : target.name
        const role = ['owner','manager','editor','viewer'].includes(body.role) ? body.role : target.role
        const status = ['active','suspended'].includes(body.status) ? body.status : target.status
        let salt = target.password_salt, hash = target.password_hash
        if (body.password) { salt = randomHex(16); hash = await derivePassword(String(body.password),salt) }
        await env.DB.prepare('UPDATE admin_users SET name=?,role=?,status=?,password_salt=?,password_hash=?,updated_at=? WHERE id=?')
          .bind(name,role,status,salt,hash,new Date().toISOString(),id).run()
        return json({id,email:target.email,name,role,status})
      }

      if (method === 'DELETE') {
        if (protectedOwners.includes(String(target.email).toLowerCase())) return json({error:'Protected owner cannot be deleted.'},400)
        await env.DB.batch([
          env.DB.prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(id),
          env.DB.prepare('DELETE FROM admin_users WHERE id=?').bind(id),
        ])
        return json({ok:true})
      }
      return json({error:'Method not allowed.'},405)
    }

    const type = resourceMap[resource]
    if (!type) return json({error:'Unknown admin resource.'},404)

    if (method === 'GET' && !id) {
      const items = await sanity(env,false).fetch(`*[_type == $type] | order(coalesce(order,9999) asc,_updatedAt desc){...}`,{type})
      return json(items)
    }

    if (!canWrite(user.role)) return json({error:'This role is read-only.'},403)
    const client = sanity(env,true)

    if (method === 'POST' && !id) {
      const payload = cleanPayload(await parseJson(request))
      if (resource === 'settings') {
        const created = await client.createOrReplace({_id:'siteSettings',_type:'siteSettings',...payload})
        return json(created,201)
      }
      return json(await client.create({_type:type,...payload}),201)
    }

    if (!id) return json({error:'Document ID required.'},400)

    if (method === 'PUT') {
      const payload = cleanPayload(await parseJson(request))
      if (resource === 'settings') return json(await client.createOrReplace({_id:'siteSettings',_type:'siteSettings',...payload}))
      return json(await client.patch(id).set(payload).commit())
    }

    if (method === 'DELETE') {
      if (resource === 'settings') return json({error:'Website Settings cannot be deleted.'},400)
      await client.delete(id)
      return json({ok:true})
    }

    return json({error:'Method not allowed.'},405)
  } catch (error) {
    console.error(error)
    return json({error: error instanceof Error ? error.message : 'Server error'},500)
  }
}
