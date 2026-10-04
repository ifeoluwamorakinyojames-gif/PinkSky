import {defineField, defineType} from 'sanity'

export const review = defineType({
  name: 'review',
  title: 'Review',
  type: 'document',
  fields: [
    defineField({name: 'customerName', title: 'Customer Name', type: 'string', validation: r => r.required()}),
    defineField({name: 'text', title: 'Review', type: 'text', rows: 4, validation: r => r.required()}),
    defineField({name: 'rating', title: 'Rating', type: 'number', validation: r => r.min(1).max(5).integer()}),
    defineField({name: 'source', title: 'Source', type: 'string', description: 'Example: Google, Instagram, in-store'}),
    defineField({name: 'published', title: 'Published', type: 'boolean', initialValue: false}),
    defineField({name: 'order', title: 'Display Order', type: 'number', initialValue: 100}),
  ],
})
