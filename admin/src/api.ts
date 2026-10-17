import type { CollectionDef, DocDef } from '../../src/cms/fields'

/** Conversa com o servidor do painel. O cookie de sessão é HttpOnly (o JavaScript nem enxerga);
 * aqui só guardamos, em memória, o token anti-CSRF que vai junto em todo pedido que altera dados. */

export type Role = 'admin' | 'editor'

export type User = {
  id: number
  email: string
  name: string
  role: Role
  isActive: boolean
  mustChangePassword: boolean
  tempPasswordExpiresAt: string | null
  createdAt: string
  lastLoginAt: string | null
}

export type Me = { user: User; csrf: string }

export type TempPassword = { user: User; tempPassword: string; expiresAt: string }

export type ActivityItem = {
  id: number
  createdAt: string
  actorEmail: string | null
  action: string
  target: string | null
  ip: string | null
  details: Record<string, unknown>
}

export type Problem = { path: string; message: string }

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryAfter?: number,
    public problems: Problem[] = [],
    public extra: Record<string, unknown> = {},
  ) {
    super(message)
  }
}

let csrf: string | null = null
let onSessionLost: () => void = () => {}

export function setSessionLostHandler(fn: () => void) {
  onSessionLost = fn
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  const form = body instanceof FormData
  if (body !== undefined && !form) headers['Content-Type'] = 'application/json'
  if (method !== 'GET' && csrf) headers['X-CSRF-Token'] = csrf

  let res: Response
  try {
    res = await fetch(url, { method, headers, credentials: 'same-origin', body: body === undefined ? undefined : form ? body : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, 'offline', 'Sem conexão com o servidor. Confira a internet e tente de novo.')
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = data?.detail ?? {}
    const err = new ApiError(res.status, d.code ?? 'error', d.message ?? 'Algo deu errado. Tente de novo.', d.retryAfter, d.problems ?? [], d)
    if (res.status === 401 && err.code === 'not_authenticated') onSessionLost()
    throw err
  }
  if (data && typeof data === 'object' && 'csrf' in data) csrf = (data as Me).csrf
  return data as T
}

export const api = {
  me: () => request<Me>('GET', '/api/auth/me'),
  login: (email: string, password: string) => request<Me>('POST', '/api/auth/login', { email, password }),
  logout: () => request<void>('POST', '/api/auth/logout').finally(() => (csrf = null)),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<Me>('POST', '/api/auth/change-password', { currentPassword, newPassword }),

  users: () => request<User[]>('GET', '/api/users'),
  createUser: (data: { email: string; name: string; role: Role }) => request<TempPassword>('POST', '/api/users', data),
  updateUser: (id: number, data: { name?: string; role?: Role }) => request<User>('PATCH', `/api/users/${id}`, data),
  tempPassword: (id: number) => request<TempPassword>('POST', `/api/users/${id}/temp-password`),
  deactivate: (id: number) => request<User>('POST', `/api/users/${id}/deactivate`),
  activate: (id: number) => request<User>('POST', `/api/users/${id}/activate`),
  deleteUser: (id: number) => request<void>('DELETE', `/api/users/${id}`),

  activity: (before?: number) =>
    request<{ items: ActivityItem[]; nextBefore: number | null }>('GET', `/api/activity${before ? `?before=${before}` : ''}`),
  verifyActivity: () => request<{ ok: boolean; brokenAt: number | null }>('GET', '/api/activity/verify'),

  /* Conteúdo */
  schema: () => request<CmsSchema>('GET', '/api/content/schema'),
  contentList: () => request<DocMeta[]>('GET', '/api/content'),
  getDoc: (key: string) => request<DocFull>('GET', `/api/content/${encodeURIComponent(key)}`),
  saveDraft: (key: string, draft: unknown) => request<DocMeta>('PUT', `/api/content/${encodeURIComponent(key)}`, { draft }),
  publish: (key: string) => request<{ published: string[] }>('POST', `/api/content/${encodeURIComponent(key)}/publish`),
  discard: (key: string) => request<DocMeta | { deleted: true }>('POST', `/api/content/${encodeURIComponent(key)}/discard`),
  removeDoc: (key: string) => request<DocMeta | { deleted: true }>('DELETE', `/api/content/${encodeURIComponent(key)}`),
  schedule: (key: string, at: string | null) => request<DocMeta>('POST', `/api/content/${encodeURIComponent(key)}/schedule`, { at }),
  versions: (key: string) => request<VersionItem[]>('GET', `/api/content/${encodeURIComponent(key)}/versions`),
  restoreVersion: (key: string, id: number) => request<{ ok: true }>('POST', `/api/content/${encodeURIComponent(key)}/versions/${id}/restore`),
  presence: (key: string) => request<{ editingBy: string[] }>('POST', `/api/content/${encodeURIComponent(key)}/presence`),
  createItem: (collection: string, item: unknown) => request<DocMeta>('POST', `/api/collections/${collection}`, { item }),
  order: (collection: string, keys: string[]) => request<{ ok: true }>('POST', `/api/collections/${collection}/order`, { keys }),
  move: (collection: string, key: string, to: number) => request<{ ok: true }>('POST', `/api/collections/${collection}/move`, { key, to }),
  search: (q: string) => request<SearchResult[]>('GET', `/api/content/search?q=${encodeURIComponent(q)}`),
  history: () => request<HistoryItem[]>('GET', '/api/content/history'),
  restoreSite: (at: string) => request<{ changed: number }>('POST', '/api/content/restore-site', { at }),

  /* Busca de cidades (posição no mapa) */
  geoSearch: (q: string) => request<GeoResult[]>('GET', `/api/geo/search?q=${encodeURIComponent(q)}`),

  /* Fotos */
  media: (trash = false) => request<MediaItem[]>('GET', `/api/media${trash ? '?trash=true' : ''}`),
  upload: (file: File, alt: string) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('alt', alt)
    return request<MediaItem>('POST', '/api/media', fd)
  },
  updateMedia: (id: string, data: { alt?: string; focal?: [number, number] }) => request<MediaItem>('PATCH', `/api/media/${id}`, data),
  deleteMedia: (id: string) => request<{ ok: true }>('DELETE', `/api/media/${id}`),
  restoreMedia: (id: string) => request<MediaItem>('POST', `/api/media/${id}/restore`),

  /* Sistema */
  status: () => request<SystemStatus>('GET', '/api/system/status'),
  backups: () => request<{ name: string; sizeBytes: number }[]>('GET', '/api/system/backups'),
  createBackup: () => request<{ name: string; sizeBytes: number }>('POST', '/api/system/backups'),
}

