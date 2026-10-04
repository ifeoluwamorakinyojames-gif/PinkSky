import {defineArrayMember, defineField, defineType} from 'sanity'

export const article = defineType({
  name: 'article',
  title: 'Blog Article',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: r => r.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}, validation: r => r.required()}),
    defineField({
      name: 'intent',
      title: 'Search Intent',
      type: 'string',
      options: {
        list: [
          {title: 'Informational', value: 'Informational intent'},
          {title: 'Commercial Investigation', value: 'Commercial investigation'},
          {title: 'Local Intent', value: 'Local intent'},
        ],
        layout: 'radio',
      },
      initialValue: 'Informational intent',
    }),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 4}),
    defineField({
      name: 'body',
      title: 'Article Body',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({type: 'image', options: {hotspot: true}}),
      ],
    }),
    defineField({name: 'featuredImage', title: 'Featured Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'seoTitle', title: 'SEO Title', type: 'string'}),
    defineField({name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 3}),
    defineField({name: 'publishedAt', title: 'Published At', type: 'datetime'}),
    defineField({name: 'published', title: 'Published', type: 'boolean', initialValue: true}),
  ],
  preview: {select: {title: 'title', subtitle: 'intent', media: 'featuredImage'}},
})
