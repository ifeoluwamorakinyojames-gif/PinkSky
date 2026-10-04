export type Service = {
  name: string;
  slug: string;
  eyebrow: string;
  short: string;
  description: string;
  image: string;
  items: string[];
};

export const phones = ['0810 343 9291', '0814 828 7665', '0815 884 3685'];
export const whatsappNumber = phones[0].replace(/\s/g, '').replace(/^0/, '234');

export const locations = [
  {
    name: 'Delta Mall, Effurun',
    slug: 'delta-mall-effurun',
    address: 'Shop 20/23, Delta Mall, Effurun, Delta State'
  },
  {
    name: 'Airport Road, Warri',
    slug: 'airport-road-warri',
    address: 'Magnifique House, 67 Airport Road, near Union Bank, opposite Christ Embassy, Warri'
  }
];

export const services: Service[] = [
  {
    name: 'Teeth Whitening',
    slug: 'teeth-whitening',
    eyebrow: 'Smile brighter',
    short: 'Professional teeth whitening with consultation and aftercare guidance.',
    description: 'A focused Pink Sky beauty service with a clear journey from consultation to treatment and aftercare.',
    image: './resources/pinksky-teeth-whitening.jpg',
    items: ['Consultation', 'Whitening session', 'Treatment guidance', 'Aftercare guidance']
  },
  {
    name: 'Facials & Skincare',
    slug: 'facials-skincare',
    eyebrow: 'Glow with confidence',
    short: 'Facials, skin testing and personalised skincare support.',
    description: 'Professional facial and skincare care tailored to the client.',
    image: './resources/pinksky-facial-3.png',
    items: ['Facials', 'Skin testing', 'Skin consultation', 'Skincare treatments']
  },
  {
    name: 'Hair & Wig Studio',
    slug: 'hair-wig-studio',
    eyebrow: 'Style. Treat. Transform.',
    short: 'Haircare, styling, extensions, dreadlocks and wig services.',
    description: 'Hair and wig services for styling, transformations and maintenance.',
    image: './resources/pinksky-haircare.jpg',
    items: ['Hair styling', 'Hair treatments', 'Colouring', 'Extensions', 'Wig revamping', 'Dreadlocks']
  },
  {
    name: 'Nails',
    slug: 'nails',
    eyebrow: 'Clean detail, beautiful finish',
    short: 'Manicure and pedicure care with a polished finish.',
    description: 'Professional nail care in a beauty-led environment.',
    image: './resources/pinksky-nails.jpg',
    items: ['Manicure', 'Pedicure', 'Nail care']
  },
  {
    name: 'Spa & Massage',
    slug: 'spa-massage',
    eyebrow: 'Pause. Restore. Renew.',
    short: 'Relaxation and wellness treatments designed for restoration.',
    description: 'A soothing spa experience around relaxation and personal care.',
    image: './resources/pinksky-facial-5.png',
    items: ['Massage', 'Spa treatments', 'Wellness care']
  },
  {
    name: 'Barbing & Grooming',
    slug: 'barbing-grooming',
    eyebrow: 'Sharp, clean, confident',
    short: 'Modern cuts and grooming for a polished finish.',
    description: 'Male grooming services for a clean and confident look.',
    image: './resources/pinksky-storefront.jpg',
    items: ['Haircut', 'Barbing', 'Grooming']
  },
  {
    name: 'Makeup & Brows',
    slug: 'makeup-brows',
    eyebrow: 'Refined beauty artistry',
    short: 'Makeup and brow services for everyday and event beauty.',
    description: 'Beauty artistry for polished everyday looks and special occasions.',
    image: './resources/pinksky-facial-6.png',
    items: ['Makeup', 'Brow enhancement']
  },
  {
    name: 'Microblading & Brows',
    slug: 'microblading-brows',
    eyebrow: 'Defined brows, refined finish',
    short: 'Microblading and brow enhancement for a natural, polished look.',
    description: 'Consultation, brow mapping, microblading and aftercare guidance.',
    image: './resources/pinksky-facial-4.png',
    items: ['Consultation', 'Brow mapping', 'Microblading', 'Aftercare']
  },
  {
    name: 'Waxing',
    slug: 'waxing',
    eyebrow: 'Smooth, simple care',
    short: 'Professional waxing as part of a complete beauty routine.',
    description: 'Professional grooming care with preparation and aftercare guidance.',
    image: './resources/pinksky-facial-2.png',
    items: ['Waxing', 'Grooming care', 'Aftercare']
  }
];
