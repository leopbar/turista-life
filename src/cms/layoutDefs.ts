/**
 * Seções de cada página, na ordem padrão. No painel dá para ligar, desligar e reordenar.
 * Só dados: o mapa de conteúdo (schema.ts) e o servidor também leem esta lista.
 */
export const layoutDefs = {
  home: {
    label: 'Página inicial', route: '/',
    sections: [['hero', 'Capa'], ['about', 'Como tudo começou'], ['products', 'Produtos'], ['recommendations', 'Recomendações'], ['brands', 'Para marcas'], ['diary', 'Diário e newsletter']],
  },
  sobre: {
    label: 'Sobre mim', route: '/sobre',
    sections: [['hero', 'Topo'], ['intro', 'Apresentação'], ['timeline', 'Linha do tempo'], ['jobs', 'Trabalhos na Austrália'], ['quote', 'Citação'], ['values', 'Valores'], ['facts', 'Curiosidades e bastidores'], ['cta', 'Chamada final']],
  },
  produtos: {
    label: 'Produtos', route: '/produtos',
    sections: [['hero', 'Topo'], ['available', 'Disponíveis agora'], ['upcoming', 'Próximos lançamentos'], ['free', 'Materiais gratuitos'], ['faq', 'Perguntas frequentes'], ['cta', 'Chamada final']],
  },
  recomendacoes: {
    label: 'Recomendações', route: '/recomendacoes',
    sections: [['hero', 'Topo'], ['filters', 'Filtro por categoria'], ['list', 'Indicações e dicas'], ['cta', 'Chamada final']],
  },
  parcerias: {
    label: 'Parcerias', route: '/parcerias',
    sections: [['hero', 'Topo'], ['stats', 'Números'], ['about', 'Quem é a Laura'], ['audience', 'Audiência em números'], ['pillars', 'Pilares'], ['formats', 'Formatos'], ['process', 'Processo'], ['contact', 'Contato']],
  },
  diario: {
    label: 'Diário', route: '/diario',
    sections: [['hero', 'Topo'], ['stats', 'Números da viagem'], ['map', 'Mapa da rota'], ['countries', 'Navegação por país'], ['route', 'Linha do tempo']],
  },
  blog: {
    label: 'Blog', route: '/blog',
    sections: [['hero', 'Topo'], ['destinations', 'Destinos'], ['filters', 'Filtros'], ['articles', 'Artigos']],
  },
} as const satisfies Record<string, { label: string; route: string; sections: readonly (readonly [string, string])[] }>

export type PageId = keyof typeof layoutDefs
