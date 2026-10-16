/**
 * Conteúdo das páginas internas: /produtos, /recomendacoes e /parcerias.
 * Fonte: canal youtube.com/@turistalife, Linktree, página do e-book na Kiwify (out/2026).
 */
import { links, type Product } from './content'

/* ------------------------------------------------------------------ */
/* /produtos                                                           */
/* ------------------------------------------------------------------ */

export type CatalogItem = {
  id: string
  kind: string
  title: string
  text: string
  status: 'available' | 'soon' | 'planned' | 'free'
  /** Preço exibido nos produtos disponíveis (ex.: "R$ 49"). */
  price?: string
  /** Botão de compra dos produtos disponíveis. */
  cta?: string
  href?: string
  /** Página individual do produto (ex.: "/produtos/guia-de-bali"); o botão do card leva até ela. */
  page?: string
  /** Mensagem depois de entrar na lista de espera (padrão: "quando o {título} sair"). */
  notify?: string
  cover: Product['cover']
}

export const productsPage = {
  hero: {
    eyebrow: 'Produtos',
    script: 'Na prática, sem enrolação',
    title: 'Guias e e-books para você chegar preparado',
    text: 'Tudo o que eu aprendi vivendo 3 anos e meio na Austrália e viajando sozinha pela Ásia, transformado em material direto ao ponto.',
    image: import.meta.env.BASE_URL + 'images/bali.jpg',
  },
  /** Produtos à venda: aparecem antes e com mais destaque que os próximos lançamentos. */
  available: {
    eyebrow: 'Disponíveis agora',
    title: 'Prontos para te ajudar',
    text: 'Materiais completos, que você compra hoje e recebe na hora no seu e-mail.',
  },
  upcoming: {
    eyebrow: 'Próximos lançamentos',
    title: 'O que vem por aí',
    text: 'Guias e serviços em produção. Deixe seu e-mail e seja avisado no dia do lançamento.',
  },
  // TODO(dúvida Laura): página de inscrição no MailerLite (subscribepage.io) para a lista de espera.
  // Enquanto estiver vazio, o "Me avise" mostra a confirmação mas não guarda o e-mail.
  waitlistUrl: '',
  catalog: [
    {
      id: 'guia-bali', kind: 'Guia de destino', title: 'Guia de Bali',
      text: 'Dois meses na ilha resumidos: Canggu, Ubud, Gili, Nusa Penida e Uluwatu, quanto custa, como se locomover, cuidados com água e comida e o que vale (ou não) a pena. 7 dias de garantia.',
      status: 'available', price: 'R$ 49', cta: 'Conhecer o guia', page: '/produtos/guia-de-bali',
      cover: { image: import.meta.env.BASE_URL + 'images/bali.jpg', top: 'Guia completo', title: 'Bali', tone: 'sun' },
    },
    {
      id: 'guia-tailandia', kind: 'Guia de destino', title: 'Guia da Tailândia',
      text: 'Bangkok, Chiang Mai e as praias do sul, com a época certa de ir (aprendi do jeito difícil) e como equilibrar trabalho e passeio.',
      status: 'planned',
      cover: { image: import.meta.env.BASE_URL + 'images/v-bangkok.jpg', top: 'Em produção', title: 'Tailândia', tone: 'pine' },
    },
    {
      // TODO: texto e foto provisórios, aguardando material da Laura
      id: 'guia-vietna', kind: 'Guia de destino', title: 'Guia do Vietnã',
      text: 'Roteiro, custos, transporte entre as cidades e o que eu aprendi na prática viajando pelo país.',
      status: 'planned',
      cover: { image: import.meta.env.BASE_URL + 'images/hero.jpg', top: 'Em produção', title: 'Vietnã', tone: 'sun' },
    },
    {
      id: 'guia-proximo', kind: 'Guia de destino', title: 'Próximos destinos',
      text: 'A cada lugar novo, um guia novo. Deixe seu e-mail e saiba qual é o próximo antes de todo mundo.',
      status: 'soon', notify: 'Combinado! Você fica sabendo assim que o próximo guia sair.',
      cover: { image: import.meta.env.BASE_URL + 'images/v-nusa.jpg', top: 'Novo guia', title: 'Próximo destino', tone: 'sky' },
    },
    {
      id: 'ebook-australia', kind: 'E-book', title: 'Como encontrar um trabalho na Austrália',
      text: 'Currículo australiano, plataformas de emprego, direitos e mentalidade. 7 dias de garantia.',
      status: 'available', price: 'R$ 67', cta: 'Conhecer o e-book', page: '/produtos/trabalho-na-australia',
      cover: { image: import.meta.env.BASE_URL + 'images/sydney.jpg', top: 'E-book', title: 'Trabalho na Austrália', tone: 'pine' },
    },
    {
      // TODO: texto provisório, aguardando a definição dos serviços da Laura
      id: 'consultoria', kind: 'Consultoria', title: 'Consultoria individual',
      text: 'Uma conversa para montar o seu plano: destino, custos, trabalho remoto e primeiros passos fora do Brasil.',
      status: 'soon', notify: 'Combinado! Você recebe um aviso assim que as consultorias abrirem.',
      cover: { image: import.meta.env.BASE_URL + 'images/work.jpg', top: 'Em breve', title: 'Consultoria', tone: 'pine' },
    },
    {
      // TODO(dúvida Laura): nome, texto e formato da comunidade são provisórios.
      id: 'comunidade', kind: 'Comunidade', title: 'Comunidade Turista Life',
      text: 'Um espaço para trocar experiências com quem também quer viajar, morar fora ou trabalhar de qualquer lugar, com conteúdos exclusivos e conversas comigo.',
      status: 'soon', notify: 'Combinado! Você recebe um aviso assim que a comunidade abrir.',
      cover: { image: import.meta.env.BASE_URL + 'images/v-sydney.jpg', top: 'Em breve', title: 'Comunidade', tone: 'sky' },
    },
  ] as CatalogItem[],
  /** Materiais gratuitos: ficam fora do catálogo pago, em seção própria. */
  freeSection: {
    eyebrow: 'Grátis',
    title: 'Materiais gratuitos',
    text: 'Para dar o primeiro passo sem gastar nada. Chegam direto no seu e-mail.',
  },
  free: [
    {
      id: 'guia-liberdade', kind: 'Material gratuito', title: 'Guia Liberdade Geográfica',
      text: 'Os primeiros passos para construir uma carreira que você possa levar para qualquer lugar do mundo.',
      status: 'free', cta: 'Conhecer o guia', page: '/produtos/guia-liberdade-geografica',
      cover: { image: import.meta.env.BASE_URL + 'images/work.jpg', top: 'Guia gratuito', title: 'Liberdade Geográfica', tone: 'sky' },
    },
    {
      id: 'checklist-australia', kind: 'Material gratuito', title: '5 coisas que eu faria diferente antes de ir para a Austrália',
      text: 'Checklist com cinco aprendizados que teriam me poupado tempo e dinheiro na chegada.',
      status: 'free', cta: 'Conhecer o checklist', page: '/produtos/checklist-australia',
      cover: { image: import.meta.env.BASE_URL + 'images/opera.jpg', top: 'Checklist', title: 'Austrália', tone: 'pine' },
    },
  ] as CatalogItem[],
  faq: [
    { q: 'Como recebo o e-book ou o Guia de Bali?', a: 'A compra é processada pela Kiwify. Assim que o pagamento é aprovado, o acesso chega no seu e-mail.' },
    { q: 'E se eu não gostar?', a: 'Você tem 7 dias de garantia. Se não fizer sentido para você, é só pedir o reembolso dentro desse prazo.' },
    { q: 'O e-book serve para quem ainda não tem visto?', a: 'Sim, ele ajuda a planejar antes de embarcar. Para dúvidas de visto, indico o agente de imigração que acompanhou o meu processo, na página de recomendações.' },
  ],
  cta: {
    title: 'Não sabe por onde começar?',
    text: 'Pegue o Guia Liberdade Geográfica, é gratuito e chega no seu e-mail.',
    cta: { label: 'Quero o guia grátis', href: 'https://turista-life-laura-irigoyen-ifwilc.subscribepage.io/' },
  },
}

