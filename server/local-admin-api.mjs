import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import {createClient} from '@sanity/client'

const PORT = Number(process.env.PINKSKY_API_PORT || 8788)
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.VITE_SANITY_DATASET || 'production'
const writeToken = process.env.SANITY_API_WRITE_TOKEN || ''
const sessionSecret = process.env.PINKSKY_SESSION_SECRET || ''

const protectedOwnerEmails = (process.env.PINKSKY_OWNER_EMAILS || 'ifeoluwamorakinyojames@gmail.com,pinkskyccnt@gmail.com')
  .split(',')
  .map(v => v.trim().toLowerCase())
  .filter(Boolean)

const ownerSeeds = [
  {
    email: protectedOwnerEmails[0],
    name: process.env.PINKSKY_OWNER_NAME_1 || 'Ifeoluwa Morakinyo James',
    password: process.env.PINKSKY_OWNER_PASSWORD_1 || '',
  },
  {
    email: protectedOwnerEmails[1],
    name: process.env.PINKSKY_OWNER_NAME_2 || 'Pink Sky Owner',
    password: process.env.PINKSKY_OWNER_PASSWORD_2 || '',
  },
].filter(x => x.email)

if (!projectId) throw new Error('Missing Sanity project ID in .env')
if (!sessionSecret || sessionSecret.startsWith('change-this')) {
  throw new Error('Set PINKSKY_SESSION_SECRET in .env to a long random value')
}

const readClient = createClient({
  projectId,
  dataset,
  apiVersion: '2026-10-04',
  useCdn: false,
})

const writeClient = writeToken
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2026-10-04',
      useCdn: false,
      token: writeToken,
    })
  : null

const dataDir = path.resolve('.local-data')
const storeFile = path.join(dataDir, 'admin-store.json')
await fs.mkdir(dataDir, {recursive: true})

async function loadStore() {
  try {
    return JSON.parse(await fs.readFile(storeFile, 'utf8'))
  } catch {
    return {users: [], sessions: []}
  }
}
async function saveStore(store) {
  await fs.writeFile(storeFile, JSON.stringify(store, null, 2), 'utf8')
}

function hashPassword(password, saltHex) {
  return crypto.pbkdf2Sync(password, Buffer.from(saltHex, 'hex'), 210000, 32, 'sha256').toString('hex')
}
function createPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  return {salt, hash: hashPassword(password, salt)}
}
function tokenHash(token) {
  return crypto.createHmac('sha256', sessionSecret).update(token).digest('hex')
}
function safeUser(user) {
  return {id: user.id, email: user.email, name: user.name, role: user.role}
}
function parseCookies(req) {
  const out = {}
  for (const part of (req.headers.cookie || '').split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key) out[key] = decodeURIComponent(rest.join('='))
  }
  return out
}
function send(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {'content-type': 'application/json; charset=utf-8', ...extraHeaders})
  res.end(JSON.stringify(body))
}
async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
}
async function getSessionUser(req) {
  const raw = parseCookies(req).pinksky_admin
  if (!raw) return null
  const store = await loadStore()
  const session = store.sessions.find(s => s.tokenHash === tokenHash(raw) && s.expiresAt > Date.now())
  if (!session) return null
  return store.users.find(u => u.id === session.userId && u.status !== 'suspended') || null
}
function canWrite(role) {
  return ['owner', 'manager', 'editor'].includes(role)
}
function isProtectedOwnerEmail(email) {
  return protectedOwnerEmails.includes(String(email || '').trim().toLowerCase())
}
function cleanPayload(payload) {
  const out = {...payload}
  for (const key of ['_id', '_rev', '_createdAt', '_updatedAt']) delete out[key]
  if (typeof out.slug === 'string') out.slug = {_type: 'slug', current: out.slug}
  return out
}

