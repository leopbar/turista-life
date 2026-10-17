import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { AboutPage } from './pages/AboutPage'
import { BlogArticlePage } from './pages/BlogArticlePage'
import { BlogDestinationPage } from './pages/BlogDestinationPage'
import { BlogPage } from './pages/BlogPage'
import { articles, destinations } from './blog/blogData'
import { DiaryPage } from './pages/DiaryPage'
import { HomePage } from './pages/HomePage'
import { MediaKitPage } from './pages/MediaKitPage'
import { ProductPage } from './pages/ProductPage'
import { ProductsPage } from './pages/ProductsPage'
import { productPages } from './pagesContent'
import { RecommendationsPage } from './pages/RecommendationsPage'
import { CustomPage } from './pages/CustomPage'
import { customPages } from './cms/pages'

const titles: Record<string, string> = {
  '/': 'Turista Life · Laura Irigoyen',
  '/produtos': 'Produtos · Turista Life',
  '/recomendacoes': 'Recomendações · Turista Life',
  '/parcerias': 'Parcerias · Turista Life',
  '/diario': 'Diário · Turista Life',
  '/blog': 'Blog · Turista Life',
  ...Object.fromEntries(destinations.map((d) => [`/blog/destino/${d.id}`, `${d.name}: guia, dicas e vídeos · Turista Life`])),
  ...Object.fromEntries(articles.map((a) => [`/blog/${a.slug}`, `${a.title} · Turista Life`])),
  '/sobre': 'Sobre mim · Turista Life',
  ...Object.fromEntries(productPages.map((p) => [`/produtos/${p.slug}`, `${p.title} · Turista Life`])),
  ...Object.fromEntries(customPages.map((p) => [`/${p.slug}`, `${p.title} · Turista Life`])),
}

/** Ao trocar de página: vai ao topo, ou à âncora (/#sobre, /produtos#guia-bali). */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    document.title = titles[pathname] ?? titles['/']
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 60)
      return () => clearTimeout(t)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

/** Endereços antigos (/midia-kit, /destinos) levam para os novos, mantendo a âncora. */
function Redirect({ to }: { to: string }) {
  const { hash } = useLocation()
  return <Navigate to={to + hash} replace />
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/produtos" element={<ProductsPage />} />
          <Route path="/produtos/:slug" element={<ProductPage />} />
          <Route path="/recomendacoes" element={<RecommendationsPage />} />
          <Route path="/parcerias" element={<MediaKitPage />} />
          <Route path="/diario" element={<DiaryPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/destino/:id" element={<BlogDestinationPage />} />
          <Route path="/blog/:slug" element={<BlogArticlePage />} />
          <Route path="/midia-kit" element={<Redirect to="/parcerias" />} />
          <Route path="/destinos" element={<Redirect to="/diario" />} />
          <Route path="/sobre" element={<AboutPage />} />
          {/* Páginas criadas no painel; endereço desconhecido leva à página inicial. */}
          <Route path="/:slug" element={<CustomPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
