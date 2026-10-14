/**
 * Blog: tipos, assuntos, destinos e a montagem dos artigos.
 * Os artigos ficam em ./articles (um arquivo por país) e foram escritos a partir dos vídeos
 * do canal youtube.com/@turistalife (out/2026). Textos provisórios: aguardam validação da Laura.
 *
 * Para publicar um artigo novo: crie o objeto no arquivo do país, com as fotos em
 * /public/images/blog. O índice, a página do destino, os relacionados e a busca se atualizam sozinhos.
 */
import { countries } from '../diaryContent'
import { productsPage, recsPage, type CatalogItem, type RecCategory, type RecItem } from '../pagesContent'
import { baliArticles } from './articles/bali'
import { tailandiaArticles } from './articles/tailandia'
import { australiaArticles } from './articles/australia'

/* ------------------------------------------------------------------ */
/* Assuntos                                                            */
/* ------------------------------------------------------------------ */

export type CategoryId = 'vale-a-pena' | 'onde-ficar' | 'quanto-custa' | 'transporte' | 'o-que-fazer' | 'erros' | 'experiencias' | 'curiosidades' | 'dicas'

export const blogCategories: { id: CategoryId; label: string }[] = [
  { id: 'vale-a-pena', label: 'Vale a pena visitar?' },
  { id: 'onde-ficar', label: 'Onde se hospedar' },
  { id: 'quanto-custa', label: 'Quanto custa' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'o-que-fazer', label: 'O que fazer' },
  { id: 'erros', label: 'Erros comuns' },
  { id: 'experiencias', label: 'Experiências' },
  { id: 'curiosidades', label: 'Curiosidades' },
  { id: 'dicas', label: 'Dicas práticas' },
]

export const categoryLabel = (id: CategoryId) => blogCategories.find((c) => c.id === id)!.label

/* ------------------------------------------------------------------ */
/* Recomendações e guias usados dentro dos artigos                     */
/* ------------------------------------------------------------------ */

/** Uma indicação real da página /recomendacoes, ou uma categoria ainda sem indicação ("Em breve"). */
export type RecRef = { cat: string; i?: number }

export type ResolvedRec = { kind: 'item'; item: RecItem; category: RecCategory } | { kind: 'soon'; category: RecCategory }

export function resolveRec(ref: RecRef): ResolvedRec | undefined {
  const category = recsPage.categories.find((c) => c.id === ref.cat)
  if (!category) return undefined
  const item = ref.i !== undefined ? category.items[ref.i] : undefined
  return item ? { kind: 'item', item, category } : { kind: 'soon', category }
}

export type GuideId = 'guia-bali' | 'guia-tailandia' | 'ebook-australia'

export const guideById = (id: GuideId): CatalogItem => productsPage.catalog.find((p) => p.id === id)!

/* ------------------------------------------------------------------ */
/* Blocos de texto dos artigos                                         */
/* ------------------------------------------------------------------ */

const blogImg = (f: string) => import.meta.env.BASE_URL + 'images/blog/' + f + '.jpg'
export { blogImg }

export type Img = { src: string; alt: string; position?: string }

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  /** `tall` para fotos verticais (dos shorts): aparecem em pé, centralizadas. */
  | { type: 'img'; image: Img; caption?: string; tall?: boolean }
  /** Fotos verticais (dos shorts), lado a lado. */
  | { type: 'gallery'; images: Img[]; caption?: string }
  | { type: 'tip'; title?: string; text: string }
  | { type: 'quote'; text: string }
  /** Tabela de preços: item e valor como ela falou no vídeo. */
  | { type: 'prices'; title: string; rows: { item: string; price: string }[]; note?: string }
  /** Vídeo do YouTube incorporado. `vertical` para shorts; `poster` é a foto exibida antes do play. */
  | { type: 'video'; id: string; title: string; vertical?: boolean; poster?: string }
  /** Chamada para o guia digital do destino (capa, descrição e botão). */
  | { type: 'guide'; id?: GuideId; text?: string }
  /** Recomendações com links de afiliado. */
  | { type: 'recs'; title?: string; items: RecRef[] }

