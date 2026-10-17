/**
 * Todo o conteúdo do site num só lugar.
 * Fonte: canal youtube.com/@turistalife, descrições dos vídeos, Linktree e Instagram (out/2026).
 * Atualize aqui a cada novo episódio, destino ou produto.
 */

import { countries } from './diaryContent'
import { doc } from './cms/runtime'

export const links = doc('geral.links', {
  youtube: 'https://www.youtube.com/@turistalife',
  instagram: 'https://www.instagram.com/turista.life/',
  tiktok: 'https://www.tiktok.com/@turistalife',
  email: 'contatoturistalife@gmail.com',
})

const yt = (id: string) => `https://youtu.be/${id}`

export const nav = doc('geral.nav', { items: [
  { label: 'Início', href: '/' },
  { label: 'Sobre mim', href: '/sobre' },
  { label: 'Produtos', href: '/produtos' },
  { label: 'Recomendações', href: '/recomendacoes' },
  { label: 'Parcerias', href: '/parcerias' },
  { label: 'Diário', href: '/diario' },
  { label: 'Blog', href: '/blog' },
] }).items

export const hero = doc('inicio.hero', {
  title: 'Viajar mais. Viver mais.',
  subtitle: 'Construir uma vida com liberdade.',
  text:
    'Eu sou a Laura! Depois de mais de 3 anos vivendo na Austrália, decidi explorar o mundo enquanto construo minha renda online para viver com liberdade geográfica. Aqui compartilho os bastidores reais dessa jornada, sem romantizar, além de guias de viagem, dicas práticas e ferramentas para ajudar você a viajar também.',
  cta: { label: 'Explore a Turista Life', href: '/blog' },
  story: { label: 'Assista o começo da história', href: yt('pwwxtfpaVNs') },
  signature: ['O mundo', 'pode ser', 'sua casa.'],
  image: import.meta.env.BASE_URL + 'images/hero-laura.jpg',
})

export const about = doc('inicio.about', {
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
})

// Países da rota, na ordem, sem repetir: a partida (Austrália) + os países do diário.
// O último é o país atual; entra um país novo no diário e a home se atualiza sozinha.
const journeyStops = () => [...new Set(['Austrália', ...countries.map((c) => c.name)])]

export const journey = doc('inicio.journey', {
  eyebrow: 'Em qual episódio estamos?',
  title: 'Construindo minha liberdade geográfica',
  text:
    'Depois de 3 anos e meio na Austrália, comecei uma nova fase: viajar pelo mundo enquanto construo um negócio digital. Minha meta é alcançar uma renda online e transformar esse projeto em uma fonte de liberdade geográfica. Compartilho os bastidores, os números reais, as conquistas e os desafios dessa construção. Sem fórmulas mágicas, apenas o processo real.',
  cta: { label: 'Acompanhe a jornada', href: links.youtube },
}) as { eyebrow: string; title: string; text: string; cta: { label: string; href: string }; stops: string[]; current: number }
// Calculados a partir do diário (não são editáveis aqui, por isso não entram no documento).
Object.defineProperties(journey, {
  stops: { get: journeyStops, enumerable: false },
  current: { get: () => journeyStops().length - 1, enumerable: false },
})

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

export const products = doc<{ eyebrow: string; title: string; text: string; items: Product[] }>('inicio.products', {
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
      cta: 'Conhecer o guia',
      href: '/produtos/guia-liberdade-geografica',
      cover: { image: import.meta.env.BASE_URL + 'images/work.jpg', top: 'Guia gratuito', title: 'Liberdade Geográfica', tone: 'sky' },
    },
    {
      kind: 'Material gratuito',
      title: '5 coisas que eu faria diferente antes de ir para a Austrália',
      text: 'Checklist com os aprendizados que teriam me poupado tempo e dinheiro.',
      cta: 'Conhecer o checklist',
      href: '/produtos/checklist-australia',
      cover: { image: import.meta.env.BASE_URL + 'images/opera.jpg', top: 'Checklist', title: 'Austrália', tone: 'pine' },
    },
  ],
})

export const recommendations = doc('inicio.recommendations', {
  eyebrow: 'Recomendações',
  title: 'O que eu realmente uso',
  text: 'Só recomendo o que eu uso na estrada. Usando meus links e cupons você economiza e ainda apoia o canal.',
})

export const brands = doc('inicio.brands', {
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
})

export const diary = doc('inicio.diary', {
  eyebrow: 'Diário · Guia por país',
  title: 'Dicas, roteiros e a vida real na estrada',
  text: 'Cada destino vira episódio: o que vale a pena, o que decepciona, quanto custa e como se virar sozinha.',
  cta: { label: 'Ver o diário da viagem', href: '/diario' },
  posts: [
    { tag: 'Indonésia', title: 'A realidade dos lugares mais paradisíacos de Bali', image: import.meta.env.BASE_URL + 'images/v-nusa.jpg', href: yt('TtBuGZLTSog') },
    { tag: 'Tailândia', title: 'Cheguei sozinha na Tailândia… e não era o que eu imaginava', image: import.meta.env.BASE_URL + 'images/v-bangkok.jpg', href: yt('Hc4nMTf6fDg') },
    { tag: 'Austrália', title: 'O país onde todo brasileiro quer morar', image: import.meta.env.BASE_URL + 'images/v-sydney.jpg', href: yt('hKqoB9HA9uM') },
  ],
})

export const newsletter = doc('geral.newsletter', {
  eyebrow: 'Newsletter',
  title: 'Inspiração de viagem direto no seu e-mail',
  bullets: ['Dicas práticas e roteiros de viagem', 'Recomendações e cupons exclusivos', 'Lançamentos de guias em primeira mão', 'Bastidores da jornada que não vão para as redes'],
  cta: 'Quero receber',
  sending: 'Enviando…',
  // TODO(dúvida Laura): validar os textos da newsletter (confirmação por e-mail, erros e aviso de cancelamento)
  sent: 'Quase lá! Enviamos um e-mail para você confirmar a inscrição. Confere a caixa de entrada (e o spam).',
  invalid: 'Esse e-mail parece estar incompleto. Confere e tenta de novo?',
  error: 'Não deu para enviar agora. Tenta de novo em alguns minutos.',
  privacy: 'Sem spam. Você pode cancelar quando quiser.',
})

export const footer = doc('geral.footer', {
  tagline: 'Documentando a construção da minha liberdade geográfica.',
  newsletter: 'Receba as novidades da jornada por e-mail',
  sent: 'Quase lá! Confirma a inscrição no e-mail que acabamos de enviar.',
})
