import { layoutDefs, type PageId } from './layoutDefs'
import { doc } from './runtime'

export type Layout = { sections: { id: string; visible: boolean }[] }

/** Ordem e visibilidade das seções de cada página (documento "layout.<página>" no painel). */
export const layouts = Object.fromEntries(
  (Object.keys(layoutDefs) as PageId[]).map((page) => [
    page,
    doc<Layout>(`layout.${page}`, { sections: layoutDefs[page].sections.map(([id]) => ({ id, visible: true })) }),
  ]),
) as Record<PageId, Layout>
