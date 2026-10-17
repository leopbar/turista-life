import type { Block } from '../blog/blogData'
import { collection } from './runtime'

/** Blocos das páginas criadas no painel: os mesmos dos artigos, mais capa, cards e botão. */
export type PageBlock =
  | Block
  | { type: 'hero'; eyebrow?: string; title: string; text?: string; image: string; position?: string }
  | { type: 'cards'; title?: string; items: { image: string; title: string; text: string; href?: string; button?: string }[] }
  | { type: 'button'; label: string; href: string; style: 'sun' | 'pine' | 'outline' }

export type CustomPage = { slug: string; title: string; description?: string; blocks: PageBlock[] }

/** Páginas novas, criadas no painel (endereço: /<slug>). */
export const customPages = collection<CustomPage>('page', [], (p) => p.slug)
export const customPageBySlug = (slug: string) => customPages.find((p) => p.slug === slug)
