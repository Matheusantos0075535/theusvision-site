import { ArrowUpRight, CircleCheckBig, Flame, type LucideIcon } from 'lucide-react'
import type { PointerEvent, ReactNode } from 'react'
import type { Modulo } from '../modulos'
import { Selo } from './Selo'

export type DestaqueCard = {
  numero: number | null
  linha: string
  /** Mostra "3/7" com um check no lugar da chama (tarefas, não ofensiva). */
  de?: number
  /** Ícone no lugar da chama. */
  icone?: LucideIcon
}

type Props = {
  modulo: Modulo
  ativo: boolean
  destaque?: DestaqueCard | null
  aoEscolher: () => void
  aoEntrar: () => void
  aoAbrir: () => void
  idPrevia: string
  aoExpandir: boolean
  children?: ReactNode
}

/** O brilho em degradê acompanha o mouse por dentro do cartão (só variáveis CSS, sem re-render). */
function seguirMouse(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}

export function CardModulo({ modulo, ativo, destaque, aoEscolher, aoEntrar, aoAbrir, idPrevia, aoExpandir, children }: Props) {
  const Icone = modulo.icone
  const linha = destaque?.linha ?? (modulo.status === 'em_breve' ? 'Em construção' : modulo.descricao)
  return (
    <li className="mod" data-status={modulo.status} data-ativo={ativo || undefined}>
      <button
        type="button"
        className="mod-alvo"
        onClick={aoEscolher}
        onPointerEnter={(e) => e.pointerType === 'mouse' && aoEntrar()}
        onPointerMove={seguirMouse}
        onFocus={aoEntrar}
        aria-expanded={aoExpandir ? ativo : undefined}
        aria-controls={aoExpandir ? idPrevia : undefined}
        aria-label={`${modulo.nome}, ${modulo.categoria}. ${modulo.status === 'disponivel' ? 'Disponível' : 'Em breve'}. ${linha}`}
      >
        <span className="mod-brilho" aria-hidden />
        <span className="mod-topo">
          <span className="mod-icone" aria-hidden>
            <Icone />
          </span>
          <Selo status={modulo.status} />
        </span>
        {destaque && (
          <span className="mod-numero" aria-hidden>
            {destaque.icone ? <destaque.icone /> : destaque.de != null ? <CircleCheckBig /> : <Flame />}
            <b>
              {destaque.numero ?? '—'}
              {destaque.de != null && <small>/{destaque.de}</small>}
            </b>
          </span>
        )}
        <span className="mod-textos" aria-hidden>
          <span className="mod-categoria">{modulo.categoria}</span>
          <span className="mod-nome">{modulo.nome}</span>
          <span className="mod-desc">{modulo.descricao}</span>
        </span>
        <span className="mod-linha" aria-hidden>
          {linha}
        </span>
      </button>
      <button type="button" className="mod-seta" onClick={aoAbrir} aria-label={`Abrir ${modulo.nome}`}>
        <ArrowUpRight aria-hidden />
      </button>
      {children}
    </li>
  )
}
