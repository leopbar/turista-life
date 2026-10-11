/**
 * Todo o conteúdo do site num só lugar.
 * Fonte: canal youtube.com/@turistalife, descrições dos vídeos, Linktree e Instagram (out/2026).
 * Atualize aqui a cada novo episódio, destino ou produto.
 */

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
  { label: 'Marcas', href: '/midia-kit' },
  { label: 'Diário', href: '/diario' },
  { label: 'Membros', href: '/#membros' },
]

export const hero = {
  titleLines: ['Turista Life', 'Larguei tudo pra', 'conhecer o mundo.'],
  text:
    'Eu sou a Laura, gaúcha de Porto Alegre. Depois de 3 anos e meio na Austrália, coloquei a mochila nas costas para viajar o mundo sozinha enquanto construo uma vida trabalhando pela internet. Aqui eu mostro tudo, sem romantizar.',
  cta: { label: 'Assista o começo da história', href: yt('pwwxtfpaVNs') },
  signature: ['O momento', 'certo é', 'agora.'],
  image: '/images/hero.jpg',
}

export const about = {
  eyebrow: 'Sobre a Turista Life',
  title: 'Como tudo começou?',
  paragraphs: [
    'Formada em Turismo, em 2022 consegui uma das 500 vagas do Working Holiday para brasileiros e fui para Sydney. Foram 3 anos e meio, cinco áreas diferentes (de garçonete a escritório) e nenhuma semana desempregada.',
    'Em 2026 um problema no visto virou o empurrão que faltava: transformei o fim de um ciclo no começo do meu sonho. Hoje o mundo é a minha casa, e cada passo vira conteúdo aqui.',
  ],
  cta: { label: 'Conheça minha história', href: '/sobre' },
  polaroid: { image: '/images/sydney.jpg', caption: ['De Sydney', 'para o mundo!'] },
}

export const journey = {
  eyebrow: 'Em qual episódio estamos?',
  episode: 'Mês 3',
  title: 'Construindo minha liberdade geográfica',
  text:
    'Depois de dois meses em Bali e uma passagem pela Austrália, agora estou na Tailândia. A meta: R$ 5.000 por mês vivendo 100% da internet. Todo mês eu abro os números reais, o que deu certo e o que não deu.',
  now: 'Krabi, Tailândia',
  stops: ['Sydney', 'Bali', 'Perth', 'Tailândia'],
  current: 3,
  cta: { label: 'Acompanhe a jornada', href: '/diario' },
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
      cta: 'Saiba mais',
      href: 'https://pay.kiwify.com.br/a7BpARM',
      cover: { image: '/images/sydney.jpg', top: 'E-book', title: 'Trabalho na Austrália', tone: 'pine' },
    },
    {
      kind: 'Guia de destino',
      title: 'Guia de Bali',
      text: 'Tudo o que eu queria saber antes de passar dois meses na ilha: regiões, custos, transporte e cuidados.',
      note: 'Em breve',
      cta: 'Me avise',
      href: '/produtos#guia-bali',
      soon: true,
      cover: { image: '/images/bali.jpg', top: 'Guia completo', title: 'Bali', tone: 'sun' },
    },
    {
      kind: 'Material gratuito',
      title: 'Guia Liberdade Geográfica',
      text: 'Os primeiros passos para construir uma carreira que você possa levar para qualquer lugar do mundo.',
      cta: 'Quero receber',
      href: 'https://turista-life-laura-irigoyen-ifwilc.subscribepage.io/',
      cover: { image: '/images/work.jpg', top: 'Guia gratuito', title: 'Liberdade Geográfica', tone: 'sky' },
    },
    {
      kind: 'Material gratuito',
      title: '5 coisas que eu faria diferente antes de ir para a Austrália',
      text: 'Checklist com os aprendizados que teriam me poupado tempo e dinheiro.',
      cta: 'Quero receber',
      href: 'https://turista-life-laura-irigoyen-nehwou.subscribepage.io/',
      cover: { image: '/images/opera.jpg', top: 'Checklist', title: 'Austrália', tone: 'pine' },
    },
  ],
}

