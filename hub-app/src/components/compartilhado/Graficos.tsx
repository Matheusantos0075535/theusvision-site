/** Gráficos simples em SVG, sem biblioteca. */

// Mostra um rótulo a cada "passo" e o último, desde que não encoste no anterior.
function mostrarRotulo(i: number, n: number, passo: number) {
  if (i % passo === 0) return true
  return i === n - 1 && (n - 1) % passo >= Math.ceil(passo / 2)
}

export type Serie = { nome: string; cor: string; valores: (number | null)[]; max: number; min?: number }

export function GraficoLinhas({ rotulos, series, altura = 150 }: { rotulos: string[]; series: Serie[]; altura?: number }) {
  const largura = 320
  const margem = { t: 10, d: 8, b: 22, e: 8 }
  const w = largura - margem.e - margem.d
  const h = altura - margem.t - margem.b
  const n = rotulos.length
  const x = (i: number) => margem.e + (n <= 1 ? w / 2 : (i * w) / (n - 1))
  const passoRotulo = Math.max(1, Math.ceil(n / 6))
  return (
    <figure className="grafico">
      <svg viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label={series.map((s) => s.nome).join(' e ')}>
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={margem.e} x2={largura - margem.d} y1={margem.t + h * f} y2={margem.t + h * f} className="grafico-grade" />
        ))}
        {series.map((s) => {
          const min = s.min ?? 0
          const y = (v: number) => margem.t + h - ((v - min) / (s.max - min)) * h
          const pontos = s.valores.map((v, i) => (v === null ? null : ([x(i), y(v)] as const)))
          const d = pontos.reduce((acc, p, i) => {
            if (!p) return acc
            const anterior = i > 0 ? pontos[i - 1] : null
            return acc + `${anterior ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)} `
          }, '')
          return (
            <g key={s.nome}>
              <path d={d} fill="none" stroke={s.cor} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
              {pontos.map((p, i) => (p ? <circle key={i} cx={p[0]} cy={p[1]} r={2.6} fill={s.cor} /> : null))}
            </g>
          )
        })}
        {rotulos.map((r, i) =>
          mostrarRotulo(i, n, passoRotulo) ? (
            <text key={i} x={x(i)} y={altura - 6} className="grafico-rotulo" textAnchor="middle">
              {r}
            </text>
          ) : null,
        )}
      </svg>
      <figcaption className="grafico-legenda">
        {series.map((s) => (
          <span key={s.nome}>
            <i style={{ background: s.cor }} />
            {s.nome}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}

export function GraficoColunas({
  rotulos,
  valores,
  altura = 140,
  destaque,
  rotuloAria,
}: {
  rotulos: string[]
  valores: number[]
  altura?: number
  destaque?: number
  rotuloAria: string
}) {
  const largura = 320
  const margem = { t: 14, b: 22 }
  const h = altura - margem.t - margem.b
  const max = Math.max(1, ...valores)
  const n = valores.length
  const slot = largura / Math.max(1, n)
  const bw = Math.max(3, Math.min(26, slot * 0.62))
  const passoRotulo = Math.max(1, Math.ceil(n / 8))
  return (
    <figure className="grafico">
      <svg viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label={rotuloAria}>
        <line x1={0} x2={largura} y1={margem.t + h} y2={margem.t + h} className="grafico-grade" />
        {valores.map((v, i) => {
          const bh = (v / max) * h
          return (
            <rect
              key={i}
              x={i * slot + (slot - bw) / 2}
              y={margem.t + h - bh}
              width={bw}
              height={Math.max(bh, v > 0 ? 2 : 0)}
              rx={Math.min(4, bw / 2)}
              className={i === destaque ? 'coluna coluna-destaque' : 'coluna'}
            />
          )
        })}
        {rotulos.map((r, i) =>
          mostrarRotulo(i, n, passoRotulo) ? (
            <text key={i} x={i * slot + slot / 2} y={altura - 6} className="grafico-rotulo" textAnchor="middle">
              {r}
            </text>
          ) : null,
        )}
      </svg>
    </figure>
  )
}

export function BarrasHorizontais({ itens }: { itens: { rotulo: string; valor: number; sufixo?: string }[] }) {
  const max = Math.max(1, ...itens.map((i) => i.valor))
  return (
    <ul className="barras-h">
      {itens.map((i) => (
        <li key={i.rotulo}>
          <span className="barras-h-rotulo">{i.rotulo}</span>
          <span className="barras-h-trilho" aria-hidden>
            <i style={{ width: `${(i.valor / max) * 100}%` }} />
          </span>
          <b>
            {i.valor}
            {i.sufixo ?? ''}
          </b>
        </li>
      ))}
    </ul>
  )
}

export function Numeros({ itens }: { itens: { rotulo: string; valor: string | number; destaque?: boolean }[] }) {
  return (
    <dl className="numeros">
      {itens.map((i) => (
        <div key={i.rotulo} data-destaque={i.destaque || undefined}>
          <dt>{i.rotulo}</dt>
          <dd>{i.valor}</dd>
        </div>
      ))}
    </dl>
  )
}
