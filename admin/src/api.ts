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

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryAfter?: number,
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
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET' && csrf) headers['X-CSRF-Token'] = csrf

  let res: Response
  try {
    res = await fetch(url, { method, headers, credentials: 'same-origin', body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, 'offline', 'Sem conexão com o servidor. Confira a internet e tente de novo.')
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = data?.detail ?? {}
    const err = new ApiError(res.status, d.code ?? 'error', d.message ?? 'Algo deu errado. Tente de novo.', d.retryAfter)
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