/* ------------------------------------------------------------------ */
/* /produtos/:slug (página individual de cada produto e material grátis) */
/* ------------------------------------------------------------------ */

export type ProductPage = {
  slug: string
  kind: string
  title: string
  /** Frase de efeito, em letra cursiva. */
  promise: string
  text: string
  forWho: string[]
  chapters: string[]
  /** Sem preço definido, a página mostra só o botão de compra. */
  price?: string
  /** Material gratuito: selo "Grátis" no lugar do preço e botão para a inscrição no MailerLite. */
  free?: boolean
  guarantee?: string
  /** Sem href, o botão aparece mas não leva a lugar nenhum (checkout pendente). */
  buy: { label: string; href?: string }
  faq: { q: string; a: string }[]
  image: string
  cover: Product['cover']
}

const [faqDelivery, faqGuarantee, faqVisa] = productsPage.faq

const faqFree = [
  { q: 'É grátis mesmo?', a: 'Sim. Você só precisa deixar o seu nome e o seu e-mail, sem cartão e sem pegadinha.' },
  { q: 'Como eu recebo?', a: 'Depois do cadastro, o material chega no seu e-mail. Se não aparecer em alguns minutos, confira a caixa de spam ou a aba Promoções.' },
  { q: 'Vou receber outros e-mails?', a: 'Você passa a receber as novidades do Turista Life, como dicas e lançamentos de guias. Dá para sair da lista quando quiser, com um clique.' },
]

