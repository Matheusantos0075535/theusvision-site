import { Check, ChevronDown, House, Pencil, Pause, Play, Plus, RotateCcw, ShoppingCart, Timer, Trash2, X } from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { Confete } from '../../components/compartilhado/Confete'
import { Secao, ShellModulo } from '../../components/compartilhado/ShellModulo'
import { diaDaSemana, diferencaDias, formatarDataCurta, hojeBrasiliaIso, somarDias } from '../../lib/tempo'
import { useMovimentoReduzido } from '../../lib/useMidia'
import '../dia/dia.css'
import '../prototipo/prototipo.css'
import { tocar } from '../../lib/som'
import { novoId as uid, useCasaDados, type Dados, type Freq, type Tarefa } from './dados'

const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MISSAO = 15 * 60_000

type Ctx = { d: Dados; set: Dispatch<SetStateAction<Dados>> }
const C = createContext<Ctx | null>(null)
const useC = () => useContext(C)!

/** Tarefa vale para hoje? Diária sempre; semanal só nos dias da semana marcados; mensal até ser feita no mês (ou 30 dias depois da última vez). */
function devidaHoje(t: Tarefa, hoje: string) {
  const ultima = t.feitas[t.feitas.length - 1]
  if (t.freq === 'diaria') return true
  if (t.freq === 'semanal') return t.dias.includes(diaDaSemana(hoje))
  return !ultima || diferencaDias(hoje, ultima) >= 30 || t.feitas.includes(hoje)
}

function sequencia(dias: string[], hoje: string) {
  const s = new Set(dias)
  let n = 0
  let d = s.has(hoje) ? hoje : somarDias(hoje, -1)
  while (s.has(d)) {
    n++
    d = somarDias(d, -1)
  }
  return n
}

