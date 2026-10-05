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
  for (const key of ['_id','_rev','_createdAt','_updatedAt','id']) delete out[key]
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
  try { return await request.json<any>() } catch { return {} }
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

  const [
    services,
    banners,
    articles,
    products,
    locations,
    settings,
    programs,
    reviews
  ] = await Promise.all([
    client.fetch(`*[_type == "service" && published == true] | order(order asc, name asc) {
      _id, name, "slug": slug.current, eyebrow, short, description,
      price, duration, items, "image": heroImage.asset->url,
      "gallery": gallery[].asset->url
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
        seoTitle, metaDescription, publishedAt,
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

    client.fetch(`*[_type == "location" && active == true]
      | order(order asc, name asc) {
        _id, name, "slug": slug.current, address, note, phone,
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
        _id, customerName, text, rating, source
      }`)
  ])

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

    if (path === '/api/bookings' && method === 'POST') {
      const body = await parseJson(request)
      const required = ['name','phone','service','location','preferredDate','preferredTime']
      for (const key of required) if (!clean(body[key])) return json({error: `Missing ${key}`}, 400)
      const client = sanity(env, true)
      const doc = await client.create({
        _type: 'booking',
        name: clean(body.name,120), phone: clean(body.phone,60), email: clean(body.email,180),
        service: clean(body.service,160), location: clean(body.location,200),
        preferredDate: clean(body.preferredDate,30), preferredTime: clean(body.preferredTime,40),
        notes: clean(body.notes,1500), status: 'requested', createdAt: new Date().toISOString(),
      })
      return json({id: doc._id, status: 'requested'}, 201)
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

    if (path === '/api/admin/uploads' && method === 'POST') {
      if (!canWrite(user.role)) return json({error:'This role cannot upload images.'},403)
      const body = await parseJson(request)
      const data = String(body.data || '')
      if (!data) return json({error:'Image data is required.'},400)
      const binary = Uint8Array.from(atob(data), c => c.charCodeAt(0))
      if (binary.byteLength > 8*1024*1024) return json({error:'Image must be under 8 MB.'},413)
      const contentType = clean(body.contentType,80) || 'image/jpeg'
      const asset = await sanity(env,true).assets.upload('image', new Blob([binary], {type: contentType}), {
        filename: clean(body.filename,180) || 'pinksky-image.jpg',
        contentType,
      })
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
