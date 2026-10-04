import {defineField, defineType} from 'sanity'

export const booking = defineType({
  name: 'booking',
  title: 'Booking',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Customer Name', type: 'string', readOnly: true}),
    defineField({name: 'phone', title: 'Phone', type: 'string', readOnly: true}),
    defineField({name: 'email', title: 'Email', type: 'string', readOnly: true}),
    defineField({name: 'service', title: 'Service', type: 'string', readOnly: true}),
    defineField({name: 'location', title: 'Preferred Location', type: 'string', readOnly: true}),
    defineField({name: 'preferredDate', title: 'Preferred Date', type: 'date', readOnly: true}),
    defineField({name: 'preferredTime', title: 'Preferred Time', type: 'string', readOnly: true}),
    defineField({name: 'notes', title: 'Customer Notes', type: 'text', rows: 4, readOnly: true}),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'New Request', value: 'requested'},
          {title: 'Contacted', value: 'contacted'},
          {title: 'Confirmed', value: 'confirmed'},
          {title: 'Completed', value: 'completed'},
          {title: 'Cancelled', value: 'cancelled'},
        ],
        layout: 'radio',
      },
      initialValue: 'requested',
    }),
    defineField({name: 'internalNotes', title: 'Internal Notes', type: 'text', rows: 4}),
    defineField({name: 'createdAt', title: 'Created At', type: 'datetime', readOnly: true}),
  ],
  preview: {
    select: {title: 'name', service: 'service', status: 'status', date: 'preferredDate'},
    prepare({title, service, status, date}) {
      return {title: title || 'Booking', subtitle: `${service || ''} • ${date || ''} • ${status || 'requested'}`}
    },
  },
})