function Hoje() {
  const { d, set } = useC()
  const reduzido = useMovimentoReduzido()
  const hoje = hojeBrasiliaIso()
  const [agora, setAgora] = useState(Date.now())
  const [festa, setFesta] = useState(false)
  const [terminou, setTerminou] = useState(false)
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const doDia = d.tarefas.filter((t) => devidaHoje(t, hoje))
  // Tarefas mensais ficam numa seção própria e recolhida, para não misturar com as do dia.
  const tarefas = doDia.filter((t) => t.freq !== 'mensal')
  const mensais = doDia.filter((t) => t.freq === 'mensal')
  const [mensaisAbertas, setMensaisAbertas] = useState(false)
  const mensaisFeitas = mensais.filter((t) => t.feitas.includes(hoje)).length
  // O título do timer é sempre a próxima tarefa da rotina de hoje que ainda não foi marcada.
  const alvo = tarefas.find((t) => !t.feitas.includes(hoje))
  const heroRef = useRef<HTMLDivElement>(null)
  const [heroVisivel, setHeroVisivel] = useState(true)
  useEffect(() => {
    const el = heroRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const o = new IntersectionObserver(([x]) => setHeroVisivel(x.isIntersecting), { threshold: 0 })
    o.observe(el)
    return () => o.disconnect()
  }, [])

  const resta = d.timer ? Math.max(0, (d.timer.pausado ?? d.timer.fim - agora)) : MISSAO
  const rodando = !!d.timer && !d.timer.pausado && resta > 0
  useEffect(() => {
    if (d.timer && !d.timer.pausado && resta === 0 && !terminou) {
      setTerminou(true)
      tocar('timer')
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        /* sem vibração */
      }
    }
  }, [resta, d.timer, terminou])

  const concluir = (feita: boolean) => {
    set((x) => ({
      ...x,
      timer: null,
      missoes: x.missoes.includes(hoje) ? x.missoes : [...x.missoes, hoje],
      tarefas: feita && alvo ? x.tarefas.map((y) => (y.id === alvo.id && !y.feitas.includes(hoje) ? { ...y, feitas: [...y.feitas, hoje] } : y)) : x.tarefas,
    }))
    setTerminou(false)
    tocar('sucesso')
    if (!reduzido) {
      setFesta(true)
      window.setTimeout(() => setFesta(false), 2600)
    }
  }

  const alternar = (t: Tarefa) =>
    set((x) => ({
      ...x,
      tarefas: x.tarefas.map((y) => (y.id !== t.id ? y : { ...y, feitas: y.feitas.includes(hoje) ? y.feitas.filter((f) => f !== hoje) : [...y.feitas, hoje] })),
    }))
  const linha = (t: Tarefa) => {
    const feita = t.feitas.includes(hoje)
    return (
      <li key={t.id} className="pt-linha" data-feita={feita || undefined}>
        <button className="dia-prio-marca" aria-pressed={feita} aria-label={feita ? `Desmarcar ${t.nome}` : `Concluir ${t.nome}`} onClick={() => alternar(t)}>
          <span className="dia-caixa" aria-hidden>
            <Check />
          </span>
        </button>
        <span>
          <b>{t.nome}</b>
          <small>{rotuloFreq(t)}</small>
        </span>
      </li>
    )
  }
  const seq = sequencia(d.missoes, hoje)
  const feitasHoje = tarefas.filter((t) => t.feitas.includes(hoje)).length
  const mm = Math.floor(resta / 60000)
  const ss = Math.floor((resta % 60000) / 1000)

  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Missão de 15 minutos</span>
        <p className="dia-hero-saudacao">{alvo ? 'Agora' : 'Rotina de hoje'}</p>
        <h2 className="dia-hero-data">
          <span>{alvo?.nome ?? (tarefas.length ? 'Tudo feito hoje 🎉' : 'Sem tarefas hoje')}</span>
          {alvo ? rotuloFreq(alvo) : tarefas.length ? 'Descanse ou adiante algo de amanhã.' : 'Cadastre tarefas na aba Rotina.'}
        </h2>
        <div ref={heroRef} className="pt-anel" style={{ ['--p' as string]: ((MISSAO - resta) / MISSAO) * 100 }}>
          <div>
            <span className="pt-relogio">
              {mm}:{String(ss).padStart(2, '0')}
            </span>
            <small>{resta === 0 ? 'Tempo! Pode parar.' : rodando ? 'Só essa zona.' : 'Quando tocar, para.'}</small>
          </div>
        </div>
        <div className="pt-botoes">
          {!d.timer ? (
            <button className="btn btn-verde btn-grande" disabled={!alvo} onClick={() => set((x) => ({ ...x, timer: { fim: Date.now() + MISSAO } }))}>
              <Play aria-hidden /> Começar 15 minutos
            </button>
          ) : resta > 0 ? (
            <>
              <button
                className="btn btn-secundario"
                onClick={() =>
                  set((x) => ({
                    ...x,
                    timer: x.timer!.pausado ? { fim: Date.now() + x.timer!.pausado } : { ...x.timer!, pausado: x.timer!.fim - Date.now() },
                  }))
                }
              >
                {d.timer.pausado ? <Play aria-hidden /> : <Pause aria-hidden />} {d.timer.pausado ? 'Continuar' : 'Pausar'}
              </button>
              <button className="btn btn-primario" onClick={() => set((x) => ({ ...x, timer: { fim: Date.now() } }))}>
                <Check aria-hidden /> Terminei antes
              </button>
            </>
          ) : null}
          {d.timer && (
            <button className="btn btn-fantasma" onClick={() => set((x) => ({ ...x, timer: null }))}>
              <RotateCcw aria-hidden /> Zerar
            </button>
          )}
        </div>
        {d.timer && resta === 0 && (
          <div className="pt-card" style={{ marginTop: 12 }}>
            <b>{alvo ? `Deu para terminar "${alvo.nome}"?` : 'Missão cumprida!'}</b>
            <div className="dia-prio-botoes" style={{ justifyContent: 'flex-start' }}>
              {alvo && (
                <button className="btn btn-verde" onClick={() => concluir(true)}>
                  <Check aria-hidden /> Sim, marcar como feita
                </button>
              )}
              <button className="btn btn-secundario" onClick={() => concluir(false)}>
                {alvo ? 'Ainda não' : 'Fechar'}
              </button>
            </div>
          </div>
        )}
        <div className="pt-hero-mini">
          <div>
            <small>Sequência</small>
            <b>
              {seq} {seq === 1 ? 'dia' : 'dias'}
            </b>
          </div>
          <div>
            <small>Rotina de hoje</small>
            <b>
              {feitasHoje}/{tarefas.length}
            </b>
          </div>
          <div>
            <small>Missões</small>
            <b>{d.missoes.length}</b>
          </div>
        </div>
      </section>

      <Secao
        titulo={`Rotina de hoje · ${SEMANA[diaDaSemana(hoje)]}`}
        acao={
          <Link to="/casa/rotina" className="btn btn-fantasma ca-editar">
            <Pencil aria-hidden /> Editar
          </Link>
        }
      >
        <div className="pt-card">
          <ul className="pt-linhas">
            {tarefas.map(linha)}
          </ul>
          {tarefas.length === 0 && <small>Nenhuma tarefa para hoje.</small>}
        </div>
      </Secao>
      {mensais.length > 0 && (
        <details className="dia-lista ca-mensais" open={mensaisAbertas} onToggle={(e) => setMensaisAbertas(e.currentTarget.open)} data-completo={mensaisFeitas === mensais.length || undefined}>
          <summary>
            <span className="dia-lista-titulo">Do mês</span>
            <span className="dia-lista-conta">
              {mensaisFeitas}/{mensais.length}
            </span>
            <ChevronDown aria-hidden />
          </summary>
          <ul className="pt-linhas">{mensais.map(linha)}</ul>
        </details>
      )}
      {d.timer && !heroVisivel && (
        <div className="ca-flutuante" data-rodando={rodando || undefined} role="region" aria-label="Missão em andamento">
          <div className="ca-flut-textos">
            <small>{alvo ? 'Agora' : 'Missão'}</small>
            <b>{alvo?.nome ?? 'Tudo feito'}</b>
          </div>
          <span className="ca-flut-tempo">
            {mm}:{String(ss).padStart(2, '0')}
          </span>
          {resta > 0 && (
            <button
              className="ca-flut-play"
              aria-label={d.timer.pausado ? 'Continuar' : 'Pausar'}
              onClick={() => set((x) => ({ ...x, timer: x.timer!.pausado ? { fim: Date.now() + x.timer!.pausado } : { ...x.timer!, pausado: x.timer!.fim - Date.now() } }))}
            >
              {d.timer.pausado ? <Play aria-hidden /> : <Pause aria-hidden />}
            </button>
          )}
          {alvo && (
            <button className="ca-flut-ok" aria-label={`Marcar ${alvo.nome} como feita`} onClick={() => alternar(alvo)}>
              <Check aria-hidden />
            </button>
          )}
        </div>
      )}
      {festa && <Confete />}
    </div>
  )
}

