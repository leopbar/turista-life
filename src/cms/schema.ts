/**
 * Mapa de todo o conteúdo editável do site, documento por documento.
 * A chave de cada documento é a mesma usada em doc()/collection() nos arquivos de conteúdo.
 */
import {
  bool, button, cover, cta, heroFields, image, list, long, num, obj, opt, position, ref, sectionHead, select, text, texts, url,
  type CollectionDef, type DocDef, type Field, type Fields,
} from './fields'
import { layoutDefs } from './layoutDefs'

/* ------------------------------------------------------------------ */
/* Peças repetidas                                                     */
/* ------------------------------------------------------------------ */

const img: Field = obj('Foto', { src: image('Foto'), alt: text('O que aparece nesta foto?'), position: position() })
const video: Field = obj('Vídeo', { id: { kind: 'video', label: 'Código do vídeo no YouTube' }, title: text('Título do vídeo'), duration: opt(text('Duração (ex.: 24:36)')) })
const qa: Field = list('Perguntas frequentes', obj('Pergunta', { q: text('Pergunta'), a: long('Resposta') }), { itemTitle: 'q', itemLabel: 'Pergunta' })
const recRef: Field = list(
  'Recomendações',
  obj('Recomendação', {
    cat: ref('Categoria', 'recomendacoes.page', 'categories', 'title'),
    i: opt(num('Qual item da categoria (0 = primeiro). Vazio = "Em breve"', { min: 0 })),
  }),
  { itemTitle: 'cat', itemLabel: 'Recomendação' },
)
const statusOptions: [string, string][] = [['available', 'À venda'], ['soon', 'Em breve (com lista de espera)'], ['planned', 'Em produção'], ['free', 'Grátis']]

const catalogItem: Field = obj('Produto', {
  id: { kind: 'slug', label: 'Identificador' },
  kind: text('Tipo (ex.: E-book)'),
  title: text('Nome'),
  text: long('Descrição'),
  status: select('Situação', statusOptions),
  price: opt(text('Preço (ex.: R$ 49)')),
  cta: opt(text('Texto do botão')),
  href: opt(url('Link de compra')),
  page: opt(url('Página do produto (ex.: /produtos/guia-de-bali)')),
  notify: opt(long('Mensagem depois de entrar na lista de espera')),
  cover: cover(),
})

/* ------------------------------------------------------------------ */
/* Documentos                                                          */
/* ------------------------------------------------------------------ */

