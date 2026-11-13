import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { diaDaSemana, hojeBrasiliaIso, somarDias } from '../../lib/tempo'
import { MODULOS, ROTULO_MODO, type Modo } from '../modulos'

type Linha = { dia: string; modulo: string; segundos: number }

const MODOS: Modo[] = ['pessoal', 'work', 'creative']
const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const NOMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const modoDe = (id: string) => MODULOS.find((m) => m.id === id)?.modo ?? 'pessoal'
const nomeDe = (id: string) => MODULOS.find((m) => m.id === id)?.nome ?? id

export function tempo(seg: number) {
  if (seg < 60) return seg > 0 ? '<1 min' : '0 min'
  const m = Math.round(seg / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  return m % 60 ? `${h}h ${m % 60}min` : `${h}h`
}

/** Quanto você usou cada modo nesta semana (domingo a sábado). Só conta tempo dentro dos módulos. */
export function UsoSemanal() {
  const [linhas, setLinhas] = useState<Linha[] | null>(null)
  const [erro, setErro] = useState(false)
  const hoje = hojeBrasiliaIso()
  const domingo = somarDias(hoje, -diaDaSemana(hoje))
  const [aberto, setAberto] = useState<number>(diaDaSemana(hoje))

  useEffect(() => {
    let vivo = true
    supabase
      .from('hub_uso')
      .select('dia, modulo, segundos')
      .gte('dia', domingo)
      .then(({ data, error }) => {
        if (!vivo) return
        if (error) setErro(true)
        else setLinhas(data as Linha[])
      })
    return () => {
      vivo = false
    }
  }, [domingo])

  const dias = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = somarDias(domingo, i)
        const doDia = (linhas ?? []).filter((l) => l.dia === d)
        const porModo = Object.fromEntries(MODOS.map((m) => [m, doDia.filter((l) => modoDe(l.modulo) === m).reduce((t, l) => t + l.segundos, 0)])) as Record<Modo, number>
        return { d, i, porModo, total: doDia.reduce((t, l) => t + l.segundos, 0), modulos: [...doDia].sort((a, b) => b.segundos - a.segundos) }
      }),
    [linhas, domingo],
  )
  // Sem a tabela (migração não rodada) o cartão simplesmente não aparece.
  if (erro) return null

  const max = Math.max(60, ...dias.map((x) => x.total))
  const semana = Object.fromEntries(MODOS.map((m) => [m, dias.reduce((t, x) => t + x.porModo[m], 0)])) as Record<Modo, number>
  const totalSemana = MODOS.reduce((t, m) => t + semana[m], 0)
  const sel = dias[aberto]

  return (
    <section className="uso" aria-labelledby="uso-titulo">
      <div className="uso-topo">
        <h2 id="uso-titulo">Sua semana</h2>
        <b>{linhas ? tempo(totalSemana) : '…'}</b>
      </div>
      <ul className="uso-legenda">
        {MODOS.map((m) => (
          <li key={m} data-modo={m}>
            <i aria-hidden />
            {ROTULO_MODO[m]} <b>{tempo(semana[m])}</b>
          </li>
        ))}
      </ul>
      <div className="uso-barras" role="group" aria-label="Tempo por dia da semana">
        {dias.map((x) => (
          <button
            key={x.d}
            className="uso-dia"
            aria-pressed={aberto === x.i}
            data-hoje={x.d === hoje || undefined}
            data-futuro={x.d > hoje || undefined}
            onClick={() => setAberto(x.i)}
            onMouseEnter={() => setAberto(x.i)}
            aria-label={`${NOMES[x.i]}: ${tempo(x.total)}${x.total ? ` (${MODOS.filter((m) => x.porModo[m]).map((m) => `${ROTULO_MODO[m]} ${tempo(x.porModo[m])}`).join(', ')})` : ''}`}
          >
            <span className="uso-coluna">
              {MODOS.map((m) =>
                x.porModo[m] ? <i key={m} data-modo={m} style={{ height: `${Math.max(4, (x.porModo[m] / max) * 100)}%` }} /> : null,
              )}
            </span>
            <small>{LETRAS[x.i]}</small>
          </button>
        ))}
      </div>
      <div className="uso-detalhe" aria-live="polite">
        <b>
          {sel.d === hoje ? 'Hoje' : NOMES[sel.i]} · {tempo(sel.total)}
        </b>
        {sel.modulos.length ? (
          <span>
            {sel.modulos.slice(0, 4).map((l) => (
              <em key={l.modulo} data-modo={modoDe(l.modulo)}>
                {nomeDe(l.modulo)} {tempo(l.segundos)}
              </em>
            ))}
          </span>
        ) : (
          <span>{sel.d > hoje ? 'Ainda não chegou.' : 'Nenhum módulo usado.'}</span>
        )}
      </div>
    </section>
  )
}
