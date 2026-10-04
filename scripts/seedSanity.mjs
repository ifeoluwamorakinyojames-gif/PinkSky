import fs from 'node:fs'
import path from 'node:path'
import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.VITE_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !token) {
  throw new Error('Add SANITY_STUDIO_PROJECT_ID and SANITY_API_WRITE_TOKEN to .env first.')
}

const client = createClient({projectId, dataset, apiVersion: '2026-10-03', useCdn: false, token})

const services = [
  ['teeth-whitening','Teeth Whitening','Smile brighter','A dedicated whitening experience with clear booking and treatment guidance.',['Consultation','Whitening session','Treatment guidance','Aftercare guidance'],'pinksky-teeth-whitening.jpg'],
  ['facials-skincare','Facials & Skincare','Glow with confidence','Facials, skin testing and personalised skincare support.',['Facials','Skin testing','Skin consultation','Skincare treatments'],'pinksky-facial-3.png'],
  ['hair-wig-studio','Hair & Wig Studio','Style. Treat. Transform.','Haircare, styling, extensions, dreadlocks and wig services.',['Hair styling','Hair treatments','Colouring','Extensions','Wig revamping','Dreadlocks'],'pinksky-haircare.jpg'],
  ['nails','Nails','Clean detail, beautiful finish','Manicure and pedicure care with a polished finish.',['Manicure','Pedicure','Nail care'],'pinksky-nails.jpg'],
  ['spa-massage','Spa & Massage','Pause. Restore. Renew.','Relaxation and wellness treatments designed for restoration.',['Massage','Spa treatments','Wellness care'],'pinksky-facial-5.png'],
  ['barbing-grooming','Barbing & Grooming','Sharp, clean, confident','Modern cuts and grooming for a polished finish.',['Haircut','Barbing','Grooming'],'pinksky-storefront.jpg'],
  ['makeup-brows','Makeup & Brows','Refined beauty artistry','Makeup and brow services for everyday and event beauty.',['Makeup','Brow enhancement'],'pinksky-facial-6.png'],
  ['microblading-brows','Microblading & Brows','Defined brows, refined finish','Microblading and brow enhancement designed for a natural, polished look.',['Consultation','Brow mapping','Microblading','Aftercare'],'pinksky-facial-4.png'],
  ['waxing','Waxing','Smooth, simple care','Professional waxing as part of a complete beauty routine.',['Waxing','Grooming care','Aftercare'],'pinksky-facial-2.png'],
]

async function uploadImage(fileName) {
  const filePath = path.resolve('public/resources', fileName)
  if (!fs.existsSync(filePath)) return null
  return client.assets.upload('image', fs.createReadStream(filePath), {filename: fileName})
}

console.log('Seeding Pink Sky Sanity content...')

await client.createOrReplace({
  _id: 'siteSettings',
  _type: 'siteSettings',
  businessName: 'Pink Sky Beauty & Wellness',
  tagline: 'Beauty from within.',
  phones: ['0810 343 9291','0814 828 7665','0815 884 3685'],
  whatsappNumber: '2348103439291',
  seoTitle: 'Pink Sky Beauty & Wellness | Warri & Effurun',
  metaDescription: 'Pink Sky Beauty & Wellness offers teeth whitening, facials, spa, massage, hair, nails, microblading, grooming and beauty products in Warri and Effurun.',
})

for (let i = 0; i < services.length; i++) {
  const [slug, name, eyebrow, short, items, fileName] = services[i]
  const asset = await uploadImage(fileName)
  await client.createOrReplace({
    _id: `service-${slug}`,
    _type: 'service',
    name,
    slug: {_type: 'slug', current: slug},
    eyebrow,
    short,
    description: short,
    items,
    heroImage: asset ? {_type: 'image', asset: {_type: 'reference', _ref: asset._id}} : undefined,
    published: true,
    order: i + 1,
  })
  console.log('Seeded service:', name)
}

const locations = [
  {
    _id: 'location-delta-mall-effurun',
    _type: 'location',
    name: 'Delta Mall, Effurun',
    slug: {_type: 'slug', current: 'delta-mall-effurun'},
    address: 'Shop 20/23, Delta Mall, Effurun, Delta State',
    note: 'Salon, beauty and retail services',
    active: true,
    order: 1,
  },
  {
    _id: 'location-airport-road-warri',
    _type: 'location',
    name: 'Airport Road, Warri',
    slug: {_type: 'slug', current: 'airport-road-warri'},
    address: 'Magnifique House, 67 Airport Road, near Union Bank, opposite Christ Embassy, Warri',
    note: 'Salon, spa and beauty services',
    active: true,
    order: 2,
  },
]
for (const location of locations) await client.createOrReplace(location)

const programs = [
  ['membership','Memberships','Membership','Make self-care easier to maintain with recurring beauty and wellness options.'],
  ['packages','Packages','Package','Combine selected beauty, spa or event-focused services into one convenient experience.'],
  ['gift-cards','Gift Cards','Gift Card','Give someone a Pink Sky experience for birthdays, celebrations or self-care.'],
]
for (let i = 0; i < programs.length; i++) {
  const [id, title, type, description] = programs[i]
  await client.createOrReplace({_id: `program-${id}`, _type: 'offerProgram', title, type, description, published: true, order: i + 1})
}

for (let i = 1; i <= 2; i++) {
  const asset = await uploadImage(`pinksky-banner-${i}.jpg`)
  if (asset) {
    await client.createOrReplace({
      _id: `banner-${i}`,
      _type: 'banner',
      title: `Pink Sky Banner ${i}`,
      image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
      alt: `Pink Sky promotion ${i}`,
      order: i,
      active: true,
    })
  }
}

console.log('Seed complete. Open Sanity Studio to review, edit and publish content.')