export const docs: DocDef[] = [
  /* Geral -------------------------------------------------------------- */
  {
    key: 'geral.nav', label: 'Menu do site', group: 'geral', route: '/',
    fields: { items: list('Itens do menu', obj('Item', { label: text('Nome no menu'), href: url('Página') }), { itemTitle: 'label', itemLabel: 'Item do menu' }) },
  },
  {
    key: 'geral.links', label: 'Redes sociais e contato', group: 'geral', route: '/',
    fields: { youtube: url('YouTube'), instagram: url('Instagram'), tiktok: url('TikTok'), email: text('E-mail de contato') },
  },
  {
    key: 'geral.newsletter', label: 'Newsletter', group: 'geral', route: '/',
    fields: {
      eyebrow: text('Chamada acima do título'), title: text('Título'), bullets: texts('Vantagens', 'Vantagem'), cta: text('Texto do botão'),
      sending: text('Mensagem enquanto envia'), sent: long('Mensagem de sucesso'), invalid: long('Mensagem de e-mail inválido'),
      error: long('Mensagem de erro'), privacy: text('Aviso de privacidade'),
    },
  },
  {
    key: 'geral.footer', label: 'Rodapé', group: 'geral', route: '/',
    fields: { tagline: long('Frase do rodapé'), newsletter: text('Chamada da newsletter'), sent: long('Mensagem de sucesso da newsletter') },
  },
  {
    key: 'geral.textos', label: 'Títulos e textos fixos', group: 'geral', route: '/',
    // Preenchido sozinho com os textos t('…') espalhados pelos componentes (scripts/export-cms.mjs).
    fields: {},
  },

  /* Início ------------------------------------------------------------- */
  {
    key: 'inicio.hero', label: 'Capa (topo da página inicial)', group: 'inicio', route: '/',
    fields: {
      title: text('Título'), subtitle: text('Subtítulo'), text: long('Texto'),
      cta: button('Botão principal'), story: button('Botão do vídeo'),
      signature: texts('Frase em letra cursiva (uma linha por item)', 'Linha'),
      image: image('Foto da capa'),
    },
  },
  {
    key: 'inicio.about', label: 'Como tudo começou', group: 'inicio', route: '/',
    fields: {
      eyebrow: text('Chamada acima do título'), title: text('Título'), paragraphs: texts('Parágrafos', 'Parágrafo'), cta: button(),
      polaroid: obj('Foto polaroide', { image: image('Foto'), caption: texts('Legenda (uma linha por item)', 'Linha') }),
    },
  },
  {
    key: 'inicio.journey', label: 'Em qual episódio estamos', group: 'inicio', route: '/',
    fields: { eyebrow: text('Chamada acima do título'), title: text('Título'), text: long('Texto'), cta: button() },
  },
  {
    key: 'inicio.products', label: 'Produtos (na página inicial)', group: 'inicio', route: '/',
    fields: {
      eyebrow: text('Chamada acima do título'), title: text('Título'), text: long('Texto'),
      items: list('Produtos', obj('Produto', {
        kind: text('Tipo'), title: text('Nome'), text: long('Descrição'), price: opt(text('Preço')), note: opt(text('Observação (ex.: garantia)')),
        cta: text('Texto do botão'), href: url('Link'), cover: cover(), soon: bool('Mostrar como "Em breve"'),
      }), { itemTitle: 'title', itemLabel: 'Produto' }),
    },
  },
  {
    key: 'inicio.recommendations', label: 'Recomendações (na página inicial)', group: 'inicio', route: '/',
    fields: { eyebrow: text('Chamada acima do título'), title: text('Título'), text: long('Texto') },
  },
  {
    key: 'inicio.brands', label: 'Para marcas (na página inicial)', group: 'inicio', route: '/',
    fields: {
      eyebrow: text('Chamada acima do título'), title: text('Título'), text: long('Texto'),
      stats: list('Números', obj('Número', {
        icon: select('Ícone', [['ig', 'Instagram'], ['play', 'Vídeo'], ['users', 'Pessoas']]), value: text('Número'), label: text('Descrição'),
      }), { itemTitle: 'value', itemLabel: 'Número' }),
      cta: button('Botão principal'), secondary: button('Botão secundário'), image: image('Foto'),
    },
  },
  {
    key: 'inicio.diary', label: 'Diário (na página inicial)', group: 'inicio', route: '/',
    fields: {
      eyebrow: text('Chamada acima do título'), title: text('Título'), text: long('Texto'), cta: button(),
      posts: list('Vídeos em destaque', obj('Vídeo', { tag: text('País'), title: text('Título'), image: image('Foto'), href: url('Link do vídeo') }), { itemTitle: 'title', itemLabel: 'Vídeo' }),
    },
  },

  /* Sobre -------------------------------------------------------------- */
  {
    key: 'sobre.page', label: 'Página Sobre mim', group: 'sobre', route: '/sobre',
    fields: {
      hero: heroFields(true),
      intro: obj('Apresentação', {
        hello: text('Saudação em letra cursiva'), paragraphs: texts('Parágrafos', 'Parágrafo'),
        portrait: obj('Retrato', { src: image('Foto'), alt: text('O que aparece nesta foto?'), caption: text('Legenda') }),
        facts: texts('Etiquetas', 'Etiqueta'),
      }),
      timeline: list('Linha do tempo', obj('Momento', {
        when: text('Quando'), title: text('Título'), text: long('Texto'), link: opt(button('Link (opcional)')),
      }), { itemTitle: 'title', itemLabel: 'Momento' }),
      jobs: obj('Trabalhos na Austrália', {
        title: text('Título'), text: long('Texto'),
        items: list('Trabalhos', obj('Trabalho', { title: text('Título'), text: long('Texto') }), { itemTitle: 'title', itemLabel: 'Trabalho' }),
        cta: button(),
      }),
      values: obj('No que eu acredito', {
        title: text('Título'),
        items: list('Valores', obj('Valor', { title: text('Título'), text: long('Texto') }), { itemTitle: 'title', itemLabel: 'Valor' }),
      }),
      quote: obj('Citação', { text: long('Citação'), author: text('Autora'), image: image('Foto de fundo') }),
      facts: obj('Curiosidades', {
        title: text('Título'),
        items: list('Curiosidades', obj('Curiosidade', { title: text('Título'), text: long('Texto') }), { itemTitle: 'title', itemLabel: 'Curiosidade' }),
      }),
      behind: obj('Por trás de cada vídeo', { title: text('Título'), text: long('Texto'), steps: texts('Etapas', 'Etapa'), image: image('Foto') }),
      cta: cta(),
    },
  },

  /* Produtos ----------------------------------------------------------- */
  {
    key: 'produtos.page', label: 'Página Produtos', group: 'produtos', route: '/produtos',
    fields: {
      hero: heroFields(),
      available: sectionHead('Seção "Disponíveis agora"'),
      upcoming: sectionHead('Seção "Próximos lançamentos"'),
      waitlistUrl: opt(url('Página de inscrição da lista de espera (MailerLite)')),
      catalog: list('Catálogo', catalogItem, { itemTitle: 'title', itemLabel: 'Produto' }),
      freeSection: sectionHead('Seção "Materiais gratuitos"'),
      free: list('Materiais gratuitos', catalogItem, { itemTitle: 'title', itemLabel: 'Material' }),
      faq: qa,
      cta: cta(),
    },
  },

  /* Recomendações ------------------------------------------------------ */
  {
    key: 'recomendacoes.page', label: 'Página Recomendações', group: 'recomendacoes', route: '/recomendacoes',
    fields: {
      hero: heroFields(true),
      categories: list('Categorias', obj('Categoria', {
        id: { kind: 'slug', label: 'Identificador' },
        title: text('Título'), label: text('Nome curto (no filtro)'),
        icon: select('Ícone', [['card', 'Cartão'], ['bed', 'Cama'], ['plane', 'Avião'], ['ticket', 'Ingresso'], ['sim', 'Chip'], ['shield', 'Escudo'], ['car', 'Carro'], ['laptop', 'Notebook'], ['passport', 'Passaporte']]),
        items: list('Indicações', obj('Indicação', {
          brand: obj('Marca', { name: text('Nome da marca'), logo: opt(image('Logo')) }),
          image: image('Foto'), position: position(), place: opt(text('Onde eu usei (letra cursiva)')),
          title: text('Título'), why: long('Por que eu uso'), perk: opt(text('Vantagem')), coupon: opt(text('Cupom')),
          cta: text('Texto do botão'), href: url('Link de afiliado'),
          featured: bool('Mostrar também na página inicial'), hidden: bool('Esconder da página (continua nos artigos)'),
        }), { itemTitle: 'title', itemLabel: 'Indicação' }),
      }), { itemTitle: 'title', itemLabel: 'Categoria' }),
      soon: long('Texto das categorias sem indicação'),
      tips: obj('Minhas regras para gastar menos', {
        title: text('Título'), items: texts('Regras', 'Regra'),
        photo: obj('Foto polaroide', { image: image('Foto'), alt: text('O que aparece nesta foto?'), caption: text('Legenda') }),
      }),
      disclosure: long('Aviso de links de afiliado'),
      cta: cta(),
    },
  },

  /* Parcerias ---------------------------------------------------------- */
  {
    key: 'parcerias.page', label: 'Página Parcerias', group: 'parcerias', route: '/parcerias',
    fields: {
      hero: heroFields(),
      updated: text('Data dos números'),
      stats: list('Números', obj('Número', { value: text('Número'), label: text('Descrição'), note: text('Observação') }), { itemTitle: 'value', itemLabel: 'Número' }),
      about: obj('Quem é a Laura', { title: text('Título'), paragraphs: texts('Parágrafos', 'Parágrafo'), image: image('Foto') }),
      audience: list('Audiência', obj('Bloco', { title: text('Título'), text: long('Texto') }), { itemTitle: 'title', itemLabel: 'Bloco' }),
      audienceData: list('Dados de audiência', obj('Grupo', {
        title: text('Título'),
        items: list('Dados', obj('Dado', { value: text('Valor'), label: text('Descrição'), note: opt(text('Observação')) }), { itemTitle: 'label', itemLabel: 'Dado' }),
      }), { itemTitle: 'title', itemLabel: 'Grupo' }),
      pillars: list('Pilares', obj('Pilar', { title: text('Título'), text: long('Texto'), brands: long('Para marcas de'), image: image('Foto') }), { itemTitle: 'title', itemLabel: 'Pilar' }),
      formatGroups: list('Formatos', obj('Grupo', { title: text('Título'), text: long('Texto'), items: texts('Formatos', 'Formato') }), { itemTitle: 'title', itemLabel: 'Grupo' }),
      fits: texts('Marcas que combinam', 'Segmento'),
      steps: list('Etapas', obj('Etapa', { title: text('Título'), text: long('Texto') }), { itemTitle: 'title', itemLabel: 'Etapa' }),
      contact: obj('Contato', { title: text('Título'), text: long('Texto'), email: text('E-mail'), cta: button(), image: image('Foto de fundo') }),
    },
  },

  /* Diário ------------------------------------------------------------- */
  {
    key: 'diario.page', label: 'Página Diário', group: 'diario', route: '/diario',
    fields: {
      hero: heroFields(),
      goal: num('Meta de renda mensal (US$)', { min: 0 }),
      startDate: { kind: 'date', label: 'Início da viagem' },
      departure: obj('Ponto de partida', { title: text('Título'), place: text('Lugar'), period: text('Quando'), text: long('Texto'), image: image('Foto'), video }),
      next: obj('Próximo destino', { title: text('Título'), text: long('Texto') }),
    },
  },
  {
    key: 'diario.countries', label: 'Rota: países e paradas', group: 'diario', route: '/diario',
    fields: {
      items: list('Países', obj('País', {
        id: { kind: 'slug', label: 'Identificador' }, name: text('Nome'), code: text('Sigla (2 letras)', { max: 2 }),
        period: text('Quando'), intro: long('Introdução'),
        items: {
          kind: 'blocks', label: 'Paradas e marcos', itemLabel: 'Parada',
          variants: {
            stop: {
              label: 'Parada (cidade)',
              fields: {
                id: { kind: 'slug', label: 'Identificador' }, city: text('Cidade'), period: text('Quando'), stay: text('Quanto tempo'),
                coords: { kind: 'coords', label: 'Posição no mapa' },
                summary: long('Resumo'), highlights: texts('Destaques', 'Destaque'), pros: texts('O que eu amei', 'Ponto positivo'),
                cons: texts('O que me decepcionou', 'Ponto negativo'), tip: opt(long('Dica')), badge: opt(text('Selo')),
                current: bool('Estou aqui agora'),
                images: list('Fotos', img, { itemTitle: 'alt', itemLabel: 'Foto' }),
                videos: list('Vídeos', video, { itemTitle: 'title', itemLabel: 'Vídeo' }),
              },
            },
            milestone: {
              label: 'Marco de renda (fim do mês)',
              fields: {
                id: { kind: 'slug', label: 'Identificador' }, month: text('Mês'), recordedAt: text('Onde foi gravado'),
                income: num('Renda do mês (US$)', { min: 0 }), spent: opt(text('Gastos')), bullets: texts('Resumo', 'Item'), video,
              },
            },
          },
        },
      }), { itemTitle: 'name', itemLabel: 'País' }),
    },
  },

  /* Blog --------------------------------------------------------------- */
  {
    key: 'blog.page', label: 'Página Blog', group: 'blog', route: '/blog',
    fields: { hero: heroFields(true), disclosure: long('Aviso de links de afiliado'), soonRec: long('Texto das recomendações "Em breve"') },
  },
  {
    key: 'blog.categories', label: 'Assuntos do blog', group: 'blog', route: '/blog',
    fields: { items: list('Assuntos', obj('Assunto', { id: { kind: 'slug', label: 'Identificador' }, label: text('Nome') }), { itemTitle: 'label', itemLabel: 'Assunto' }) },
  },
  {
    key: 'blog.destinations', label: 'Destinos do blog', group: 'blog', route: '/blog',
    fields: {
      items: list('Destinos', obj('Destino', {
        id: { kind: 'slug', label: 'Identificador' }, name: text('Nome'), country: ref('País', 'diario.countries', 'items'),
        tagline: text('Frase'), intro: long('Introdução'),
        facts: list('Informações rápidas', obj('Informação', { label: text('Nome'), value: text('Valor') }), { itemTitle: 'label', itemLabel: 'Informação' }),
        image: image('Foto'), position: position(), guide: ref('Guia relacionado', 'produtos.page', 'catalog', 'title'),
        recs: recRef, stops: list('Paradas do diário', { kind: 'slug', label: 'Parada (id)' }, { itemLabel: 'Parada' }),
        videos: list('Vídeos', obj('Vídeo', {
          id: { kind: 'video', label: 'Código do vídeo no YouTube' }, title: text('Título'), duration: opt(text('Duração')),
          poster: image('Foto antes do play'), vertical: bool('Vídeo vertical (short)'),
        }), { itemTitle: 'title', itemLabel: 'Vídeo' }),
      }), { itemTitle: 'name', itemLabel: 'Destino' }),
    },
  },
]

