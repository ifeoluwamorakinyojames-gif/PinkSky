import {FormEvent, useEffect, useMemo, useState} from 'react'
import {
  ArrowLeft, Boxes, CalendarDays, FileText, Gift, Image as ImageIcon, LayoutDashboard,
  Loader2, LockKeyhole, LogOut, MapPin, Menu, Package, Settings, ShieldCheck,
  Star, Trash2, Upload, Users, X
} from 'lucide-react'
import {adminApi, AdminSession, AdminUser} from './admin/api'

type Section =
  | 'dashboard' | 'settings' | 'services' | 'products' | 'banners' | 'blog'
  | 'bookings' | 'locations' | 'programs' | 'reviews' | 'team'

const sectionMeta: Record<Section, {label: string; icon: any; resource?: string}> = {
  dashboard: {label: 'Dashboard', icon: LayoutDashboard},
  settings: {label: 'Website Settings', icon: Settings, resource: 'settings'},
  services: {label: 'Services', icon: Boxes, resource: 'services'},
  products: {label: 'Products', icon: Package, resource: 'products'},
  banners: {label: 'Rollover Banners', icon: ImageIcon, resource: 'banners'},
  blog: {label: 'Blog', icon: FileText, resource: 'articles'},
  bookings: {label: 'Bookings', icon: CalendarDays, resource: 'bookings'},
  locations: {label: 'Locations', icon: MapPin, resource: 'locations'},
  programs: {label: 'Memberships, Packages & Gift Cards', icon: Gift, resource: 'programs'},
  reviews: {label: 'Reviews', icon: Star, resource: 'reviews'},
  team: {label: 'Team & Roles', icon: Users, resource: 'users'},
}

const roleLabel = (role: AdminUser['role']) => role.charAt(0).toUpperCase() + role.slice(1)
const canWrite = (role: AdminUser['role']) => ['owner', 'manager', 'editor'].includes(role)
const canManageTeam = (role: AdminUser['role']) => role === 'owner'
const arrText = (value: any) => Array.isArray(value) ? value.join('\n') : ''
const lines = (value: string) => value.split('\n').map(x => x.trim()).filter(Boolean)
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const portableTextToPlain = (body: any[]) =>
  Array.isArray(body) ? body.filter(b => b?._type === 'block').map(b => (b.children || []).map((c:any) => c.text || '').join('')).join('\n\n') : ''
const plainToPortableText = (text: string) =>
  text.split(/\n{2,}/).map((paragraph, i) => ({
    _type: 'block', _key: `p${Date.now()}${i}`, style: 'normal', markDefs: [],
    children: [{_type:'span', _key:`s${Date.now()}${i}`, marks:[], text:paragraph.trim()}]
  })).filter(b => b.children[0].text)

function Field({label, children, hint}:{label:string; children:any; hint?:string}) {
  return <label className='admin-form-field'><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}

function Toggle({label, checked, onChange}:{label:string; checked:boolean; onChange:(v:boolean)=>void}) {
  return <label className='admin-toggle'><input type='checkbox' checked={checked} onChange={e=>onChange(e.target.checked)}/><span>{label}</span></label>
}

function ImageUpload({label, current, onUploaded}:{label:string; current?:any; onUploaded:(img:any)=>void}) {
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  async function choose(file?:File) {
    if(!file) return
    if(file.size > 8*1024*1024){setError('Please choose an image under 8 MB.'); return}
    setBusy(true); setError('')
    try { const result=await adminApi.uploadImage(file); onUploaded(result.image) }
    catch(e){ setError(e instanceof Error?e.message:'Upload failed') }
    finally { setBusy(false) }
  }
  const ref = current?.asset?._ref || ''
  return <div className='admin-image-upload'>
    <span className='admin-image-label'>{label}</span>
    <label className='admin-upload-button'>
      <Upload size={17}/>{busy?'Uploading…':'Choose image'}
      <input type='file' accept='image/*' disabled={busy} onChange={e=>choose(e.target.files?.[0])}/>
    </label>
    {ref && <small>Image attached ✓</small>}
    {error && <small className='admin-inline-error'>{error}</small>}
  </div>
}

