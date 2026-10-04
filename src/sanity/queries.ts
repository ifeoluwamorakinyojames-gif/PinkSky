export const SERVICES_QUERY = `*[_type == "service" && published == true] | order(order asc, name asc) {
  _id,
  name,
  "slug": slug.current,
  eyebrow,
  short,
  description,
  price,
  duration,
  items,
  "image": heroImage.asset->url,
  "gallery": gallery[].asset->url
}`

export const BANNERS_QUERY = `*[
  _type == "banner" &&
  active == true &&
  (!defined(startAt) || startAt <= now()) &&
  (!defined(endAt) || endAt >= now())
] | order(order asc, _createdAt desc) {
  _id,
  title,
  alt,
  link,
  order,
  active,
  startAt,
  endAt,
  "src": image.asset->url,
  "image": image.asset->url
}`

export const ARTICLES_QUERY = `*[_type == "article" && published == true] | order(coalesce(publishedAt, _createdAt) desc) {
  _id,
  title,
  "slug": slug.current,
  intent,
  summary,
  body,
  seoTitle,
  metaDescription,
  publishedAt,
  "image": featuredImage.asset->url
}`

export const PRODUCTS_QUERY = `*[_type == "product" && published == true] | order(order asc, name asc) {
  _id,
  name,
  "slug": slug.current,
  brand,
  category,
  regularPrice,
  salePrice,
  sku,
  gtin,
  stockQuantity,
  size,
  variants,
  shortDescription,
  description,
  benefits,
  ingredients,
  howToUse,
  seoTitle,
  metaDescription,
  featured,
  "images": images[].asset->url
}`

export const LOCATIONS_QUERY = `*[_type == "location" && active == true] | order(order asc, name asc) {
  _id,
  name,
  "slug": slug.current,
  address,
  note,
  phone,
  openingHours,
  "image": image.asset->url
}`

export const SETTINGS_QUERY = `*[_type == "siteSettings" && _id == "siteSettings"][0] {
  businessName,
  tagline,
  phones,
  whatsappNumber,
  email,
  instagram,
  facebook,
  seoTitle,
  metaDescription,
  "logo": logo.asset->url
}`

export const PROGRAMS_QUERY = `*[_type == "offerProgram" && published == true] | order(order asc, title asc) {
  _id,
  title,
  type,
  description,
  priceText,
  "image": image.asset->url
}`

export const REVIEWS_QUERY = `*[_type == "review" && published == true] | order(order asc, _createdAt desc) {
  _id,
  customerName,
  text,
  rating,
  source
}`
