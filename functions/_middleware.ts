import {createClient} from '@sanity/client'

interface Env {
  SANITY_STUDIO_PROJECT_ID: string
  SANITY_STUDIO_DATASET?: string
}

interface Context {
  request: Request
  env: Env
  next: () => Promise<Response>
}

type PageData = {
  title?: string
  description?: string
  image?: string
}

const SITE = 'https://pinkskybeauty.com'
const SITE_NAME = 'Pinksky Beauty & Wellness'
const DEFAULT_DESCRIPTION =
  'Beauty, wellness, teeth whitening, facials, nails and spa services in Warri and Effurun, Delta State.'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[char] || char
  })
}

function meta(property: string, value: string, isName = false): string {
  const attribute = isName ? 'name' : 'property'
  return `<meta ${attribute}="${escapeHtml(property)}" content="${escapeHtml(value)}" />`
}

export async function onRequest(context: Context): Promise<Response> {
  const url = new URL(context.request.url)
  const pathname = url.pathname.replace(/\/+$/, '') || '/'

  // Do not interfere with APIs, admin, static assets or other routes.
  const isDirectory = pathname === '/services' || pathname === '/blog'
  const match = pathname.match(/^\/(service|article|product)\/([^/]+)$/)

  if (!isDirectory && !match) {
    return context.next()
  }

  const response = await context.next()
  const contentType = response.headers.get('content-type') || ''

  if (!response.ok || !contentType.includes('text/html')) {
    return response
  }

  let page: PageData | null = null
  let pageType = 'website'

  if (pathname === '/services') {
    page = {
      title: 'Beauty & Wellness Services in Warri | Pinksky',
      description: 'Explore Pinksky beauty and wellness services in Warri and Effurun, including facials, teeth whitening, nails, massage and grooming.',
    }
  } else if (pathname === '/blog') {
    page = {
      title: 'Beauty & Wellness Blog | Pinksky',
      description: 'Explore beauty, skincare, wellness and grooming articles from Pinksky Beauty & Wellness in Warri and Effurun.',
    }
  } else if (match) {
    const kind = match[1]
    let slug: string

    try {
      slug = decodeURIComponent(match[2])
    } catch {
      return response
    }

    const projectId = context.env.SANITY_STUDIO_PROJECT_ID
    const dataset = context.env.SANITY_STUDIO_DATASET || 'production'

    if (!projectId || !/^[a-z0-9-]+$/i.test(projectId)) {
      return response
    }

    try {
      const client = createClient({
        projectId,
        dataset,
        apiVersion: '2025-02-19',
        useCdn: true,
      })

      if (kind === 'service') {
        const item = await client.fetch<{
          name?: string
          seoTitle?: string
          metaDescription?: string
          short?: string
          description?: string
          image?: string
        } | null>(
          `*[_type == "service" && published == true && slug.current == $slug][0]{
            name, seoTitle, metaDescription, short, description,
            "image": heroImage.asset->url
          }`,
          {slug},
        )

        if (item) {
          page = {
            title: item.seoTitle || `${item.name} in Warri & Effurun | Pinksky`,
            description: item.metaDescription || item.short || item.description || DEFAULT_DESCRIPTION,
            image: item.image,
          }
        }
      } else if (kind === 'article') {
        const item = await client.fetch<{
          title?: string
          seoTitle?: string
          metaDescription?: string
          summary?: string
          image?: string
        } | null>(
          `*[_type == "article" && published == true && slug.current == $slug][0]{
            title, seoTitle, metaDescription, summary,
            "image": featuredImage.asset->url
          }`,
          {slug},
        )

        if (item) {
          pageType = 'article'
          page = {
            title: `${item.seoTitle || item.title} | Pinksky`,
            description: item.metaDescription || item.summary || DEFAULT_DESCRIPTION,
            image: item.image,
          }
        }
      } else if (kind === 'product') {
        const item = await client.fetch<{
          name?: string
          seoTitle?: string
          metaDescription?: string
          shortDescription?: string
          image?: string
        } | null>(
          `*[_type == "product" && published == true && slug.current == $slug][0]{
            name, seoTitle, metaDescription, shortDescription,
            "image": images[0].asset->url
          }`,
          {slug},
        )

        if (item) {
          page = {
            title: item.seoTitle || `${item.name} | Pinksky Beauty Shop`,
            description: item.metaDescription || item.shortDescription || DEFAULT_DESCRIPTION,
            image: item.image,
          }
        }
      }
    } catch (error) {
      console.error('Pinksky page metadata lookup failed', error)
      return response
    }
  }

  // Leave unknown/unpublished records to existing React handling.
  if (!page) return response

  const title = page.title || SITE_NAME
  const description = page.description || DEFAULT_DESCRIPTION
  const canonical = SITE + pathname

  let html = await response.text()

  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    meta('description', description, true),
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    meta('og:title', title),
    meta('og:description', description),
    meta('og:url', canonical),
    meta('og:type', pageType),
    meta('og:site_name', SITE_NAME),
    meta('twitter:card', 'summary_large_image', true),
    meta('twitter:title', title, true),
    meta('twitter:description', description, true),
  ]

  if (page.image) {
    const imageUrl = page.image.startsWith('https://cdn.sanity.io/')
      ? page.image.split('?')[0] + '?w=1200&fm=jpg&q=80'
      : page.image

    tags.push(meta('og:image', imageUrl))
    tags.push(meta('twitter:image', imageUrl, true))
  }

  // Replace default template metadata to prevent duplicate tags.
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, '')
  html = html.replace(/<meta\s+name="description"[^>]*>/i, '')
  html = html.replace(/<\/head>/i, tags.join('\n') + '\n</head>')

  const headers = new Headers(response.headers)
  headers.delete('content-length')
  headers.delete('etag')
  headers.set('content-type', 'text/html; charset=utf-8')

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}