function MultiImageUpload({label, current, onUploaded, max=8}:{label:string; current?:any[]; onUploaded:(imgs:any[])=>void; max?:number}) {
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  async function choose(files?:FileList|null) {
    if(!files?.length) return
    const picked=Array.from(files).slice(0, Math.max(0, max-(current?.length||0)))
    if(picked.some(file=>file.size>8*1024*1024)){setError('Each image must be under 8 MB.'); return}
    if(!picked.length){setError(`Maximum ${max} images allowed.`); return}
    setBusy(true); setError('')
    try {
      const uploaded=[]
      for(const file of picked){const result=await adminApi.uploadImage(file); uploaded.push(result.image)}
      onUploaded([...(current||[]),...uploaded].slice(0,max))
    } catch(e){setError(e instanceof Error?e.message:'Upload failed')}
    finally{setBusy(false)}
  }
  return <div className='admin-image-upload'>
    <span className='admin-image-label'>{label}</span>
    <label className='admin-upload-button'>
      <Upload size={17}/>{busy?'Uploading…':'Add images'}
      <input type='file' accept='image/*' multiple disabled={busy} onChange={e=>choose(e.target.files)}/>
    </label>
    <small>{current?.length||0} / {max} images attached</small>
    {!!current?.length && <button type='button' className='admin-text-button' onClick={()=>onUploaded([])}>Clear all images</button>}
    {error && <small className='admin-inline-error'>{error}</small>}
  </div>
}

