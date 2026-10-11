import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import GlobalStyles from './styles/GlobalStyles'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalStyles />
    {/* Em produção o site vive em lbai.dev/turista-life (base definida no vite.config.ts). */}
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
