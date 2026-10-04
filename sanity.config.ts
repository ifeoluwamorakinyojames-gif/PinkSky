import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || ''
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineConfig({
  name: 'pink-sky',
  title: 'Pink Sky Beauty & Wellness',
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Pink Sky Admin')
          .items([
            S.listItem()
              .title('Website Settings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.divider(),
            S.documentTypeListItem('banner').title('Rollover Banners'),
            S.documentTypeListItem('service').title('Services'),
            S.documentTypeListItem('article').title('Blog'),
            S.documentTypeListItem('product').title('Products'),
            S.documentTypeListItem('booking').title('Bookings'),
            S.documentTypeListItem('review').title('Reviews'),
            S.documentTypeListItem('location').title('Locations'),
            S.documentTypeListItem('offerProgram').title('Memberships, Packages & Gift Cards'),
          ]),
    }),
  ],
  schema: {types: schemaTypes},
})
