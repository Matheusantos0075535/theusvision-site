import { BookOpenCheck, Brain, ChartNoAxesColumn, Check, Pause, Play, Plus, RotateCcw, X } from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Confete } from '../../components/compartilhado/Confete'
import { GraficoColunas, Numeros } from '../../components/compartilhado/Graficos'
import { Secao, ShellModulo } from '../../components/compartilhado/ShellModulo'
import { formatarDataCurta, hojeBrasiliaIso, somarDias } from '../../lib/tempo'
import { useMovimentoReduzido } from '../../lib/useMidia'
import '../dia/dia.css'
import { AvisoPrototipo } from '../prototipo/Aviso'
import { uid, usePersistido } from '../prototipo/estado'
import '../prototipo/prototipo.css'

type Topico = { id: string; nome: string; aprendido?: string; proxima?: string; nivel: number; revisoes: number }
type Trilha = { id: string; nome: string; cor: string; topicos: Topico[] }
type Sessao = { id: string; dia: string; min: number; trilha: string }
type Dados = { trilhas: Trilha[]; sessoes: Sessao[]; timer: { fim: number; total: number; trilha: string; pausado?: number } | null; meta: number }

/** Revisão espaçada: depois de aprender, revisa em 1, 3, 7, 14, 30 e 60 dias. */
const INTERVALOS = [1, 3, 7, 14, 30, 60]
const CORES = ['#ff9f11', '#3ddc97', '#7fb0f5', '#c792ea', '#ff8f82']

function exemplo(): Dados {
  const t = (nome: string): Topico => ({ id: uid(), nome, nivel: 0, revisoes: 0 })
  return {
    meta: 25,
    timer: null,
    sessoes: [],
    trilhas: [
      {
        id: uid(),
        nome: 'Manual de reconstrução',
        cor: CORES[0],
        topicos: [
          'O mapa da situação',
          'O modelo dos três sistemas',
          'Dopamina: querer não é gostar',
          'Desamparo aprendido e controle',
          'Catálogo de padrões (P1 a P13)',
          'Ferramentas do núcleo (F1 a F6)',
          'Protocolo de 12 semanas',
          'Prevenção de recaída',
        ].map(t),
      },
      { id: uid(), nome: 'Tráfego pago', cor: CORES[2], topicos: ['Estrutura de campanha', 'Públicos e segmentação', 'Criativos que convertem', 'Métricas: CPA, CTR, ROAS'].map(t) },
      { id: uid(), nome: 'IA e automação', cor: CORES[3], topicos: ['Prompts que funcionam', 'Automações no dia a dia da agência', 'Agentes e integrações'].map(t) },
    ],
  }
}

