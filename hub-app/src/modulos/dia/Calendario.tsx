import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { diaDaSemana } from '../../lib/tempo'
import { useDia } from './dados'

export const ANO = 2026
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const SEMANA_LONGA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

type Marca = { feitos: number; prios: number; priosFeitas: number; encerrado: boolean }

const dois = (n: number) => String(n).padStart(2, '0')

export function Calendario({ aoFechar }: { aoFechar: () => void }) {
  const { dia, hojeReal, irPara } = useDia()
  const inicial = dia.startsWith(`${ANO}-`) ? Number(dia.slice(5, 7)) - 1 : 0
  const [mes, setMes] = useState(inicial)
  const [marcas, setMarcas] = useState<Record<string, Marca>>({})
  const [erro, setErro] = useState<string | null>(null)

  const primeiro = `${ANO}-${dois(mes + 1)}-01`
  const ultimoDia = new Date(Date.UTC(ANO, mes + 1, 0)).getUTCDate()
  const ultimo = `${ANO}-${dois(mes + 1)}-${dois(ultimoDia)}`

  useEffect(() => {
    let vivo = true
    setErro(null)
    Promise.all([
      supabase.from('dia_feitos').select('dia').gte('dia', primeiro).lte('dia', ultimo),
      supabase.from('dia_prioridades').select('dia, feita').gte('dia', primeiro).lte('dia', ultimo),
      supabase.from('dia_encerramentos').select('dia').gte('dia', primeiro).lte('dia', ultimo),
    ]).then(([f, p, e]) => {
      if (!vivo) return
      const falha = f.error ?? p.error ?? e.error
      if (falha) return setErro(mensagemDeErroBanco(falha))
      const m: Record<string, Marca> = {}
      const pega = (d: string) => (m[d] ??= { feitos: 0, prios: 0, priosFeitas: 0, encerrado: false })
      ;(f.data as { dia: string }[]).forEach((x) => (pega(x.dia).feitos += 1))
      ;(p.data as { dia: string; feita: boolean }[]).forEach((x) => {
        pega(x.dia).prios += 1
        if (x.feita) pega(x.dia).priosFeitas += 1
      })
      ;(e.data as { dia: string }[]).forEach((x) => (pega(x.dia).encerrado = true))
      setMarcas(m)
    })
    return () => {
      vivo = false
    }
  }, [primeiro, ultimo])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aoFechar])

  const vazios = diaDaSemana(primeiro)
  const celulas = useMemo(() => Array.from({ length: ultimoDia }, (_, i) => `${ANO}-${dois(mes + 1)}-${dois(i + 1)}`), [mes, ultimoDia])

  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha cal-folha" role="dialog" aria-modal="true" aria-labelledby="cal-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <div className="cal-topo">
          <button className="btn-icone" onClick={() => setMes((m) => m - 1)} disabled={mes === 0} aria-label="Mês anterior">
            <ChevronLeft aria-hidden />
          </button>
          <h2 id="cal-titulo">
            {MESES[mes]} <span>{ANO}</span>
          </h2>
          <button className="btn-icone" onClick={() => setMes((m) => m + 1)} disabled={mes === 11} aria-label="Próximo mês">
            <ChevronRight aria-hidden />
          </button>
          <button className="btn-icone" onClick={aoFechar} aria-label="Fechar calendário">
            <X aria-hidden />
          </button>
        </div>
        <div className="cal-grade" role="grid" aria-label={`${MESES[mes]} de ${ANO}`}>
          {SEMANA.map((d, i) => (
            <span key={i} className="cal-semana" aria-hidden>
              {d}
            </span>
          ))}
          {Array.from({ length: vazios }, (_, i) => (
            <span key={`v${i}`} />
          ))}
          {celulas.map((d) => {
            const m = marcas[d]
            const n = Number(d.slice(8))
            const fez = !!m && (m.feitos > 0 || m.priosFeitas > 0)
            const planejou = !!m && !fez && m.prios > 0
            return (
              <button
                key={d}
                className="cal-dia"
                data-hoje={d === hojeReal || undefined}
                data-atual={d === dia || undefined}
                data-futuro={d > hojeReal || undefined}
                aria-label={`${n} de ${MESES[mes]}, ${SEMANA_LONGA[diaDaSemana(d)]}${d === hojeReal ? ', hoje' : ''}${fez ? ', com atividade' : ''}`}
                aria-current={d === dia ? 'date' : undefined}
                onClick={() => {
                  irPara(d)
                  aoFechar()
                }}
              >
                <b>{n}</b>
                <i data-estado={fez ? 'feito' : planejou ? 'plano' : undefined} aria-hidden />
              </button>
            )
          })}
        </div>
        {erro && <p className="aviso aviso-erro">{erro}</p>}
        <div className="cal-legenda">
          <span>
            <i data-estado="feito" /> teve atividade
          </span>
          <span>
            <i data-estado="plano" /> só planejado
          </span>
        </div>
        <div className="dia-prio-botoes">
          <button
            className="btn btn-secundario"
            onClick={() => {
              irPara(hojeReal)
              aoFechar()
            }}
          >
            Ir para hoje
          </button>
        </div>
      </div>
    </div>
  )
}
