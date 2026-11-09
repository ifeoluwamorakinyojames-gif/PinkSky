/** Display safeguards for CMS-managed service pages. No invented prices or treatments. */
export function displayServicePrice(value?: string): string | null {
  const raw=(value||'').trim()
  if(!raw||/^(contact|ask|enquir|on request|on enquiry|tba|varies|price on)/i.test(raw))return null
  // A few older CMS price entries used '#' rather than the naira sign.
  return raw.replace(/#(?=\s*[\d,])/g,'₦')
}
export function displayServiceDuration(value?: string): string | null {
  const raw=(value||'').trim()
  if(!raw||/^(to be confirmed|varies|confirm|contact|tba|n\/a|not available)/i.test(raw))return null
  return raw
}
export function displayServiceEyebrow(value?: string): string {
  return (value||'').replace(/\bbrigther\b/gi,'brighter').trim()
}
export function originalImageDimensions(source?: string): {width:number;height:number}|null {
  if(!source)return null
  const match=source.match(/-(\d{2,5})x(\d{2,5})(?:\.(?:png|jpe?g|webp)(?:\?|$)|-(?:png|jpe?g|webp)(?:$|[-]))/i)
  if(!match)return null
  return {width:Number(match[1]),height:Number(match[2])}
}
export function isSmallSourceImage(source?:string):boolean {
  const dim=originalImageDimensions(source)
  return !!dim&&(dim.width<600||dim.height<450)
}
export function serviceHeroImage(primary:string|undefined,gallery:string[]|undefined):string {
  const fallback=primary||'/resources/pinksky-logo.jpg'
  if(!isSmallSourceImage(fallback))return fallback
  return gallery?.find(item=>!isSmallSourceImage(item))||fallback
}
export function relatedServicesForService<T extends {slug:string;name:string}>(
  service:T, services:T[], max=3,
):T[]{
  const groups=[
    /facial|skin|acne|glow/i,
    /teeth|tooth|whiten|dental|scal/i,
    /nail|pedicure|manicure/i,
    /hair|wig|braid|dread|barb|groom/i,
    /lash|brow|microblad/i,
    /spa|massage|relax/i,
  ]
  const serviceGroups=groups.map((regex,index)=>regex.test(service.name+' '+service.slug)?index:-1).filter(i=>i>=0)
  return services.filter(item=>item.slug!==service.slug&&serviceGroups.some(index=>groups[index].test(item.name+' '+item.slug))).slice(0,max)
}