export type Article = {
  slug: string
  title: string
  excerpt: string
  destination: DestinationId
  category: CategoryId
  cover: Img
  /** Quando ela esteve lá (aparece no topo do artigo). */
  trip: string
  blocks: Block[]
}

/* ------------------------------------------------------------------ */
/* Destinos                                                            */
/* ------------------------------------------------------------------ */

export type DestinationId = 'bali' | 'bangkok' | 'chiang-mai' | 'sydney' | 'perth'

export type Destination = {
  id: DestinationId
  name: string
  /** id do país em diaryContent.ts */
  country: 'indonesia' | 'tailandia' | 'australia'
  tagline: string
  intro: string
  facts: { label: string; value: string }[]
  image: string
  position?: string
  guide: GuideId
  recs: RecRef[]
  /** Paradas da rota em /destinos (âncoras). */
  stops: string[]
  videos: { id: string; title: string; duration?: string; poster: string; vertical?: boolean }[]
}

const thumb = (id: string) => `${import.meta.env.BASE_URL}images/videos/${id}.jpg`

export const destinations: Destination[] = [
  {
    id: 'bali',
    name: 'Bali',
    country: 'indonesia',
    tagline: 'Dois meses na ilha, sem filtro',
    intro: 'Bali foi a minha primeira parada depois de sair da Austrália e o lugar onde eu comecei a construir a minha vida trabalhando com a internet. Passei por Canggu, Ubud, Gili, Nusa Penida e Uluwatu. Aqui estão as regiões, os custos reais, os passeios que valem (e os que não valem) e tudo o que eu queria saber antes de chegar.',
    facts: [
      { label: 'Quando eu fui', value: 'Julho e agosto de 2026' },
      { label: 'Quanto tempo', value: 'Quase 2 meses (o máximo do visto de turista)' },
      { label: 'Regiões', value: 'Canggu, Ubud, Gili, Nusa Penida e Uluwatu' },
      { label: 'Moeda', value: 'Rupia indonésia' },
    ],
    image: blogImg('bali-regioes-nusa'),
    guide: 'guia-bali',
    recs: [{ cat: 'dinheiro', i: 0 }, { cat: 'passeios', i: 0 }, { cat: 'passagens', i: 0 }, { cat: 'seguros' }, { cat: 'internet' }],
    stops: ['canggu', 'ubud', 'gili', 'nusa-penida', 'uluwatu'],
    videos: [
      { id: 'qPqpePK8oFM', title: 'Larguei tudo pra tentar viver da internet! Essa é a realidade', duration: '30:19', poster: thumb('qPqpePK8oFM') },
      { id: '-JAjCDJhsPw', title: 'O lado de Bali que a internet esconde', duration: '22:01', poster: thumb('-JAjCDJhsPw') },
      { id: '8B9nxMnWFlE', title: 'Conheci o lado mais famoso de Bali… e me decepcionei', duration: '24:29', poster: thumb('8B9nxMnWFlE') },
      { id: 'TtBuGZLTSog', title: 'A realidade dos lugares mais paradisíacos de Bali', duration: '40:32', poster: thumb('TtBuGZLTSog') },
      { id: 'rtEBiuBCNxE', title: 'Depois de 2 meses em Bali, fui parar onde menos esperava', duration: '30:33', poster: thumb('rtEBiuBCNxE') },
    ],
  },
  {
    id: 'bangkok',
    name: 'Bangkok',
    country: 'tailandia',
    tagline: 'Templos, mercados e muita informação',
    intro: 'A primeira parada da minha temporada pela Ásia. Cheguei em plena época de chuva, com enchente, e mesmo assim Bangkok me surpreendeu muito mais do que eu esperava. Aqui tem o que eu queria saber antes de chegar, quanto custa cada passeio e o que eu faria diferente.',
    facts: [
      { label: 'Quando eu fui', value: 'Fim de setembro de 2026' },
      { label: 'Quanto tempo', value: '1 semana' },
      { label: 'Destaques', value: 'Templos, Talat Noi, Song Wat, Mercado do Trem' },
      { label: 'Moeda', value: 'Baht tailandês' },
    ],
    image: blogImg('bangkok-mercados-capa'),
    guide: 'guia-tailandia',
    recs: [{ cat: 'passeios', i: 1 }, { cat: 'dinheiro', i: 0 }, { cat: 'passagens', i: 0 }, { cat: 'internet' }, { cat: 'seguros' }],
    stops: ['bangkok'],
    videos: [
      { id: 'Hc4nMTf6fDg', title: 'Cheguei SOZINHA na Tailândia… e não era o que eu imaginava', duration: '41:00', poster: thumb('Hc4nMTf6fDg') },
      { id: 'r2Crin2dNoA', title: 'O que eu queria saber antes de chegar em Bangkok', poster: blogImg('bangkok-dicas-songwat'), vertical: true },
      { id: 'KRsdL9T0z2s', title: 'Quanto custa conhecer os 3 templos de Bangkok?', poster: blogImg('bangkok-templos-arun'), vertical: true },
      { id: 'LQ7FwzQfq14', title: 'Conheci os mercados mais famosos da Tailândia por menos de R$ 100', poster: blogImg('bangkok-mercados-capa'), vertical: true },
    ],
  },
  {
    id: 'chiang-mai',
    name: 'Chiang Mai',
    country: 'tailandia',
    tagline: 'O norte da Tailândia, com mais calma',
    intro: 'Depois do caos de Bangkok, Chiang Mai foi onde eu consegui desacelerar. É uma cidade de montanha, histórica e cheia de templos, e a base perfeita para um bate-volta até Chiang Rai, que destruiu a imagem que eu tinha de templo tailandês.',
    facts: [
      { label: 'Quando eu fui', value: 'Início de outubro de 2026' },
      { label: 'Quanto tempo', value: '1 semana' },
      { label: 'Destaque', value: 'Bate-volta a Chiang Rai' },
      { label: 'Moeda', value: 'Baht tailandês' },
    ],
    image: blogImg('chiang-rai-capa'),
    guide: 'guia-tailandia',
    recs: [{ cat: 'passeios', i: 0 }, { cat: 'dinheiro', i: 0 }, { cat: 'internet' }],
    stops: ['chiang-mai'],
    videos: [{ id: 'GC5yz_90vIE', title: 'Os templos mais famosos da Tailândia me surpreenderam', poster: blogImg('chiang-rai-azul'), vertical: true }],
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'australia',
    tagline: 'A cidade que foi minha casa por 3 anos e meio',
    intro: 'Eu morei em Sydney de 2022 a 2026 e voltei como turista para conhecer o meu sobrinho. Aqui eu conto o que ninguém resume direito: quanto se ganha, quanto se gasta, como é a qualidade de vida e o outro lado de ser imigrante na Austrália.',
    facts: [
      { label: 'Quanto tempo', value: '3 anos e meio morando + algumas semanas como turista' },
      { label: 'Quando eu voltei', value: 'Setembro de 2026' },
      { label: 'Custo de vida', value: 'Cerca de A$ 700 por semana (o meu)' },
      { label: 'Moeda', value: 'Dólar australiano' },
    ],
    image: blogImg('australia-capa'),
    position: '50% 40%',
    guide: 'ebook-australia',
    recs: [{ cat: 'australia', i: 0 }, { cat: 'dinheiro', i: 0 }, { cat: 'passagens', i: 0 }, { cat: 'seguros' }],
    stops: ['sydney'],
    videos: [
      { id: 'hKqoB9HA9uM', title: 'O país onde todo brasileiro quer morar!', duration: '23:38', poster: thumb('hKqoB9HA9uM') },
      { id: 'pwwxtfpaVNs', title: 'Por que estou indo embora da Austrália?', duration: '24:36', poster: thumb('pwwxtfpaVNs') },
    ],
  },
  {
    id: 'perth',
    name: 'Perth',
    country: 'australia',
    tagline: 'A cidade grande mais isolada do mundo',
    intro: 'Perth entrou no roteiro quase por acaso: voar de Bali para Sydney com escala em Perth saiu mais barato que o voo direto. Fiquei alguns dias e entendi por que ela aparece em todo ranking de melhores cidades para viver.',
    facts: [
      { label: 'Quando eu fui', value: 'Fim de agosto de 2026' },
      { label: 'Quanto tempo', value: 'Alguns dias' },
      { label: 'Por que fui', value: 'Escala mais barata entre Bali e Sydney' },
      { label: 'Moeda', value: 'Dólar australiano' },
    ],
    image: blogImg('perth-capa'),
    position: '50% 35%',
    guide: 'ebook-australia',
    recs: [{ cat: 'passagens', i: 0 }, { cat: 'dinheiro', i: 0 }, { cat: 'seguros' }],
    stops: ['perth'],
    videos: [{ id: 'ZjmwiuHKxwU', title: 'Eu vim parar na cidade grande mais isolada do mundo', poster: blogImg('perth-rio'), vertical: true }],
  },
]

