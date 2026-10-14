/**
 * Conteúdo da página /sobre.
 * Fonte: o que a Laura conta nos vídeos do canal (principalmente "Por que estou indo embora
 * da Austrália?") e nos títulos dos Shorts. Frases entre aspas são falas dela, levemente editadas.
 */
import { links } from './content'

export const aboutPage = {
  hero: {
    eyebrow: 'Sobre mim',
    script: 'Prazer, Laura',
    title: 'Gaúcha, turismóloga e aprendendo a viver sem endereço fixo',
    text: 'Morei 3 anos e meio na Austrália, larguei a vida estável e hoje viajo o mundo sozinha enquanto construo uma renda pela internet. Aqui está a história inteira.',
    image: import.meta.env.BASE_URL + 'images/diario/uluwatu-1.jpg',
    position: '50% 60%',
  },
  intro: {
    hello: 'Oi, eu sou a Laura',
    paragraphs: [
      'Sou de Porto Alegre e me formei em Turismo. Dois anos depois da faculdade eu estava naquela crise que muita gente jovem conhece: sem saber muito que rumo tomar e com vontade de viver coisas novas.',
      'Em 2022 abriu o visto Working Holiday para brasileiros, com só 500 vagas por ano. Apliquei sem grandes expectativas e consegui. Nunca tinha sonhado em morar na Austrália, mas sempre quis conhecer. Foram 3 anos e meio que mudaram tudo.',
      'Hoje eu documento a construção da minha liberdade geográfica: viajar o mundo trabalhando pela internet, mostrando o que dá certo, o que dá errado e quanto eu ganho e gasto. Sem romantizar.',
    ],
    portrait: { src: import.meta.env.BASE_URL + 'images/sydney.jpg', alt: 'Laura de boné em Sydney', caption: 'Laura Irigoyen' },
    facts: ['Porto Alegre, RS', 'Formada em Turismo', '3,5 anos na Austrália', 'Na estrada desde julho de 2026', 'Viajo sozinha'],
  },
  timeline: [
    { when: 'Antes de tudo', title: 'Porto Alegre', text: 'Formada em Turismo, com um intercâmbio nos Estados Unidos na bagagem e muita vontade de conhecer o mundo.' },
    { when: 'Julho de 2022', title: 'O visto que mudou tudo', text: 'Aplico para o Working Holiday, um visto concorrido de trabalho e viagem para brasileiros de até 30 anos. E dá certo.' },
    { when: 'Dezembro de 2022', title: 'Chegada em Sydney', text: 'Pouco dinheiro e a pressa de começar a ganhar em dólar. Em 4 dias, consigo o primeiro emprego deixando o currículo pessoalmente.' },
    { when: 'Março de 2023', title: 'Três meses em Cairns', text: 'Mudo para o norte para estender o visto: café às 5h30 da manhã e hostel com mais 10 pessoas no quarto.' },
    { when: '2023 a 2026', title: 'De volta a Sydney', text: 'Restaurante, café, faxina, recepção de hotel e, por fim, um trabalho de escritório numa agência de intercâmbio.' },
    { when: 'Março de 2025', title: 'De volta à internet', text: 'Decido parar de esperar o "momento certo" e volto a criar conteúdo sobre a vida de imigrante. Em pouco mais de um ano, mais de 100 mil pessoas me acompanham.' },
    { when: 'Junho de 2026', title: 'O fim de um ciclo', text: 'Um problema no visto vira o empurrão que faltava. Escolho ir embora e viver o sonho de viajar o mundo.' },
    { when: 'Julho de 2026', title: 'O mundo vira casa', text: 'Começo por Bali e sigo pela Ásia, tentando viver 100% da internet antes que a reserva financeira acabe.', link: { label: 'Ver os destinos da viagem', href: '/destinos' } },
  ],
  jobs: {
    title: 'Cinco áreas, nenhuma semana desempregada',
    text: 'Em 3 anos e meio na Austrália eu fiz coisas que nunca tinha imaginado fazer no Brasil, e aprendi na prática como conseguir trabalho em cada uma delas.',
    items: [
      { title: 'Garçonete', text: 'Num restaurante tailandês, meu primeiro emprego. Durou um mês.' },
      { title: 'Cafés', text: 'Em Sydney e em Cairns, fazendo todas as horas possíveis.' },
      { title: 'Faxina', text: 'Trabalhei como cleaner, literalmente faxineira. E dá para pagar as contas.' },
      { title: 'Recepção de hotel', text: 'Mais uma área nova, mais um currículo adaptado para a vaga.' },
      { title: 'Agência de intercâmbio', text: 'Trabalho de escritório, o mais longo que tive por lá.' },
    ],
    cta: { label: 'Conheça o e-book', href: '/produtos' },
  },
  values: {
    title: 'No que eu acredito',
    items: [
      { title: 'Sem romantizar', text: 'A internet mostra recortes. Eu mostro a viagem real: os perrengues, os gastos e o que me decepciona.' },
      { title: 'O momento certo é agora', text: 'Eu passei tempo demais esperando o momento certo. Ele nunca chega, a gente só adia os planos.' },
      { title: 'Constância', text: 'É a parte mais difícil e a mais importante de qualquer projeto. Eu não paro.' },
      { title: 'Experiências antes de coisas', text: 'Prefiro gastar com comida e viagem do que com objetos. Quem quer viajar o mundo não pode acumular coisas.' },
      { title: 'Nada acontece por acaso', text: 'O que parece ruim no momento, lá na frente se explica. Foi assim com o fim da Austrália.' },
    ],
  },
  quote: {
    text: 'Meu maior medo sempre foi o dinheiro acabar. Hoje eu entendo que o maior medo, na verdade, seria olhar para trás e pensar: eu nunca tentei.',
    author: 'Laura, no primeiro mês em Bali',
  },
  facts: {
    title: 'Coisas que você precisa saber sobre mim',
    items: [
      { title: 'Amo correr', text: 'Já corri muito em volta da Opera House. Em Bali, achei academia na primeira semana.' },
      { title: 'Supermercado é ponto turístico', text: 'Em todo país novo, entro no mercado para ver o que tem e quanto custa.' },
      { title: 'Amo aeroportos', text: 'Desde criança. Gente do mundo inteiro, horas de espera e eu feliz.' },
      { title: 'Prefiro o mar', text: 'Cachoeira gelada e mergulho com snorkel não são comigo. Já sei: sou chata.' },
      { title: 'Sou organizada', text: 'Agenda, planilha e metas para tudo. Eu passo horas lendo avaliações antes de reservar um quarto.' },
      { title: 'Meu medo na estrada', text: 'Perder o passaporte e ficar doente sozinha. Confiro o passaporte o tempo inteiro.' },
    ],
  },
  behind: {
    title: 'Por trás de cada vídeo',
    text: 'Ninguém trabalha comigo. Eu planejo, escrevo o roteiro, gravo, edito, posto em quatro redes, respondo mensagens, negocio parcerias e ainda organizo passagens, hospedagens e vistos. Parece só um videozinho, mas não é.',
    steps: ['Planejar', 'Roteirizar', 'Gravar', 'Editar', 'Publicar'],
    image: import.meta.env.BASE_URL + 'images/work.jpg',
  },
  cta: {
    title: 'Vem comigo nessa jornada?',
    text: 'Eu conto tudo em tempo real no YouTube, no Instagram e no TikTok.',
    cta: { label: 'Acompanhe a jornada', href: links.youtube },
  },
  socials: links,
}
