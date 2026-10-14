/**
 * Todo o conteúdo do site num só lugar.
 * Fonte: canal youtube.com/@turistalife, descrições dos vídeos, Linktree e Instagram (out/2026).
 * Atualize aqui a cada novo episódio, destino ou produto.
 */

import { countries } from './diaryContent'

export const links = {
  youtube: 'https://www.youtube.com/@turistalife',
  instagram: 'https://www.instagram.com/turista.life/',
  tiktok: 'https://www.tiktok.com/@turistalife',
  email: 'contatoturistalife@gmail.com',
}

const yt = (id: string) => `https://youtu.be/${id}`

export const nav = [
  { label: 'Início', href: '/' },
  { label: 'Sobre mim', href: '/sobre' },
  { label: 'Produtos', href: '/produtos' },
  { label: 'Recomendações', href: '/recomendacoes' },
  { label: 'Parcerias', href: '/parcerias' },
  { label: 'Destinos', href: '/destinos' },
]

export const hero = {
  title: 'Viajar mais. Viver mais.',
  subtitle: 'Construir uma vida com liberdade.',
  text:
    'Eu sou a Laura! Depois de mais de 3 anos vivendo na Austrália, decidi explorar o mundo enquanto construo minha liberdade geográfica. Aqui compartilho os bastidores dessa jornada, sem romantizar, além de guias dos destinos por onde já passei, dicas práticas e ferramentas para você viajar também.',
  cta: { label: 'Explore a Turista Life', href: '/#sobre' },
  story: { label: 'Assista o começo da história', href: yt('pwwxtfpaVNs') },
  signature: ['O mundo', 'pode ser', 'sua casa.'],
  image: import.meta.env.BASE_URL + 'images/hero.jpg',
}

export const about = {
  eyebrow: 'Sobre a Turista Life',
  title: 'Como tudo começou?',
  paragraphs: [
    'Em 2022, com uma passagem para Sydney e um Working Holiday Visa aprovado, embarquei para a Austrália sem imaginar o quanto aquela decisão mudaria minha vida.',
    'Foram 3 anos e meio vivendo do outro lado do mundo, trabalhando em diferentes áreas, aprendendo inglês, juntando dinheiro e descobrindo que existiam muitas formas de viver.',
    'Em 2026, um imprevisto com meu visto antecipou uma decisão que eu já sonhava tomar: colocar a mochila nas costas e explorar o mundo.',
    'Hoje, enquanto viajo sozinha, estou usando minha reserva financeira para construir minha renda online e documentando tudo pelo caminho: os desafios, as conquistas e os bastidores reais de uma vida em construção.',
  ],
  cta: { label: 'Conheça minha história', href: '/sobre' },
  polaroid: { image: import.meta.env.BASE_URL + 'images/sydney.jpg', caption: ['De Sydney', 'para o mundo!'] },
}

// Países da rota, na ordem, sem repetir: a partida (Austrália) + os países do diário.
// O último é o país atual; entra um país novo em diaryContent.ts e a home se atualiza sozinha.
const journeyStops = [...new Set(['Austrália', ...countries.map((c) => c.name)])]

export const journey = {
  eyebrow: 'Em qual episódio estamos?',
  title: 'Construindo minha liberdade geográfica',
  text:
    'Depois de 3 anos e meio na Austrália, comecei uma nova fase: viajar pelo mundo enquanto construo um negócio digital. Minha meta é alcançar uma renda online e transformar esse projeto em uma fonte de liberdade geográfica. Compartilho os bastidores, os números reais, as conquistas e os desafios dessa construção. Sem fórmulas mágicas, apenas o processo real.',
  stops: journeyStops,
  current: journeyStops.length - 1,
  cta: { label: 'Acompanhe a jornada', href: links.youtube },
}

export type Product = {
  kind: string
  title: string
  text: string
  price?: string
  note?: string
  cta: string
  href: string
  cover: { image: string; top: string; title: string; tone: 'pine' | 'sun' | 'sky' }
  soon?: boolean
}

