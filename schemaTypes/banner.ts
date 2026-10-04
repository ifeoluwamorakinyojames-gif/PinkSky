import {defineField, defineType} from 'sanity'

export const banner = defineType({
  name: 'banner',
  title: 'Rollover Banner',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Campaign Title', type: 'string', validation: r => r.required()}),
    defineField({
      name: 'image',
      title: 'Banner Image',
      type: 'image',
      description: 'Recommended size: 1920 × 700 px. Compress before upload for fast loading.',
      options: {hotspot: true},
      validation: r => r.required(),
    }),
    defineField({name: 'alt', title: 'Image Alt Text', type: 'string', validation: r => r.required()}),
    defineField({name: 'link', title: 'Click-through Link', type: 'string', description: 'Example: #/service/teeth-whitening'}),
    defineField({name: 'order', title: 'Display Order', type: 'number', initialValue: 0}),
    defineField({name: 'active', title: 'Active', type: 'boolean', initialValue: true}),
    defineField({name: 'startAt', title: 'Start Date/Time', type: 'datetime'}),
    defineField({name: 'endAt', title: 'End Date/Time', type: 'datetime'}),
  ],
  preview: {select: {title: 'title', media: 'image', active: 'active'}},
})
