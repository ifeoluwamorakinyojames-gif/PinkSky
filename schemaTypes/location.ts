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
    defineField({
      name: 'bookingBranchId',
      title: 'Online Booking Branch',
      type: 'string',
      description: 'Assign this location to the correct booking destination.',
      options: {list: [
        {title: 'Airport Road — Warri', value: 'airport-road'},
        {title: 'ShopMall — Delta Mall, Effurun', value: 'delta-mall'},
      ]},
    }),
    defineField({
      name: 'whatsappNumbers',
      title: 'Branch WhatsApp Numbers',
      type: 'array',
      description: 'Each number has its own WhatsApp button in the booking chooser. Use Nigerian numbers such as 08129147351.',
      of: [{type: 'string'}],
      validation: rule => rule.max(4).custom(numbers => {
        if (!numbers) return true
        return numbers.every(number => /^0[789][01][0-9]{8}$|^234[789][01][0-9]{8}$/.test(String(number).replace(/[^0-9]/g,'')))
          ? true : 'Enter a valid Nigerian mobile number (11 digits or 234 followed by 10 digits).'
      }),
    }),
    defineField({name: 'openingHours', title: 'Opening Hours', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'image', title: 'Branch Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'active', title: 'Active', type: 'boolean', initialValue: true}),
    defineField({name: 'order', title: 'Display Order', type: 'number', initialValue: 0}),
  ],
})
