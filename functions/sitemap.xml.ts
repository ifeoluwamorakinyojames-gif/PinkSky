import {createClient} from '@sanity/client'

type Env = {
  SANITY_STUDIO_PROJECT_ID: string
  SANITY_STUDIO_DATASET?: string
}

type Context = {env: Env; request: Request}
type Page = {slug?: string; updatedAt?: string}

const origin = 'https://pinkskybeauty.com'
const fixedPaths = ['/', '/services', '/shop', '/blog', '/locations', '/programs']

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function validSlug(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/i.test(value) && value.length <= 160
}

function xmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': status === 200 ? 'public, max-age=300, s-maxage=900' : 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

export const onRequestGet = async ({env}: Context): Promise<Response> => {
  const projectId = String(env.SANITY_STUDIO_PROJECT_ID || '').trim()
  const dataset = String(env.SANITY_STUDIO_DATASET || 'production').trim()
  if (!/^[a-z0-9-]+$/i.test(projectId) || !/^[a-z0-9_-]+$/i.test(dataset)) {
    return xmlResponse('<error>Site configuration unavailable</error>', 503)
  }

  try {
    const client = createClient({projectId, dataset, apiVersion: '2026-10-04', useCdn: false})
    const [services, articles, products] = await Promise.all([
      client.fetch<Page[]>(`*[_type == "service" && published == true && defined(slug.current)]{
        "slug": slug.current, "updatedAt": _updatedAt
      }`),
      client.fetch<Page[]>(`*[_type == "article" && published == true && defined(slug.current)]{
        "slug": slug.current, "updatedAt": _updatedAt
      }`),
      client.fetch<Page[]>(`*[_type == "product" && published == true && defined(slug.current)]{
        "slug": slug.current, "updatedAt": _updatedAt
      }`),
    ])

    const pages = new Map<string, string | undefined>()
    fixedPaths.forEach(path => pages.set(path, undefined))
    for (const [prefix, records] of [
      ['/service/', services], ['/article/', articles], ['/product/', products],
    ] as const) {
      for (const record of records) {
        if (!validSlug(record.slug)) continue
        pages.set(prefix + record.slug, record.updatedAt)
      }
    }

    const entries = [...pages.entries()].map(([path, updatedAt]) => {
      const loc = xmlEscape(origin + path)
      const date = updatedAt && !Number.isNaN(Date.parse(updatedAt))
        ? `<lastmod>${new Date(updatedAt).toISOString().slice(0, 10)}</lastmod>` : ''
      return `<url><loc>${loc}</loc>${date}</url>`
    }).join('\n  ')

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${entries}\n</urlset>\n`)
  } catch (error) {
    console.error('Pinksky sitemap generation failed', error)
    return xmlResponse('<error>Sitemap temporarily unavailable</error>', 503)
  }
}
