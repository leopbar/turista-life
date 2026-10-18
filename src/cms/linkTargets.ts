/**
 * Destinos de link dentro do site, para o painel oferecer numa lista em vez de a pessoa digitar "/blog".
 * Só dados. As seções usam o id do elemento na página (id="newsletter" → "/#newsletter"):
 * mudou um id num componente? Atualize aqui também.
 * Artigos, páginas de produto, páginas novas, destinos, categorias e países entram sozinhos (vêm do painel).
 */
export const linkPages: [href: string, label: string][] = [
  ['/', 'Início'],
  ['/sobre', 'Sobre mim'],
  ['/produtos', 'Produtos'],
  ['/recomendacoes', 'Recomendações'],
  ['/parcerias', 'Parcerias'],
  ['/diario', 'Diário'],
  ['/blog', 'Blog'],
]

export const linkSections: [href: string, label: string][] = [
  ['/#sobre', 'Início › Como tudo começou'],
  ['/#produtos', 'Início › Produtos'],
  ['/#recomendacoes', 'Início › Recomendações'],
  ['/#marcas', 'Início › Para marcas'],
  ['/#diario', 'Início › Diário'],
  ['/#newsletter', 'Início › Newsletter'],
  ['/produtos#disponiveis', 'Produtos › Disponíveis agora'],
  ['/produtos#proximos', 'Produtos › Próximos lançamentos'],
  ['/produtos#faq', 'Produtos › Perguntas frequentes'],
  ['/diario#partida', 'Diário › Ponto de partida'],
  ['/diario#proximo', 'Diário › Próximo destino'],
]