export const productPages: ProductPage[] = [
  {
    slug: 'trabalho-na-australia',
    kind: 'E-book',
    title: 'Como encontrar um trabalho na Austrália',
    promise: '3 anos na Austrália. 5 áreas diferentes. Nenhuma semana desempregada.',
    text: 'O e-book que eu gostaria de ter tido no meu primeiro dia em Sydney: os setores que mais contratam brasileiros, os sites que realmente funcionam e as estratégias para não perder tempo fazendo do jeito errado.',
    forWho: [
      'Você está pensando em trabalhar na Austrália e não sabe por onde começar.',
      'Acabou de chegar e precisa do primeiro emprego antes de queimar a reserva.',
      'Já está lá, mas travou num trabalho ruim e quer mudar de área.',
      'Cansou de conselho genérico e quer ouvir de quem viveu o processo.',
    ],
    chapters: [
      'O currículo australiano não é o que você pensa',
      'Esqueça o que você sabe sobre procurar emprego',
      'As plataformas de emprego: como usar sem depender delas',
      'O inglês importa mais do que te falaram',
      'Seus direitos como trabalhador',
      'Mentalidade: a parte que ninguém ensina',
    ],
    price: 'R$ 67',
    guarantee: '7 dias de garantia',
    buy: { label: 'Quero o e-book', href: 'https://pay.kiwify.com.br/a7BpARM' },
    faq: [faqDelivery, faqGuarantee, faqVisa],
    image: import.meta.env.BASE_URL + 'images/sydney.jpg',
    cover: { image: import.meta.env.BASE_URL + 'images/sydney.jpg', top: 'E-book', title: 'Trabalho na Austrália', tone: 'pine' },
  },
  {
    // TODO(dúvida Laura): a frase de efeito (promise) ainda é provisória; "para quem" e "o que vai encontrar" vieram dela.
    slug: 'guia-de-bali',
    kind: 'Guia de destino',
    title: 'Guia de Bali',
    promise: 'Dois meses na ilha, resumidos para você aproveitar sem perrengue.',
    text: 'Tudo o que eu queria saber antes de passar dois meses em Bali: qual região combina com você, quanto custa de verdade, como se locomover, os cuidados com água e comida e o que vale (ou não) a pena.',
    forWho: [
      'Vai para Bali pela primeira vez e não sabe quais regiões incluir no roteiro.',
      'Quer ter uma referência de gastos reais com hospedagem, alimentação, transporte e passeios.',
      'Quer evitar perrengues comuns e aproveitar as dicas de quem já esteve lá.',
      'Prefere recomendações baseadas em 58 dias de experiências reais, em vez de listas genéricas da internet.',
    ],
    chapters: [
      'Cinco destinos: Canggu, Ubud, Gili Trawangan, Nusa Penida e Uluwatu.',
      'Custos reais: quanto gastei com hospedagem, alimentação, transporte e experiências.',
      'Deslocamentos: como me locomovi entre as regiões e ilhas.',
      'Dicas práticas: cuidados com água, alimentação e outros detalhes importantes.',
      'Minha experiência sincera: o que amei, o que não gostei e o que faria diferente.',
    ],
    price: 'R$ 49',
    guarantee: '7 dias de garantia',
    buy: { label: 'Quero o guia', href: 'https://pay.kiwify.com.br/2niMQP6' },
    faq: [faqDelivery, faqGuarantee],
    image: import.meta.env.BASE_URL + 'images/bali.jpg',
    cover: { image: import.meta.env.BASE_URL + 'images/bali.jpg', top: 'Guia completo', title: 'Bali', tone: 'sun' },
  },
  {
    // TODO(dúvida Laura): frase, "para quem" e "o que vai encontrar" são provisórios, montados a partir da descrição do material.
    slug: 'guia-liberdade-geografica',
    kind: 'Guia gratuito',
    title: 'Guia Liberdade Geográfica',
    promise: 'O primeiro passo para trabalhar de qualquer lugar do mundo.',
    text: 'Os primeiros passos para construir uma carreira que você possa levar para qualquer lugar: o que eu aprendi saindo do Brasil, vivendo na Austrália e viajando pela Ásia enquanto trabalhava.',
    forWho: [
      'Você sonha em viajar ou morar fora, mas não sabe como manter uma renda.',
      'Quer trabalhar de forma remota e não sabe por onde começar.',
      'Sente que o seu trabalho atual te prende a um lugar só.',
      'Quer um plano realista, sem promessa de dinheiro fácil.',
    ],
    chapters: [
      'O que é liberdade geográfica (e o que ela não é)',
      'Profissões e caminhos que dá para levar para qualquer lugar',
      'Como começar sem largar tudo de uma vez',
      'Organização financeira antes de sair do Brasil',
      'Os primeiros passos para esta semana',
    ],
    free: true,
    buy: { label: 'Quero receber', href: 'https://turista-life-laura-irigoyen-ifwilc.subscribepage.io/' },
    faq: faqFree,
    image: import.meta.env.BASE_URL + 'images/work.jpg',
    cover: { image: import.meta.env.BASE_URL + 'images/work.jpg', top: 'Guia gratuito', title: 'Liberdade Geográfica', tone: 'sky' },
  },
  {
    // TODO(dúvida Laura): frase, "para quem" e "o que vai encontrar" são provisórios, montados a partir da descrição do material.
    slug: 'checklist-australia',
    kind: 'Checklist gratuito',
    title: '5 coisas que eu faria diferente antes de ir para a Austrália',
    promise: 'Os aprendizados que teriam me poupado tempo e dinheiro.',
    text: 'Depois de 3 anos e meio na Austrália, juntei num checklist as cinco coisas que eu faria diferente antes de embarcar, para você chegar mais preparado do que eu cheguei.',
    forWho: [
      'Você está planejando ir para a Austrália e quer evitar os erros mais comuns.',
      'Já tem data para embarcar e quer revisar o que falta antes de ir.',
      'Quer chegar com mais reserva e menos perrengue nas primeiras semanas.',
      'Prefere aprender com a experiência de quem já viveu lá.',
    ],
    // TODO(dúvida Laura): os 5 itens reais do checklist.
    chapters: [
      'Planejamento financeiro antes de embarcar',
      'Inglês: o que eu teria estudado antes',
      'Documentos e currículo prontos antes de chegar',
      'Onde morar nas primeiras semanas',
      'A mentalidade para o primeiro emprego',
    ],
    free: true,
    buy: { label: 'Quero receber', href: 'https://turista-life-laura-irigoyen-nehwou.subscribepage.io/' },
    faq: faqFree,
    image: import.meta.env.BASE_URL + 'images/opera.jpg',
    cover: { image: import.meta.env.BASE_URL + 'images/opera.jpg', top: 'Checklist', title: 'Austrália', tone: 'pine' },
  },
]

