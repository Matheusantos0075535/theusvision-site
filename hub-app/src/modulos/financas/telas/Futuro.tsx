import { ChevronLeft, ChevronRight, Flame, PiggyBank, Sprout, Trophy, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BarrasHorizontais } from '../../../components/compartilhado/Graficos'
import { Secao } from '../../../components/compartilhado/ShellModulo'
import { useToast } from '../../../components/ui/Toast'
import { tocar } from '../../../lib/som'
import { supabase } from '../../../lib/supabase'
import { diaDaSemana, formatarDataCurta, somarDias } from '../../../lib/tempo'
import { diasNoMes, MESES, numero, real, soValor, somarMeses, useFin, useResumoDoMes } from '../dados'

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

/** Sequência de dias seguidos guardando, terminando hoje (ou ontem, se hoje ainda não guardou). */
function sequencias(dias: Set<string>, hoje: string) {
  let atual = 0
  let d = dias.has(hoje) ? hoje : somarDias(hoje, -1)
  while (dias.has(d)) {
    atual++
    d = somarDias(d, -1)
  }
  let melhor = 0
  for (const x of dias) {
    if (dias.has(somarDias(x, -1))) continue
    let n = 0
    let y = x
    while (dias.has(y)) {
      n++
      y = somarDias(y, 1)
    }
    melhor = Math.max(melhor, n)
  }
  return { atual, melhor }
}

