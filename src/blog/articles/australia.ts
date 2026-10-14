/**
 * Artigos da Austrália. Fonte: vídeos hKqoB9HA9uM e rtEBiuBCNxE (final) e os shorts
 * NOyBjK1DFFQ (salário mínimo), Ov8t_rQkTBo e ZjmwiuHKxwU (Perth), ago–set/2026.
 * TODO(dúvida Laura): textos provisórios escritos com as palavras dela nos vídeos; validar.
 */
import type { Article } from '../blogData'

const img = (f: string) => import.meta.env.BASE_URL + 'images/blog/' + f + '.jpg'

export const australiaArticles: Article[] = [
  {
    slug: 'morar-na-australia-vale-a-pena',
    title: 'Morar na Austrália vale a pena? Salário, custo de vida e o outro lado',
    excerpt: 'Depois de 3 anos e meio em Sydney: quanto se ganha, quanto eu gastava por semana, a qualidade de vida e as trocas que ninguém conta.',
    destination: 'sydney',
    category: 'vale-a-pena',
    cover: { src: img('australia-capa'), alt: 'Laura em Sydney com a Opera House ao fundo', position: '50% 35%' },
    trip: 'De 2022 a 2026',
    blocks: [
      { type: 'p', text: 'Eu morei em Sydney do fim de 2022 até o meio de 2026, e voltei como turista para conhecer o meu sobrinho. É uma sensação muito louca passear num lugar onde tu teve uma vida inteira. E aproveitei para responder uma pergunta que eu recebo muito: morar na Austrália é tão bom quanto parece?' },
      { type: 'h2', text: 'O salário' },
      { type: 'p', text: 'Desde julho de 2026, o salário mínimo nacional, numa jornada de 38 horas, dá um pouco mais de A$ 1.000 por semana antes dos impostos. Eu sei que tu deve estar convertendo para real, mas esse é um dos erros: quem mora na Austrália ganha em dólar australiano e gasta em dólar australiano. A pergunta certa não é "quanto dá em reais", é "quanto rende aqui".' },
      { type: 'h2', text: 'Quanto eu gastava por semana em Sydney' },
      { type: 'img', image: { src: img('australia-mercado'), alt: 'Prateleira de produtos brasileiros num mercadinho em Sydney' }, caption: 'Tem mercadinho com polvilho, goiabada, farofa e até erva de chimarrão.' },
      { type: 'prices', title: 'Os meus gastos no último ano', rows: [
        { item: 'Total para me sustentar', price: 'quase A$ 700 por semana' },
        { item: 'Aluguel (a minha parte de um apê de 1 quarto dividido com o meu irmão)', price: '~A$ 360 por semana' },
        { item: 'Transporte público', price: 'A$ 50 por semana' },
        { item: 'Academia', price: '~A$ 25 por semana' },
        { item: 'Lazer e comer fora', price: '~A$ 80 por semana' },
        { item: 'O melhor cookie do planeta', price: 'A$ 8,70' },
      ], note: 'Média minha, de uma pessoa econômica. Dá para gastar mais e dá para gastar menos. Sydney é a cidade mais cara da Austrália.' },
      { type: 'h2', text: 'A qualidade de vida começa quando o expediente termina' },
      { type: 'img', image: { src: img('australia-ferry'), alt: 'Interior do ferry de Sydney a caminho de Manly' } },
      { type: 'p', text: 'O que mais me chamou atenção quando eu comecei a morar lá não foi quanto as pessoas ganhavam, foi quanta vida acontecia fora do trabalho. Tu sai do trabalho e pega um ferry, que é transporte público, até a praia. As lojas fecham às 5 da tarde porque eles acreditam que quem trabalha também merece aproveitar a vida. O dia começa às 6 da manhã, com gente correndo nos parques e os cafés já abertos.' },
      { type: 'img', image: { src: img('australia-manly'), alt: 'Laura no centrinho de Manly' }, caption: 'Manly, o meu lugar favorito em Sydney (desculpa, Bondi).' },
      { type: 'h2', text: 'Segurança, principalmente para mulher' },
      { type: 'p', text: 'Para mim, uma das coisas que mais pesam na qualidade de vida. Não quer dizer que nada acontece lá, mas durante três anos eu andei com o celular e a câmera na mão, peguei transporte sozinha à noite e corri sozinha de short no parque. Quando tu é mulher, tu gasta muito menos energia pensando em "como eu volto para casa" ou "essa rua é tranquila?".' },
      { type: 'h2', text: 'Um país de imigrantes' },
      { type: 'p', text: 'Quase uma em cada três pessoas que vivem na Austrália nasceu em outro país: são cerca de 8,8 milhões numa população de uns 27 milhões. Quando tu chega, normalmente tu entra primeiro num grupo de estrangeiros ou de brasileiros. Quase todos os meus amigos eram imigrantes, e isso torna o processo de morar fora menos assustador.' },
      { type: 'video', id: 'hKqoB9HA9uM', title: 'O país onde todo brasileiro quer morar!' },
      { type: 'h2', text: 'O outro lado' },
      { type: 'list', items: [
        'É longe de tudo: visitar a família no Brasil é caro e exige pelo menos um mês para valer a pena.',
        'A vida de quem ficou continua: datas importantes, as pessoas envelhecendo, as crianças crescendo.',
        'O teu currículo não funciona do mesmo jeito: é difícil entrar na tua área, e tudo começa do zero, em outro idioma.',
        'O visto: querer ficar e ter permissão para ficar são coisas muito diferentes. Quando a tua permanência depende de um visto, sempre tem uma incerteza.',
        'Sydney também tem trânsito, atraso no transporte e crise de moradia.',
      ] },
      { type: 'quote', text: 'A Austrália não oferece uma vida perfeita para todo mundo. Mas, para muita gente, oferece a possibilidade de construir uma vida melhor.' },
      { type: 'tip', title: 'A minha opinião sincera', text: 'Parece que eu estou tentando vender a Austrália, mas não. O melhor país do mundo para ti é o que combina com a vida que tu quer construir e que te dá a chance de ficar. Para mim, foram três anos e meio que mudaram tudo.' },
      { type: 'guide', text: 'Se tu está pensando em ir, o e-book reúne tudo o que eu aprendi conseguindo emprego em cinco áreas diferentes, sem ficar uma semana desempregada.' },
      { type: 'recs', items: [{ cat: 'australia', i: 0 }, { cat: 'dinheiro', i: 0 }, { cat: 'seguros' }] },
    ],
  },
  {
    slug: 'perth-primeiras-impressoes',
    title: 'Perth: primeiras impressões da cidade grande mais isolada do mundo',
    excerpt: 'Do caos de Bali para o silêncio da costa oeste australiana: por que Perth está sempre nos rankings e o que pesa contra ela.',
    destination: 'perth',
    category: 'experiencias',
    cover: { src: img('perth-capa'), alt: 'Laura de cachecol numa praça de Perth', position: '50% 35%' },
    trip: 'Agosto de 2026',
    blocks: [
      { type: 'p', text: 'Perth não estava nos meus planos. O meu sobrinho nasceu enquanto eu estava em Bali e eu precisava ir para Sydney. Só que a passagem de Bali para Sydney estava mais cara do que fazer Bali–Perth e depois Perth–Sydney. Então aproveitei para conhecer.' },
      { type: 'h2', text: 'Primeira impressão: silêncio' },
      { type: 'gallery', images: [
        { src: img('perth-predios'), alt: 'Laura com os prédios espelhados de Perth ao fundo' },
        { src: img('perth-mapa'), alt: 'Mapa da Austrália mostrando Perth na costa oeste' },
        { src: img('perth-rio'), alt: 'Laura na beira do rio em Perth' },
      ] },
      { type: 'p', text: 'Depois do caos de Bali, eu estava no meio do centro da cidade e era um silêncio. Perth tem mais de 2 milhões de habitantes, mas não parece. É tudo muito tranquilo, limpo, organizado, com muito espaço. Tão tranquilo que eu ainda não decidi se isso é bom ou se pode ser um pouco entediante.' },
      { type: 'h2', text: 'A qualidade de vida é visível' },
      { type: 'p', text: 'Tem parque, ciclovia, gente correndo, caminhando e treinando ao ar livre. Ferry pelo rio com vista da cidade, praia com pôr do sol no mar, banheiro público e bebedouro em todo lugar. O que mais me surpreendeu foi isso: Perth tem estrutura de cidade grande sem as pessoas viverem na correria de cidade grande.' },
      { type: 'h2', text: 'O que pesa contra' },
      { type: 'p', text: 'Perth é extremamente isolada. Fica na costa oeste, muito longe das outras grandes cidades do país, e isso pesa bastante na hora de pensar em morar. Chegar lá também é caro. E a cidade me pareceu vazia demais, talvez por ser inverno.' },
      { type: 'tip', title: 'Vindo de Bali? Leva casaco', text: 'Eu só levei roupa de verão para Bali e tive que ir direto numa loja comprar roupa de frio quando cheguei em Perth. Agosto é inverno na Austrália.' },
      { type: 'video', id: 'ZjmwiuHKxwU', title: 'Eu vim parar na cidade grande mais isolada do mundo', vertical: true, poster: img('perth-rio') },
      { type: 'h2', text: 'Cuidado ao visitar a Austrália' },
      { type: 'p', text: 'Toda vez a história se repete: os carros param na faixa para tu atravessar, todo mundo te dá bom-dia no mercado e tu anda até o ponto de ônibus sem esconder o celular. Cuidado, porque tu provavelmente vai se apaixonar e não vai querer ir embora.' },
      { type: 'tip', title: 'Dica de passagem', text: 'Compara rotas com escala: às vezes sai mais barato que o voo direto e ainda rende um destino novo, como Perth rendeu para mim.' },
      { type: 'guide', text: 'Pensando em trabalhar na Austrália? O e-book tem o currículo australiano, os sites que funcionam e os setores que mais contratam brasileiros.' },
      { type: 'recs', items: [{ cat: 'passagens', i: 0 }, { cat: 'dinheiro', i: 0 }, { cat: 'seguros' }] },
    ],
  },
]