export const destinationById = (id: string) => destinations.find((d) => d.id === id)

export const countryName = (id: Destination['country']) => countries.find((c) => c.id === id)?.name ?? id

/** Países na ordem da rota, com os destinos de cada um. */
export const blogCountries = [...new Set(destinations.map((d) => d.country))].map((id) => ({
  id,
  name: countryName(id),
  destinations: destinations.filter((d) => d.country === id),
}))

/* ------------------------------------------------------------------ */
/* Artigos                                                             */
/* ------------------------------------------------------------------ */

export const articles: Article[] = [...baliArticles, ...tailandiaArticles, ...australiaArticles]

export const articleBySlug = (slug: string) => articles.find((a) => a.slug === slug)

export const articlesOf = (destination: DestinationId) => articles.filter((a) => a.destination === destination)

/** Tempo de leitura: ~200 palavras por minuto. */
export function readingMinutes(a: Article) {
  const text = a.blocks
    .map((b) => ('text' in b ? b.text : b.type === 'list' ? b.items.join(' ') : b.type === 'prices' ? b.rows.map((r) => r.item).join(' ') : ''))
    .join(' ')
  return Math.max(2, Math.round(text.split(/\s+/).length / 200))
}

/** Relacionados: primeiro do mesmo destino, depois do mesmo país. */
export function relatedTo(a: Article, limit = 3) {
  const country = destinationById(a.destination)!.country
  const same = articles.filter((x) => x.slug !== a.slug && x.destination === a.destination)
  const near = articles.filter((x) => x.slug !== a.slug && x.destination !== a.destination && destinationById(x.destination)!.country === country)
  return [...same, ...near].slice(0, limit)
}

export const blogPage = {
  hero: {
    eyebrow: 'Blog',
    script: 'Guias de quem esteve lá',
    title: 'Dicas práticas, custos reais e o que eu faria diferente',
    text: 'Tudo o que eu vivi em cada destino, organizado por país e por assunto: onde ficar, quanto custa, como se locomover, o que vale a pena e os erros que eu cometi para você não cometer.',
    image: blogImg('bali-regioes-capa'),
    position: '50% 40%',
  },
  disclosure: recsPage.disclosure,
  soonRec: 'Ainda estou escolhendo a minha indicação para esta categoria. Em breve aparece aqui.',
}
