import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, api, type DocFull } from '../api'
import { getAt, setAt } from './model'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Um documento aberto para edição: rascunho local, salvamento automático (rascunho),
 * erros por campo e o aviso de quem mais está editando.
 */
export function useDocSession(key: string | null, onDraft?: (key: string, draft: unknown) => void) {
  const [doc, setDoc] = useState<DocFull | null>(null)
  const [draft, setDraftState] = useState<Record<string, unknown> | null>(null)
  const [save, setSave] = useState<SaveState>('idle')
  const [problems, setProblems] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [editingBy, setEditingBy] = useState<string[]>([])
  const pending = useRef<{ key: string; draft: unknown } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const onDraftRef = useRef(onDraft)
  onDraftRef.current = onDraft

  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    const p = pending.current
    if (!p) return true
    pending.current = null
    setSave('saving')
    try {
      const meta = await api.saveDraft(p.key, p.draft)
      setDoc((d) => (d && d.key === p.key ? { ...d, ...meta } : d))
      setProblems({})
      setMessage(null)
      setSave('saved')
      return true
    } catch (err) {
      if (err instanceof ApiError) {
        setProblems(Object.fromEntries(err.problems.map((x) => [x.path, x.message])))
        setMessage(err.message)
      }
      setSave('error')
      return false
    }
  }, [])

  const reload = useCallback(async () => {
    if (!key) return
    const d = await api.getDoc(key)
    setDoc(d)
    setDraftState(d.draft)
    setEditingBy(d.editingBy)
    // Descartar ou voltar uma versão muda o rascunho: a pré-visualização acompanha.
    onDraftRef.current?.(key, d.draft)
  }, [key])

  useEffect(() => {
    setDoc(null)
    setDraftState(null)
    setProblems({})
    setMessage(null)
    setSave('idle')
    if (!key) return
    let alive = true
    api.getDoc(key).then((d) => {
      if (!alive) return
      setDoc(d)
      setDraftState(d.draft)
      setEditingBy(d.editingBy)
    }).catch((err) => alive && setMessage(err instanceof ApiError ? err.message : 'Não foi possível abrir.'))
    // Aviso "fulano está editando": avisa o servidor a cada 20 s.
    const beat = () => api.presence(key).then((r) => alive && setEditingBy(r.editingBy)).catch(() => {})
    beat()
    const id = setInterval(beat, 20_000)
    return () => {
      alive = false
      clearInterval(id)
      flush()
    }
  }, [key, flush])

  const setDraft = useCallback((next: Record<string, unknown>) => {
    if (!key) return
    setDraftState(next)
    onDraftRef.current?.(key, next)
    pending.current = { key, draft: next }
    setSave('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, 800)
  }, [key, flush])

  const update = useCallback((path: string, value: unknown) => {
    setDraftState((cur) => {
      if (!cur || !key) return cur
      const next = setAt(cur, path, value)
      onDraftRef.current?.(key, next)
      pending.current = { key, draft: next }
      setSave('saving')
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, 800)
      return next
    })
  }, [key, flush])

  const value = useCallback((path: string) => getAt(draft, path), [draft])

  return { doc, draft, setDraft, update, value, save, problems, message, editingBy, flush, reload, setDoc }
}

export type DocSession = ReturnType<typeof useDocSession>
