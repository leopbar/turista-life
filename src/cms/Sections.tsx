import { Fragment, type ReactNode } from 'react'
import type { PageId } from './layoutDefs'
import { layouts } from './layouts'

/** Desenha as seções da página na ordem escolhida no painel, sem as desligadas.
 * Seção nova no código (que o painel ainda não conhece) aparece no fim. */
export function Sections({ page, items }: { page: PageId; items: Record<string, ReactNode> }) {
  const layout = layouts[page].sections
  const known = new Set(layout.map((s) => s.id))
  const order = [...layout.filter((s) => s.visible && s.id in items).map((s) => s.id), ...Object.keys(items).filter((id) => !known.has(id))]
  return (
    <>
      {order.map((id) => (
        <Fragment key={id}>{items[id]}</Fragment>
      ))}
    </>
  )
}
