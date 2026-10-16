/**
 * Índice da busca do site, montado a partir dos mesmos arquivos de conteúdo.
 * Tudo que for adicionado em content.ts, pagesContent.ts ou diaryContent.ts entra na busca sozinho.
 */
import { allMilestones, allStops, countries, diaryPage, ytUrl } from '../diaryContent'
import { mediaKit, productsPage, recsPage } from '../pagesContent'
import { articles, categoryLabel, countryName, destinationById, destinations } from '../blog/blogData'

export type SearchGroup = 'Páginas' | 'Blog' | 'Diário' | 'Produtos' | 'Recomendações' | 'Vídeos' | 'Dúvidas'

export type SearchItem = {
  id: string
  group: SearchGroup
  title: string
  subtitle?: string
  href: string
  /** Palavras extras que também devem encontrar o item (não aparecem na tela). */
  keywords?: string
}

export const GROUP_ORDER: SearchGroup[] = ['Páginas', 'Blog', 'Diário', 'Produtos', 'Recomendações', 'Vídeos', 'Dúvidas']

const pages: SearchItem[] = [
  { id: 'p-home', group: 'Páginas', title: 'Início', subtitle: 'Página inicial', href: '/', keywords: 'home turista life laura' },
  { id: 'p-sobre', group: 'Páginas', title: 'Sobre mim', subtitle: 'A história da Laura', href: '/sobre', keywords: 'laura irigoyen porto alegre historia quem turismo working holiday' },
  { id: 'p-diario', group: 'Páginas', title: 'Diário', subtitle: 'A rota, os guias por país e os vídeos', href: '/diario', keywords: 'diario de bordo blog jornada viagem mapa rota timeline linha do tempo episodio' },
  { id: 'p-blog', group: 'Páginas', title: 'Blog', subtitle: 'Guias, dicas e custos por destino', href: '/blog', keywords: 'artigos posts dicas roteiro quanto custa onde ficar transporte' },
  { id: 'p-produtos', group: 'Páginas', title: 'Produtos', subtitle: 'E-books, guias e materiais gratuitos', href: '/produtos', keywords: 'loja comprar ebook guia' },
  { id: 'p-recs', group: 'Páginas', title: 'Recomendações', subtitle: 'O que eu uso para viajar e trabalhar', href: '/recomendacoes', keywords: 'cupom desconto afiliado indicacoes' },
  { id: 'p-midia', group: 'Páginas', title: 'Parcerias', subtitle: 'Mídia kit e contato para marcas', href: '/parcerias', keywords: 'midia kit marcas parceria publicidade publi ugc contato comercial numeros seguidores' },
  { id: 'p-newsletter', group: 'Páginas', title: 'Newsletter', subtitle: 'Dicas, roteiros e cupons por e-mail', href: '/#newsletter', keywords: 'newsletter email e-mail inscrever novidades cupons dicas' },
  ...allMilestones.map((m) => ({
    id: `p-${m.id}`,
    group: 'Páginas' as const,
    title: `Fechamento do ${m.month.split(' · ')[0]}`,
    subtitle: `Quanto ganhei em ${m.month.split(' · ')[1]}`,
    href: `/diario#${m.id}`,
    keywords: 'renda dinheiro ganhei liberdade geografica meta mes resultados',
  })),
]

const destinationItems: SearchItem[] = [
  ...countries.map((c) => ({
    id: `c-${c.id}`,
    group: 'Diário' as const,
    title: c.name,
    subtitle: c.period,
    href: `/diario#${c.id}`,
    keywords: c.id === 'indonesia' ? 'bali' : '',
  })),
  ...allStops.map((s) => {
    const country = countries.find((c) => c.items.includes(s))
    return {
      id: `s-${s.id}`,
      group: 'Diário' as const,
      title: s.city,
      subtitle: `${country?.name ?? ''} · ${s.current ? 'onde estou agora' : s.stay}`,
      href: `/diario#${s.id}`,
      keywords: `${country?.name ?? ''} ${s.highlights.join(' ')}`,
    }
  }),
]


