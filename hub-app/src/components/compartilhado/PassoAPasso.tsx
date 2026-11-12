import { ArrowLeft, X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { BarraProgresso } from './BarraProgresso'

/** Fluxo estilo Duolingo: barra de progresso no topo, um passo por tela, botão grande embaixo. */
export function PassoAPasso({
  passo,
  total,
  titulo,
  apoio,
  aoVoltar,
  aoFechar,
  rotuloFechar = 'Fechar',
  rodape,
  children,
}: {
  passo: number
  total: number
  titulo: string
  apoio?: ReactNode
  aoVoltar?: () => void
  aoFechar: () => void
  rotuloFechar?: string
  rodape: ReactNode
  children?: ReactNode
}) {
  const refTitulo = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    refTitulo.current?.focus()
  }, [passo])

  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [])

  return (
    <div className="fluxo" role="dialog" aria-modal="true" aria-labelledby="fluxo-titulo">
      <div className="fluxo-topo">
        {aoVoltar && passo > 0 ? (
          <button className="fluxo-icone" onClick={aoVoltar} aria-label="Voltar um passo">
            <ArrowLeft aria-hidden />
          </button>
        ) : (
          <button className="fluxo-icone" onClick={aoFechar} aria-label={rotuloFechar}>
            <X aria-hidden />
          </button>
        )}
        <BarraProgresso fracao={(passo + 1) / total} rotulo={`Passo ${passo + 1} de ${total}`} />
        {aoVoltar && passo > 0 ? (
          <button className="fluxo-icone" onClick={aoFechar} aria-label={rotuloFechar}>
            <X aria-hidden />
          </button>
        ) : (
          <span className="fluxo-icone" aria-hidden />
        )}
      </div>
      <div className="fluxo-corpo" key={passo}>
        <h2 id="fluxo-titulo" ref={refTitulo} tabIndex={-1}>
          {titulo}
        </h2>
        {apoio && <p className="fluxo-apoio">{apoio}</p>}
        <div className="fluxo-conteudo">{children}</div>
      </div>
      <div className="fluxo-rodape">{rodape}</div>
    </div>
  )
}

export function Opcoes<T extends string | number>({
  opcoes,
  valor,
  aoMudar,
  colunas = 1,
  multiplo = false,
  rotulo,
}: {
  opcoes: { valor: T; rotulo: ReactNode; sub?: string }[]
  valor: T | T[] | null
  aoMudar: (v: T) => void
  colunas?: number
  multiplo?: boolean
  rotulo: string
}) {
  const marcado = (v: T) => (Array.isArray(valor) ? valor.includes(v) : valor === v)
  return (
    <div
      className="opcoes"
      role={multiplo ? 'group' : 'radiogroup'}
      aria-label={rotulo}
      style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
    >
      {opcoes.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          role={multiplo ? 'checkbox' : 'radio'}
          aria-checked={marcado(o.valor)}
          className="opcao"
          onClick={() => aoMudar(o.valor)}
        >
          <span className="opcao-rotulo">{o.rotulo}</span>
          {o.sub && <small>{o.sub}</small>}
        </button>
      ))}
    </div>
  )
}