function Editor({
  section, record, user, onClose, onSaved, onDeleted
}:{section:Section; record:any; user:AdminUser; onClose:()=>void; onSaved:(x:any)=>void; onDeleted:()=>void}) {
  const isNew=!!record?._new
  const [form,setForm]=useState<any>(()=>({...record, published: record.published ?? true}))
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [success,setSuccess]=useState('')
  const resource=sectionMeta[section].resource || ''
  const readonly=!canWrite(user.role)
  const set=(key:string,value:any)=>setForm((x:any)=>({...x,[key]:value}))
  const title=form.name||form.title||form.customerName||form.email||(isNew?'New record':'Record')

  async function save() {
    if(readonly) return
    setSaving(true);setError('');setSuccess('')
    try {
      const payload:any={...form}
      delete payload._new
      if((section==='services'||section==='products'||section==='blog'||section==='locations') && !payload.slug){
        payload.slug=slugify(payload.name||payload.title||'')
      }
      if(section==='blog' && typeof payload.bodyText==='string'){
        payload.body=plainToPortableText(payload.bodyText); delete payload.bodyText
      }
      if(section==='team' && !payload.password && !isNew) delete payload.password
      const result=isNew?await adminApi.save(resource,payload):await adminApi.update(resource,record._id||record.id,payload)
      setSuccess('Saved successfully.')
      try { new BroadcastChannel('pinksky-cms').postMessage({type:'refresh', resource}) } catch {}
      onSaved(result)
    } catch(e){setError(e instanceof Error?e.message:'Save failed')}
    finally{setSaving(false)}
  }
  async function remove() {
    if(readonly||isNew) return
    if(!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setSaving(true);setError('')
    try{await adminApi.remove(resource,record._id||record.id);try{new BroadcastChannel('pinksky-cms').postMessage({type:'refresh',resource})}catch{};onDeleted();onClose()}
    catch(e){setError(e instanceof Error?e.message:'Delete failed');setSaving(false)}
  }

  const commonActions=<div className='admin-editor-actions'>
    <button className='admin-secondary' onClick={onClose}>Cancel</button>
    {!isNew && !readonly && section!=='bookings' && <button className='admin-danger' onClick={remove}><Trash2 size={16}/> Delete</button>}
    {!readonly && <button className='admin-primary' disabled={saving} onClick={save}>{saving?<><Loader2 className='spin' size={16}/> Saving…</>:'Save changes'}</button>}
  </div>

  return <div className='admin-drawer-backdrop' onClick={onClose}>
    <aside className='admin-drawer admin-editor-drawer' onClick={e=>e.stopPropagation()}>
      <button className='admin-drawer-close' onClick={onClose}><X/></button>
      <span className='admin-kicker'>{isNew?'Create':'Edit'}</span>
      <h2>{title}</h2>
      {readonly && <div className='admin-security-note'><ShieldCheck size={17}/><span>Your role is read-only.</span></div>}
      {error && <div className='admin-error'>{error}</div>}
      {success && <div className='admin-success'>{success}</div>}
      <div className='admin-editor-form'>

      {section==='services' && <>
        <Field label='Service name'><input value={form.name||''} onChange={e=>set('name',e.target.value)}/></Field>
        <Field label='Slug'><input value={form.slug?.current||form.slug||''} onChange={e=>set('slug',e.target.value)}/></Field>
        <Field label='Short tagline'><input value={form.eyebrow||''} onChange={e=>set('eyebrow',e.target.value)}/></Field>
        <Field label='Short description'><textarea rows={3} value={form.short||''} onChange={e=>set('short',e.target.value)}/></Field>
        <Field label='Full description'><textarea rows={6} value={form.description||''} onChange={e=>set('description',e.target.value)}/></Field>
        <div className='admin-form-grid'><Field label='Price text'><input value={form.price||''} onChange={e=>set('price',e.target.value)}/></Field><Field label='Duration'><input value={form.duration||''} onChange={e=>set('duration',e.target.value)}/></Field></div>
        <Field label='Service items' hint='One item per line'><textarea rows={6} value={arrText(form.items)} onChange={e=>set('items',lines(e.target.value))}/></Field>
        <ImageUpload label='Main service image' current={form.heroImage} onUploaded={img=>set('heroImage',img)}/><MultiImageUpload label='Service gallery' current={form.gallery||[]} max={8} onUploaded={imgs=>set('gallery',imgs)}/>
        <div className='admin-form-grid'><Field label='Display order'><input type='number' value={form.order??100} onChange={e=>set('order',Number(e.target.value))}/></Field><Toggle label='Published' checked={form.published!==false} onChange={v=>set('published',v)}/></div>
      </>}

      {section==='products' && <>
        <div className='admin-form-grid'><Field label='Product name'><input value={form.name||''} onChange={e=>set('name',e.target.value)}/></Field><Field label='Brand'><input value={form.brand||'Pink Sky'} onChange={e=>set('brand',e.target.value)}/></Field></div>
        <div className='admin-form-grid'><Field label='Slug'><input value={form.slug?.current||form.slug||''} onChange={e=>set('slug',e.target.value)}/></Field><Field label='Category'><input value={form.category||''} onChange={e=>set('category',e.target.value)}/></Field></div>
        <div className='admin-form-grid'><Field label='Regular price (NGN)'><input type='number' min='0' value={form.regularPrice??''} onChange={e=>set('regularPrice',e.target.value===''?undefined:Number(e.target.value))}/></Field><Field label='Sale price (NGN)'><input type='number' min='0' value={form.salePrice??''} onChange={e=>set('salePrice',e.target.value===''?undefined:Number(e.target.value))}/></Field></div>
        <div className='admin-form-grid'><Field label='Stock quantity'><input type='number' min='0' value={form.stockQuantity??0} onChange={e=>set('stockQuantity',Number(e.target.value))}/></Field><Field label='Size / Volume'><input value={form.size||''} onChange={e=>set('size',e.target.value)}/></Field></div>
        <div className='admin-form-grid'><Field label='SKU'><input value={form.sku||''} onChange={e=>set('sku',e.target.value)}/></Field><Field label='GTIN / Barcode'><input value={form.gtin||''} onChange={e=>set('gtin',e.target.value)}/></Field></div>
        <Field label='Short description'><textarea rows={3} value={form.shortDescription||''} onChange={e=>set('shortDescription',e.target.value)}/></Field>
        <Field label='Full description'><textarea rows={7} value={form.description||''} onChange={e=>set('description',e.target.value)}/></Field>
        <Field label='Benefits' hint='One per line'><textarea rows={5} value={arrText(form.benefits)} onChange={e=>set('benefits',lines(e.target.value))}/></Field>
        <Field label='Variants' hint='One per line'><textarea rows={4} value={arrText(form.variants)} onChange={e=>set('variants',lines(e.target.value))}/></Field>
        <Field label='Ingredients / Specifications'><textarea rows={4} value={form.ingredients||''} onChange={e=>set('ingredients',e.target.value)}/></Field>
        <Field label='How to use'><textarea rows={4} value={form.howToUse||''} onChange={e=>set('howToUse',e.target.value)}/></Field>
        <MultiImageUpload label='Product images' current={form.images||[]} max={8} onUploaded={imgs=>set('images',imgs)}/><Field label='SEO title'><input value={form.seoTitle||''} onChange={e=>set('seoTitle',e.target.value)}/></Field><Field label='Meta description'><textarea rows={3} value={form.metaDescription||''} onChange={e=>set('metaDescription',e.target.value)}/></Field>
        <div className='admin-form-grid'><Toggle label='Featured product' checked={!!form.featured} onChange={v=>set('featured',v)}/><Toggle label='Published' checked={!!form.published} onChange={v=>set('published',v)}/></div>
        <Field label='Display order'><input type='number' value={form.order??100} onChange={e=>set('order',Number(e.target.value))}/></Field>
      </>}

      {section==='banners' && <>
        <Field label='Campaign title'><input value={form.title||''} onChange={e=>set('title',e.target.value)}/></Field>
        <ImageUpload label='Banner image (recommended 1920 × 700)' current={form.image} onUploaded={img=>set('image',img)}/>
        <Field label='Image alt text'><input value={form.alt||''} onChange={e=>set('alt',e.target.value)}/></Field>
        <Field label='Click-through link'><input value={form.link||''} onChange={e=>set('link',e.target.value)} placeholder='#/service/teeth-whitening'/></Field>
        <div className='admin-form-grid'><Field label='Display order'><input type='number' value={form.order??0} onChange={e=>set('order',Number(e.target.value))}/></Field><Toggle label='Active' checked={form.active!==false} onChange={v=>set('active',v)}/></div>
        <div className='admin-form-grid'><Field label='Start date/time'><input type='datetime-local' value={form.startAt?String(form.startAt).slice(0,16):''} onChange={e=>set('startAt',e.target.value?new Date(e.target.value).toISOString():undefined)}/></Field><Field label='End date/time'><input type='datetime-local' value={form.endAt?String(form.endAt).slice(0,16):''} onChange={e=>set('endAt',e.target.value?new Date(e.target.value).toISOString():undefined)}/></Field></div>
      </>}

      {section==='blog' && <>
        <Field label='Article title'><input value={form.title||''} onChange={e=>set('title',e.target.value)}/></Field>
        <Field label='Slug'><input value={form.slug?.current||form.slug||''} onChange={e=>set('slug',e.target.value)}/></Field>
        <Field label='Search intent'><select value={form.intent||'Informational intent'} onChange={e=>set('intent',e.target.value)}><option>Informational intent</option><option>Commercial investigation</option><option>Local intent</option></select></Field>
        <Field label='Summary'><textarea rows={4} value={form.summary||''} onChange={e=>set('summary',e.target.value)}/></Field>
        <Field label='Article body' hint='Separate paragraphs with a blank line'><textarea rows={14} value={form.bodyText ?? portableTextToPlain(form.body)} onChange={e=>set('bodyText',e.target.value)}/></Field>
        <ImageUpload label='Featured image' current={form.featuredImage} onUploaded={img=>set('featuredImage',img)}/>
        <Field label='SEO title'><input value={form.seoTitle||''} onChange={e=>set('seoTitle',e.target.value)}/></Field>
        <Field label='Meta description'><textarea rows={3} value={form.metaDescription||''} onChange={e=>set('metaDescription',e.target.value)}/></Field>
        <div className='admin-form-grid'><Field label='Published at'><input type='datetime-local' value={form.publishedAt?String(form.publishedAt).slice(0,16):''} onChange={e=>set('publishedAt',e.target.value?new Date(e.target.value).toISOString():undefined)}/></Field><Toggle label='Published' checked={form.published!==false} onChange={v=>set('published',v)}/></div>
      </>}

      {section==='locations' && <>
        <Field label='Location name'><input value={form.name||''} onChange={e=>set('name',e.target.value)}/></Field>
        <Field label='Slug'><input value={form.slug?.current||form.slug||''} onChange={e=>set('slug',e.target.value)}/></Field>
        <Field label='Address'><textarea rows={3} value={form.address||''} onChange={e=>set('address',e.target.value)}/></Field>
        <div className='admin-form-grid'><Field label='Branch note'><input value={form.note||''} onChange={e=>set('note',e.target.value)}/></Field><Field label='Branch phone'><input value={form.phone||''} onChange={e=>set('phone',e.target.value)}/></Field></div>
        <Field label='Opening hours' hint='One line per day or schedule'><textarea rows={5} value={arrText(form.openingHours)} onChange={e=>set('openingHours',lines(e.target.value))}/></Field>
        <ImageUpload label='Branch image' current={form.image} onUploaded={img=>set('image',img)}/>
        <div className='admin-form-grid'><Field label='Display order'><input type='number' value={form.order??0} onChange={e=>set('order',Number(e.target.value))}/></Field><Toggle label='Active' checked={form.active!==false} onChange={v=>set('active',v)}/></div>
      </>}

      {section==='programs' && <>
        <Field label='Title'><input value={form.title||''} onChange={e=>set('title',e.target.value)}/></Field>
        <Field label='Type'><select value={form.type||'Package'} onChange={e=>set('type',e.target.value)}><option>Membership</option><option>Package</option><option>Gift Card</option></select></Field>
        <Field label='Description'><textarea rows={5} value={form.description||''} onChange={e=>set('description',e.target.value)}/></Field>
        <Field label='Price text'><input value={form.priceText||''} onChange={e=>set('priceText',e.target.value)}/></Field>
        <ImageUpload label='Image' current={form.image} onUploaded={img=>set('image',img)}/>
        <div className='admin-form-grid'><Field label='Display order'><input type='number' value={form.order??100} onChange={e=>set('order',Number(e.target.value))}/></Field><Toggle label='Published' checked={form.published!==false} onChange={v=>set('published',v)}/></div>
      </>}

      {section==='reviews' && <>
        <Field label='Customer name'><input value={form.customerName||''} onChange={e=>set('customerName',e.target.value)}/></Field>
        <Field label='Review'><textarea rows={5} value={form.text||''} onChange={e=>set('text',e.target.value)}/></Field>
        <div className='admin-form-grid'><Field label='Rating (1–5)'><input type='number' min='1' max='5' value={form.rating??5} onChange={e=>set('rating',Number(e.target.value))}/></Field><Field label='Source'><input value={form.source||''} onChange={e=>set('source',e.target.value)} placeholder='Google, Instagram, in-store'/></Field></div>
        <div className='admin-form-grid'><Field label='Display order'><input type='number' value={form.order??100} onChange={e=>set('order',Number(e.target.value))}/></Field><Toggle label='Published' checked={!!form.published} onChange={v=>set('published',v)}/></div>
      </>}

      {section==='bookings' && <>
        <div className='admin-form-grid'><Field label='Customer name'><input value={form.name||''} readOnly/></Field><Field label='Phone'><input value={form.phone||''} readOnly/></Field></div>
        <div className='admin-form-grid'><Field label='Email'><input value={form.email||''} readOnly/></Field><Field label='Service'><input value={form.service||''} readOnly/></Field></div>
        <div className='admin-form-grid'><Field label='Location'><input value={form.location||''} readOnly/></Field><Field label='Preferred date'><input value={form.preferredDate||''} readOnly/></Field></div>
        <Field label='Preferred time'><input value={form.preferredTime||''} readOnly/></Field>
        <Field label='Customer notes'><textarea rows={3} value={form.notes||''} readOnly/></Field>
        <Field label='Status'><select value={form.status||'requested'} onChange={e=>set('status',e.target.value)}><option value='requested'>New Request</option><option value='contacted'>Contacted</option><option value='confirmed'>Confirmed</option><option value='completed'>Completed</option><option value='cancelled'>Cancelled</option></select></Field>
        <Field label='Internal notes'><textarea rows={4} value={form.internalNotes||''} onChange={e=>set('internalNotes',e.target.value)}/></Field>
      </>}

      {section==='settings' && <>
        <Field label='Business name'><input value={form.businessName||''} onChange={e=>set('businessName',e.target.value)}/></Field>
        <Field label='Tagline'><input value={form.tagline||''} onChange={e=>set('tagline',e.target.value)}/></Field>
        <Field label='Phone numbers' hint='One number per line'><textarea rows={4} value={arrText(form.phones)} onChange={e=>set('phones',lines(e.target.value))}/></Field>
        <div className='admin-form-grid'><Field label='WhatsApp number'><input value={form.whatsappNumber||''} onChange={e=>set('whatsappNumber',e.target.value)}/></Field><Field label='Public email'><input value={form.email||''} onChange={e=>set('email',e.target.value)}/></Field></div>
        <Field label='Instagram URL'><input value={form.instagram||''} onChange={e=>set('instagram',e.target.value)}/></Field>
        <Field label='Facebook URL'><input value={form.facebook||''} onChange={e=>set('facebook',e.target.value)}/></Field>
        <Field label='Default SEO title'><input value={form.seoTitle||''} onChange={e=>set('seoTitle',e.target.value)}/></Field>
        <Field label='Default meta description'><textarea rows={3} value={form.metaDescription||''} onChange={e=>set('metaDescription',e.target.value)}/></Field>
        <ImageUpload label='Logo' current={form.logo} onUploaded={img=>set('logo',img)}/>
      </>}

      {section==='team' && <>
        <Field label='Name'><input value={form.name||''} onChange={e=>set('name',e.target.value)}/></Field>
        <Field label='Email'><input type='email' value={form.email||''} onChange={e=>set('email',e.target.value)} readOnly={!isNew}/></Field>
        <Field label={isNew?'Password':'New password (leave blank to keep current)'}><input type='password' value={form.password||''} onChange={e=>set('password',e.target.value)}/></Field>
        <div className='admin-form-grid'><Field label='Role'><select value={form.role||'viewer'} onChange={e=>set('role',e.target.value)}><option value='owner'>Owner</option><option value='manager'>Manager</option><option value='editor'>Editor</option><option value='viewer'>Viewer</option></select></Field>{!isNew&&<Field label='Status'><select value={form.status||'active'} onChange={e=>set('status',e.target.value)}><option value='active'>Active</option><option value='suspended'>Suspended</option></select></Field>}</div>
      </>}

      </div>
      {commonActions}
    </aside>
  </div>
}

export default function AdminDashboard({onExit}: {onExit: () => void}) {
  const [session,setSession]=useState<AdminSession|null>(null)
  const [loginError,setLoginError]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loggingIn,setLoggingIn]=useState(false)
  const [section,setSection]=useState<Section>('dashboard')
  const [mobileOpen,setMobileOpen]=useState(false)
  const [items,setItems]=useState<any[]>([])
  const [loading,setLoading]=useState(false)
  const [loadError,setLoadError]=useState('')
  const [selected,setSelected]=useState<any|null>(null)

  useEffect(()=>{adminApi.session().then(setSession).catch(()=>setSession({authenticated:false}))},[])
  const user=session?.authenticated?session.user:null

  async function loadCurrent() {
    if(!user||section==='dashboard'){setItems([]);return}
    if(section==='team'&&!canManageTeam(user.role)){setSection('dashboard');return}
    const resource=sectionMeta[section].resource;if(!resource)return
    setLoading(true);setLoadError('')
    try {
      const loader:any =
        resource==='services'?adminApi.services:
        resource==='products'?adminApi.products:
        resource==='banners'?adminApi.banners:
        resource==='articles'?adminApi.articles:
        resource==='bookings'?adminApi.bookings:
        resource==='locations'?adminApi.locations:
        resource==='programs'?adminApi.programs:
        resource==='reviews'?adminApi.reviews:
        resource==='settings'?adminApi.settings:adminApi.users
      const data=await loader()
      const list=Array.isArray(data)?data:(data.items||[])
      setItems(list)
      if(section==='settings' && list.length && !selected) setSelected(list[0])
    } catch(e){setLoadError(e instanceof Error?e.message:'Load failed')}
    finally{setLoading(false)}
  }
  useEffect(()=>{setSelected(null);void loadCurrent()},[section,user?.id,user?.role])

  const visibleSections=useMemo(()=> (Object.keys(sectionMeta) as Section[]).filter(k=>k!=='team'||(user&&canManageTeam(user.role))),[user])

  async function submitLogin(e:FormEvent){
    e.preventDefault();setLoggingIn(true);setLoginError('')
    try{const result=await adminApi.login(email,password);setSession({authenticated:true,user:result.user});setPassword('')}
    catch(err){setLoginError(err instanceof Error?err.message:'Login failed')}
    finally{setLoggingIn(false)}
  }
  async function logout(){try{await adminApi.logout()}finally{setSession({authenticated:false});setSection('dashboard')}}

  if(session===null)return <div className='admin-auth-shell'><div className='admin-login-card loading-card'><Loader2 className='spin'/><p>Checking Pink Sky admin session…</p></div></div>

  if(!session.authenticated)return <div className='admin-auth-shell'>
    <div className='admin-login-brand'>
      <img src='./resources/pinksky-logo.jpg' alt='Pink Sky'/>
      <span>Pink Sky Beauty & Wellness</span><h1>Staff Administration</h1>
      <p>Manage services, products, bookings, banners and website content from one secure workspace.</p>
      <button className='admin-link-button' onClick={onExit}><ArrowLeft size={17}/> Back to website</button>
    </div>
    <form className='admin-login-card' onSubmit={submitLogin}>
      <div className='admin-lock'><LockKeyhole/></div><span className='admin-kicker'>Authorised staff only</span>
      <h2>Sign in to Pink Sky Admin</h2><p className='admin-muted'>Use the staff account assigned to you by a Pink Sky owner.</p>
      <Field label='Email address'><input type='email' required autoComplete='username' value={email} onChange={e=>setEmail(e.target.value)}/></Field>
      <Field label='Password'><input type='password' required autoComplete='current-password' value={password} onChange={e=>setPassword(e.target.value)}/></Field>
      {loginError&&<div className='admin-error'>{loginError}</div>}
      <button className='admin-login-submit' disabled={loggingIn}>{loggingIn?<><Loader2 className='spin' size={17}/> Signing in…</>:'Sign in'}</button>
      <div className='admin-security-note'><ShieldCheck size={17}/><span>Passwords and Sanity write credentials stay on the backend.</span></div>
    </form>
  </div>

  if (!user) return null
  const meta=sectionMeta[section]
  return <div className='admin-shell'>
    <aside className={`admin-sidebar ${mobileOpen?'open':''}`}>
      <div className='admin-sidebar-brand'><img src='./resources/pinksky-logo.jpg' alt='Pink Sky'/><div><strong>Pink Sky</strong><span>Administration</span></div><button className='admin-mobile-close' onClick={()=>setMobileOpen(false)}><X/></button></div>
      <nav className='admin-nav'>{visibleSections.map(key=>{const item=sectionMeta[key],I=item.icon;return <button key={key} className={section===key?'active':''} onClick={()=>{setSection(key);setMobileOpen(false)}}><I size={18}/>{item.label}</button>})}</nav>
      <div className='admin-sidebar-bottom'><button onClick={onExit}><ArrowLeft size={17}/> View website</button><button onClick={logout}><LogOut size={17}/> Sign out</button></div>
    </aside>

    <main className='admin-main'>
      <header className='admin-topbar'><button className='admin-menu' onClick={()=>setMobileOpen(true)}><Menu/></button><div><span className='admin-kicker'>Pink Sky Admin</span><h1>{meta.label}</h1></div><div className='admin-user-chip'><span>{user.name||user.email}</span><strong>{roleLabel(user.role)}</strong></div></header>

      {section==='dashboard'?<section className='admin-dashboard-home'>
        <div className='admin-welcome-card'><div><span className='admin-kicker'>Welcome back</span><h2>{user.name||user.email}</h2><p>Manage the website from this dashboard. Sanity remains behind the scenes.</p></div><ShieldCheck size={48}/></div>
        <div className='admin-quick-grid'>{visibleSections.filter(x=>x!=='dashboard'&&x!=='team').map(key=>{const item=sectionMeta[key],I=item.icon;return <button key={key} onClick={()=>setSection(key)}><I/><strong>{item.label}</strong><span>Open section</span></button>})}</div>
      </section>:<section className='admin-resource-page'>
        <div className='admin-resource-toolbar'><div><span className='admin-kicker'>Manage</span><h2>{meta.label}</h2></div>
          {canWrite(user.role)&&section!=='bookings'&&section!=='settings'&&<button className='admin-primary' onClick={()=>setSelected({_new:true,published:true,active:true})}>+ Add new</button>}
        </div>
        {loading&&<div className='admin-state'><Loader2 className='spin'/> Loading…</div>}
        {loadError&&<div className='admin-error admin-page-error'>{loadError}</div>}
        {!loading&&!loadError&&section==='settings'&&items.length===0&&<button className='admin-primary' onClick={()=>setSelected({_new:true,businessName:'Pink Sky Beauty & Wellness',tagline:'Beauty from within.'})}>Create website settings</button>}
        {!loading&&!loadError&&section!=='settings'&&<div className='admin-table-wrap'><table className='admin-table'><thead><tr><th>Name / Title</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>
          {items.length===0?<tr><td colSpan={4} className='admin-empty'>No records yet.</td></tr>:items.map((item,index)=><tr key={item._id||item.id||index}><td><strong>{item.name||item.title||item.customerName||item.email||'Untitled'}</strong><span>{item.slug?.current||item.service||item.role||''}</span></td><td><span className='admin-status'>{item.status||(item.published===false?'Hidden':'Published')}</span></td><td>{item._updatedAt?new Date(item._updatedAt).toLocaleDateString():'—'}</td><td><button className='admin-text-button' onClick={()=>setSelected(item)}>{canWrite(user.role)?'Edit':'View'}</button></td></tr>)}
        </tbody></table></div>}
      </section>}
    </main>

    {selected&&<Editor section={section} record={selected} user={user} onClose={()=>setSelected(null)}
      onSaved={async(saved)=>{setSelected(saved);await loadCurrent()}}
      onDeleted={async()=>{await loadCurrent()}}/>}
  </div>
}


