/** Rosto simples para o humor de 1 a 5. */
export function Rosto({ nivel }: { nivel: 1 | 2 | 3 | 4 | 5 }) {
  const curva = { 1: -7, 2: -3.5, 3: 0, 4: 4, 5: 7.5 }[nivel]
  return (
    <svg viewBox="0 0 40 40" width="36" height="36" aria-hidden className={`rosto rosto-${nivel}`}>
      <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="14" cy="16" r="2" fill="currentColor" />
      <circle cx="26" cy="16" r="2" fill="currentColor" />
      <path d={`M12.5 ${26 - curva / 2} Q20 ${26 + curva} 27.5 ${26 - curva / 2}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