/* ------------------------------------------------------------------ */
/* /recomendacoes                                                      */
/* ------------------------------------------------------------------ */

export type RecItem = {
  /** Marca: logo oficial em /images/logos ou, sem logo, o nome em texto. */
  brand: { name: string; logo?: string }
  /** Foto da viagem da Laura que abre o card. */
  image: string
  position?: string
  /** Onde ela usou (aparece em letra cursiva sobre a foto). */
  place?: string
  title: string
  why: string
  perk?: string
  coupon?: string
  cta: string
  href: string
  /** Aparece também na seção de recomendações da home. */
  featured?: boolean
}

export type RecCategory = {
  id: string
  title: string
  /** Rótulo curto do filtro. */
  label: string
  icon: 'card' | 'bed' | 'plane' | 'ticket' | 'sim' | 'shield' | 'car' | 'laptop' | 'passport'
  /** Sem itens: a categoria aparece com um card "Em breve". */
  items: RecItem[]
}

const img = (f: string) => import.meta.env.BASE_URL + 'images/' + f
const logo = (f: string) => import.meta.env.BASE_URL + 'images/logos/' + f

const recCategories: RecCategory[] = [
  {
    id: 'dinheiro', title: 'Dinheiro e cartões internacionais', label: 'Dinheiro e cartões', icon: 'card',
    items: [
      { brand: { name: 'Nomad', logo: logo('nomad.svg') }, image: img('diario/bangkok-2.jpg'), place: 'Bali e Tailândia', title: 'Conta global Nomad', why: 'O cartão que eu uso em tudo. Funcionou em todos os lugares de Bali e da Tailândia e desconta na moeda local.', perk: 'Até US$ 20 ou €20 de cashback na primeira conversão', coupon: 'TURISTALIFE', cta: 'Abrir minha conta', href: 'https://link.nomadglobal.com/wIQT/TURISTALIFE', featured: true },
    ],
  },
  {
    id: 'hospedagens', title: 'Hospedagens', label: 'Hospedagens', icon: 'bed',
    items: [
      { brand: { name: 'Agoda', logo: logo('agoda.svg') }, image: img('diario/gili-1.jpg'), title: 'O hotel em que fiquei em Krabi', why: 'Um pouco acima da média que eu costumo pagar, mas pelo que entrega saiu barato. Eu levo horas lendo avaliações antes de reservar.', cta: 'Ver hotel', href: 'https://agoda.tpm.li/ws5fHCJo', featured: true },
    ],
  },
  {
    id: 'passagens', title: 'Passagens aéreas', label: 'Passagens aéreas', icon: 'plane',
    items: [
      { brand: { name: 'Agência de viagens' }, image: img('diario/partida-1.jpg'), position: '38% 30%', title: 'Passagens aéreas mais baratas', why: 'Onde eu compro as passagens da viagem. Dica: às vezes duas conexões saem mais barato que o voo direto.', cta: 'Ver ofertas', href: 'https://agencia.iddas.com.br/so/eyzdkw13', featured: true },
    ],
  },
  {
    id: 'passeios', title: 'Passeios e experiências', label: 'Passeios', icon: 'ticket',
    items: [
      { brand: { name: 'GetYourGuide', logo: logo('getyourguide.svg') }, image: img('diario/ubud-2.jpg'), title: 'Passeios no mundo todo', why: 'Em lugares grandes eu prefiro ir com guia local: entendo a história e não fico perdida.', perk: 'Desconto com o cupom', coupon: 'TURISTALIFE5', cta: 'Ver passeios', href: 'https://gyg.me/turistalife-app', featured: true },
      { brand: { name: 'GetYourGuide', logo: logo('getyourguide.svg') }, image: img('diario/bangkok-3.jpg'), place: 'Bangkok', title: 'Mercado do Trem + Mercado Flutuante', why: 'O passeio que eu fiz em Bangkok, com guia e saída de um ponto de encontro no centro. Vale muito a pena.', coupon: 'TURISTALIFE5', cta: 'Ver passeio', href: 'https://getyourguide.tpm.li/SKiGC8qK' },
    ],
  },
  { id: 'internet', title: 'Internet e eSIM', label: 'Internet e eSIM', icon: 'sim', items: [] },
  { id: 'seguros', title: 'Seguros de viagem', label: 'Seguros', icon: 'shield', items: [] },
  { id: 'carro', title: 'Aluguel de carro', label: 'Aluguel de carro', icon: 'car', items: [] },
  {
    id: 'renda', title: 'Trabalho e renda online', label: 'Renda online', icon: 'laptop',
    items: [
      { brand: { name: 'Hotmart', logo: logo('hotmart.svg') }, image: img('work.jpg'), title: 'Como estou aprendendo a ganhar dinheiro online', why: 'A formação que estou fazendo: são mais de 12 profissões que permitem trabalhar de qualquer lugar.', cta: 'Conhecer', href: 'https://go.hotmart.com/W105546619I' },
    ],
  },
  {
    id: 'australia', title: 'Para quem vai para a Austrália', label: 'Austrália', icon: 'passport',
    items: [
      { brand: { name: 'Assessoria de imigração' }, image: img('diario/sydney-2.jpg'), position: '50% 30%', title: 'Agente de imigração', why: 'O time que acompanhou o meu processo do início ao fim e me ajudou quando meu visto deu problema. Recomendo de olhos fechados.', cta: 'Agendar conversa', href: 'https://calendly.com/d/cxwy-bw6-hsr' },
      { brand: { name: 'E-book Turista Life' }, image: img('sydney.jpg'), place: 'Sydney e Cairns', title: 'E-book: trabalho na Austrália', why: 'Tudo o que eu aprendi conseguindo emprego em cinco áreas diferentes em Sydney e Cairns.', cta: 'Ver e-book', href: '/produtos' },
    ],
  },
]

