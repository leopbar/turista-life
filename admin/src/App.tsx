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
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/minha-senha" element={<CreatePassword firstAccess={false} />} />
        <Route path="/equipe" element={<AdminOnly><Team /></AdminOnly>} />
        <Route path="/atividades" element={<AdminOnly><Activity /></AdminOnly>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}