function Calendario() {
  const { hoje, aportes, metas, escrever } = useFin()
  const { mostrar } = useToast()
  const [mes, setMes] = useState(hoje.slice(0, 7))
  const [aberto, setAberto] = useState<string | null>(null)
  const porDia = useMemo(() => {
    const m: Record<string, number> = {}
    for (const a of aportes) m[a.dia] = (m[a.dia] ?? 0) + a.valor
    return m
  }, [aportes])
  const n = diasNoMes(mes)
  const vazios = diaDaSemana(`${mes}-01`)
  const verdes = Object.keys(porDia).filter((d) => d.startsWith(mes)).length
  const passados = mes === hoje.slice(0, 7) ? Number(hoje.slice(8)) : mes < hoje.slice(0, 7) ? n : 0
  const doDia = aberto ? aportes.filter((a) => a.dia === aberto) : []

  return (
    <div className="pt-card fin-cal">
      <div className="cal-topo">
        <button className="btn-icone" onClick={() => setMes((m) => somarMeses(m, -1))} aria-label="Mês anterior">
          <ChevronLeft aria-hidden />
        </button>
        <h3>
          {MESES[Number(mes.slice(5, 7)) - 1]} <span>{mes.slice(0, 4)}</span>
        </h3>
        <button className="btn-icone" onClick={() => setMes((m) => somarMeses(m, 1))} disabled={mes >= hoje.slice(0, 7)} aria-label="Próximo mês">
          <ChevronRight aria-hidden />
        </button>
      </div>
      <div className="cal-grade" role="grid" aria-label={`Dias em que guardou dinheiro em ${MESES[Number(mes.slice(5, 7)) - 1]}`}>
        {SEMANA.map((d, i) => (
          <span key={i} className="cal-semana" aria-hidden>
            {d}
          </span>
        ))}
        {Array.from({ length: vazios }, (_, i) => (
          <span key={`v${i}`} />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const d = `${mes}-${String(i + 1).padStart(2, '0')}`
          const v = porDia[d]
          return (
            <button
              key={d}
              className="fin-cal-dia"
              data-verde={v ? true : undefined}
              data-hoje={d === hoje || undefined}
              data-futuro={d > hoje || undefined}
              aria-pressed={aberto === d}
              disabled={!v}
              aria-label={`${i + 1}${v ? `: guardou ${real(v)}` : ''}${d === hoje ? ', hoje' : ''}`}
              onClick={() => setAberto(aberto === d ? null : d)}
            >
              <b>{i + 1}</b>
              {v ? <Sprout aria-hidden /> : null}
            </button>
          )
        })}
      </div>
      <p className="fin-cal-conta">
        <b>{verdes}</b> {verdes === 1 ? 'dia verde' : 'dias verdes'}
        {passados > 0 && ` de ${passados}`} neste mês
      </p>
      {aberto && (
        <ul className="pt-linhas fin-cal-detalhe">
          {doDia.map((a) => (
            <li key={a.id} className="pt-linha">
              <span>
                <b>{metas.find((m) => m.id === a.meta_id)?.nome ?? 'Meta'}</b>
                <small>{formatarDataCurta(a.dia)}</small>
              </span>
              <span className="pt-valor" data-sinal="mais">
                +{real(a.valor)}
              </span>
              <button
                className="btn-icone"
                aria-label="Desfazer este valor guardado"
                onClick={async () => {
                  if (!window.confirm(`Desfazer ${real(a.valor)} guardado?`)) return
                  const e = await escrever(supabase.from('fin_aportes').delete().eq('id', a.id))
                  if (e) mostrar(e, { comNav: true })
                }}
              >
                <X aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Futuro() {
  const { hoje, metas, aportes, categorias, escrever } = useFin()
  const { mostrar } = useToast()
  const r = useResumoDoMes(hoje.slice(0, 7))
  const [valor, setValor] = useState<Record<string, string>>({})
  const [nova, setNova] = useState({ nome: '', alvo: '' })
  const dias = useMemo(() => new Set(aportes.map((a) => a.dia)), [aportes])
  const seq = sequencias(dias, hoje)
  const guardadoTotal = aportes.reduce((t, a) => t + a.valor, 0)
  const porMeta = (id: string) => aportes.filter((a) => a.meta_id === id).reduce((t, a) => t + a.valor, 0)
  const hojeVerde = dias.has(hoje)

  async function guardar(metaId: string) {
    const v = numero(valor[metaId] ?? '')
    const e = await escrever(supabase.from('fin_aportes').insert({ meta_id: metaId, valor: v }))
    if (e) return mostrar(e, { comNav: true })
    tocar(!hojeVerde ? 'conquista' : 'sucesso')
    if (!hojeVerde) mostrar(seq.atual + 1 > 1 ? `Dia verde! ${seq.atual + 1} dias seguidos guardando.` : 'Dia verde! Mais um dia pro seu futuro.', { comNav: true })
    setValor((x) => ({ ...x, [metaId]: '' }))
  }

  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Futuro</span>
        <h2 className="dia-hero-data">
          <span>{real(guardadoTotal)}</span>
          guardados para o que importa
        </h2>
        <div className="fin-selos">
          <span className="fin-selo" data-ativo={seq.atual > 0 || undefined}>
            <Flame aria-hidden />
            <b>{seq.atual}</b>
            <small>{seq.atual === 1 ? 'dia seguido' : 'dias seguidos'}</small>
          </span>
          <span className="fin-selo" data-ativo={seq.melhor > 0 || undefined}>
            <Trophy aria-hidden />
            <b>{seq.melhor}</b>
            <small>melhor sequência</small>
          </span>
          <span className="fin-selo" data-ativo={hojeVerde || undefined}>
            <Sprout aria-hidden />
            <b>{hojeVerde ? 'Sim' : 'Não'}</b>
            <small>{hojeVerde ? 'guardou hoje' : 'guardou hoje ainda'}</small>
          </span>
        </div>
        <p className="pt-mini-texto">Qualquer valor conta: até R$ 5 deixa o dia verde. Pague-se primeiro: quando a renda entrar, separe a parte do futuro antes de gastar.</p>
      </section>

      <Secao titulo="Dias verdes">
        <Calendario />
      </Secao>

      <Secao titulo="Metas">
        <ul className="pt-cards pt-cards-2">
          {metas.map((m) => {
            const g = porMeta(m.id)
            const p = g / m.alvo
            return (
              <li key={m.id} className="pt-card">
                <div className="pt-card-topo">
                  <b>{m.nome}</b>
                  <span className="pt-tag" data-cor={p >= 1 ? 'verde' : undefined}>
                    {Math.round(p * 100)}%
                  </span>
                </div>
                <span className="pt-barra">
                  <i style={{ width: `${Math.min(100, p * 100)}%` }} />
                </span>
                <small>
                  {real(g)} de {real(m.alvo)}
                </small>
                <form
                  className="pt-form"
                  onSubmit={(ev) => {
                    ev.preventDefault()
                    void guardar(m.id)
                  }}
                >
                  <input
                    className="entrada"
                    inputMode="decimal"
                    placeholder="Valor"
                    value={valor[m.id] ?? ''}
                    onChange={(e) => setValor((v) => ({ ...v, [m.id]: soValor(e.target.value) }))}
                    aria-label={`Valor para guardar em ${m.nome}`}
                  />
                  <button className="btn btn-verde" disabled={numero(valor[m.id] ?? '') <= 0}>
                    <PiggyBank aria-hidden /> Guardar
                  </button>
                </form>
              </li>
            )
          })}
        </ul>
        <form
          className="pt-card"
          onSubmit={async (ev) => {
            ev.preventDefault()
            const e = await escrever(supabase.from('fin_metas').insert({ nome: nova.nome.trim(), alvo: numero(nova.alvo), ordem: metas.length + 1 }))
            if (e) return mostrar(e, { comNav: true })
            setNova({ nome: '', alvo: '' })
          }}
        >
          <b>Nova meta</b>
          <div className="pt-form">
            <input className="entrada" maxLength={80} value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} placeholder="Ex.: viagem, equipamento" aria-label="Nome da meta" />
            <input className="entrada" inputMode="decimal" value={nova.alvo} onChange={(e) => setNova({ ...nova, alvo: soValor(e.target.value) })} placeholder="Quanto" aria-label="Valor da meta" />
            <button className="btn btn-primario" disabled={!nova.nome.trim() || numero(nova.alvo) <= 0}>
              Criar
            </button>
          </div>
        </form>
      </Secao>

      {r.totalGastos > 0 && (
        <Secao titulo="Para onde foi o dinheiro neste mês">
          <div className="pt-card">
            <BarrasHorizontais
              itens={categorias
                .map((c) => ({ rotulo: c.nome, valor: Math.round(r.gastos.filter((g) => g.categoria_id === c.id).reduce((t, g) => t + g.valor, 0)) }))
                .filter((x) => x.valor > 0)}
            />
          </div>
        </Secao>
      )}
    </div>
  )
}
