import { ROTULO_STATUS, type StatusModulo } from '../modulos'

/** Bolinha com aro. A palavra aparece com animação quando o card está em foco, sob o mouse ou tocado. */
export function Selo({ status }: { status: StatusModulo }) {
  return (
    <span className="selo" data-status={status}>
      <i aria-hidden />
      <span className="selo-palavra">{ROTULO_STATUS[status]}</span>
    </span>
  )
}