/* ------------------------------------------------------------------ */
/* Coleções                                                            */
/* ------------------------------------------------------------------ */

const articleBlocks: Field = {
  kind: 'blocks', label: 'Conteúdo do artigo', itemLabel: 'Bloco',
  variants: {
    p: { label: 'Parágrafo', fields: { text: long('Texto') } },
    h2: { label: 'Subtítulo', fields: { text: text('Subtítulo') } },
    list: { label: 'Lista', fields: { items: texts('Itens', 'Item'), ordered: bool('Numerada') } },
    img: { label: 'Foto', fields: { image: img, caption: opt(text('Legenda')), tall: bool('Foto em pé (vertical)') } },
    gallery: { label: 'Galeria de fotos', fields: { images: list('Fotos', img, { itemTitle: 'alt', itemLabel: 'Foto' }), caption: opt(text('Legenda')) } },
    tip: { label: 'Dica da Laura', fields: { title: opt(text('Título')), text: long('Texto') } },
    quote: { label: 'Citação', fields: { text: long('Citação') } },
    prices: {
      label: 'Tabela de preços',
      fields: { title: text('Título'), rows: list('Linhas', obj('Linha', { item: text('Item'), price: text('Valor') }), { itemTitle: 'item', itemLabel: 'Linha' }), note: opt(long('Observação')) },
    },
    video: {
      label: 'Vídeo do YouTube',
      fields: { id: { kind: 'video', label: 'Código do vídeo' }, title: text('Título'), vertical: bool('Vídeo vertical (short)'), poster: opt(image('Foto antes do play')) },
    },
    guide: { label: 'Chamada para o guia', fields: { id: opt(ref('Guia (vazio = guia do destino)', 'produtos.page', 'catalog', 'title')), text: opt(long('Texto')) } },
    recs: { label: 'Recomendações', fields: { title: opt(text('Título')), items: recRef } },
  },
}