export const recsPage = {
  hero: {
    eyebrow: 'Recomendações',
    script: 'Testado na estrada',
    title: 'O que eu realmente uso para viajar e trabalhar',
    text: 'Eu só indico o que uso no dia a dia. Com meus links e cupons você economiza e ainda apoia o meu trabalho, sem pagar nada a mais por isso.',
    image: import.meta.env.BASE_URL + 'images/v-nusa.jpg',
    position: '50% 30%',
  },
  categories: recCategories,
  soon: 'Estou separando a minha indicação para esta categoria. Em breve aparece aqui.',
  tips: {
    title: 'Minhas regras para gastar menos',
    items: [
      'Ando sempre com a minha garrafa de água: nos cafés ela é superfaturada.',
      'Meta de alimentação na Tailândia: cerca de 15 dólares australianos por dia.',
      'Café da manhã do 7-Eleven antes do aeroporto, onde tudo custa o dobro.',
      'Dinheiro e cartão equilibrados: lugares pequenos só aceitam cash para valores baixos.',
      'Fico mais dias em cada cidade: uma parte para passear, outra para trabalhar.',
    ],
  },
  disclosure: 'Alguns links desta página são de afiliado: se você comprar por eles, eu recebo uma pequena comissão, sem custo extra para você.',
  cta: {
    title: 'Quer saber quanto custa cada destino?',
    text: 'Todo mês eu abro quanto ganhei e quanto gastei viajando. Os números estão no canal.',
    cta: { label: 'Ver no YouTube', href: links.youtube },
  },
}