const rotuloFreq = (t: { freq: Freq; dias: number[] }) => {
  if (t.freq === 'diaria') return 'Todo dia'
  if (t.freq === 'mensal') return 'Uma vez por mês'
  const nomes = t.dias.map((d) => SEMANA[d])
  if (nomes.length === 0) return 'Toda semana'
  if (nomes.length === 7) return 'Todo dia'
  const lista = nomes.length === 1 ? nomes[0] : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
  return `${t.dias.every((d) => [0, 6].includes(d)) ? 'Todo' : 'Toda'} ${lista}`
}

type Rascunho = { nome: string; freq: Freq; dias: number[] }
const GRUPOS_FREQ: [Freq, string][] = [
  ['diaria', 'Todo dia'],
  ['semanal', 'Toda semana'],
  ['mensal', 'Todo mês'],
]

/** Formulário de tarefa da casa: o mesmo para criar e para editar. */
function FormTarefa({ inicial, rotulo, aoSalvar, aoCancelar }: { inicial: Rascunho; rotulo: string; aoSalvar: (r: Rascunho) => void; aoCancelar?: () => void }) {
  const [r, setR] = useState(inicial)
  return (
    <form
      className="ca-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (r.nome.trim() && (r.freq !== 'semanal' || r.dias.length)) aoSalvar({ ...r, nome: r.nome.trim(), dias: r.freq === 'semanal' ? r.dias : [] })
      }}
    >
      <input className="entrada" autoFocus={!!aoCancelar} maxLength={80} value={r.nome} onChange={(e) => setR({ ...r, nome: e.target.value })} placeholder="Ex.: regar as plantas" aria-label="Nome da tarefa" />
      <div className="tr-chips">
        {GRUPOS_FREQ.map(([f, rot]) => (
          <button key={f} type="button" className="dia-chip" aria-pressed={r.freq === f} onClick={() => setR({ ...r, freq: f })}>
            {rot}
          </button>
        ))}
      </div>
      {r.freq === 'semanal' && (
        <>
          <div className="tr-chips" role="group" aria-label="Dias da semana (pode marcar mais de um)">
            {SEMANA.map((s, i) => (
              <button
                key={s}
                type="button"
                className="dia-chip"
                aria-pressed={r.dias.includes(i)}
                onClick={() => setR({ ...r, dias: r.dias.includes(i) ? r.dias.filter((x) => x !== i) : [...r.dias, i].sort((a, b) => a - b) })}
              >
                {s.slice(0, 3)}
              </button>
            ))}
          </div>
          <small className="ca-dica">Marque todos os dias em que a tarefa se repete.</small>
        </>
      )}
      <div className="dia-prio-botoes">
        {aoCancelar && (
          <button type="button" className="btn btn-fantasma" onClick={aoCancelar}>
            Cancelar
          </button>
        )}
        <button className="btn btn-primario" disabled={!r.nome.trim() || (r.freq === 'semanal' && r.dias.length === 0)}>
          {rotulo}
        </button>
      </div>
    </form>
  )
}

