import { Flame } from 'lucide-react'
import type { DestaqueCard } from './CardModulo'

/** Miniatura ilustrativa do módulo, mostrada na prévia. Só formas simples, sem dados reais. */
export function Miniatura({ id, destaque }: { id: string; destaque?: DestaqueCard | null }) {
  const numero = destaque?.numero

  if (id === 'dnsmk') {
    return (
      <div className="mini mini-dnsmk" aria-hidden>
        <div className="mini-chama">
          <Flame />
          <b>{numero ?? '—'}</b>
          <span>dias sem fumar</span>
        </div>
        <div className="mini-barra">
          <i style={{ width: '82%' }} />
        </div>
        <div className="mini-semana">
          {[1, 1, 1, 1, 1, 1, 0].map((v, i) => (
            <i key={i} data-ok={v || undefined} />
          ))}
        </div>
      </div>
    )
  }

  if (id === 'leitura') {
    return (
      <div className="mini mini-leitura" aria-hidden>
        <div className="mini-livros">
          {[
            ['#3d1773', '#ffc266', 62],
            ['#17a56f', '#03261a', 38],
            ['#e08707', '#1a0a00', 80],
          ].map(([fundo, tinta], i) => (
            <span key={i} style={{ background: fundo as string, color: tinta as string }}>
              <i style={{ background: tinta as string }} />
              <b />
              <b />
            </span>
          ))}
        </div>
        <div className="mini-chama mini-chama-p">
          <Flame />
          <b>{numero ?? '—'}</b>
          <span>dias lendo</span>
        </div>
        <div className="mini-barra">
          <i style={{ width: '62%' }} />
        </div>
      </div>
    )
  }

  if (id === 'treino') {
    return (
      <div className="mini mini-colunas" aria-hidden>
        {[40, 62, 48, 78, 66, 92, 74].map((h, i) => (
          <i key={i} style={{ height: `${h}%` }} />
        ))}
      </div>
    )
  }

  if (id === 'estudos') {
    return (
      <div className="mini mini-trilha" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} data-ok={i < 2 || undefined} style={{ marginLeft: [0, 28, 40, 18][i] }} />
        ))}
      </div>
    )
  }

  if (id === 'rotina') {
    return (
      <div className="mini mini-lista" aria-hidden>
        {[true, true, false, false].map((ok, i) => (
          <div key={i}>
            <i data-ok={ok || undefined} />
            <b style={{ width: `${[72, 58, 66, 44][i]}%` }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mini mini-notas" aria-hidden>
      <span style={{ transform: 'rotate(-4deg)' }} />
      <span style={{ transform: 'rotate(3deg)' }} />
      <span style={{ transform: 'rotate(-1deg)' }} />
    </div>
  )
}
