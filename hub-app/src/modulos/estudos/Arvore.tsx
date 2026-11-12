/**
 * Árvore em SVG que cresce de 0 a 1. Três espécies (redonda, pinheiro, arbusto) escolhidas pela trilha.
 * "murcha" = foco abandonado: tronco seco, sem folhas.
 */
export type Especie = 0 | 1 | 2

export function especieDaTrilha(indice: number): Especie {
  return (indice % 3) as Especie
}

export function estagioPorMinutos(min: number) {
  return min < 10 ? 0.38 : min < 20 ? 0.6 : min < 30 ? 0.82 : 1
}

export function Arvore({ estagio, cor, especie = 0, murcha = false, tamanho = 72 }: { estagio: number; cor: string; especie?: Especie; murcha?: boolean; tamanho?: number }) {
  const e = Math.max(0.12, Math.min(1, estagio))
  const troncoH = 12 + 26 * e
  const topo = 90 - troncoH
  const r = 8 + 20 * e
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" role="img" aria-label={murcha ? 'Árvore murcha' : `Árvore ${Math.round(e * 100)}% crescida`} className="es-arvore" data-murcha={murcha || undefined}>
      <ellipse cx="50" cy="92" rx={18 + 10 * e} ry="4" fill="rgba(0,0,0,0.28)" />
      <rect x="47" y={topo} width="6" height={troncoH} rx="2" fill={murcha ? '#8a7766' : '#8b5a2b'} />
      {murcha ? (
        <g stroke="#8a7766" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d={`M50 ${topo + 4} L38 ${topo - 8}`} />
          <path d={`M50 ${topo + 10} L63 ${topo - 2}`} />
          <path d={`M50 ${topo} L50 ${topo - 12}`} />
        </g>
      ) : especie === 1 ? (
        <g>
          {[0, 1, 2].map((i) => (
            <polygon key={i} points={`${50 - (r * (1 - i * 0.22))},${topo + 6 - i * r * 0.62} ${50 + r * (1 - i * 0.22)},${topo + 6 - i * r * 0.62} 50,${topo - r * 1.05 - i * r * 0.62}`} fill={cor} />
          ))}
          <polygon points={`${50 - r * 0.6},${topo + 6} 50,${topo - r} ${50 + r * 0.6},${topo + 6}`} fill="rgba(0,0,0,0.12)" />
        </g>
      ) : especie === 2 ? (
        <g>
          <ellipse cx="50" cy={topo - r * 0.1} rx={r * 1.25} ry={r * 0.8} fill={cor} />
          <ellipse cx={50 + r * 0.45} cy={topo - r * 0.3} rx={r * 0.75} ry={r * 0.55} fill="rgba(255,255,255,0.18)" />
        </g>
      ) : (
        <g>
          <circle cx="50" cy={topo - r * 0.55} r={r} fill={cor} />
          <circle cx={50 - r * 0.7} cy={topo - r * 0.05} r={r * 0.72} fill={cor} />
          <circle cx={50 + r * 0.7} cy={topo - r * 0.05} r={r * 0.72} fill={cor} />
          <circle cx={50 + r * 0.25} cy={topo - r * 0.85} r={r * 0.5} fill="rgba(255,255,255,0.2)" />
        </g>
      )}
    </svg>
  )
}
