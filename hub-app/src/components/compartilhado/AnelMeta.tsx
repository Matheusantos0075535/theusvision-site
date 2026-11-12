import type { ReactNode } from 'react'

/** Anel de progresso (ex.: "72 de 80"). */
export function AnelMeta({
  valor,
  inicio = 0,
  alvo,
  tamanho = 120,
  espessura = 10,
  children,
  rotulo,
}: {
  valor: number
  inicio?: number
  alvo: number
  tamanho?: number
  espessura?: number
  children?: ReactNode
  rotulo?: string
}) {
  const r = (tamanho - espessura) / 2
  const c = 2 * Math.PI * r
  const faixa = Math.max(1, alvo - inicio)
  const fracao = Math.min(1, Math.max(0, (valor - inicio) / faixa))
  return (
    <div className="anel" style={{ width: tamanho, height: tamanho }} role="img" aria-label={rotulo ?? `${valor} de ${alvo}`}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden>
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={espessura} />
        <circle
          className="anel-progresso"
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke="var(--laranja)"
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fracao)}
          transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
        />
      </svg>
      <div className="anel-miolo">{children}</div>
    </div>
  )
}
