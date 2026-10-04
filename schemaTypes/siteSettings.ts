import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Website Settings',
  type: 'document',
  fields: [
    defineField({name: 'businessName', title: 'Business Name', type: 'string', initialValue: 'Pink Sky Beauty & Wellness'}),
    defineField({name: 'tagline', title: 'Tagline', type: 'string', initialValue: 'Beauty from within.'}),
    defineField({name: 'phones', title: 'Phone Numbers', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'whatsappNumber', title: 'WhatsApp Number', type: 'string', description: 'International format without +, e.g. 2348103439291'}),
    defineField({name: 'email', title: 'Public Email', type: 'string'}),
    defineField({name: 'instagram', title: 'Instagram URL', type: 'url'}),
    defineField({name: 'facebook', title: 'Facebook URL', type: 'url'}),
    defineField({name: 'seoTitle', title: 'Default SEO Title', type: 'string'}),
    defineField({name: 'metaDescription', title: 'Default Meta Description', type: 'text', rows: 3}),
    defineField({name: 'logo', title: 'Logo', type: 'image'}),
  ],
})
