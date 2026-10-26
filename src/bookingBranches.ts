/** Single source of truth for Pinksky's two shop floors.
 * Admin Locations can override contact numbers and addresses. A branch
 * explicitly marked inactive is removed from the booking chooser.
 */
export type BookingLocationRecord = {
  _id?: string
  name?: string
  slug?: string | {current?: string}
  bookingBranchId?: string
  address?: string
  phone?: string
  note?: string
  whatsappNumbers?: string[]
  openingHours?: string[]
  active?: boolean
}

export type PinkskyBranch = {
  id: 'airport-road' | 'delta-mall'
  name: string
  address: string
  whatsappNumbers: string[]
  openingHours?: string[]
  note?: string
}

export const defaultBookingBranches: PinkskyBranch[] = [
  {
    id: 'airport-road',
    name: 'Airport Road, Warri',
    address: 'Magnifique House, 67 Airport Road, near Union Bank, opposite Christ Embassy, Warri',
    whatsappNumbers: ['08037416330', '08129147351'],
  },
  {
    id: 'delta-mall',
    name: 'ShopMall — Delta Mall, Effurun',
    address: 'Shop 20/23, Delta Mall, Effurun, Delta State',
    whatsappNumbers: ['09127118845', '08101214336'],
  },
]

export function getBookingBranchId(location: BookingLocationRecord): PinkskyBranch['id'] | null {
  if (location.bookingBranchId === 'airport-road' || location.bookingBranchId === 'delta-mall') {
    return location.bookingBranchId
  }
  const slug = typeof location.slug === 'string' ? location.slug : location.slug?.current || ''
  const value = [slug, location.name].filter(Boolean).join(' ').toLowerCase()
  if (/airport[\s-]*road|magnifique/.test(value)) return 'airport-road'
  if (/delta[\s-]*mall|shop[\s-]*mall|shopmall|effurun/.test(value)) return 'delta-mall'
  return null
}

export function validateWhatsappNumber(value: string): boolean {
  const digits = String(value).replace(/[^0-9]/g, '')
  return /^0[789][01][0-9]{8}$/.test(digits) || /^234[789][01][0-9]{8}$/.test(digits)
}

export function resolveBookingBranches(locations: BookingLocationRecord[]): PinkskyBranch[] {
  const records = Array.isArray(locations) ? locations : []
  return defaultBookingBranches.flatMap(defaultBranch => {
    const matching = records.find(record => getBookingBranchId(record) === defaultBranch.id)
    if (matching?.active === false) return []
    const configuredNumbers = Array.isArray(matching?.whatsappNumbers)
      ? matching.whatsappNumbers.filter(value => validateWhatsappNumber(value))
      : []
    return [{
      ...defaultBranch,
      address: matching?.address?.trim() || defaultBranch.address,
      whatsappNumbers: configuredNumbers.length ? configuredNumbers : defaultBranch.whatsappNumbers,
      openingHours: matching?.openingHours,
      note: matching?.note,
    }]
  })
}
