import { StrictMode, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import GlobalStyles from './styles/GlobalStyles'
import { getVersion, subscribe, type Bundle } from './cms/runtime'

const PREVIEW = import.meta.env.VITE_CMS_PREVIEW === '1'

/** Conteúdo publicado pelo painel. Sem ele (ou se falhar), o site usa o texto escrito no código. */
async function loadBundle(): Promise<Bundle | null> {
  try {
    const url = PREVIEW ? '/api/preview/bundle' : `${import.meta.env.BASE_URL}cms/site.json`
    const res = await fetch(url, { cache: 'no-cache', credentials: 'same-origin' })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

async function boot() {
  ;(window as unknown as { __TL_CMS__: unknown }).__TL_CMS__ = { bundle: await loadBundle(), preview: PREVIEW }
  if (PREVIEW) (await import('./cms/preview')).installPreview()
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
      {/* Em produção o site vive em lbai.dev/turista-life (base definida no vite.config.ts). */}
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <Root />
      </BrowserRouter>
    </StrictMode>,
  )
}

boot()