/* ------------------------------------------------------------------ */
/* /parcerias                                                          */
/* ------------------------------------------------------------------ */

export const mediaKit = {
  hero: {
    eyebrow: 'Parcerias',
    script: 'Para marcas',
    title: 'Uma audiência que confia no que eu recomendo',
    text: 'Brasileiros que sonham em viajar, morar fora e trabalhar de qualquer lugar acompanham a minha jornada real, com números abertos todo mês.',
    image: import.meta.env.BASE_URL + 'images/brands.jpg',
  },
  updated: 'Números de outubro de 2026',
  stats: [
    { value: '110 mil', label: 'seguidores no Instagram', note: '@turista.life' },
    { value: '3,4 mi', label: 'visualizações no vídeo mais visto', note: 'Short sobre taxa de bagagem' },
    { value: '+5,7 mil', label: 'inscritos no YouTube', note: 'em 3 meses de canal' },
    { value: '9,7 mil', label: 'seguidores no TikTok', note: '@turistalife' },
  ],
  about: {
    title: 'Quem é a Laura',
    paragraphs: [
      'Gaúcha de Porto Alegre e formada em Turismo, morou 3 anos e meio em Sydney trabalhando com hospitalidade, hotelaria e numa agência de intercâmbio.',
      'Em julho de 2026 deixou a vida estável para viajar o mundo sozinha e documentar, mês a mês, a construção de uma renda 100% online. Faz tudo sozinha: roteiro, gravação, edição e estratégia.',
    ],
    image: import.meta.env.BASE_URL + 'images/sydney.jpg',
  },
  audience: [
    { title: 'Quem me acompanha', text: 'Brasileiros que moram fora ou querem morar, intercambistas e quem sonha com trabalho remoto.' },
    { title: 'Do que eles gostam', text: 'Viagem com orçamento real, vida no exterior, Austrália, Sudeste Asiático, finanças de viagem e renda online.' },
    { title: 'Por que confiam', text: 'Eu mostro o que dá certo e o que dá errado, inclusive quanto ganho e gasto. Só recomendo o que uso.' },
  ],
  /* Blocos de audiência (MID-06): ficam ocultos enquanto `items` estiver vazio.
     Preencher quando a Laura enviar os dados. Ex.: { value: '62%', label: 'mulheres', note: 'Instagram' } */
  audienceData: [
    { title: 'Principais países', items: [] as { value: string; label: string; note?: string }[] },
    { title: 'Principais cidades', items: [] as { value: string; label: string; note?: string }[] },
    { title: 'Faixa etária', items: [] as { value: string; label: string; note?: string }[] },
    { title: 'Gênero', items: [] as { value: string; label: string; note?: string }[] },
    { title: 'Alcance recente', items: [] as { value: string; label: string; note?: string }[] },
  ],
  pillars: [
    {
      title: 'Viagem sem filtro',
      text: 'Vlogs pela Ásia mostrando a realidade dos destinos: custos, perrengues e o que vale a pena.',
      brands: 'passeios, hospedagem, seguro viagem, companhias aéreas e equipamentos de viagem.',
      image: import.meta.env.BASE_URL + 'images/v-nusa.jpg',
    },
    {
      title: 'Vida no exterior',
      text: 'Austrália, Working Holiday, trabalho e o dia a dia de quem mora fora.',
      brands: 'intercâmbio e educação, contas globais e câmbio, serviços para quem mora fora.',
      image: import.meta.env.BASE_URL + 'images/v-sydney.jpg',
    },
    {
      title: 'Liberdade geográfica',
      text: 'A série mensal "tentando viver da internet", com metas e números abertos.',
      brands: 'trabalho remoto, ferramentas digitais, cursos online e finanças.',
      image: import.meta.env.BASE_URL + 'images/work.jpg',
    },
  ],
  formatGroups: [
    {
      title: 'Conteúdo nas minhas redes sociais',
      text: 'Sua marca aparece para a minha audiência, integrada ao conteúdo de viagem.',
      items: ['Reels e TikTok', 'Stories', 'Integrações em vídeos no YouTube'],
    },
    {
      title: 'Produção de conteúdo para marcas',
      text: 'Conteúdo exclusivo para a sua marca usar nos próprios canais, sem precisar ser publicado nas minhas redes.',
      items: ['UGC', 'Conteúdos para anúncios pagos, mediante condições específicas de uso'],
    },
    {
      title: 'Projetos personalizados',
      text: 'Formatos sob medida para objetivos maiores.',
      items: ['Campanhas', 'Experiências e hospedagens', 'Parcerias recorrentes', 'Projetos especiais'],
    },
  ],
  fits: ['Contas globais e câmbio', 'Passeios e turismo', 'Hospedagem', 'Seguro viagem', 'Intercâmbio e educação', 'Equipamentos de viagem', 'Trabalho remoto', 'Companhias aéreas'],
  steps: [
    { title: 'Conversa', text: 'Você me conta o objetivo da campanha.' },
    { title: 'Proposta', text: 'Envio formatos, datas e valores sob medida.' },
    { title: 'Produção', text: 'Produzo o conteúdo combinado. UGC e materiais exclusivos podem ser feitos de qualquer lugar.' },
    { title: 'Relatório', text: 'Você recebe os resultados da campanha.' },
  ],
  contact: {
    title: 'Vamos conversar?',
    text: 'Me escreve contando sobre a sua marca. Eu respondo pessoalmente.',
    email: links.email,
    cta: { label: 'Enviar e-mail', href: `mailto:${links.email}?subject=Parceria%20Turista%20Life` },
  },
}
