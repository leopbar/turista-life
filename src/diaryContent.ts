/**
 * Diário de bordo: a rota da Laura desde a saída de Sydney (jul/2026).
 * Fonte: os vídeos longos do canal youtube.com/@turistalife. Resumos, prós, contras,
 * dicas e o ranking de Bali vêm do que ela fala em cada vídeo.
 *
 * Para adicionar uma parada: inclua um objeto em `countries[].items` (ou um país novo)
 * e as fotos em /public/images/diario. O mapa, os números e a home se atualizam sozinhos.
 */

export type Video = { id: string; title: string; duration: string }

export type Stop = {
  type: 'stop'
  id: string
  city: string
  period: string
  stay: string
  /** Coordenadas reais, usadas no mapa da rota. */
  coords: [lat: number, lon: number]
  summary: string
  highlights: string[]
  pros: string[]
  cons: string[]
  tip?: string
  badge?: string
  current?: boolean
  images: { src: string; alt: string }[]
  videos: Video[]
}

export type Milestone = {
  type: 'milestone'
  id: string
  month: string
  recordedAt: string
  income: number
  spent?: string
  bullets: string[]
  video: Video
}

export type Country = {
  id: string
  name: string
  code: string
  period: string
  intro: string
  items: (Stop | Milestone)[]
}

export const GOAL = 5000

export const diaryPage = {
  hero: {
    eyebrow: 'Diário de bordo',
    script: 'Acompanhe a jornada',
    title: 'A rota, parada por parada',
    text: 'Cada parada da viagem, resumida: o que eu vi, o que eu amei, o que me decepcionou e os vídeos completos de cada lugar. E, entre um destino e outro, os números reais de cada mês tentando viver da internet.',
    image: import.meta.env.BASE_URL + 'images/diario/nusa-2.jpg',
  },
  startDate: '2026-07-01',
  departure: {
    title: 'O ponto de partida',
    place: 'Sydney, Austrália',
    period: 'Junho de 2026',
    text: 'Depois de 3 anos e meio em Sydney, um problema no visto virou o empurrão que faltava. Em vez de procurar outro caminho para ficar, transformei o fim de um ciclo no começo do sonho: viajar o mundo enquanto construo uma renda 100% online.',
    image: import.meta.env.BASE_URL + 'images/diario/partida-1.jpg',
    video: { id: 'pwwxtfpaVNs', title: 'Por que estou indo embora da Austrália?', duration: '24:36' } as Video,
  },
  next: {
    title: 'Próximo destino',
    text: 'A primeira temporada pela Ásia continua por mais alguns países. O próximo eu só conto quando estiver lá.',
  },
}

