import { StrictMode, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import GlobalStyles from './styles/GlobalStyles'
import { getVersion, subscribe, type Bundle } from './cms/runtime'

const PREVIEW = import.meta.env.VITE_CMS_PREVIEW === '1'
// Clicar-e-editar só dentro do painel. Aberta sozinha, a pré-visualização funciona como o site.
const EDITING = PREVIEW && window.parent !== window

async function fetchBundle(url: string): Promise<Bundle | null> {
  try {
    const res = await fetch(url, { cache: 'no-cache', credentials: 'same-origin' })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

/**
 * Conteúdo publicado pelo painel. Na pré-visualização vale o rascunho (precisa estar logado no painel);
 * sem ele, o publicado. Sem nenhum dos dois, o site usa o texto escrito no código.
 */
async function loadBundle(): Promise<Bundle | null> {
  const draft = PREVIEW ? await fetchBundle('/api/preview/bundle') : null
  return draft ?? fetchBundle(`${import.meta.env.BASE_URL}cms/site.json`)
}

async function boot() {
  ;(window as unknown as { __TL_CMS__: unknown }).__TL_CMS__ = { bundle: await loadBundle(), preview: EDITING }
  if (EDITING) (await import('./cms/preview')).installPreview()
  // O App (e os arquivos de conteúdo) só carregam depois que o conteúdo chegou.
  const { default: App } = await import('./App')

  // Na pré-visualização o painel troca o conteúdo ao vivo: a versão muda e tudo redesenha.
  function Root() {
    useSyncExternalStore(subscribe, getVersion)
    return <App />
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <GlobalStyles />
      {/* Em produção o site vive em turistalife.com (base definida no vite.config.ts). */}
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <Root />
      </BrowserRouter>
    </StrictMode>,
  )
}

boot()