export type Recommendation = {
  icon: 'card' | 'ticket' | 'plane' | 'bed' | 'laptop' | 'passport'
  title: string
  text: string
  coupon?: string
  cta: string
  href: string
}

export const recommendations: { eyebrow: string; title: string; text: string; items: Recommendation[] } = {
  eyebrow: 'Recomendações',
  title: 'O que eu realmente uso',
  text: 'Só recomendo o que eu uso na estrada. Usando meus links e cupons você economiza e ainda apoia o canal.',
  items: [
    { icon: 'card', title: 'Conta global Nomad', text: 'O cartão que funcionou em todo lugar, de Bali à Tailândia. Até US$ 20 de cashback.', coupon: 'TURISTALIFE', cta: 'Abrir conta', href: 'https://link.nomadglobal.com/wIQT/TURISTALIFE' },
    { icon: 'ticket', title: 'Passeios no mundo todo', text: 'Tours com guia local pela GetYourGuide, com desconto.', coupon: 'TURISTALIFE5', cta: 'Ver passeios', href: 'https://gyg.me/turistalife-app' },
    { icon: 'plane', title: 'Passagens aéreas', text: 'Onde eu compro as passagens mais baratas da viagem.', cta: 'Ver ofertas', href: 'https://agencia.iddas.com.br/so/eyzdkw13' },
    { icon: 'bed', title: 'Hospedagens', text: 'O hotel em que eu fiquei em Krabi, com ótimo custo-benefício.', cta: 'Ver hotel', href: 'https://agoda.tpm.li/ws5fHCJo' },
    { icon: 'laptop', title: 'Renda online', text: 'Como estou aprendendo a ganhar dinheiro pela internet: mais de 12 profissões.', cta: 'Conhecer', href: 'https://go.hotmart.com/W105546619I' },
    { icon: 'passport', title: 'Imigração Austrália', text: 'O agente de imigração que acompanhou meu processo do início ao fim.', cta: 'Agendar conversa', href: 'https://calendly.com/d/cxwy-bw6-hsr' },
  ],
}

export const brands = {
  eyebrow: 'Para marcas',
  title: 'Vamos construir algo incrível juntos?',
  text:
    'Uma comunidade de brasileiros que sonham em viajar, morar fora e trabalhar de qualquer lugar. Conteúdo real, sem romantizar, e recomendações em que a audiência confia.',
  stats: [
    { icon: 'ig', value: '110 mil', label: 'seguidores no Instagram' },
    { icon: 'play', value: '3,4 mi', label: 'views no vídeo mais visto' },
    { icon: 'users', value: '+125 mil', label: 'pessoas em 4 redes' },
  ],
  cta: { label: 'Quero ser parceiro', href: `mailto:${links.email}?subject=Parceria%20Turista%20Life` },
  secondary: { label: 'Ver mídia kit', href: '/midia-kit' },
  image: '/images/brands.jpg',
}

export const diary = {
  eyebrow: 'Diário de bordo · Guia por país',
  title: 'Dicas, roteiros e a vida real na estrada',
  text: 'Cada destino vira episódio: o que vale a pena, o que decepciona, quanto custa e como se virar sozinha.',
  cta: { label: 'Ver o diário completo', href: '/diario' },
  posts: [
    { tag: 'Indonésia', title: 'A realidade dos lugares mais paradisíacos de Bali', image: '/images/v-nusa.jpg', href: yt('TtBuGZLTSog') },
    { tag: 'Tailândia', title: 'Cheguei sozinha na Tailândia… e não era o que eu imaginava', image: '/images/v-bangkok.jpg', href: yt('Hc4nMTf6fDg') },
    { tag: 'Austrália', title: 'O país onde todo brasileiro quer morar', image: '/images/v-sydney.jpg', href: yt('hKqoB9HA9uM') },
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
