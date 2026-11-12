export function BarraProgresso({ fracao, rotulo, fina = false }: { fracao: number; rotulo?: string; fina?: boolean }) {
  const pct = Math.round(Math.min(1, Math.max(0, fracao)) * 100)
  return (
    <div
      className={`barra-prog${fina ? ' fina' : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={rotulo}
    >
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}
