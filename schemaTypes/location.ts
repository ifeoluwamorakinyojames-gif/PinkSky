import {defineField, defineType} from 'sanity'

export const location = defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Location Name', type: 'string', validation: r => r.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name'}}),
    defineField({name: 'address', title: 'Address', type: 'text', rows: 3}),
    defineField({name: 'note', title: 'Branch Note', type: 'string'}),
    defineField({name: 'phone', title: 'Branch Phone', type: 'string'}),
    defineField({name: 'openingHours', title: 'Opening Hours', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'image', title: 'Branch Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'active', title: 'Active', type: 'boolean', initialValue: true}),
    defineField({name: 'order', title: 'Display Order', type: 'number', initialValue: 0}),
  ],
})
