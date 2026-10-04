import {defineField, defineType} from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Product Name', type: 'string', validation: r => r.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name'}, validation: r => r.required()}),
    defineField({name: 'brand', title: 'Brand', type: 'string', initialValue: 'Pink Sky'}),
    defineField({name: 'category', title: 'Category', type: 'string'}),
    defineField({name: 'regularPrice', title: 'Regular Price (NGN)', type: 'number', validation: r => r.min(0)}),
    defineField({name: 'salePrice', title: 'Sale Price (NGN)', type: 'number', validation: r => r.min(0)}),
    defineField({name: 'sku', title: 'SKU', type: 'string'}),
    defineField({name: 'gtin', title: 'GTIN / Barcode', type: 'string'}),
    defineField({name: 'stockQuantity', title: 'Stock Quantity', type: 'number', validation: r => r.integer().min(0), initialValue: 0}),
    defineField({name: 'size', title: 'Size / Volume', type: 'string'}),
    defineField({name: 'variants', title: 'Variants', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'shortDescription', title: 'Short Description', type: 'text', rows: 3}),
    defineField({name: 'description', title: 'Full Description', type: 'text', rows: 8}),
    defineField({name: 'benefits', title: 'Benefits', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'ingredients', title: 'Ingredients / Specifications', type: 'text', rows: 5}),
    defineField({name: 'howToUse', title: 'How to Use', type: 'text', rows: 5}),
    defineField({
      name: 'images',
      title: 'Product Images',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
      validation: r => r.max(8),
    }),
    defineField({name: 'seoTitle', title: 'SEO Title', type: 'string'}),
    defineField({name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 3}),
    defineField({name: 'featured', title: 'Featured Product', type: 'boolean', initialValue: false}),
    defineField({name: 'published', title: 'Published', type: 'boolean', initialValue: false}),
    defineField({name: 'order', title: 'Display Order', type: 'number', initialValue: 100}),
  ],
  preview: {
    select: {title: 'name', price: 'regularPrice', media: 'images.0', published: 'published'},
    prepare({title, price, media, published}) {
      return {title, media, subtitle: `${published ? 'Published' : 'Draft'} • ₦${Number(price || 0).toLocaleString()}`}
    },
  },
})
