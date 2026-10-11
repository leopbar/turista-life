import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { AboutPage } from './pages/AboutPage'
import { DiaryPage } from './pages/DiaryPage'
import { HomePage } from './pages/HomePage'
import { MediaKitPage } from './pages/MediaKitPage'
import { ProductsPage } from './pages/ProductsPage'
import { RecommendationsPage } from './pages/RecommendationsPage'

const titles: Record<string, string> = {
  '/': 'Turista Life · Laura Irigoyen',
  '/produtos': 'Produtos · Turista Life',
  '/recomendacoes': 'Recomendações · Turista Life',
  '/midia-kit': 'Mídia kit · Turista Life',
  '/diario': 'Diário de bordo · Turista Life',
  '/sobre': 'Sobre mim · Turista Life',
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

export default function App() {
  return (
    <>
      <ScrollManager />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/produtos" element={<ProductsPage />} />
          <Route path="/recomendacoes" element={<RecommendationsPage />} />
          <Route path="/midia-kit" element={<MediaKitPage />} />
          <Route path="/diario" element={<DiaryPage />} />
          <Route path="/sobre" element={<AboutPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
