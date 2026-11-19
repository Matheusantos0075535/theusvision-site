import { ArrowRightToLine, CalendarCheck, ChevronLeft, ChevronRight, Download, Flame, Paperclip, PenLine, Search, Star } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Secao } from '../components/compartilhado/ShellModulo'
import { useToast } from '../components/ui/Toast'
import { mensagemDeErroBanco } from '../lib/erros'
import { tocar } from '../lib/som'
import { supabase } from '../lib/supabase'
import { diaDaSemana, hojeBrasiliaIso, somarDias } from '../lib/tempo'
import { CAMPOS, diaCurto, diaLongo, GATILHOS, hora, HUMORES, humorDe, levarParaOAFazer, palavras, paraMarkdown, sequenciaDeDias, tituloOuInicio, type Entrada } from './dados'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

/** Quantos arquivos cada entrada tem (para o clipe na lista). */
function useContagemAnexos(ids: string[]) {
  const [mapa, setMapa] = useState<Record<string, number>>({})
  const chave = ids.join(',')
  useEffect(() => {
    if (!ids.length) return setMapa({})
    let vivo = true
    supabase
      .from('diario_anexos')
      .select('entrada_id')
      .in('entrada_id', ids)
      .then(({ data }) => {
        if (!vivo) return
        const m: Record<string, number> = {}
        for (const l of (data ?? []) as { entrada_id: string }[]) m[l.entrada_id] = (m[l.entrada_id] ?? 0) + 1
        setMapa(m)
      })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  return mapa
}

function LinhaEntrada({ e, anexos, mostrarDia }: { e: Entrada; anexos: number; mostrarDia?: boolean }) {
  const h = humorDe(e.humor)
  const resto = e.texto.trim().split('\n').filter((l) => l.trim())
  const previa = (e.titulo?.trim() ? resto.join(' ') : resto.slice(1).join(' ')).slice(0, 160)
  return (
    <li>
      <Link to={`/diario/e/${e.id}`} className="di-linha">
        <span className="di-linha-humor" aria-hidden style={h ? { background: `${h.cor}33` } : undefined}>
          {h?.emoji ?? '📝'}
        </span>
        <span className="di-linha-textos">
          <b>
            {e.favorita && <Star className="di-fav" aria-label="Favorita" />}
            {tituloOuInicio(e)}
          </b>
          {previa && <small className="di-previa">{previa}</small>}
          <small className="di-linha-meta">
            {mostrarDia ? `${diaCurto(e.dia)} · ` : ''}
            {hora(e.criado_em)} · {palavras(e.texto)} palavras
            {anexos > 0 && (
              <>
                {' · '}
                <Paperclip aria-label={`${anexos} arquivos`} /> {anexos}
              </>
            )}
            {e.tarefas.length > 0 && ` · ${e.tarefas.filter((t) => t.feita).length}/${e.tarefas.length} para fazer`}
          </small>
          {e.etiquetas.length > 0 && (
            <span className="di-linha-tags">
              {e.etiquetas.map((t) => (
                <i key={t}>#{t}</i>
              ))}
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}

const gatilhoDoDia = (hoje: string) => GATILHOS[Number(hoje.slice(8)) % GATILHOS.length]

/** Tela principal: convite para escrever, números do hábito, o que escreveu hoje e pendências. */
export function Hoje() {
  const hoje = hojeBrasiliaIso()
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const [dias, setDias] = useState<string[] | null>(null)
  const [total, setTotal] = useState(0)
  const [recentes, setRecentes] = useState<Entrada[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErro(null)
    const [d, t, r] = await Promise.all([
      supabase.from('diario_entradas').select('dia').order('dia', { ascending: false }).limit(500),
      supabase.from('diario_entradas').select('id', { count: 'exact', head: true }),
      supabase.from('diario_entradas').select(CAMPOS).order('criado_em', { ascending: false }).limit(60),
    ])
    const falha = d.error ?? t.error ?? r.error
    if (falha) return setErro(mensagemDeErroBanco(falha))
    setDias((d.data as { dia: string }[]).map((x) => x.dia))
    setTotal(t.count ?? 0)
    setRecentes(r.data as Entrada[])
  }, [])
  useEffect(() => {
    void carregar()
  }, [carregar])

  const seq = useMemo(() => sequenciaDeDias(dias ?? [], hoje), [dias, hoje])
  const deHoje = recentes.filter((e) => e.dia === hoje)
  const palavrasHoje = deHoje.reduce((t, e) => t + palavras(e.texto), 0)
  const contagem = useContagemAnexos(deHoje.map((e) => e.id))
  const gatilho = gatilhoDoDia(hoje)

  // Pendências anotadas nos últimos dias que ainda não viraram tarefa nem foram feitas.
  const limite = somarDias(hoje, -30)
  const pendencias = recentes
    .filter((e) => e.dia >= limite)
    .flatMap((e) => e.tarefas.filter((t) => !t.feita && !t.levada).map((t) => ({ e, t })))
    .slice(0, 8)

  async function levar(e: Entrada, id: string) {
    const t = e.tarefas.find((x) => x.id === id)
    if (!t) return
    setOcupado(id)
    const err = await levarParaOAFazer(t.texto)
    if (err) {
      setOcupado(null)
      return mostrar(err, { comNav: false })
    }
    const r = await supabase
      .from('diario_entradas')
      .update({ tarefas: e.tarefas.map((x) => (x.id === id ? { ...x, levada: true } : x)), atualizado_em: new Date().toISOString() })
      .eq('id', e.id)
    setOcupado(null)
    if (r.error) return mostrar(mensagemDeErroBanco(r.error), { comNav: false })
    tocar('sucesso')
    mostrar('Levada para o A fazer de hoje.', { comNav: false })
    void carregar()
  }

  if (erro)
    return (
      <div className="bloco-erro" role="alert">
        <p>{erro}</p>
        <button className="btn btn-secundario" onClick={() => void carregar()}>
          Tentar de novo
        </button>
      </div>
    )

  return (
    <div className="di-tela">
      <section className="dia-hero di-hero">
        <span className="dia-hero-tipo">Seu diário</span>
        <h2 className="dia-hero-data">
          <span>Esvazie a cabeça</span>
          Escreva sem organizar. Depois, decida o que fazer.
        </h2>
        <button className="btn btn-verde btn-grande di-escrever" onClick={() => navegar('/diario/escrever')}>
          <PenLine aria-hidden /> Escrever agora
        </button>
        <button className="di-gatilho" onClick={() => navegar('/diario/escrever', { state: { texto: `${gatilho}\n` } })}>
          <small>Sugestão de hoje</small>
          <b>{gatilho}</b>
        </button>
        <div className="pt-hero-mini">
          <div>
            <small>Dias seguidos</small>
            <b>
              <Flame aria-hidden className="di-chama" data-ativa={seq > 0 || undefined} /> {dias ? seq : '…'}
            </b>
          </div>
          <div>
            <small>Entradas</small>
            <b>{dias ? total : '…'}</b>
          </div>
          <div>
            <small>Palavras hoje</small>
            <b>{dias ? palavrasHoje : '…'}</b>
          </div>
        </div>
      </section>

      {pendencias.length > 0 && (
        <Secao titulo="Anotado para fazer">
          <div className="pt-card">
            <ul className="pt-linhas">
              {pendencias.map(({ e, t }) => (
                <li key={`${e.id}-${t.id}`} className="pt-linha di-pendencia">
                  <span>
                    <b>{t.texto}</b>
                    <small>
                      <Link to={`/diario/e/${e.id}`}>{diaCurto(e.dia)} · {tituloOuInicio(e)}</Link>
                    </small>
                  </span>
                  <button className="btn btn-secundario" disabled={ocupado === t.id} onClick={() => void levar(e, t.id)}>
                    <ArrowRightToLine aria-hidden /> Hoje
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Secao>
      )}

      <Secao titulo="Hoje">
        {!dias ? (
          <div className="carregando" role="status" aria-label="Carregando">
            <span className="giro" />
          </div>
        ) : deHoje.length === 0 ? (
          <p className="vazio">Nada escrito hoje ainda. Dois minutos já ajudam: jogue aqui o que estiver na cabeça.</p>
        ) : (
          <ul className="di-lista">
            {deHoje.map((e) => (
              <LinhaEntrada key={e.id} e={e} anexos={contagem[e.id] ?? 0} />
            ))}
          </ul>
        )}
      </Secao>
    </div>
  )
}

type Marca = { n: number; humor: number | null }

/** Calendário do mês: dias escritos marcados, e o que foi escrito (e feito no A fazer) no dia escolhido. */
export function Calendario() {
  const hoje = hojeBrasiliaIso()
  const [mes, setMes] = useState(hoje.slice(0, 7))
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [escolhido, setEscolhido] = useState<string>(hoje)
  const [afazer, setAfazer] = useState<{ titulo: string; feita: boolean }[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const navegar = useNavigate()

  const [ano, m] = mes.split('-').map(Number)
  const primeiro = `${mes}-01`
  const nDias = new Date(Date.UTC(ano, m, 0)).getUTCDate()
  const ultimo = `${mes}-${String(nDias).padStart(2, '0')}`

  useEffect(() => {
    let vivo = true
    setErro(null)
    supabase
      .from('diario_entradas')
      .select(CAMPOS)
      .gte('dia', primeiro)
      .lte('dia', ultimo)
      .order('criado_em')
      .then(({ data, error }) => {
        if (!vivo) return
        if (error) setErro(mensagemDeErroBanco(error))
        else setEntradas(data as Entrada[])
      })
    return () => {
      vivo = false
    }
  }, [primeiro, ultimo])

  useEffect(() => {
    let vivo = true
    supabase
      .from('dia_prioridades')
      .select('titulo, feita')
      .eq('dia', escolhido)
      .order('ordem')
      .then(({ data, error }) => vivo && setAfazer(error ? [] : (data as { titulo: string; feita: boolean }[])))
    return () => {
      vivo = false
    }
  }, [escolhido])

  const marcas = useMemo(() => {
    const mp: Record<string, Marca> = {}
    for (const e of entradas) {
      const x = (mp[e.dia] ??= { n: 0, humor: null })
      x.n += 1
    }
    for (const d of Object.keys(mp)) {
      const hs = entradas.filter((e) => e.dia === d && e.humor).map((e) => e.humor!)
      mp[d].humor = hs.length ? Math.round(hs.reduce((a, b) => a + b, 0) / hs.length) : null
    }
    return mp
  }, [entradas])

  const doDia = entradas.filter((e) => e.dia === escolhido)
  const contagem = useContagemAnexos(doDia.map((e) => e.id))
  const vazios = diaDaSemana(primeiro)
  const mesAtual = mes === hoje.slice(0, 7)
  const trocarMes = (delta: number) => {
    const d = new Date(Date.UTC(ano, m - 1 + delta, 1))
    const novo = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    setMes(novo)
    setEscolhido(novo === hoje.slice(0, 7) ? hoje : `${novo}-01`)
  }
  const escritos = Object.keys(marcas).length

  return (
    <div className="di-tela di-cal-tela">
      <div className="pt-card di-cal">
        <div className="cal-topo">
          <button className="btn-icone" onClick={() => trocarMes(-1)} aria-label="Mês anterior">
            <ChevronLeft aria-hidden />
          </button>
          <h2>
            {MESES[m - 1]} <span>{ano}</span>
          </h2>
          <button className="btn-icone" onClick={() => trocarMes(1)} disabled={mesAtual} aria-label="Próximo mês">
            <ChevronRight aria-hidden />
          </button>
        </div>
        <div className="cal-grade" role="grid" aria-label={`Dias escritos em ${MESES[m - 1]}`}>
          {SEMANA.map((d, i) => (
            <span key={i} className="cal-semana" aria-hidden>
              {d}
            </span>
          ))}
          {Array.from({ length: vazios }, (_, i) => (
            <span key={`v${i}`} />
          ))}
          {Array.from({ length: nDias }, (_, i) => {
            const d = `${mes}-${String(i + 1).padStart(2, '0')}`
            const mk = marcas[d]
            const h = humorDe(mk?.humor ?? null)
            return (
              <button
                key={d}
                className="di-dia"
                data-escrito={mk ? true : undefined}
                data-hoje={d === hoje || undefined}
                data-atual={d === escolhido || undefined}
                data-futuro={d > hoje || undefined}
                disabled={d > hoje}
                aria-pressed={d === escolhido}
                aria-label={`${i + 1} de ${MESES[m - 1]}${mk ? `, ${mk.n} ${mk.n === 1 ? 'entrada' : 'entradas'}` : ', sem entradas'}${d === hoje ? ', hoje' : ''}`}
                onClick={() => setEscolhido(d)}
              >
                <b>{i + 1}</b>
                {mk ? <i style={{ background: h?.cor ?? 'var(--laranja)' }} aria-hidden /> : <i aria-hidden />}
              </button>
            )
          })}
        </div>
        <p className="di-cal-conta">
          <b>{escritos}</b> {escritos === 1 ? 'dia escrito' : 'dias escritos'} neste mês
        </p>
      </div>

      <div className="di-dia-detalhe">
        <div className="di-dia-topo">
          <h3>{diaLongo(escolhido)}</h3>
          <button className="btn btn-primario" onClick={() => navegar('/diario/escrever', { state: { dia: escolhido } })}>
            <PenLine aria-hidden /> Escrever
          </button>
        </div>
        {erro && <p className="aviso aviso-erro">{erro}</p>}
        {doDia.length === 0 ? (
          <p className="vazio">{escolhido === hoje ? 'Nada escrito hoje ainda.' : 'Você não escreveu neste dia.'}</p>
        ) : (
          <ul className="di-lista">
            {doDia.map((e) => (
              <LinhaEntrada key={e.id} e={e} anexos={contagem[e.id] ?? 0} />
            ))}
          </ul>
        )}
        {afazer.length > 0 && (
          <div className="pt-card di-afazer-dia">
            <div className="pt-card-topo">
              <b>
                <CalendarCheck aria-hidden /> No A fazer deste dia
              </b>
              <span className="pt-tag" data-cor={afazer.every((a) => a.feita) ? 'verde' : undefined}>
                {afazer.filter((a) => a.feita).length}/{afazer.length}
              </span>
            </div>
            <ul className="pt-linhas">
              {afazer.map((a, i) => (
                <li key={i} className="pt-linha" data-feita={a.feita || undefined}>
                  <span>
                    <b>{a.feita ? '✓ ' : '○ '}{a.titulo}</b>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function baixar(nome: string, texto: string) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/markdown;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}

/** Todas as entradas, com busca, favoritas e etiquetas. */
export function Entradas() {
  const { mostrar } = useToast()
  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [favoritas, setFavoritas] = useState(false)
  const [tag, setTag] = useState<string | null>(null)
  const [humor, setHumor] = useState<number | null>(null)
  const [lista, setLista] = useState<Entrada[] | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [limite, setLimite] = useState(60)

  useEffect(() => {
    const t = window.setTimeout(() => setBuscaAplicada(busca.trim()), 300)
    return () => window.clearTimeout(t)
  }, [busca])

  useEffect(() => {
    let vivo = true
    setErro(null)
    let q = supabase.from('diario_entradas').select(CAMPOS).order('dia', { ascending: false }).order('criado_em', { ascending: false }).limit(limite)
    if (favoritas) q = q.eq('favorita', true)
    if (tag) q = q.contains('etiquetas', [tag])
    if (humor) q = q.eq('humor', humor)
    if (buscaAplicada) {
      const t = buscaAplicada.replace(/[%_,()]/g, ' ').slice(0, 80)
      q = q.or(`texto.ilike.%${t}%,titulo.ilike.%${t}%`)
    }
    q.then(({ data, error }) => {
      if (!vivo) return
      if (error) setErro(mensagemDeErroBanco(error))
      else setLista(data as Entrada[])
    })
    return () => {
      vivo = false
    }
  }, [buscaAplicada, favoritas, tag, humor, limite])

  useEffect(() => {
    supabase
      .from('diario_entradas')
      .select('etiquetas')
      .order('criado_em', { ascending: false })
      .limit(300)
      .then(({ data }) => {
        const c = new Map<string, number>()
        for (const l of (data ?? []) as { etiquetas: string[] }[]) for (const t of l.etiquetas) c.set(t, (c.get(t) ?? 0) + 1)
        setTags([...c.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 10))
      })
  }, [])

  const contagem = useContagemAnexos((lista ?? []).map((e) => e.id))
  const grupos = useMemo(() => {
    const m = new Map<string, Entrada[]>()
    for (const e of lista ?? []) m.set(e.dia, [...(m.get(e.dia) ?? []), e])
    return [...m.entries()]
  }, [lista])
  const filtrando = !!(buscaAplicada || favoritas || tag || humor)

  async function exportar() {
    const r = await supabase.from('diario_entradas').select(CAMPOS).order('dia').order('criado_em').limit(5000)
    if (r.error) return mostrar(mensagemDeErroBanco(r.error), { comNav: false })
    baixar(`meu-diario-${hojeBrasiliaIso()}.md`, paraMarkdown(r.data as Entrada[]))
  }

  return (
    <div className="di-tela">
      <label className="id-busca">
        <Search aria-hidden />
        <input className="entrada" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar no diário" aria-label="Buscar no diário" />
      </label>
      <div className="di-chips di-filtros" role="group" aria-label="Filtros">
        <button className="dia-chip" aria-pressed={favoritas} onClick={() => setFavoritas((f) => !f)}>
          ★ Favoritas
        </button>
        {HUMORES.map((h) => (
          <button key={h.n} className="dia-chip" aria-pressed={humor === h.n} aria-label={`Humor: ${h.rotulo}`} onClick={() => setHumor(humor === h.n ? null : h.n)}>
            {h.emoji}
          </button>
        ))}
        {tags.map((t) => (
          <button key={t} className="dia-chip" aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>
            #{t}
          </button>
        ))}
      </div>
      {erro && (
        <div className="bloco-erro" role="alert">
          <p>{erro}</p>
        </div>
      )}
      {!lista && !erro && (
        <div className="carregando" role="status" aria-label="Carregando">
          <span className="giro" />
        </div>
      )}
      {lista && lista.length === 0 && <p className="vazio">{filtrando ? 'Nada encontrado com esses filtros.' : 'O diário ainda está vazio. A primeira entrada leva dois minutos.'}</p>}
      {grupos.map(([dia, es]) => (
        <section key={dia} className="di-grupo">
          <h3>{diaLongo(dia)}</h3>
          <ul className="di-lista">
            {es.map((e) => (
              <LinhaEntrada key={e.id} e={e} anexos={contagem[e.id] ?? 0} />
            ))}
          </ul>
        </section>
      ))}
      {lista && lista.length >= limite && (
        <button className="btn btn-secundario" onClick={() => setLimite((l) => l + 60)}>
          Ver mais antigas
        </button>
      )}
      {lista && lista.length > 0 && !filtrando && (
        <button className="btn btn-fantasma di-exportar" onClick={() => void exportar()}>
          <Download aria-hidden /> Baixar o diário inteiro (.md)
        </button>
      )}
    </div>
  )
}