export const collections: CollectionDef[] = [
  {
    key: 'article', label: 'Artigos do blog', itemLabel: 'Artigo', group: 'blog', idField: 'slug', titleField: 'title', route: '/blog/{id}', newestFirst: true,
    fields: {
      slug: { kind: 'slug', label: 'Endereço do artigo' },
      title: text('Título'), excerpt: long('Resumo (aparece nos cards)'),
      destination: ref('Destino', 'blog.destinations', 'items'), category: ref('Assunto', 'blog.categories', 'items', 'label'),
      date: opt({ kind: 'date', label: 'Data de publicação', help: 'Preenchida sozinha na primeira vez que o artigo vai para o ar. Pode mudar.' }),
      cover: img, trip: text('Quando eu estive lá'),
      blocks: articleBlocks,
    },
  },
  {
    key: 'productPage', label: 'Páginas de produto', itemLabel: 'Página de produto', group: 'produtos', idField: 'slug', titleField: 'title', route: '/produtos/{id}',
    fields: {
      slug: { kind: 'slug', label: 'Endereço da página' },
      kind: text('Tipo'), title: text('Nome'), promise: text('Frase de efeito (letra cursiva)'), text: long('Descrição'),
      forWho: texts('É para você se…', 'Item'), chapters: texts('Por dentro', 'Item'),
      price: opt(text('Preço')), free: bool('Material gratuito'), guarantee: opt(text('Garantia')),
      buy: obj('Botão de compra', { label: text('Texto do botão'), href: opt(url('Link de compra')) }),
      faq: qa, image: image('Foto de fundo'), cover: cover(),
    },
  },
]