export type CmsSchema = { docs: DocDef[]; collections: CollectionDef[] }

export type DocStatus = 'publicado' | 'alterado' | 'novo' | 'sair'

export type DocMeta = {
  key: string
  collection: string | null
  group: string | null
  label: string
  route: string
  status: DocStatus
  position: number
  draftUpdatedAt: string
  draftUpdatedBy: string | null
  publishedAt: string | null
  publishedBy: string | null
  scheduledAt: string | null
  editingBy: string[]
  /** Escolhas de outras listas (assunto, destino…) de um item de coleção. */
  refs: Record<string, string>
  /** "Data de publicação" (AAAA-MM-DD) de um item de coleção, quando tem. */
  date: string | null
}

export type DocFull = DocMeta & { draft: Record<string, unknown>; published: Record<string, unknown> | null; draftDeleted: boolean }

export type VersionItem = { id: number; action: string; createdAt: string; createdBy: string | null; data: Record<string, unknown> | null }

export type HistoryItem = { id: number; key: string; label: string; action: string; createdAt: string; createdBy: string | null }

export type GeoResult = { label: string; detail: string; lat: number; lon: number }

export type SearchResult = { key: string; label: string; path: string; snippet: string; route: string }

export type MediaItem = {
  id: string
  url: string
  alt: string
  focal: [number, number]
  width: number
  height: number
  widths: number[]
  sizeBytes: number
  originalName: string
  createdAt: string
  createdBy: string | null
  deletedAt: string | null
  usedIn: { key: string; label: string; route: string; states: string[] }[]
}

export type SystemStatus = {
  role: Role
  lastBackupDownloadAt?: string | null
  needsBackupDownload?: boolean
  emailAlerts?: boolean
  warnings?: ActivityItem[]
}

/** As datas do servidor vêm em UTC sem fuso. */
export const parseDate = (iso: string) => new Date(iso.endsWith('Z') ? iso : iso + 'Z')

export function formatDateTime(iso: string) {
  return parseDate(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function timeAgo(iso: string) {
  const s = Math.round((Date.now() - parseDate(iso).getTime()) / 1000)
  if (s < 60) return 'agora mesmo'
  const m = Math.round(s / 60)
  if (m < 60) return `há ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  if (d < 30) return `há ${d} dia${d > 1 ? 's' : ''}`
  return formatDateTime(iso)
}
