export type AdminUser = {
  id: string
  email: string
  name?: string
  role: 'owner' | 'manager' | 'editor' | 'viewer'
  status?: 'active' | 'suspended'
}

export type AdminSession =
  | {authenticated: true; user: AdminUser}
  | {authenticated: false}

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {'content-type': 'application/json', ...(options.headers || {})},
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`)
  return data
}

export const adminApi = {
  session: () => request('/api/admin/session') as Promise<AdminSession>,
  login: (email: string, password: string) =>
    request('/api/admin/login', {method: 'POST', body: JSON.stringify({email, password})}) as Promise<{user: AdminUser}>,
  logout: () => request('/api/admin/logout', {method: 'POST'}) as Promise<{ok: true}>,

  services: () => request('/api/admin/services'),
  banners: () => request('/api/admin/banners'),
  products: () => request('/api/admin/products'),
  articles: () => request('/api/admin/articles'),
  bookings: () => request('/api/admin/bookings'),
  locations: () => request('/api/admin/locations'),
  programs: () => request('/api/admin/programs'),
  reviews: () => request('/api/admin/reviews'),
  settings: () => request('/api/admin/settings'),
  users: () => request('/api/admin/users'),

  save: (resource: string, payload: unknown) =>
    request(`/api/admin/${resource}`, {method: 'POST', body: JSON.stringify(payload)}),
  update: (resource: string, id: string, payload: unknown) =>
    request(`/api/admin/${resource}/${encodeURIComponent(id)}`, {method: 'PUT', body: JSON.stringify(payload)}),
  remove: (resource: string, id: string) =>
    request(`/api/admin/${resource}/${encodeURIComponent(id)}`, {method: 'DELETE'}),

  uploadImage: async (file: File) => {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '')
      reader.onerror = () => reject(reader.error || new Error('Could not read image'))
      reader.readAsDataURL(file)
    })
    return request('/api/admin/uploads', {
      method: 'POST',
      body: JSON.stringify({filename: file.name, contentType: file.type || 'image/jpeg', data}),
    }) as Promise<{assetId: string; image: any; url?: string}>
  },
}
