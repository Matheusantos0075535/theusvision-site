import { ChevronLeft, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { BotaoSom } from '../ui/BotaoSom'
import './compartilhado.css'

export type Aba = { para: string; rotulo: string; icone: LucideIcon; fim?: boolean }

export function ShellModulo({
  titulo,
  direita,
  abas,
  children,
}: {
  titulo: string
  direita?: ReactNode
  abas: Aba[]
  children: ReactNode
}) {
  return (
    <div className="shell">
      <div className="fita" />
      <header className="shell-topo">
        <Link to="/" className="shell-voltar" aria-label="Voltar para o Hub">
          <ChevronLeft aria-hidden />
          <span>Hub</span>
        </Link>
        <h1 className="shell-titulo">{titulo}</h1>
        <div className="shell-direita">
          <BotaoSom />
          {direita}
        </div>
      </header>
      <main className="shell-miolo">{children}</main>
      <nav className="shell-nav" aria-label={`Navegação de ${titulo}`}>
        {abas.map(({ para, rotulo, icone: Icone, fim }) => (
          <NavLink key={para} to={para} end={fim} className="shell-aba">
            <Icone aria-hidden />
            <span>{rotulo}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function Secao({ titulo, acao, children }: { titulo?: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <section className="secao">
      {(titulo || acao) && (
        <div className="secao-topo">
          {titulo && <h2>{titulo}</h2>}
          {acao}
        </div>
      )}
      {children}
    </section>
  )
}

export function Carregando() {
  return (
    <div className="bloco-carregando" role="status" aria-label="Carregando">
      <span className="giro" />
    </div>
  )
}

export function ErroCarregar({ mensagem, tentar }: { mensagem: string; tentar: () => void }) {
  return (
    <div className="bloco-erro" role="alert">
      <p>{mensagem}</p>
      <button className="btn btn-secundario" onClick={tentar}>
        Tentar de novo
      </button>
    </div>
  )
}