function Rotina() {
  const { d, set } = useC()
  const [editando, setEditando] = useState<string | null>(null)
  const [chave, setChave] = useState(0)
  const salvar = (id: string, r: Rascunho) =>
    set((x) => ({ ...x, tarefas: x.tarefas.map((y) => (y.id === id ? { ...y, nome: r.nome, freq: r.freq, dias: r.dias } : y)) }))
  return (
    <div className="pt-tela">
      <p className="dia-apoio">Toque no lápis para mudar o nome, a frequência ou o dia de uma tarefa.</p>
      {GRUPOS_FREQ.map(([f, rot]) => {
        const lista = d.tarefas.filter((t) => t.freq === f).sort((a, b) => (a.dias[0] ?? 0) - (b.dias[0] ?? 0))
        return (
          <Secao key={f} titulo={rot}>
            <div className="pt-card">
              {lista.length === 0 && <small>Nenhuma tarefa aqui.</small>}
              <ul className="pt-linhas">
                {lista.map((t) =>
                  editando === t.id ? (
                    <li key={t.id} className="ca-editando">
                      <FormTarefa
                        inicial={{ nome: t.nome, freq: t.freq, dias: t.dias.length ? t.dias : [6] }}
                        rotulo="Salvar"
                        aoCancelar={() => setEditando(null)}
                        aoSalvar={(r) => {
                          salvar(t.id, r)
                          setEditando(null)
                        }}
                      />
                    </li>
                  ) : (
                    <li key={t.id} className="pt-linha">
                      <span>
                        <b>{t.nome}</b>
                        <small>
                          {rotuloFreq(t)} · {t.feitas.length ? `última vez ${formatarDataCurta(t.feitas[t.feitas.length - 1])}` : 'ainda não feita'}
                        </small>
                      </span>
                      <button className="btn-icone" aria-label={`Editar ${t.nome}`} onClick={() => setEditando(t.id)}>
                        <Pencil aria-hidden />
                      </button>
                      <button
                        className="btn-icone"
                        aria-label={`Apagar ${t.nome}`}
                        onClick={() => window.confirm(`Apagar "${t.nome}" da rotina?`) && set((x) => ({ ...x, tarefas: x.tarefas.filter((y) => y.id !== t.id) }))}
                      >
                        <X aria-hidden />
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </Secao>
        )
      })}
      <div className="pt-card">
        <b>Nova tarefa da casa</b>
        <FormTarefa
          key={chave}
          inicial={{ nome: '', freq: 'semanal', dias: [6] }}
          rotulo="Adicionar"
          aoSalvar={(r) => {
            set((x) => ({ ...x, tarefas: [...x.tarefas, { id: uid(), nome: r.nome, freq: r.freq, dias: r.dias, feitas: [] }] }))
            setChave((k) => k + 1)
          }}
        />
      </div>
    </div>
  )
}

function Compras() {
  const { d, set } = useC()
  const [item, setItem] = useState('')
  const faltam = d.compras.filter((c) => !c.comprado)
  const comprados = d.compras.filter((c) => c.comprado)
  const alternar = (id: string) => set((x) => ({ ...x, compras: x.compras.map((c) => (c.id === id ? { ...c, comprado: !c.comprado } : c)) }))
  return (
    <div className="pt-tela">
      <form
        className="dep-novo"
        onSubmit={(e) => {
          e.preventDefault()
          if (!item.trim()) return
          set((x) => ({ ...x, compras: [{ id: uid(), nome: item.trim(), comprado: false }, ...x.compras] }))
          setItem('')
        }}
      >
        <input className="entrada" value={item} onChange={(e) => setItem(e.target.value)} placeholder="Acabou alguma coisa? Anota aqui" aria-label="Item" />
        <button className="btn btn-verde">
          <Plus aria-hidden />
        </button>
      </form>
      <div className="pt-card">
        <div className="pt-card-topo">
          <b>Comprar · {faltam.length}</b>
        </div>
        <ul className="pt-linhas">
          {[...faltam, ...comprados].map((c) => (
            <li key={c.id} className="pt-linha" data-feita={c.comprado || undefined}>
              <button className="dia-prio-marca" aria-pressed={c.comprado} aria-label={c.comprado ? `Desmarcar ${c.nome}` : `Comprado: ${c.nome}`} onClick={() => alternar(c.id)}>
                <span className="dia-caixa" aria-hidden>
                  <Check />
                </span>
              </button>
              <span>
                <b>{c.nome}</b>
              </span>
            </li>
          ))}
        </ul>
        {comprados.length > 0 && (
          <button className="btn btn-fantasma" onClick={() => set((x) => ({ ...x, compras: x.compras.filter((c) => !c.comprado) }))}>
            <Trash2 aria-hidden /> Limpar comprados
          </button>
        )}
      </div>
    </div>
  )
}

const ABAS = [
  { para: '/casa', rotulo: 'Hoje', icone: Timer, fim: true },
  { para: '/casa/rotina', rotulo: 'Rotina', icone: House },
  { para: '/casa/compras', rotulo: 'Compras', icone: ShoppingCart },
]

export default function CasaApp() {
  const { d, set, erro, recarregar } = useCasaDados()
  return (
    <ShellModulo titulo="Rotina da casa" abas={ABAS}>
      {!d ? (
        erro ? (
          <div className="bloco-erro" role="alert">
            <p>{erro}</p>
            <button className="btn btn-secundario" onClick={() => void recarregar()}>
              Tentar de novo
            </button>
          </div>
        ) : (
          <div className="carregando" role="status" aria-label="Carregando">
            <span className="giro" />
          </div>
        )
      ) : (
        <C.Provider value={{ d, set }}>
          <Routes>
            <Route index element={<Hoje />} />
            <Route path="rotina" element={<Rotina />} />
            <Route path="compras" element={<Compras />} />
            <Route path="*" element={<Hoje />} />
          </Routes>
        </C.Provider>
      )}
    </ShellModulo>
  )
}
