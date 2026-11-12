import { ArrowUpRight, Flame } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Modulo } from '../modulos'
import { Selo } from './Selo'

export type DestaqueCard = {
  numero: number | null
  linha: string
}

type Props = {
  modulo: Modulo
  ativo: boolean
  destaque?: DestaqueCard | null
  aoEscolher: () => void
  aoEntrar: () => void
  aoAbrir: () => void
  idPrevia: string
  modoToque: boolean
  children?: ReactNode
}

export function CardModulo({ modulo, ativo, destaque, aoEscolher, aoEntrar, aoAbrir, idPrevia, modoToque, children }: Props) {
  const Icone = modulo.icone
  const linha = destaque?.linha ?? (modulo.status === 'em_breve' ? 'Em construção' : modulo.descricao)
  return (
    <li className="mod" data-status={modulo.status} data-ativo={ativo || undefined}>
      <button
        type="button"
        className="mod-alvo"
        onClick={aoEscolher}
        onMouseEnter={aoEntrar}
        onFocus={aoEntrar}
        aria-expanded={modoToque ? ativo : undefined}
        aria-controls={modoToque ? idPrevia : undefined}
        aria-label={`${modulo.nome}, ${modulo.categoria}. ${modulo.status === 'disponivel' ? 'Disponível' : 'Em breve'}. ${linha}`}
      >
        <span className="mod-topo">
          <span className="mod-icone" aria-hidden>
            <Icone />
          </span>
          <Selo status={modulo.status} />
        </span>
        {destaque && (
          <span className="mod-numero" aria-hidden>
            <Flame />
            <b>{destaque.numero ?? '—'}</b>
          </span>
        )}
        <span className="mod-textos" aria-hidden>
          <span className="mod-categoria">{modulo.categoria}</span>
          <span className="mod-nome">{modulo.nome}</span>
          <span className="mod-linha">{linha}</span>
        </span>
      </button>
      <button type="button" className="mod-seta" onClick={aoAbrir} aria-label={`Abrir ${modulo.nome}`}>
        <ArrowUpRight aria-hidden />
      </button>
      {children}
    </li>
  )
}