export const products: { eyebrow: string; title: string; text: string; items: Product[] } = {
  eyebrow: 'Produtos digitais',
  title: 'Leve a Turista Life com você',
  text: 'Tudo o que eu aprendi na prática, organizado para você planejar melhor, economizar e chegar preparado.',
  items: [
    {
      kind: 'E-book',
      title: 'Como encontrar um trabalho na Austrália',
      text: 'Currículo australiano, sites que funcionam, setores que mais contratam brasileiros e a mentalidade certa.',
      note: '7 dias de garantia',
      cta: 'Conhecer o e-book',
      href: '/produtos/trabalho-na-australia',
      cover: { image: import.meta.env.BASE_URL + 'images/sydney.jpg', top: 'E-book', title: 'Trabalho na Austrália', tone: 'pine' },
    },
    {
      kind: 'Guia de destino',
      title: 'Guia de Bali',
      text: 'Tudo o que eu queria saber antes de passar dois meses na ilha: regiões, custos, transporte e cuidados.',
      note: 'R$ 49',
      cta: 'Conhecer o guia',
      href: '/produtos/guia-de-bali',
      cover: { image: import.meta.env.BASE_URL + 'images/bali.jpg', top: 'Guia completo', title: 'Bali', tone: 'sun' },
    },
    {
      kind: 'Material gratuito',
      title: 'Guia Liberdade Geográfica',
      text: 'Os primeiros passos para construir uma carreira que você possa levar para qualquer lugar do mundo.',
      cta: 'Quero receber',
      href: 'https://turista-life-laura-irigoyen-ifwilc.subscribepage.io/',
      cover: { image: import.meta.env.BASE_URL + 'images/work.jpg', top: 'Guia gratuito', title: 'Liberdade Geográfica', tone: 'sky' },
    },
    {
      kind: 'Material gratuito',
      title: '5 coisas que eu faria diferente antes de ir para a Austrália',
      text: 'Checklist com os aprendizados que teriam me poupado tempo e dinheiro.',
      cta: 'Quero receber',
      href: 'https://turista-life-laura-irigoyen-nehwou.subscribepage.io/',
      cover: { image: import.meta.env.BASE_URL + 'images/opera.jpg', top: 'Checklist', title: 'Austrália', tone: 'pine' },
    },
  ],
}

export const recommendations = {
  eyebrow: 'Recomendações',
  title: 'O que eu realmente uso',
  text: 'Só recomendo o que eu uso na estrada. Usando meus links e cupons você economiza e ainda apoia o canal.',
}

export const brands = {
  eyebrow: 'Para marcas',
  title: 'Vamos construir algo incrível juntos?',
  text:
    'Turista Life é um projeto de criação de conteúdo para quem quer viajar, morar fora e trabalhar de qualquer lugar. Para marcas, produzo vídeos, UGC e campanhas que falam com uma audiência engajada e que confia nas minhas recomendações.',
  stats: [
    { icon: 'ig', value: '110 mil', label: 'seguidores no Instagram' },
    { icon: 'play', value: '3,4 mi', label: 'views no vídeo mais visto' },
    { icon: 'users', value: '+125 mil', label: 'pessoas em 4 redes' },
  ],
  cta: { label: 'Quero ser parceiro', href: `mailto:${links.email}?subject=Parceria%20Turista%20Life` },
  secondary: { label: 'Ver parcerias e mídia kit', href: '/parcerias' },
  image: import.meta.env.BASE_URL + 'images/brands.jpg',
}

export const diary = {
  eyebrow: 'Destinos · Guia por país',
  title: 'Dicas, roteiros e a vida real na estrada',
  text: 'Cada destino vira episódio: o que vale a pena, o que decepciona, quanto custa e como se virar sozinha.',
  cta: { label: 'Ver todos os destinos', href: '/destinos' },
  posts: [
    { tag: 'Indonésia', title: 'A realidade dos lugares mais paradisíacos de Bali', image: import.meta.env.BASE_URL + 'images/v-nusa.jpg', href: yt('TtBuGZLTSog') },
    { tag: 'Tailândia', title: 'Cheguei sozinha na Tailândia… e não era o que eu imaginava', image: import.meta.env.BASE_URL + 'images/v-bangkok.jpg', href: yt('Hc4nMTf6fDg') },
    { tag: 'Austrália', title: 'O país onde todo brasileiro quer morar', image: import.meta.env.BASE_URL + 'images/v-sydney.jpg', href: yt('hKqoB9HA9uM') },
  ],
}

export const members = {
  eyebrow: 'Área de membros',
  title: 'Os bastidores que não cabem nas redes',
  bullets: ['Números e estratégias do mês, abertos', 'Guias e cupons exclusivos', 'Criação de conteúdo na prática', 'Comunidade de quem quer viver viajando'],
  cta: 'Entrar na lista de espera',
  note: 'Em breve',
}

export const footer = {
  tagline: 'Documentando a construção da minha liberdade geográfica.',
  newsletter: 'Receba as novidades da jornada por e-mail',
}