/* ------------------------------------------------------------------ */
/* Seções das páginas (ligar, desligar, reordenar)                     */
/* ------------------------------------------------------------------ */

const pageGroup: Record<string, DocDef['group']> = {
  home: 'inicio', sobre: 'sobre', produtos: 'produtos', recomendacoes: 'recomendacoes', parcerias: 'parcerias', diario: 'diario', blog: 'blog',
}

for (const [page, d] of Object.entries(layoutDefs)) {
  docs.push({
    key: `layout.${page}`, label: `Seções: ${d.label}`, group: pageGroup[page], route: d.route,
    fields: {
      sections: list('Seções', obj('Seção', {
        id: select('Seção', d.sections.map(([id, label]) => [id, label] as [string, string])),
        visible: { kind: 'bool', label: 'Aparece no site' },
      }), { itemTitle: 'id', itemLabel: 'Seção' }),
    },
  })
}

/* ------------------------------------------------------------------ */
/* Páginas novas (criadas no painel)                                   */
/* ------------------------------------------------------------------ */

if (articleBlocks.kind !== 'blocks') throw new Error('blocos')
collections.push({
  key: 'page', label: 'Páginas novas', itemLabel: 'Página', group: 'paginas', idField: 'slug', titleField: 'title', route: '/{id}',
  reservedIds: ['produtos', 'recomendacoes', 'parcerias', 'diario', 'blog', 'sobre', 'midia-kit', 'destinos', 'site', 'cms', 'images', 'assets', 'api', 'inicio', 'p'],
  fields: {
    slug: { kind: 'slug', label: 'Endereço da página (ex.: minha-pagina)' },
    title: text('Título da página'),
    description: opt(long('Resumo (aparece no Google)')),
    blocks: {
      kind: 'blocks', label: 'Blocos da página', itemLabel: 'Bloco',
      variants: {
        hero: { label: 'Capa com foto', fields: { eyebrow: opt(text('Texto pequeno de cima')), title: text('Título'), text: opt(long('Texto')), image: image('Foto de fundo'), position: position() } },
        ...articleBlocks.variants,
        cards: {
          label: 'Cards',
          fields: {
            title: opt(text('Título da seção')),
            items: list('Cards', obj('Card', { image: image('Foto'), title: text('Título'), text: long('Texto'), href: opt(url('Link')), button: opt(text('Texto do link')) }), { itemTitle: 'title', itemLabel: 'Card' }),
          },
        },
        button: { label: 'Botão', fields: { label: text('Texto do botão'), href: url('Link'), style: select('Cor', [['sun', 'Laranja'], ['pine', 'Verde'], ['outline', 'Contorno']]) } },
      },
    },
  },
})

/** Todos os campos de um documento ou coleção, pela chave. */
export function fieldsOf(key: string): Fields | undefined {
  const base = key.includes(':') ? key.split(':')[0] : key
  return docs.find((d) => d.key === base)?.fields ?? collections.find((c) => c.key === base)?.fields
}