type Ctx = { d: Dados; set: Dispatch<SetStateAction<Dados>> }
const C = createContext<Ctx | null>(null)
const useE = () => useContext(C)!

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
  const { d, set } = useE()
  const reduzido = useMovimentoReduzido()
  const hoje = hojeBrasiliaIso()
  const [agora, setAgora] = useState(Date.now())
  const [trilha, setTrilha] = useState(d.trilhas[0]?.id ?? '')
  const [duracao, setDuracao] = useState(d.meta)
  const [festa, setFesta] = useState(false)
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const total = d.timer?.total ?? duracao * 60_000
  const resta = d.timer ? Math.max(0, d.timer.pausado ?? d.timer.fim - agora) : total
  const minHoje = d.sessoes.filter((s) => s.dia === hoje).reduce((t, s) => t + s.min, 0)
  const devidas = d.trilhas.flatMap((tr) => tr.topicos.filter((tp) => tp.proxima && tp.proxima <= hoje).map((tp) => ({ tr, tp })))
  const seq = sequencia(d.sessoes.map((s) => s.dia), hoje)

  useEffect(() => {
    if (d.timer && !d.timer.pausado && resta === 0) {
      const min = Math.round(d.timer.total / 60_000)
      set((x) => ({ ...x, timer: null, sessoes: [...x.sessoes, { id: uid(), dia: hoje, min, trilha: x.timer!.trilha }] }))
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        /* sem vibração */
      }
      if (!reduzido) {
        setFesta(true)
        window.setTimeout(() => setFesta(false), 2600)
      }
    }
  }, [resta, d.timer, hoje, set, reduzido])

  const revisar = (trId: string, tpId: string, resultado: 0 | 1 | 2) =>
    set((x) => ({
      ...x,
      trilhas: x.trilhas.map((tr) =>
        tr.id !== trId
          ? tr
          : {
              ...tr,
              topicos: tr.topicos.map((tp) => {
                if (tp.id !== tpId) return tp
                const nivel = resultado === 0 ? 0 : resultado === 1 ? tp.nivel : Math.min(INTERVALOS.length - 1, tp.nivel + 1)
                return { ...tp, nivel, revisoes: tp.revisoes + 1, proxima: somarDias(hoje, INTERVALOS[nivel]) }
              }),
            },
      ),
    }))

  const tr = d.trilhas.find((t) => t.id === (d.timer?.trilha ?? trilha))
  const mm = Math.floor(resta / 60000)
  const ss = Math.floor((resta % 60000) / 1000)

  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Foco de estudo</span>
        <p className="dia-hero-saudacao">{d.timer ? `Estudando ${tr?.nome ?? ''}` : 'Depois do bloco principal do dia, até 30 minutos.'}</p>
        <div className="pt-anel" style={{ ['--p' as string]: ((total - resta) / total) * 100 }}>
          <div>
            <span className="pt-relogio">
              {mm}:{String(ss).padStart(2, '0')}
            </span>
            <small>{minHoje ? `${minHoje} min estudados hoje` : 'Nada estudado hoje ainda'}</small>
          </div>
        </div>
        {!d.timer && (
          <>
            <div className="tr-chips" style={{ justifyContent: 'center' }}>
              {[15, 25, 30].map((m) => (
                <button key={m} className="dia-chip" aria-pressed={duracao === m} onClick={() => setDuracao(m)}>
                  {m} min
                </button>
              ))}
            </div>
            <div className="tr-chips" style={{ justifyContent: 'center' }}>
              {d.trilhas.map((t) => (
                <button key={t.id} className="dia-chip" aria-pressed={trilha === t.id} onClick={() => setTrilha(t.id)}>
                  {t.nome}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="pt-botoes">
          {!d.timer ? (
            <button className="btn btn-verde btn-grande" disabled={!trilha} onClick={() => set((x) => ({ ...x, timer: { fim: Date.now() + duracao * 60_000, total: duracao * 60_000, trilha } }))}>
              <Play aria-hidden /> Começar {duracao} minutos
            </button>
          ) : (
            <>
              <button
                className="btn btn-secundario"
                onClick={() => set((x) => ({ ...x, timer: x.timer!.pausado ? { ...x.timer!, fim: Date.now() + x.timer!.pausado, pausado: undefined } : { ...x.timer!, pausado: x.timer!.fim - Date.now() } }))}
              >
                {d.timer.pausado ? <Play aria-hidden /> : <Pause aria-hidden />} {d.timer.pausado ? 'Continuar' : 'Pausar'}
              </button>
              <button
                className="btn btn-primario"
                onClick={() => {
                  const feitos = Math.max(1, Math.round((d.timer!.total - resta) / 60_000))
                  set((x) => ({ ...x, timer: null, sessoes: [...x.sessoes, { id: uid(), dia: hoje, min: feitos, trilha: x.timer!.trilha }] }))
                }}
              >
                <Check aria-hidden /> Encerrar e salvar
              </button>
              <button className="btn btn-fantasma" onClick={() => set((x) => ({ ...x, timer: null }))}>
                <RotateCcw aria-hidden /> Descartar
              </button>
            </>
          )}
        </div>
        <div className="pt-hero-mini">
          <div>
            <small>Sequência</small>
            <b>
              {seq} {seq === 1 ? 'dia' : 'dias'}
            </b>
          </div>
          <div>
            <small>Revisões hoje</small>
            <b>{devidas.length}</b>
          </div>
          <div>
            <small>Aprendidos</small>
            <b>{d.trilhas.reduce((t, x) => t + x.topicos.filter((y) => y.aprendido).length, 0)}</b>
          </div>
        </div>
      </section>

      <Secao titulo="Revisões de hoje">
        {devidas.length === 0 ? (
          <p className="vazio">Nenhuma revisão hoje. Quando você marca um assunto como aprendido, ele volta aqui no dia certo para não esquecer.</p>
        ) : (
          <ul className="pt-cards">
            {devidas.map(({ tr, tp }) => (
              <li key={tp.id} className="pt-card">
                <div className="pt-card-topo">
                  <b>{tp.nome}</b>
                  <span className="pt-tag">{tr.nome}</span>
                </div>
                <small>Tente explicar em voz alta, em 1 minuto, sem olhar. Como foi?</small>
                <div className="pt-revisao-botoes">
                  <button className="btn btn-secundario" onClick={() => revisar(tr.id, tp.id, 0)}>
                    Esqueci
                  </button>
                  <button className="btn btn-secundario" onClick={() => revisar(tr.id, tp.id, 1)}>
                    Mais ou menos
                  </button>
                  <button className="btn btn-verde" onClick={() => revisar(tr.id, tp.id, 2)}>
                    Lembrei bem
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Secao>
      {festa && <Confete />}
    </div>
  )
}

function Trilhas() {
  const { d, set } = useE()
  const hoje = hojeBrasiliaIso()
  const [aberta, setAberta] = useState<string | null>(null)
  const [novoTopico, setNovoTopico] = useState('')
  const [novaTrilha, setNovaTrilha] = useState('')
  const t = d.trilhas.find((x) => x.id === aberta)
  const mudarTopico = (trId: string, tpId: string, c: Partial<Topico> | null) =>
    set((x) => ({
      ...x,
      trilhas: x.trilhas.map((tr) => (tr.id !== trId ? tr : { ...tr, topicos: c === null ? tr.topicos.filter((tp) => tp.id !== tpId) : tr.topicos.map((tp) => (tp.id === tpId ? { ...tp, ...c } : tp)) })),
    }))
  return (
    <div className="pt-tela">
      <p className="dia-apoio">Cada trilha é um assunto. Marque o que aprendeu e o app agenda as revisões sozinho: 1, 3, 7, 14, 30 e 60 dias depois.</p>
      <ul className="pt-cards pt-cards-2">
        {d.trilhas.map((tr) => {
          const ap = tr.topicos.filter((x) => x.aprendido).length
          const min = d.sessoes.filter((s) => s.trilha === tr.id).reduce((a, s) => a + s.min, 0)
          return (
            <li key={tr.id}>
              <button className="pt-card" style={{ width: '100%', textAlign: 'left' }} onClick={() => setAberta(tr.id)}>
                <div className="pt-card-topo">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="pt-trilha-cor" style={{ background: tr.cor }} />
                    <b>{tr.nome}</b>
                  </span>
                  <span className="pt-tag">
                    {ap}/{tr.topicos.length}
                  </span>
                </div>
                <span className="pt-barra">
                  <i style={{ width: `${tr.topicos.length ? (ap / tr.topicos.length) * 100 : 0}%` }} />
                </span>
                <small>{min} min de estudo</small>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="pt-card">
        <b>Nova trilha</b>
        <div className="pt-form">
          <input className="entrada" value={novaTrilha} onChange={(e) => setNovaTrilha(e.target.value)} placeholder="Ex.: Copywriting" aria-label="Nome da trilha" />
          <button
            className="btn btn-primario"
            disabled={!novaTrilha.trim()}
            onClick={() => {
              set((x) => ({ ...x, trilhas: [...x.trilhas, { id: uid(), nome: novaTrilha.trim(), cor: CORES[x.trilhas.length % CORES.length], topicos: [] }] }))
              setNovaTrilha('')
            }}
          >
            <Plus aria-hidden /> Criar
          </button>
        </div>
      </div>
      {t && (
        <div className="folha-fundo" onClick={() => setAberta(null)}>
          <div className="folha pt-folha-clara" role="dialog" aria-modal="true" aria-label={t.nome} onClick={(e) => e.stopPropagation()} style={{ maxHeight: '88vh', overflow: 'auto' }}>
            <div className="folha-alca" aria-hidden />
            <div className="tr-folha-topo">
              <h2>{t.nome}</h2>
              <button className="btn-icone" onClick={() => setAberta(null)} aria-label="Fechar">
                <X aria-hidden />
              </button>
            </div>
            <div className="pt-card">
              <ul className="pt-linhas">
                {t.topicos.map((tp) => (
                  <li key={tp.id} className="pt-linha">
                    <button
                      className="dia-prio-marca"
                      aria-pressed={!!tp.aprendido}
                      aria-label={tp.aprendido ? `Desmarcar ${tp.nome}` : `Aprendi: ${tp.nome}`}
                      onClick={() => mudarTopico(t.id, tp.id, tp.aprendido ? { aprendido: undefined, proxima: undefined, nivel: 0 } : { aprendido: hoje, proxima: somarDias(hoje, 1), nivel: 0 })}
                    >
                      <span className="dia-caixa" aria-hidden>
                        <Check />
                      </span>
                    </button>
                    <span>
                      <b>{tp.nome}</b>
                      <small>{tp.aprendido ? `Aprendido em ${formatarDataCurta(tp.aprendido)} · próxima revisão ${formatarDataCurta(tp.proxima!)}` : 'Ainda não estudado'}</small>
                    </span>
                    <button className="btn-icone" aria-label={`Apagar ${tp.nome}`} onClick={() => mudarTopico(t.id, tp.id, null)}>
                      <X aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className="dep-novo"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!novoTopico.trim()) return
                  set((x) => ({ ...x, trilhas: x.trilhas.map((tr) => (tr.id !== t.id ? tr : { ...tr, topicos: [...tr.topicos, { id: uid(), nome: novoTopico.trim(), nivel: 0, revisoes: 0 }] })) }))
                  setNovoTopico('')
                }}
              >
                <input className="entrada" value={novoTopico} onChange={(e) => setNovoTopico(e.target.value)} placeholder="Novo assunto" aria-label="Novo assunto" />
                <button className="btn btn-secundario" disabled={!novoTopico.trim()}>
                  <Plus aria-hidden />
                </button>
              </form>
            </div>
            <button
              className="btn btn-fantasma"
              onClick={() => {
                if (!window.confirm(`Apagar a trilha ${t.nome}?`)) return
                set((x) => ({ ...x, trilhas: x.trilhas.filter((y) => y.id !== t.id) }))
                setAberta(null)
              }}
            >
              Apagar trilha
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Progresso() {
  const { d } = useE()
  const hoje = hojeBrasiliaIso()
  const dias = Array.from({ length: 14 }, (_, i) => somarDias(hoje, i - 13))
  const porDia = dias.map((x) => d.sessoes.filter((s) => s.dia === x).reduce((t, s) => t + s.min, 0))
  const semana = porDia.slice(-7).reduce((a, b) => a + b, 0)
  return (
    <div className="pt-tela">
      <Numeros
        itens={[
          { rotulo: 'Minutos na semana', valor: semana, destaque: true },
          { rotulo: 'Sessões no total', valor: d.sessoes.length },
          { rotulo: 'Assuntos aprendidos', valor: d.trilhas.reduce((t, x) => t + x.topicos.filter((y) => y.aprendido).length, 0) },
          { rotulo: 'Revisões feitas', valor: d.trilhas.reduce((t, x) => t + x.topicos.reduce((a, y) => a + y.revisoes, 0), 0) },
        ]}
      />
      <Secao titulo="Minutos por dia">
        <div className="cartao-bloco">
          <GraficoColunas
            rotulos={dias.map((x) => x.slice(8))}
            valores={porDia}
            destaque={13}
            mostrarValores
            rotuloAria="Minutos de estudo nos últimos 14 dias"
            explicacao="Últimos 14 dias. A coluna laranja é hoje. Pouco todo dia vale mais que muito de vez em quando."
          />
        </div>
      </Secao>
    </div>
  )
}

const ABAS = [
  { para: '/estudos', rotulo: 'Hoje', icone: Brain, fim: true },
  { para: '/estudos/trilhas', rotulo: 'Trilhas', icone: BookOpenCheck },
  { para: '/estudos/progresso', rotulo: 'Progresso', icone: ChartNoAxesColumn },
]

export default function EstudosApp() {
  const [d, set, recomecar] = usePersistido<Dados>('tv-proto-estudos', exemplo)
  const valor = useMemo(() => ({ d, set }), [d, set])
  return (
    <ShellModulo titulo="Estudos" abas={ABAS}>
      <C.Provider value={valor}>
        <AvisoPrototipo aoRecomecar={recomecar} />
        <div style={{ height: 12 }} />
        <Routes>
          <Route index element={<Hoje />} />
          <Route path="trilhas" element={<Trilhas />} />
          <Route path="progresso" element={<Progresso />} />
          <Route path="*" element={<Hoje />} />
        </Routes>
      </C.Provider>
    </ShellModulo>
  )
}

