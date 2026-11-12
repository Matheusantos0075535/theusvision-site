import { BookOpenCheck, Brain, CalendarDays, Check, Flag, Pause, Play, Plus, Trees, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Confete } from '../../components/compartilhado/Confete'
import { Secao, ShellModulo } from '../../components/compartilhado/ShellModulo'
import { formatarDataCurta, hojeBrasiliaIso, somarDias } from '../../lib/tempo'
import { useMovimentoReduzido } from '../../lib/useMidia'
import '../dia/dia.css'
import { AvisoPrototipo } from '../prototipo/Aviso'
import { uid, usePersistido } from '../prototipo/estado'
import '../prototipo/prototipo.css'
import { Arvore, especieDaTrilha, estagioPorMinutos } from './Arvore'
import { CalendarioEstudo } from './CalendarioEstudo'
import { CORES, EstCtx, INTERVALOS, exemplo, fmtMin, minutosDoDia, sequencia, useE, type Dados, type Topico } from './dados'
import { Floresta } from './Floresta'
import { tocar } from '../../lib/som'

function Hoje() {
  const { d, set } = useE()
  const reduzido = useMovimentoReduzido()
  const hoje = hojeBrasiliaIso()
  const [agora, setAgora] = useState(Date.now())
  const [trilha, setTrilha] = useState(d.trilhas[0]?.id ?? '')
  const [duracao, setDuracao] = useState(d.meta)
  const [festa, setFesta] = useState<{ min: number; trilha: string; murcha?: boolean } | null>(null)
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const total = d.timer?.total ?? duracao * 60_000
  const resta = d.timer ? Math.max(0, d.timer.pausado ?? d.timer.fim - agora) : total
  const progresso = (total - resta) / total
  const minHoje = minutosDoDia(d.sessoes, hoje)
  const devidas = d.trilhas.flatMap((tr) => tr.topicos.filter((tp) => tp.proxima && tp.proxima <= hoje).map((tp) => ({ tr, tp })))
  const seq = sequencia(d.sessoes, hoje)
  const idxTrilha = Math.max(0, d.trilhas.findIndex((t) => t.id === (d.timer?.trilha ?? trilha)))
  const tr = d.trilhas[idxTrilha]

  useEffect(() => {
    if (d.timer && !d.timer.pausado && resta === 0) {
      const min = Math.round(d.timer.total / 60_000)
      const trilhaId = d.timer.trilha
      set((x) => ({ ...x, timer: null, sessoes: [...x.sessoes, { id: uid(), dia: hoje, min, trilha: trilhaId }] }))
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        /* sem vibração */
      }
      setFesta({ min, trilha: trilhaId })
      tocar('plantar')
    }
  }, [resta, d.timer, hoje, set, reduzido])

  const revisar = (trId: string, tpId: string, resultado: 0 | 1 | 2) =>
    set((x) => ({
      ...x,
      trilhas: x.trilhas.map((t) =>
        t.id !== trId
          ? t
          : {
              ...t,
              topicos: t.topicos.map((tp) => {
                if (tp.id !== tpId) return tp
                const nivel = resultado === 0 ? 0 : resultado === 1 ? tp.nivel : Math.min(INTERVALOS.length - 1, tp.nivel + 1)
                return { ...tp, nivel, revisoes: tp.revisoes + 1, proxima: somarDias(hoje, INTERVALOS[nivel]) }
              }),
            },
      ),
    }))

  const mm = Math.floor(resta / 60000)
  const ss = Math.floor((resta % 60000) / 1000)
  const festaTrilha = festa ? d.trilhas.findIndex((t) => t.id === festa.trilha) : -1

  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero es-hero">
        <span className="dia-hero-tipo">Foco de estudo</span>
        <p className="dia-hero-saudacao">{d.timer ? `Crescendo: ${tr?.nome ?? ''}` : 'Planta uma árvore a cada foco concluído.'}</p>
        <div className="es-canteiro" aria-live="off">
          <Arvore estagio={d.timer ? 0.12 + 0.88 * progresso : 0.12} cor={tr?.cor ?? '#3ddc97'} especie={especieDaTrilha(idxTrilha)} tamanho={150} />
        </div>
        <span className="pt-relogio es-relogio">
          {mm}:{String(ss).padStart(2, '0')}
        </span>
        <small className="es-hoje-min">{minHoje ? `${fmtMin(minHoje)} estudados hoje · meta ${fmtMin(d.metaDia)}` : `Nada estudado hoje · meta ${fmtMin(d.metaDia)}`}</small>
        {!d.timer && (
          <>
            <div className="tr-chips" style={{ justifyContent: 'center' }}>
              {[15, 25, 30, 45].map((m) => (
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
              <Play aria-hidden /> Plantar ({duracao} min)
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
                  const trilhaId = d.timer!.trilha
                  set((x) => ({ ...x, timer: null, sessoes: [...x.sessoes, { id: uid(), dia: hoje, min: feitos, trilha: trilhaId }] }))
                  setFesta({ min: feitos, trilha: trilhaId })
                  tocar('plantar')
                }}
              >
                <Flag aria-hidden /> Terminar agora
              </button>
              <button
                className="btn btn-fantasma"
                onClick={() => {
                  if (!window.confirm('Desistir agora? A árvore vai murchar e esse tempo não conta.')) return
                  const trilhaId = d.timer!.trilha
                  set((x) => ({ ...x, timer: null, sessoes: [...x.sessoes, { id: uid(), dia: hoje, min: 0, trilha: trilhaId, ok: false }] }))
                  setFesta({ min: 0, trilha: trilhaId, murcha: true })
                  tocar('erro')
                }}
              >
                <X aria-hidden /> Desistir
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
            {devidas.map(({ tr: t, tp }) => (
              <li key={tp.id} className="pt-card">
                <div className="pt-card-topo">
                  <b>{tp.nome}</b>
                  <span className="pt-tag">{t.nome}</span>
                </div>
                <small>Tente explicar em voz alta, em 1 minuto, sem olhar. Como foi?</small>
                <div className="pt-revisao-botoes">
                  <button className="btn btn-secundario" onClick={() => revisar(t.id, tp.id, 0)}>
                    Esqueci
                  </button>
                  <button className="btn btn-secundario" onClick={() => revisar(t.id, tp.id, 1)}>
                    Mais ou menos
                  </button>
                  <button className="btn btn-verde" onClick={() => revisar(t.id, tp.id, 2)}>
                    Lembrei bem
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {festa && (
        <div className="folha-fundo" onClick={() => setFesta(null)}>
          <div className="folha es-festa" role="dialog" aria-modal="true" aria-label="Resultado do foco" onClick={(e) => e.stopPropagation()}>
            <div className="folha-alca" aria-hidden />
            <Arvore estagio={festa.murcha ? 0.5 : estagioPorMinutos(festa.min)} cor={d.trilhas[festaTrilha]?.cor ?? '#3ddc97'} especie={especieDaTrilha(Math.max(0, festaTrilha))} murcha={festa.murcha} tamanho={170} />
            <h2>{festa.murcha ? 'A árvore murchou' : 'Sua árvore cresceu!'}</h2>
            <p>{festa.murcha ? 'Acontece. Respire e plante outra quando puder.' : `${fmtMin(festa.min)} de foco em ${d.trilhas[festaTrilha]?.nome ?? 'estudo'}. Mais uma na sua floresta.`}</p>
            <button className="btn btn-verde btn-grande" onClick={() => setFesta(null)}>
              Fechar
            </button>
          </div>
          {!festa.murcha && !reduzido && <Confete />}
        </div>
      )}
    </div>
  )
}

export function Trilhas() {
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


const ABAS = [
  { para: '/estudos', rotulo: 'Foco', icone: Brain, fim: true },
  { para: '/estudos/floresta', rotulo: 'Floresta', icone: Trees },
  { para: '/estudos/calendario', rotulo: 'Calendário', icone: CalendarDays },
  { para: '/estudos/trilhas', rotulo: 'Trilhas', icone: BookOpenCheck },
]

export default function EstudosApp() {
  const [d, set, recomecar] = usePersistido<Dados>('tv-proto-estudos', exemplo)
  const valor = useMemo(() => ({ d: { ...d, metaDia: d.metaDia ?? 60 }, set }), [d, set])
  return (
    <ShellModulo titulo="Estudos" abas={ABAS}>
      <EstCtx.Provider value={valor}>
        <AvisoPrototipo aoRecomecar={recomecar} />
        <div style={{ height: 12 }} />
        <Routes>
          <Route index element={<Hoje />} />
          <Route path="floresta" element={<Floresta />} />
          <Route path="calendario" element={<CalendarioEstudo />} />
          <Route path="trilhas" element={<Trilhas />} />
          <Route path="*" element={<Hoje />} />
        </Routes>
      </EstCtx.Provider>
    </ShellModulo>
  )
}
