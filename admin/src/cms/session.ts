import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, api, type DocFull, type Problem } from '../api'
import { getAt, setAt } from './model'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Campos (primeiro nível) que outra pessoa mudou e o servidor juntou: entram no rascunho local sem apagar o que foi digitado depois. */
function adopt(local: Record<string, unknown>, sent: Record<string, unknown>, merged: Record<string, unknown>) {
  let out = local
  for (const k of new Set([...Object.keys(sent), ...Object.keys(merged)])) {
    if (same(merged[k], sent[k]) || !same(local[k], sent[k])) continue
    out = { ...out }
    if (k in merged) out[k] = merged[k]
    else delete out[k]
  }
  return out
}

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
  // O rascunho como o servidor tem: vai junto ao salvar para o servidor juntar edições de duas pessoas.
  const base = useRef<unknown>(null)
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
      const { draft: merged, ...meta } = await api.saveDraft(p.key, p.draft, base.current)
      base.current = merged
      if (!same(merged, p.draft)) {
        // Outra pessoa tinha mudado outros campos: eles aparecem aqui também.
        const sent = p.draft as Record<string, unknown>
        setDraftState((cur) => {
          if (!cur) return cur
          const next = adopt(cur, sent, merged)
          if (next !== cur) onDraftRef.current?.(p.key, next)
          return next
        })
        // Algo digitado enquanto salvava (pending.current pode ter mudado durante o await).
        const next = pending.current as { key: string; draft: unknown } | null
        if (next?.key === p.key) pending.current = { key: p.key, draft: adopt(next.draft as Record<string, unknown>, sent, merged) }
      }
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
    base.current = d.draft
    pending.current = null
    setDoc(d)
    setDraftState(d.draft)
    setEditingBy(d.editingBy)
    setProblems({})
    setMessage(null)
    setSave('idle')
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
      base.current = d.draft
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

  /** Erros vindos de outra ação (ex.: publicar com campo obrigatório vazio) destacam os campos também. */
  const showProblems = useCallback((list: Problem[]) => {
    if (list.length) setProblems(Object.fromEntries(list.map((x) => [x.path, x.message])))
  }, [])

  return { doc, draft, setDraft, update, value, save, problems, message, editingBy, flush, reload, setDoc, showProblems }
}

export type DocSession = ReturnType<typeof useDocSession>