export const countries: Country[] = [
  {
    id: 'indonesia',
    name: 'Indonésia',
    code: 'ID',
    period: 'Julho e agosto de 2026',
    intro: 'Quase dois meses em Bali, o máximo do visto de turista. Escolhi a ilha para começar justamente pela estrutura para nômades digitais e pelo custo de vida.',
    items: [
      {
        type: 'stop',
        id: 'canggu',
        city: 'Canggu, Bali',
        period: '1 a 25 de julho',
        stay: '25 dias',
        coords: [-8.65, 115.13],
        badge: '2º no meu ranking de Bali',
        summary: 'A primeira parada, escolhida a dedo: o lugar de Bali com mais nômades digitais, para chegar e focar 100% no trabalho. Um caos que funciona.',
        highlights: [
          'Cafés e coworkings em toda esquina, com Wi-Fi bom',
          'Moto por aplicativo (Grab e Gojek) é o transporte do dia a dia',
          'Oferendas balinesas na frente de casas e lojas, todos os dias',
          'Pôr do sol na praia, com surfistas e moradores misturados',
        ],
        pros: [
          'Estrutura completa para quem trabalha online',
          'Comer fora todos os dias sai barato',
          'Pessoas muito simpáticas e prestativas',
          'Rotina de praia, academia e vida saudável',
        ],
        cons: [
          'Trânsito caótico, sem calçada nem faixa de pedestre',
          'Barulho de obras e poeira no ar',
          'Lixo nas ruas e até na praia',
          'Praias de areia preta, menos bonitas para turistar',
        ],
        tip: 'Só água de garrafa e sempre peça capacete ao motorista: muitos têm um guardado na moto.',
        images: [
          { src: import.meta.env.BASE_URL + 'images/diario/canggu-1.jpg', alt: 'Vista aérea da praia de Canggu' },
          { src: import.meta.env.BASE_URL + 'images/diario/canggu-2.jpg', alt: 'Rua de Canggu ao lado de um arrozal' },
          { src: import.meta.env.BASE_URL + 'images/diario/canggu-3.jpg', alt: 'Laura numa rua de Canggu' },
        ],
        videos: [
          { id: 'qPqpePK8oFM', title: 'Larguei tudo pra tentar viver da internet! Essa é a realidade', duration: '30:19' },
          { id: '-JAjCDJhsPw', title: 'O lado de Bali que a internet esconde', duration: '22:01' },
        ],
      },
      {
        type: 'stop',
        id: 'ubud',
        city: 'Ubud, Bali',
        period: 'Fim de julho e início de agosto',
        stay: '14 dias',
        coords: [-8.51, 115.26],
        badge: '3º no meu ranking de Bali',
        summary: 'A Bali dos cartões-postais: arrozais, templos, cachoeiras e a Floresta dos Macacos. Lindo, mas pensado inteiro para o turismo e quase sempre lotado.',
        highlights: [
          'Arrozal de Tegallalang, antes das 10h para fugir dos ônibus',
          'Degustação de cafés e chás numa plantação',
          'Templo do Elefante, construído no século X',
          'Floresta dos Macacos (deixe tudo guardado)',
        ],
        pros: [
          'Concentra os passeios clássicos de Bali',
          'Natureza e templos impressionantes',
          'Yoga, spas e retiros por toda parte',
        ],
        cons: [
          'Calçadas estreitas e sempre cheias',
          'Gente oferecendo passeio e táxi o tempo todo',
          'Fila paga para foto em cachoeira',
          'Trânsito pesado de carros e ônibus de turismo',
        ],
        tip: 'Para turistar, 4 dias bastam. Eu fiquei 14 e foi demais. Chegue cedo em todos os pontos.',
        images: [
          { src: import.meta.env.BASE_URL + 'images/diario/ubud-1.jpg', alt: 'Arrozal e coqueiros em Ubud' },
          { src: import.meta.env.BASE_URL + 'images/diario/ubud-2.jpg', alt: 'Cachoeira na floresta perto de Ubud' },
          { src: import.meta.env.BASE_URL + 'images/diario/ubud-3.jpg', alt: 'Laura diante de um muro esculpido em pedra' },
        ],
        videos: [{ id: '8B9nxMnWFlE', title: 'Conheci o lado mais famoso de Bali… e me decepcionei', duration: '24:29' }],
      },
      {
        type: 'milestone',
        id: 'mes-1',
        month: 'Mês 1 · julho',
        recordedAt: 'Gravado em Ubud',
        income: 4500,
        spent: 'Gastos em Bali: cerca de A$ 300 em dinheiro e A$ 718 no cartão, mais A$ 553 de hospedagem',
        bullets: ['Duas publicidades pagas', 'Primeiras vendas como afiliada', 'Mais de 900 inscritos novos no YouTube'],
        video: { id: 'wfKyB2O7MOk', title: 'Meu primeiro mês tentando viver da internet (quanto ganhei?)', duration: '29:01' },
      },
      {
        type: 'stop',
        id: 'gili',
        city: 'Gili Trawangan',
        period: 'Agosto',
        stay: '3 noites',
        coords: [-8.35, 116.04],
        badge: '5º no meu ranking de Bali',
        summary: 'Uma ilha sem carros, de bicicleta e charrete, com água cristalina e clima total de férias. Linda, mas não é a minha vibe para trabalhar sozinha.',
        highlights: [
          'Volta na ilha de bicicleta: uns 7 km, tudo plano',
          'Night market com satay e bolinho de milho',
          'Um dos melhores lugares para snorkel e mergulho com tartarugas',
        ],
        pros: [
          'Silenciosa, sem carros nem motos a gasolina',
          'Perfeita para mergulho e passeios de barco',
          'Muita atividade e vida noturna',
        ],
        cons: [
          'Tudo mais caro, até a garrafa de água',
          'Check-in do barco caótico, sem fila',
          'Festa demais para quem quer trabalhar',
        ],
        tip: 'Confira sempre a conta: cobraram o pedido de outra mesa na minha.',
        images: [
          { src: import.meta.env.BASE_URL + 'images/diario/gili-1.jpg', alt: 'Barcos na praia de água turquesa em Gili' },
          { src: import.meta.env.BASE_URL + 'images/diario/gili-2.jpg', alt: 'Laura na praia de Gili Trawangan' },
          { src: import.meta.env.BASE_URL + 'images/diario/gili-3.jpg', alt: 'Laura sorrindo numa rua de Gili' },
        ],
        videos: [{ id: 'TtBuGZLTSog', title: 'A realidade dos lugares mais paradisíacos de Bali', duration: '40:32' }],
      },
      {
        type: 'stop',
        id: 'nusa-penida',
        city: 'Nusa Penida',
        period: 'Agosto',
        stay: '2 noites',
        coords: [-8.73, 115.54],
        badge: '4º no meu ranking de Bali',
        summary: 'As paisagens mais bonitas da viagem, e as mais disputadas. Natureza de tirar o fôlego com estrada ruim e multidão em volta.',
        highlights: ['Diamond Beach, a minha favorita', 'Kelingking, o famoso "T-Rex"', 'Broken Beach, com golfinhos passando'],
        pros: ['Entre as paisagens mais bonitas que eu já vi', 'Dá para fazer em bate-volta saindo de Bali'],
        cons: [
          'Estradas esburacadas e perigosas',
          'Multidão e disputa por lugar para foto',
          'Sem aplicativo de transporte: táxi caro',
          'Quase 4 horas de barco vindo de Gili',
        ],
        tip: 'Não alugue moto. Vá com guia de carro e comece o mais cedo possível.',
        images: [
          { src: import.meta.env.BASE_URL + 'images/diario/nusa-1.jpg', alt: 'Falésia de Kelingking em Nusa Penida' },
          { src: import.meta.env.BASE_URL + 'images/diario/nusa-2.jpg', alt: 'Arco de pedra de Broken Beach' },
          { src: import.meta.env.BASE_URL + 'images/diario/nusa-3.jpg', alt: 'Laura em Nusa Penida' },
        ],
        videos: [{ id: 'TtBuGZLTSog', title: 'A realidade dos lugares mais paradisíacos de Bali', duration: '40:32' }],
      },
      {
        type: 'stop',
        id: 'uluwatu',
        city: 'Uluwatu, Bali',
        period: 'Fim de agosto',
        stay: '10 dias',
        coords: [-8.83, 115.09],
        badge: '1º no meu ranking de Bali',
        summary: 'Praias de falésia, surf e o equilíbrio ideal entre trabalho e vida de praia. Foi onde eu mais me senti em casa em Bali.',
        highlights: [
          'Bingin e Padang Padang, as praias mais famosas',
          'Pôr do sol nos beach clubs em cima da falésia',
          'Treinos funcionais todos os dias',
          'Muitos brasileiros e até comida brasileira',
        ],
        pros: ['As praias mais bonitas de Bali', 'Vibe de surf, jovem e ativa', 'Bons cafés para trabalhar'],
        cons: [
          'A região mais cara de Bali',
          'Tudo espalhado: depende de moto',
          'Muita escada para descer e subir das praias',
          'Corais no fundo do mar machucam o pé',
        ],
        tip: 'Economizar numa hospedagem mal localizada saiu caro em moto. E compre Havaianas no Brasil: aqui custam R$ 100.',
        images: [
          { src: import.meta.env.BASE_URL + 'images/diario/uluwatu-1.jpg', alt: 'Praia vista do alto da falésia em Uluwatu' },
          { src: import.meta.env.BASE_URL + 'images/diario/uluwatu-2.jpg', alt: 'Mar turquesa entre árvores em Uluwatu' },
          { src: import.meta.env.BASE_URL + 'images/diario/uluwatu-3.jpg', alt: 'Laura de óculos escuros em Uluwatu' },
        ],
        videos: [{ id: 'rtEBiuBCNxE', title: 'Depois de 2 meses em Bali, fui parar onde menos esperava', duration: '30:33' }],
      },
    ],
  },
  {
    id: 'australia',
    name: 'Austrália',
    code: 'AU',
    period: 'Agosto e setembro de 2026',
    intro: 'Uma volta rápida, agora como turista: meu sobrinho nasceu enquanto eu estava em Bali e minha mãe vinha do Brasil.',
    items: [
      {
        type: 'stop',
        id: 'perth',
        city: 'Perth',
        period: 'Fim de agosto',
        stay: 'Alguns dias',
        coords: [-31.95, 115.86],
        summary: 'Voar Bali–Perth–Sydney saiu mais barato que o voo direto, então aproveitei para conhecer. Do caos de Bali para uma das cidades mais calmas que eu já vi.',
        highlights: ['Ferry pelo rio com vista da cidade', 'Praias com pôr do sol no mar', 'Banheiros públicos e bebedouros em todo lugar'],
        pros: ['Limpa, segura e tranquila', 'Transporte público excelente', 'Qualidade de vida visível'],
        cons: ['Isolada e cara para chegar', 'Cidade vazia demais (talvez pelo inverno)'],
        tip: 'Compare rotas com escala: às vezes sai mais barato e ainda rende um destino novo. E se vier de Bali, traga roupa de frio: eu tive que comprar assim que cheguei.',
        images: [{ src: import.meta.env.BASE_URL + 'images/diario/perth-2.jpg', alt: 'Laura de casaco na Austrália' }],
        videos: [],
      },
      {
        type: 'milestone',
        id: 'mes-2',
        month: 'Mês 2 · agosto',
        recordedAt: 'Gravado em Perth',
        income: 4300,
        spent: 'Gastei cerca de R$ 5.462: no vermelho de novo',
        bullets: ['YouTube passou de 4.000 inscritos e liberou as horas de monetização', 'Afiliados: 300% acima da meta', 'Facebook voltou a monetizar'],
        video: { id: '5qp6FXtZm2g', title: 'Meu 2º mês tentando viver da internet (quanto eu ganhei?)', duration: '22:05' },
      },
      {
        type: 'stop',
        id: 'sydney',
        city: 'Sydney',
        period: 'Setembro',
        stay: 'Algumas semanas',
        coords: [-33.87, 151.21],
        summary: 'De volta como turista à cidade que foi casa por 3 anos e meio, para conhecer meu sobrinho e rever minha mãe. E para responder: a Austrália é tão boa quanto parece?',
        highlights: ['Opera House e Jardim Botânico', 'Ferry até Manly, a minha praia favorita', 'Custo de vida real: cerca de A$ 700 por semana'],
        pros: ['Segurança, inclusive para mulher sozinha', 'Salário mínimo acima de A$ 1.000 por semana', 'Transporte que funciona e praia depois do expediente'],
        cons: ['Um dos custos de vida mais altos do mundo', 'Longe de tudo, e da família', 'Visto sempre incerto para imigrante'],
        tip: 'Dá para conhecer Sydney inteira de transporte público: em 3 anos eu nunca precisei de carro.',
        images: [
          { src: import.meta.env.BASE_URL + 'images/diario/sydney-1.jpg', alt: 'Praia de Sydney vista do alto' },
          { src: import.meta.env.BASE_URL + 'images/diario/sydney-2.jpg', alt: 'Laura com a Opera House ao fundo' },
          { src: import.meta.env.BASE_URL + 'images/diario/sydney-3.jpg', alt: 'Laura em Manly' },
        ],
        videos: [{ id: 'hKqoB9HA9uM', title: 'O país onde todo brasileiro quer morar!', duration: '23:38' }],
      },
    ],
  },
  {
    id: 'tailandia',
    name: 'Tailândia',
    code: 'TH',
    period: 'Setembro e outubro de 2026',
    intro: 'Início da primeira temporada pela Ásia: três meses, vários países, com todas as passagens compradas de uma vez.',
    items: [
      {
        type: 'stop',
        id: 'bangkok',
        city: 'Bangkok',
        period: 'Fim de setembro',
        stay: '1 semana',
        coords: [13.75, 100.5],
        summary: 'Cidade gigante e cheia de informação: templos ao lado de arranha-céus, tuk-tuks e mercados. Cheguei em plena temporada de chuva, com enchente.',
        highlights: ['Talat Noi e a rua Song Wat', 'Chinatown', 'Mercado do Trem e Mercado Flutuante', 'Metrô e BTS sinalizados em inglês'],
        pros: ['Transporte público muito bem estruturado', 'Muito para ver em uma semana', 'Me senti segura até à noite', '"O Brasil da Ásia": povo criativo e receptivo'],
        cons: ['Chuva e enchentes em setembro', 'Pouco inglês fora das áreas turísticas', 'Tuk-tuk caro para turista', 'Um pouco mais cara que Bali'],
        tip: 'Não vá para Bangkok em setembro. E fuja dos "pega-turista" no Mercado Flutuante.',
        images: [
          { src: import.meta.env.BASE_URL + 'images/diario/bangkok-1.jpg', alt: 'Buda dourado gigante perto de Bangkok' },
          { src: import.meta.env.BASE_URL + 'images/diario/bangkok-2.jpg', alt: 'Barcos no Mercado Flutuante' },
          { src: import.meta.env.BASE_URL + 'images/diario/bangkok-3.jpg', alt: 'Mercado do Trem com barracas sobre os trilhos' },
        ],
        videos: [{ id: 'Hc4nMTf6fDg', title: 'Cheguei SOZINHA na Tailândia… e não era o que eu imaginava', duration: '41:00' }],
      },
      {
        type: 'stop',
        id: 'chiang-mai',
        city: 'Chiang Mai',
        period: 'Início de outubro',
        stay: '1 semana',
        coords: [18.79, 98.98],
        summary: 'A capital do norte: cidade de montanha, histórica e cheia de templos. Depois do caos de Bangkok, finalmente consegui desacelerar.',
        highlights: ['Templos e cidade histórica', 'Clima de serra, sem praia', 'Organizei aqui a temporada de três meses pela Ásia'],
        pros: ['Mais tranquila que Bangkok', 'Toda estruturada para o turismo'],
        cons: ['Choveu tanto que não deu para gravar na rua'],
        tip: 'Quando recomendam 4 dias, eu fico 7: três para turistar e o resto para trabalhar.',
        images: [{ src: import.meta.env.BASE_URL + 'images/diario/tailandia-1.jpg', alt: 'Laura trabalhando no aeroporto' }],
        videos: [],
      },
      {
        type: 'milestone',
        id: 'mes-3',
        month: 'Mês 3 · setembro',
        recordedAt: 'Gravado entre Chiang Mai e Krabi',
        income: 3500,
        bullets: ['YouTube chegou a 5.700 inscritos', 'Guia de Bali finalizado', 'Parceria com uma empresa brasileira de passeios na Tailândia'],
        video: { id: 'JuHrtf0UOSc', title: 'Meu 3º mês tentando viver da internet (quanto eu ganhei?)', duration: '25:26' },
      },
      {
        type: 'stop',
        id: 'krabi',
        city: 'Krabi',
        period: 'Outubro',
        stay: 'Agora',
        coords: [8.09, 98.91],
        current: true,
        summary: 'Destino 3 na Tailândia e o começo das praias do sul. O episódio daqui ainda está sendo gravado.',
        highlights: ['Hotel um pouco acima da média que eu pago, mas que vale cada centavo'],
        pros: [],
        cons: [],
        images: [],
        videos: [],
      },
    ],
  },
]

/** Todas as paradas em ordem, para o mapa e para a home. */
export const allStops = countries.flatMap((c) => c.items.filter((i): i is Stop => i.type === 'stop'))
export const allMilestones = countries.flatMap((c) => c.items.filter((i): i is Milestone => i.type === 'milestone'))
export const videoCount = new Set([
  diaryPage.departure.video.id,
  ...allStops.flatMap((s) => s.videos.map((v) => v.id)),
  ...allMilestones.map((m) => m.video.id),
]).size

export const ytUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`
export const ytThumb = (id: string) => `${import.meta.env.BASE_URL}images/videos/${id}.jpg`
