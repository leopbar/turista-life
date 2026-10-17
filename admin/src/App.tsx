import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import { Shell } from './components/Shell'
import { Spinner } from './components/ui'
import { Activity } from './pages/Activity'
import { CreatePassword } from './pages/CreatePassword'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Team } from './pages/Team'
import { Backups } from './pages/Backups'
import { ContentList } from './cms/ContentList'
import { MediaPage, MediaPickerHost } from './cms/Media'
import { SchemaProvider } from './cms/model'
import { Notebook } from './cms/Notebook'
import { SiteEditor } from './cms/SiteEditor'

function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  const { user } = useAuth()

  if (user === undefined) return <Spinner />
  if (user === null) return <Login />
  // Primeiro acesso: o resto do painel fica fechado até a pessoa criar a própria senha.
  if (user.mustChangePassword) return <CreatePassword firstAccess />

  return (
    <SchemaProvider>
      <MediaPickerHost>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/editar" element={<SiteEditor />} />
            <Route path="/conteudo" element={<ContentList />} />
            <Route path="/fotos" element={<MediaPage />} />
            <Route path="/caderno" element={<Notebook />} />
            <Route path="/minha-senha" element={<CreatePassword firstAccess={false} />} />
            <Route path="/equipe" element={<AdminOnly><Team /></AdminOnly>} />
            <Route path="/atividades" element={<AdminOnly><Activity /></AdminOnly>} />
            <Route path="/backup" element={<AdminOnly><Backups /></AdminOnly>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>
      </MediaPickerHost>
    </SchemaProvider>
  )
}
