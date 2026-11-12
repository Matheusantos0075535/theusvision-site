import type { ReactNode } from 'react'
import './acesso.css'

export function Marca() {
  return (
    <span className="marca">
      <img src={`${import.meta.env.BASE_URL}icone.png`} alt="" width={28} height={28} />
      <b>TeusVision</b>
      <span>Hub</span>
    </span>
  )
}

export function LayoutAcesso({ titulo, apoio, children }: { titulo: string; apoio?: ReactNode; children: ReactNode }) {
  return (
    <div className="acesso">
      <div className="fita" />
      <div className="acesso-brilho" aria-hidden />
      <main className="acesso-miolo">
        <Marca />
        <section className="acesso-cartao">
          <h1>{titulo}</h1>
          {apoio && <p className="acesso-apoio">{apoio}</p>}
          {children}
        </section>
        <p className="acesso-rodape">Sistema interno · acesso só para convidados</p>
      </main>
    </div>
  )
}
