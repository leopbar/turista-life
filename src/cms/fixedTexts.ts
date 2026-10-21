/**
 * Onde cada texto fixo (as chamadas t do código) é editado no painel: na página onde ele aparece, num grupo de
 * "Textos fixos desta página", com um nome que diz o que ele é. Assim, clicar no texto na pré-visualização
 * abre a página certa (e não um bloco com os textos do site inteiro).
 *
 * O site (t() em runtime.ts), o mapa do painel (schema.ts) e a exportação (scripts/export-cms.mjs) leem daqui.
 * Texto fixo novo no código? Coloque aqui também: a exportação para com erro se algum t('…') ficar sem lugar.
 */

type Group = { label: string; texts: Record<string, string> }

/** Documento → grupos → id do texto → nome no painel. */
export const pageTexts: Record<string, Record<string, Group>> = {
  'inicio.hero': {
    capa: { label: 'Capa', texts: { 'inicio.capa.foto': 'Descrição da foto (para quem usa leitor de tela)' } },
  },
  'inicio.about': {
    sobre: { label: 'Como tudo começou', texts: { 'inicio.sobre.foto': 'Descrição da foto (para quem usa leitor de tela)' } },
  },
  'sobre.page': {
    secoes: {
      label: 'Seções da página',
      texts: {
        'sobre.redes.usuario': 'Usuário nas redes (ao lado dos ícones)',
        'sobre.historia.chamada': 'Minha história: chamada acima do título',
        'sobre.historia.titulo': 'Minha história: título',
        'sobre.trabalhos.chamada': 'Trabalhos: chamada acima do título',
        'sobre.valores.chamada': 'Valores: chamada acima do título',
        'sobre.curiosidades.chamada': 'Curiosidades: chamada acima do título',
        'sobre.bastidores.foto': 'Bastidores: descrição da foto (para quem usa leitor de tela)',
      },
    },
  },
  'produtos.page': {
    espera: {
      label: 'Lista de espera (produtos em breve)',
      texts: {
        'produtos.espera.embreve': 'Aviso enquanto a lista de espera não abre',
        'produtos.espera.botao': 'Botão para entrar na lista',
        'produtos.espera.rotulo': 'Nome do campo de e-mail (para quem usa leitor de tela)',
        'produtos.espera.confirmar': 'Aviso depois de entrar na lista (confirmar o e-mail)',
      },
    },
    faq: {
      label: 'Perguntas frequentes (aqui e nas páginas de produto)',
      texts: { 'geral.faq.chamada': 'Chamada acima do título', 'geral.faq.titulo': 'Título' },
    },
    produto: {
      label: 'Páginas de produto (iguais em todas)',
      texts: {
        'produtos.migalha': 'Caminho no topo: link para Produtos',
        'produto.para-quem.chamada': 'Para quem é: chamada acima do título',
        'produto.para-quem.titulo': 'Para quem é: título',
        'produto.conteudo.titulo': 'O que tem dentro: título',
        'produto.valor': 'Rótulo do preço (também nos cards desta página)',
        'produto.gratis': 'Preço dos materiais gratuitos',
      },
    },
  },
  'recomendacoes.page': {
    cards: {
      label: 'Filtro e cards (aqui, na página inicial e no blog)',
      texts: {
        'recomendacoes.filtro.todas': 'Filtro: opção que mostra todas',
        'recomendacoes.porque': 'Antes do motivo (letra cursiva)',
        'recomendacoes.cupom': 'Rótulo do cupom',
        'recomendacoes.cupom.copiado': 'Aviso ao copiar o cupom',
      },
    },
  },
  'parcerias.page': {
    sobre: {
      label: 'Sobre',
      texts: {
        'parcerias.sobre.chamada': 'Chamada acima do título',
        'parcerias.sobre.nome': 'Nome na foto (letra cursiva)',
        'parcerias.sobre.foto': 'Descrição da foto (para quem usa leitor de tela)',
      },
    },
    audiencia: { label: 'Audiência', texts: { 'parcerias.audiencia.chamada': 'Chamada acima do título', 'parcerias.audiencia.titulo': 'Título' } },
    pilares: {
      label: 'Pilares do canal',
      texts: {
        'parcerias.pilares.chamada': 'Chamada acima do título',
        'parcerias.pilares.titulo': 'Título',
        'parcerias.pilares.marcas': 'Antes da lista de marcas de cada pilar',
      },
    },
    formatos: { label: 'Formatos', texts: { 'parcerias.formatos.chamada': 'Chamada acima do título', 'parcerias.formatos.titulo': 'Título' } },
    combina: { label: 'Combina com', texts: { 'parcerias.combina.chamada': 'Chamada acima do título', 'parcerias.combina.titulo': 'Título' } },
    processo: { label: 'Processo', texts: { 'parcerias.processo.chamada': 'Chamada acima do título', 'parcerias.processo.titulo': 'Título' } },
  },
  'diario.page': {
    rota: {
      label: 'A rota (mapa)',
      texts: {
        'diario.rota.chamada': 'Chamada acima do título',
        'diario.rota.titulo': 'Título',
        'diario.rota.partida': 'Atalho para o ponto de partida',
        'diario.rota.proximo': 'Atalho para o próximo destino',
        'diario.mapa.segue-para': 'No mapa, antes do lugar seguinte ("Segue para Bali")',
        'diario.mapa.vinda-de': 'No mapa, antes do lugar anterior ("Vinda de Sydney")',
        'diario.mapa.zoom-em': 'No mapa, antes do lugar ampliado ("ZOOM EM BALI")',
      },
    },
    partida: { label: 'Ponto de partida', texts: { 'diario.partida.foto': 'Descrição da foto (para quem usa leitor de tela)' } },
    paradas: {
      label: 'Cada parada',
      texts: {
        'diario.parada.destaques': 'Título dos destaques',
        'diario.parada.pros': 'Título dos pontos fortes',
        'diario.parada.contras': 'Título dos pontos fracos',
        'diario.parada.sem-video': 'Aviso quando a parada ainda não tem vídeo',
      },
    },
    marco: {
      label: 'Fechamento do mês (liberdade geográfica)',
      texts: { 'diario.marco.titulo': 'Título', 'diario.marco.ganhei': 'Legenda do valor ganho' },
    },
    proximo: {
      label: 'Próximo destino',
      texts: {
        'diario.proximo.pergunta': 'Pergunta (título)',
        'diario.proximo.botao': 'Botão',
        'diario.proximo.ok': 'Mensagem depois de enviar o e-mail',
      },
    },
  },
  'blog.page': {
    blog: {
      label: 'Página Blog',
      texts: {
        'blog.destinos.chamada': 'Destinos: chamada acima do título',
        'blog.destinos.titulo': 'Destinos: título',
        'blog.vazio': 'Aviso quando o filtro não encontra artigos',
      },
    },
    artigo: {
      label: 'Páginas de artigo (iguais em todos)',
      texts: {
        'blog.migalha': 'Caminho no topo: link para o Blog (também nas páginas de destino)',
        'blog.artigo.autora': 'Nome da autora',
        'blog.artigo.ver-destino': 'Link para a página do destino',
        'blog.artigo.continue': 'Título dos outros artigos, no fim',
        'blog.recs.titulo': 'Recomendações no artigo: título (letra cursiva)',
        'blog.recs.ver-todas': 'Recomendações no artigo: link para ver todas',
      },
    },
    destino: {
      label: 'Páginas de destino (iguais em todos)',
      texts: {
        'blog.destino.artigos': 'Artigos: chamada acima da lista',
        'blog.destino.videos': 'Vídeos: chamada acima da lista',
        'blog.destino.rota': 'Na rota: frase em letra cursiva',
      },
    },
  },
}

/** Textos que aparecem em várias páginas: ficam juntos em "Textos usados em várias páginas" (geral.textos). */
export const sharedTexts: Record<string, string> = {
  'geral.migalha.inicio': 'Caminho no topo: primeiro item (link para a página inicial)',
  'geral.email.rotulo': 'Campo de e-mail (newsletter, lista de espera e diário)',
  'geral.em-breve': 'Etiqueta de "em breve" (blog e recomendações)',
  'geral.dica-da-laura': 'Título das dicas (diário e recomendações)',
  'produtos.capa.marca': 'Assinatura nas capas dos produtos',
}

/** Chave do texto dentro do grupo ("produtos.espera.botao" → "produtos_espera_botao"): ponto separa caminhos no painel. */
export const textKey = (id: string) => id.replace(/\./g, '_')

/** id do texto → onde ele mora: documento, grupo e chave. */
export const textHome: Record<string, { doc: string; group: string; key: string }> = Object.fromEntries(
  Object.entries(pageTexts).flatMap(([doc, groups]) =>
    Object.entries(groups).flatMap(([group, g]) => Object.keys(g.texts).map((id) => [id, { doc, group, key: textKey(id) }])),
  ),
)
