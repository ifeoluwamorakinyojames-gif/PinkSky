import {defineField, defineType} from 'sanity'

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Service Name', type: 'string', validation: r => r.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name'}, validation: r => r.required()}),
    defineField({name: 'eyebrow', title: 'Short Tagline', type: 'string'}),
    defineField({name: 'short', title: 'Short Description', type: 'text', rows: 3}),
    defineField({name: 'description', title: 'Full Description', type: 'text', rows: 6}),
    defineField({name: 'price', title: 'Price Text', type: 'string', description: 'Example: From ₦25,000 or Contact Pink Sky'}),
    defineField({name: 'duration', title: 'Duration', type: 'string', description: 'Example: 45–60 minutes'}),
    defineField({name: 'items', title: 'Service Items', type: 'array', of: [{type: 'string'}]}),
    defineField({
      name: 'heroImage',
      title: 'Main Service Image',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt Text'}],
    }),
    defineField({
      name: 'gallery',
      title: 'Service Gallery',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
    defineField({name: 'published', title: 'Published', type: 'boolean', initialValue: true}),
    defineField({name: 'order', title: 'Display Order', type: 'number', initialValue: 100}),
  ],
  preview: {
    select: {title: 'name', media: 'heroImage', published: 'published'},
    prepare({title, media, published}) {
      return {title, media, subtitle: published ? 'Published' : 'Draft / hidden'}
    },
  },
})
