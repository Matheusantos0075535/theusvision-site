import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'
import { diaDaSemana, hojeBrasiliaIso } from '../../lib/tempo'
import { fmtMin, minutosDoDia, useE } from './dados'
import { ResumoDia } from './Floresta'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const ANO = 2026
const dois = (n: number) => String(n).padStart(2, '0')

export function CalendarioEstudo() {
  const { d } = useE()
  const hoje = hojeBrasiliaIso()
  const [mes, setMes] = useState(hoje.startsWith(`${ANO}-`) ? Number(hoje.slice(5, 7)) - 1 : 0)
  const [aberto, setAberto] = useState<string | null>(null)
  const primeiro = `${ANO}-${dois(mes + 1)}-01`
  const n = new Date(Date.UTC(ANO, mes + 1, 0)).getUTCDate()
  const dias = Array.from({ length: n }, (_, i) => `${ANO}-${dois(mes + 1)}-${dois(i + 1)}`)
  const mins = dias.map((x) => minutosDoDia(d.sessoes, x))
  const total = mins.reduce((a, b) => a + b, 0)
  const nivel = (m: number) => (m === 0 ? 0 : m < 20 ? 1 : m < 45 ? 2 : m < d.metaDia ? 3 : 4)
  return (
    <div className="pt-tela">
      <div className="cal-topo">
        <button className="btn-icone" onClick={() => setMes((m) => m - 1)} disabled={mes === 0} aria-label="Mês anterior">
          <ChevronLeft aria-hidden />
        </button>
        <h2>
          {MESES[mes]} <span>{ANO}</span>
        </h2>
        <button className="btn-icone" onClick={() => setMes((m) => m + 1)} disabled={mes === 11} aria-label="Próximo mês">
          <ChevronRight aria-hidden />
        </button>
      </div>
      <p className="dia-apoio" style={{ textAlign: 'center' }}>
        {total ? `${fmtMin(total)} de estudo em ${MESES[mes].toLowerCase()}.` : 'Nenhum estudo neste mês ainda.'} Toque num dia para ver a floresta dele.
      </p>
      <div className="cal-grade es-cal">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((x, i) => (
          <span key={i} className="cal-semana" aria-hidden>
            {x}
          </span>
        ))}
        {Array.from({ length: diaDaSemana(primeiro) }, (_, i) => (
          <span key={`v${i}`} />
        ))}
        {dias.map((x, i) => (
          <button key={x} className="es-cal-dia" data-n={nivel(mins[i])} data-hoje={x === hoje || undefined} data-futuro={x > hoje || undefined} onClick={() => setAberto(x)} aria-label={`${i + 1} de ${MESES[mes]}: ${mins[i] ? fmtMin(mins[i]) : 'sem estudo'}`}>
            <b>{i + 1}</b>
            <small>{mins[i] ? fmtMin(mins[i]) : ''}</small>
          </button>
        ))}
      </div>
      <div className="cal-legenda">
        <span>
          <i className="es-leg" data-n="0" /> nada
        </span>
        <span>
          <i className="es-leg" data-n="1" /> pouco
        </span>
        <span>
          <i className="es-leg" data-n="3" /> bom
        </span>
        <span>
          <i className="es-leg" data-n="4" /> meta batida
        </span>
      </div>
      {aberto && (
        <div className="folha-fundo" onClick={() => setAberto(null)}>
          <div className="folha pt-folha-clara" role="dialog" aria-modal="true" aria-label="Estudo do dia" onClick={(e) => e.stopPropagation()}>
            <div className="folha-alca" aria-hidden />
            <div className="tr-folha-topo">
              <h2>Floresta do dia</h2>
              <button className="btn-icone" onClick={() => setAberto(null)} aria-label="Fechar">
                <X aria-hidden />
              </button>
            </div>
            <ResumoDia dia={aberto} />
          </div>
        </div>
      )}
    </div>
  )
}