async function bootstrapOwners() {
  const store = await loadStore()
  let changed = false

  for (const owner of ownerSeeds) {
    if (!owner.email) continue
    let existing = store.users.find(u => u.email === owner.email)

    if (!existing) {
      if (!owner.password || owner.password.length < 8 || owner.password.startsWith('change-this')) {
        console.warn(`Owner ${owner.email} not created yet: set its password in .env and restart the API.`)
        continue
      }
      const {salt, hash} = createPassword(owner.password)
      existing = {
        id: 'usr_' + crypto.randomUUID(),
        email: owner.email,
        name: owner.name,
        role: 'owner',
        status: 'active',
        passwordSalt: salt,
        passwordHash: hash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      store.users.push(existing)
      changed = true
      console.log('Created protected Pink Sky owner:', owner.email)
    } else {
      let localChange = false
      if (existing.role !== 'owner') { existing.role = 'owner'; localChange = true }
      if (existing.status !== 'active') { existing.status = 'active'; localChange = true }
      if (localChange) {
        existing.updatedAt = new Date().toISOString()
        changed = true
      }
    }
  }

  if (changed) await saveStore(store)
}

await bootstrapOwners()

const resourceMap = {
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

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || `localhost:${PORT}`}`)

    if (url.pathname === '/api/admin/session' && req.method === 'GET') {
      const user = await getSessionUser(req)
      return send(res, 200, user ? {authenticated: true, user: safeUser(user)} : {authenticated: false})
    }

    if (url.pathname === '/api/admin/login' && req.method === 'POST') {
      const body = await readBody(req)
      const email = String(body.email || '').trim().toLowerCase()
      const password = String(body.password || '')

      const store = await loadStore()
      const user = store.users.find(u => u.email === email && u.status !== 'suspended')

      if (!user || !password || hashPassword(password, user.passwordSalt) !== user.passwordHash) {
        return send(res, 401, {error: 'Incorrect email or password.'})
      }

      const rawToken = crypto.randomBytes(32).toString('base64url')
      store.sessions = store.sessions.filter(s => s.userId !== user.id)
      store.sessions.push({
        tokenHash: tokenHash(rawToken),
        userId: user.id,
        expiresAt: Date.now() + 12 * 60 * 60 * 1000,
      })
      await saveStore(store)

      return send(
        res,
        200,
        {user: safeUser(user)},
        {'set-cookie': `pinksky_admin=${encodeURIComponent(rawToken)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`}
      )
    }

    if (url.pathname === '/api/admin/logout' && req.method === 'POST') {
      const raw = parseCookies(req).pinksky_admin
      const store = await loadStore()
      if (raw) {
        const hashed = tokenHash(raw)
        store.sessions = store.sessions.filter(s => s.tokenHash !== hashed)
        await saveStore(store)
      }
      return send(
        res,
        200,
        {ok: true},
        {'set-cookie': 'pinksky_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}
      )
    }


    if (url.pathname === '/api/admin/uploads' && req.method === 'POST') {
      const user = await getSessionUser(req)
      if (!user) return send(res, 401, {error: 'Please sign in to Pink Sky Admin.'})
      if (!canWrite(user.role)) return send(res, 403, {error: 'This role cannot upload images.'})
      if (!writeClient) return send(res, 503, {error: 'SANITY_API_WRITE_TOKEN is not configured on the backend yet.'})
      const payload = await readBody(req)
      const data = String(payload.data || '')
      const contentType = String(payload.contentType || 'image/jpeg')
      const filename = String(payload.filename || 'pinksky-image.jpg').replace(/[^\w.\-]+/g, '-')
      if (!data) return send(res, 400, {error: 'Image data is required.'})
      const buffer = Buffer.from(data, 'base64')
      if (buffer.length > 8 * 1024 * 1024) return send(res, 413, {error: 'Image must be under 8 MB.'})
      const asset = await writeClient.assets.upload('image', buffer, {filename, contentType})
      return send(res, 201, {
        assetId: asset._id,
        url: asset.url,
        image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
      })
    }

    if (url.pathname.startsWith('/api/admin/')) {
      const user = await getSessionUser(req)
      if (!user) return send(res, 401, {error: 'Please sign in to Pink Sky Admin.'})

      const parts = url.pathname.split('/').filter(Boolean)
      const resource = parts[2]
      const id = parts[3]

      if (resource === 'users') {
        if (user.role !== 'owner') return send(res, 403, {error: 'Owner access required.'})

        const store = await loadStore()

        if (req.method === 'GET' && !id) {
          return send(res, 200, store.users.map(safeUser))
        }

        if (req.method === 'POST' && !id) {
          const body = await readBody(req)
          const email = String(body.email || '').trim().toLowerCase()
          const password = String(body.password || '')
          const role = String(body.role || 'viewer')

          if (!email || password.length < 8 || !['owner', 'manager', 'editor', 'viewer'].includes(role)) {
            return send(res, 400, {error: 'Valid email, password (8+ characters), and role are required.'})
          }
          if (store.users.some(u => u.email === email)) {
            return send(res, 409, {error: 'This email already exists.'})
          }

          const {salt, hash} = createPassword(password)
          const created = {
            id: 'usr_' + crypto.randomUUID(),
            email,
            name: String(body.name || ''),
            role,
            status: 'active',
            passwordSalt: salt,
            passwordHash: hash,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          store.users.push(created)
          await saveStore(store)
          return send(res, 201, safeUser(created))
        }

        if (!id) return send(res, 400, {error: 'User ID required.'})

        const target = store.users.find(u => u.id === id)
        if (!target) return send(res, 404, {error: 'Staff member not found.'})

        if (req.method === 'PUT') {
          const body = await readBody(req)

          if (isProtectedOwnerEmail(target.email)) {
            if (body.role && body.role !== 'owner') {
              return send(res, 400, {error: 'Protected owner cannot be demoted.'})
            }
            if (body.status && body.status !== 'active') {
              return send(res, 400, {error: 'Protected owner cannot be suspended.'})
            }
          }

          if (body.name !== undefined) target.name = String(body.name || '')
          if (body.role && ['owner', 'manager', 'editor', 'viewer'].includes(body.role)) target.role = body.role
          if (body.status && ['active', 'suspended'].includes(body.status)) target.status = body.status
          if (body.password) {
            const {salt, hash} = createPassword(String(body.password))
            target.passwordSalt = salt
            target.passwordHash = hash
          }
          target.updatedAt = new Date().toISOString()
          await saveStore(store)
          return send(res, 200, safeUser(target))
        }

        if (req.method === 'DELETE') {
          if (isProtectedOwnerEmail(target.email)) {
            return send(res, 400, {error: 'Protected owner cannot be deleted.'})
          }
          store.users = store.users.filter(u => u.id !== id)
          store.sessions = store.sessions.filter(s => s.userId !== id)
          await saveStore(store)
          return send(res, 200, {ok: true})
        }

        return send(res, 405, {error: 'Method not allowed.'})
      }

      const type = resourceMap[resource]
      if (!type) return send(res, 404, {error: 'Unknown admin resource.'})

      if (req.method === 'GET' && !id) {
        const items = await readClient.fetch(
          `*[_type == $type] | order(coalesce(order, 9999) asc, _updatedAt desc){...}`,
          {type}
        )
        return send(res, 200, items)
      }

      if (!canWrite(user.role)) {
        return send(res, 403, {error: 'This role is read-only.'})
      }
      if (!writeClient) {
        return send(res, 503, {error: 'SANITY_API_WRITE_TOKEN is not configured on the backend yet.'})
      }

      if (req.method === 'POST' && !id) {
        const payload = cleanPayload(await readBody(req))
        if (resource === 'settings') {
          const created = await writeClient.createOrReplace({_id: 'siteSettings', _type: 'siteSettings', ...payload})
          return send(res, 201, created)
        }
        const created = await writeClient.create({_type: type, ...payload})
        return send(res, 201, created)
      }

      if (!id) return send(res, 400, {error: 'Document ID required.'})

      if (req.method === 'PUT') {
        const payload = cleanPayload(await readBody(req))
        if (resource === 'settings') {
          const updated = await writeClient.createOrReplace({_id: 'siteSettings', _type: 'siteSettings', ...payload})
          return send(res, 200, updated)
        }
        const updated = await writeClient.patch(id).set(payload).commit()
        return send(res, 200, updated)
      }

      if (req.method === 'DELETE') {
        if (resource === 'settings') return send(res, 400, {error: 'Website Settings cannot be deleted.'})
        await writeClient.delete(id)
        return send(res, 200, {ok: true})
      }

      return send(res, 405, {error: 'Method not allowed.'})
    }


    if (url.pathname === '/api/bookings' && req.method === 'POST') {
      if (!writeClient) return send(res, 503, {error: 'Booking backend is not configured yet.'})
      const payload = await readBody(req)
      for (const key of ['name','phone','service','location','preferredDate','preferredTime']) {
        if (!String(payload[key] || '').trim()) return send(res, 400, {error: `Missing ${key}`})
      }
      const created = await writeClient.create({
        _type: 'booking',
        name: String(payload.name).trim().slice(0,120),
        phone: String(payload.phone).trim().slice(0,60),
        email: String(payload.email || '').trim().slice(0,180),
        service: String(payload.service).trim().slice(0,160),
        location: String(payload.location).trim().slice(0,200),
        preferredDate: String(payload.preferredDate).trim().slice(0,30),
        preferredTime: String(payload.preferredTime).trim().slice(0,40),
        notes: String(payload.notes || '').trim().slice(0,1500),
        status: 'requested',
        createdAt: new Date().toISOString(),
      })
      return send(res, 201, {id: created._id, status: 'requested'})
    }

    return send(res, 404, {error: 'Not found'})
  } catch (error) {
    console.error(error)
    return send(res, 500, {error: error instanceof Error ? error.message : 'Server error'})
  }
})

server.listen(PORT, () => {
  console.log(`Pink Sky admin API: http://localhost:${PORT}`)
  console.log(`Sanity project: ${projectId} / ${dataset}`)
  console.log(`Protected owners: ${protectedOwnerEmails.join(', ')}`)
  console.log(`Sanity writes: ${writeClient ? 'ENABLED' : 'DISABLED until SANITY_API_WRITE_TOKEN is added'}`)
})
