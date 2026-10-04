import {defineField, defineType} from 'sanity'

export const offerProgram = defineType({
  name: 'offerProgram',
  title: 'Membership / Package / Gift Card',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: r => r.required()}),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {list: ['Membership', 'Package', 'Gift Card'], layout: 'radio'},
      validation: r => r.required(),
    }),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 5}),
    defineField({name: 'priceText', title: 'Price Text', type: 'string'}),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'published', title: 'Published', type: 'boolean', initialValue: true}),
    defineField({name: 'order', title: 'Display Order', type: 'number', initialValue: 100}),
  ],
})