const blogItems: SearchItem[] = [
  ...destinations.map((d) => ({
    id: `bd-${d.id}`,
    group: 'Blog' as const,
    title: `${d.name}: guia do destino`,
    subtitle: `${countryName(d.country)} · artigos, vídeos e recomendações`,
    href: `/blog/destino/${d.id}`,
    keywords: `${d.tagline} ${d.intro}`,
  })),
  ...articles.map((a) => {
    const d = destinationById(a.destination)!
    return {
      id: `ba-${a.slug}`,
      group: 'Blog' as const,
      title: a.title,
      subtitle: `${d.name} · ${categoryLabel(a.category)}`,
      href: `/blog/${a.slug}`,
      keywords: `${d.name} ${countryName(d.country)} ${a.excerpt}`,
    }
  }),
]

const productItems: SearchItem[] = [...productsPage.catalog, ...productsPage.free].map((p) => ({
  id: `pr-${p.id}`,
  group: 'Produtos',
  title: p.title,
  subtitle: p.kind + (p.status === 'soon' ? ' · em breve' : p.status === 'planned' ? ' · em produção' : p.status === 'free' ? ' · grátis' : p.price ? ` · ${p.price}` : ''),
  href: p.page ?? `/produtos#${p.id}`,
  keywords: `${p.text} ${p.cover.title}`,
}))

const recItems: SearchItem[] = recsPage.categories.flatMap((g) =>
  g.items.map((r, i) => ({
    id: `r-${g.id}-${i}`,
    group: 'Recomendações' as const,
    title: r.title,
    subtitle: r.coupon ? `Cupom ${r.coupon}` : g.title,
    href: `/recomendacoes#${g.id}`,
    keywords: `${g.title} ${r.brand.name} ${r.coupon ?? ''} ${r.perk ?? ''} ${r.why}`,
  })),
)

const videos = new Map<string, SearchItem>()
const addVideo = (v: { id: string; title: string; duration: string }, where: string) => {
  if (!videos.has(v.id)) {
    videos.set(v.id, { id: `v-${v.id}`, group: 'Vídeos', title: v.title, subtitle: `${where} · ${v.duration}`, href: ytUrl(v.id), keywords: 'youtube video assistir' })
  }
}
addVideo(diaryPage.departure.video, 'Sydney')
allStops.forEach((s) => s.videos.forEach((v) => addVideo(v, s.city)))
allMilestones.forEach((m) => addVideo(m.video, m.month))

const faq: SearchItem[] = productsPage.faq.map((f, i) => ({
  id: `f-${i}`,
  group: 'Dúvidas',
  title: f.q,
  subtitle: 'Perguntas frequentes',
  href: '/produtos#faq',
  keywords: f.a,
}))

const extras: SearchItem[] = [
  { id: 'x-contato', group: 'Páginas', title: 'Contato comercial', subtitle: mediaKit.contact.email, href: '/parcerias', keywords: 'email parceria marca falar' },
]

export const SEARCH_INDEX: SearchItem[] = [...pages, ...blogItems, ...destinationItems, ...productItems, ...recItems, ...videos.values(), ...faq, ...extras]

/** Sugestões quando o campo ainda está vazio. */
export const POPULAR = ['p-diario', 'c-indonesia', 'pr-ebook-australia', 'r-dinheiro-0', 's-krabi']
  .map((id) => SEARCH_INDEX.find((i) => i.id === id))
  .filter(Boolean) as SearchItem[]

/* ------------------------------------------------------------------ */

/** Minúsculas e sem acento: "Tailândia" → "tailandia". */
export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const words = (s: string) => normalize(s).split(/[^a-z0-9]+/).filter(Boolean)

const prepared = SEARCH_INDEX.map((item) => ({
  item,
  title: normalize(item.title),
  titleWords: words(item.title),
  restWords: words(`${item.subtitle ?? ''} ${item.keywords ?? ''}`),
}))

/**
 * Cada palavra digitada precisa ser o começo de alguma palavra do item.
 * Título pesa mais que subtítulo e palavras-chave.
 */
export function search(query: string, limit = 8): SearchItem[] {
  const terms = words(query)
  if (!terms.length) return []
  const q = normalize(query.trim())
  const scored: { item: SearchItem; score: number }[] = []
  for (const p of prepared) {
    let score = 0
    let ok = true
    for (const t of terms) {
      if (p.titleWords.some((w) => w.startsWith(t))) score += 10
      else if (p.restWords.some((w) => w.startsWith(t))) score += 3
      else { ok = false; break }
    }
    if (!ok) continue
    if (p.title.startsWith(q)) score += 20
    scored.push({ item: p.item, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || GROUP_ORDER.indexOf(a.item.group) - GROUP_ORDER.indexOf(b.item.group))
    .slice(0, limit)
    .map((s) => s.item)
}
