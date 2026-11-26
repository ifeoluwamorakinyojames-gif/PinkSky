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
  imageAlt?: string
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
  const isDirectory = ['/', '/services', '/shop', '/blog', '/locations', '/programs', '/reviews'].includes(pathname)
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
  let initialContent = ''
  let structuredData: Record<string, unknown> | undefined
  const articleLinks = (items: {title?: string; slug?: string}[]) => items.filter(item => item.slug && /^[a-z0-9][a-z0-9-]*$/i.test(item.slug)).map(item => `<li><a href="/article/${escapeHtml(item.slug!)}">${escapeHtml(item.title || item.slug!)}</a></li>`).join('')

  if (pathname === '/') {
    page = {title: 'Pinksky Beauty & Wellness | Warri & Effurun', description: DEFAULT_DESCRIPTION, image: SITE + '/resources/pinksky-home-banner.jpg', imageAlt: 'Pinksky Beauty & Wellness in Warri and Effurun'}
  } else if (pathname === '/shop') {
    page = {title: 'Beauty Products in Warri & Effurun | Pinksky Beauty Shop', description: 'Shop skincare, beauty and wellness products at Pinksky Beauty & Wellness in Warri and Effurun.', image: SITE + '/resources/pinksky-home-banner.jpg', imageAlt: 'Pinksky Beauty & Wellness beauty shop'}
  } else if (pathname === '/locations') {
    page = {title: 'Our Locations in Warri & Effurun | Pinksky', description: 'Find Pinksky Beauty & Wellness branches and book beauty services in Warri and Effurun.'}
  } else if (pathname === '/programs') {
    page = {title: 'Beauty Packages & Programs | Pinksky', description: 'Explore beauty and wellness packages and programs at Pinksky Beauty & Wellness.'}
  } else if (pathname === '/reviews') {
    page = {title: 'Customer Reviews | Pinksky Beauty & Wellness', description: 'Read customer experiences and reviews for Pinksky Beauty & Wellness in Warri and Effurun.'}
  } else if (pathname === '/services') {
    page = {
      title: 'Beauty & Wellness Services in Warri | Pinksky',
      description: 'Explore Pinksky beauty and wellness services in Warri and Effurun, including facials, teeth whitening, nails, massage and grooming.',
    }
  } else if (pathname === '/blog') {
    page = {
      title: 'Beauty & Wellness Blog | Pinksky',
      description: 'Explore beauty, skincare, wellness and grooming articles from Pinksky Beauty & Wellness in Warri and Effurun.',
    }
    try {
      const client = createClient({projectId: context.env.SANITY_STUDIO_PROJECT_ID, dataset: context.env.SANITY_STUDIO_DATASET || 'production', apiVersion: '2025-02-19', useCdn: false})
      const items = await client.fetch<{title?: string; slug?: string}[]>(`*[_type == "article" && published == true && defined(slug.current)] | order(coalesce(publishedAt,_createdAt) desc){title,"slug":slug.current}`)
      initialContent = '<main><h1>Beauty &amp; Wellness Blog</h1><ul>' + articleLinks(items) + '</ul></main>'
    } catch (error) { console.error('Blog listing lookup failed', error) }
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
        useCdn: false,
      })

      if (kind === 'service') {
        const item = await client.fetch<{
          name?: string
          seoTitle?: string
          metaDescription?: string
          short?: string
          description?: string
          image?: string
          imageAlt?: string
        } | null>(
          `*[_type == "service" && published == true && slug.current == $slug][0]{
            name, seoTitle, metaDescription, short, description,
            "image": heroImage.asset->url, "imageAlt": heroImage.alt
          }`,
          {slug},
        )

        if (item) {
          page = {
            title: item.seoTitle || `${item.name} in Warri & Effurun | Pinksky`,
            description: item.metaDescription || item.short || item.description || DEFAULT_DESCRIPTION,
            image: item.image,
            imageAlt: item.imageAlt,
          }
        }
      } else if (kind === 'article') {
        const item = await client.fetch<{
          title?: string; seoTitle?: string; metaDescription?: string; summary?: string;
          image?: string; imageAlt?: string; authorName?: string; publishedAt?: string; updatedAt?: string;
          body?: { _type?: string; style?: string; children?: {text?: string}[]; url?: string; alt?: string }[];
        } | null>(
          `*[_type == "article" && published == true && slug.current == $slug][0]{
            title, seoTitle, metaDescription, summary, authorName, publishedAt, "updatedAt": _updatedAt,
            "image": featuredImage.asset->url, "imageAlt": featuredImage.alt,
            body[]{..., "url": asset->url}
          }`, {slug})
        if (!item) return new Response('Article not found', {status:404, headers:{'content-type':'text/plain; charset=utf-8','x-robots-tag':'noindex'}})
        pageType = 'article'
        page = {
          title: item.seoTitle || (item.title || 'Beauty article') + ' | Pinksky',
          description: item.metaDescription || item.summary || DEFAULT_DESCRIPTION,
          image: item.image, imageAlt: item.imageAlt,
        }
        const heading = escapeHtml(item.title || 'Beauty article')
        const body = (Array.isArray(item.body) ? item.body : []).map(block => {
          if (block._type === 'image' && block.url?.startsWith('https://cdn.sanity.io/')) return '<img src="' + escapeHtml(block.url) + '" alt="' + escapeHtml(block.alt || '') + '" loading="lazy">'
          if (block._type !== 'block') return ''
          const tag = ['h2','h3','h4','blockquote'].includes(block.style || '') ? block.style! : 'p'
          return '<' + tag + '>' + escapeHtml((block.children || []).map(child => child.text || '').join('')).replace(/\n/g,'<br>') + '</' + tag + '>'
        }).join('')
        const related = await client.fetch<{title?: string; slug?: string}[]>(`*[_type == "article" && published == true && defined(slug.current) && slug.current != $slug] | order(coalesce(publishedAt,_createdAt) desc)[0...8]{title,"slug":slug.current}`, {slug}).catch(() => [])
        initialContent = '<main><a href="/blog">Beauty guides</a><article><h1>' + heading + '</h1>' +
          (item.image?.startsWith('https://cdn.sanity.io/') ? '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.imageAlt || item.title || '') + '" style="max-width:100%;height:auto">' : '') +
          (item.authorName ? '<p>By ' + escapeHtml(item.authorName) + '</p>' : '') +
          (item.summary ? '<p>' + escapeHtml(item.summary) + '</p>' : '') + body +
          '</article><nav><h2>More beauty guides</h2><ul>' + articleLinks(related) + '</ul><a href="/services">Explore our services</a></nav></main>'
        structuredData = {'@context':'https://schema.org','@type':'BlogPosting',headline:item.title,description:page.description,url:SITE+pathname,mainEntityOfPage:SITE+pathname,image:item.image,datePublished:item.publishedAt,dateModified:item.updatedAt,author:item.authorName ? {'@type':'Person',name:item.authorName} : {'@type':'Organization',name:SITE_NAME},publisher:{'@type':'Organization',name:SITE_NAME,url:SITE}}
      } else if (kind === 'product') {
        const item = await client.fetch<{
          name?: string
          seoTitle?: string
          metaDescription?: string
          shortDescription?: string
          image?: string
          imageAlt?: string
        } | null>(
          `*[_type == "product" && published == true && slug.current == $slug][0]{
            name, seoTitle, metaDescription, shortDescription,
            "image": images[0].asset->url, "imageAlt": images[0].alt
          }`,
          {slug},
        )

        if (item) {
          page = {
            title: item.seoTitle || `${item.name} | Pinksky Beauty Shop`,
            description: item.metaDescription || item.shortDescription || DEFAULT_DESCRIPTION,
            image: item.image,
            imageAlt: item.imageAlt,
          }
        }
      }
    } catch (error) {
      console.error('Pinksky page metadata lookup failed', error)
      if (match?.[1] === 'article') return new Response('Article temporarily unavailable', {status:503, headers:{'retry-after':'300'}})
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
    tags.push(meta('og:image:secure_url', imageUrl))
    tags.push(meta('og:image:width', '1200'))
    if (page.imageAlt) tags.push(meta('og:image:alt', page.imageAlt))
    tags.push(meta('twitter:image', imageUrl, true))
    if (page.imageAlt) tags.push(meta('twitter:image:alt', page.imageAlt, true))
  }

  if (structuredData) tags.push('<script type="application/ld+json" id="pinksky-server-article-schema">' + JSON.stringify(structuredData).replace(/</g, '\\u003c') + '</script>')
  if (initialContent) html = html.replace('<div id="root"></div>', () => '<div id="root">' + initialContent + '</div>')

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