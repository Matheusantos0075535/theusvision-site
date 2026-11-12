import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './hub/auth'
import { Inicio } from './hub/inicio/Inicio'
import { ConfirmeEmail } from './hub/telas/ConfirmeEmail'
import { Entrar } from './hub/telas/Entrar'
import { PrimeiroAcesso } from './hub/telas/PrimeiroAcesso'
import { SemAcesso } from './hub/telas/SemAcesso'
import { ROTAS_MODULOS } from './modulos/rotas'

function Carregando() {
  return (
    <div className="carregando" role="status" aria-label="Carregando">
      <span className="giro" />
    </div>
  )
}

/** Só passa quem está logado, com e-mail confirmado e na lista de autorizados. */
function Protegida({ children }: { children: ReactNode }) {
  const { carregando, sessao, acesso, emailConfirmado } = useAuth()
  const local = useLocation()
  if (carregando) return <Carregando />
  if (!sessao) return <Navigate to="/entrar" replace state={{ de: local.pathname }} />
  if (!emailConfirmado) return <Navigate to="/confirme-email" replace />
  if (!acesso) return <Navigate to="/sem-acesso" replace />
  return <>{children}</>
}

/** Telas de entrada: quem já está dentro vai direto para o início. */
function Publica({ children }: { children: ReactNode }) {
  const { carregando, sessao, acesso } = useAuth()
  if (carregando) return <Carregando />
  if (sessao && acesso) return <Navigate to="/" replace />
  return <>{children}</>
}

function SoLogado({ children }: { children: ReactNode }) {
  const { carregando, sessao, acesso } = useAuth()
  if (carregando) return <Carregando />
  if (!sessao) return <Navigate to="/entrar" replace />
  if (acesso) return <Navigate to="/" replace />
  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<Publica><Entrar /></Publica>} />
      <Route path="/primeiro-acesso" element={<Publica><PrimeiroAcesso /></Publica>} />
      <Route path="/confirme-email" element={<Publica><ConfirmeEmail /></Publica>} />
      <Route path="/sem-acesso" element={<SoLogado><SemAcesso /></SoLogado>} />
      <Route path="/" element={<Protegida><Inicio /></Protegida>} />
      {ROTAS_MODULOS.map((r) => (
        <Route key={r.caminho} path={r.caminho} element={<Protegida>{r.elemento}</Protegida>} />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
