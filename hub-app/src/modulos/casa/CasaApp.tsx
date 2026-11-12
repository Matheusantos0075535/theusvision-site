import { Check, House, LayoutGrid, Pause, Play, Plus, RotateCcw, ShoppingCart, Timer, Trash2, X } from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Confete } from '../../components/compartilhado/Confete'
import { Secao, ShellModulo } from '../../components/compartilhado/ShellModulo'
import { diaDaSemana, diferencaDias, formatarDataCurta, hojeBrasiliaIso, somarDias } from '../../lib/tempo'
import { useMovimentoReduzido } from '../../lib/useMidia'
import '../dia/dia.css'
import { AvisoPrototipo } from '../prototipo/Aviso'
import { uid, usePersistido } from '../prototipo/estado'
import '../prototipo/prototipo.css'

type Zona = { id: string; nome: string; comodo: string; estado: 0 | 1 | 2 | 3; ultima?: string; regra?: string }
type Freq = 'diaria' | 'semanal' | 'mensal'
type Tarefa = { id: string; nome: string; freq: Freq; dia?: number; feitas: string[] }
type Item = { id: string; nome: string; comprado: boolean }
type Dados = { zonas: Zona[]; tarefas: Tarefa[]; compras: Item[]; missoes: string[]; timer: { fim: number; pausado?: number } | null }

const ESTADOS = ['Caótica', 'Bagunçada', 'Quase lá', 'Organizada']
const CORES = ['#ff6b5b', '#ffb547', '#7fb0f5', '#3ddc97']
const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const MISSAO = 15 * 60_000

function exemplo(): Dados {
  const z = (nome: string, comodo: string, estado: Zona['estado']): Zona => ({ id: uid(), nome, comodo, estado })
  const t = (nome: string, freq: Freq, dia?: number): Tarefa => ({ id: uid(), nome, freq, dia, feitas: [] })
  return {
    zonas: [
      z('Mesa de trabalho', 'Escritório', 1),
      z('Gavetas da mesa', 'Escritório', 0),
      z('Pia e bancada', 'Cozinha', 2),
      z('Armário de mantimentos', 'Cozinha', 1),
      z('Guarda-roupa', 'Quarto', 1),
      z('Criado-mudo', 'Quarto', 2),
      z('Sala de estar', 'Sala', 2),
      z('Banheiro', 'Banheiro', 2),
      z('Área de serviço', 'Lavanderia', 0),
    ],
    tarefas: [
      t('Arrumar a cama', 'diaria'),
      t('Louça do dia', 'diaria'),
      t('Recolher roupas e objetos soltos', 'diaria'),
      t('Lavar roupa', 'semanal', 6),
      t('Limpar banheiro', 'semanal', 6),
      t('Trocar roupa de cama', 'semanal', 0),
      t('Tirar o lixo reciclável', 'semanal', 3),
      t('Limpar geladeira', 'mensal'),
    ],
    compras: [
      { id: uid(), nome: 'Detergente', comprado: false },
      { id: uid(), nome: 'Saco de lixo', comprado: false },
    ],
    missoes: [],
    timer: null,
  }
}

type Ctx = { d: Dados; set: Dispatch<SetStateAction<Dados>> }
const C = createContext<Ctx | null>(null)
const useC = () => useContext(C)!

/** Tarefa vale para hoje? Diária sempre; semanal no dia marcado (ou se passou 7 dias); mensal se passou 30 dias. */
function devidaHoje(t: Tarefa, hoje: string) {
  const ultima = t.feitas[t.feitas.length - 1]
  if (t.freq === 'diaria') return true
  if (t.freq === 'semanal') return t.dia === diaDaSemana(hoje) || !ultima || diferencaDias(hoje, ultima) >= 7
  return !ultima || diferencaDias(hoje, ultima) >= 30
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

  // Zona da vez: a pior, e entre as piores a que está há mais tempo sem atenção.
  const zona = useMemo(
    () => [...d.zonas].sort((a, b) => a.estado - b.estado || (a.ultima ?? '').localeCompare(b.ultima ?? ''))[0],
    [d.zonas],
  )
  const [escolhida, setEscolhida] = useState<string | null>(null)
  const alvo = d.zonas.find((z) => z.id === escolhida) ?? zona

  const resta = d.timer ? Math.max(0, (d.timer.pausado ?? d.timer.fim - agora)) : MISSAO
  const rodando = !!d.timer && !d.timer.pausado && resta > 0
  useEffect(() => {
    if (d.timer && !d.timer.pausado && resta === 0 && !terminou) {
      setTerminou(true)
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        /* sem vibração */
      }
    }
  }, [resta, d.timer, terminou])

  const concluir = (estado: Zona['estado']) => {
    set((x) => ({
      ...x,
      timer: null,
      missoes: x.missoes.includes(hoje) ? x.missoes : [...x.missoes, hoje],
      zonas: x.zonas.map((z) => (z.id === alvo?.id ? { ...z, estado, ultima: hoje } : z)),
    }))
    setTerminou(false)
    if (!reduzido) {
      setFesta(true)
      window.setTimeout(() => setFesta(false), 2600)
    }
  }

  const tarefas = d.tarefas.filter((t) => devidaHoje(t, hoje))
  const alternar = (t: Tarefa) =>
    set((x) => ({
      ...x,
      tarefas: x.tarefas.map((y) => (y.id !== t.id ? y : { ...y, feitas: y.feitas.includes(hoje) ? y.feitas.filter((f) => f !== hoje) : [...y.feitas, hoje] })),
    }))
  const seq = sequencia(d.missoes, hoje)
  const organizadas = d.zonas.filter((z) => z.estado === 3).length
  const mm = Math.floor(resta / 60000)
  const ss = Math.floor((resta % 60000) / 1000)

  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Missão de 15 minutos</span>
        <p className="dia-hero-saudacao">Zona da vez</p>
        <h2 className="dia-hero-data">
          <span>{alvo?.nome ?? 'Cadastre uma zona'}</span>
          {alvo && `${alvo.comodo} · ${ESTADOS[alvo.estado].toLowerCase()}`}
        </h2>
        <div className="pt-anel" style={{ ['--p' as string]: ((MISSAO - resta) / MISSAO) * 100 }}>
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
            <b>Como ficou {alvo?.nome.toLowerCase()}?</b>
            <div className="pt-estados">
              {ESTADOS.map((e, i) => (
                <button key={e} className="pt-estado" data-n={i} aria-pressed={false} onClick={() => concluir(i as Zona['estado'])}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}
        {!d.timer && (
          <div className="tr-chips" style={{ marginTop: 12 }}>
            {d.zonas.slice(0, 6).map((z) => (
              <button key={z.id} className="dia-chip" aria-pressed={alvo?.id === z.id} onClick={() => setEscolhida(z.id)}>
                {z.nome}
              </button>
            ))}
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
            <small>Zonas em ordem</small>
            <b>
              {organizadas}/{d.zonas.length}
            </b>
          </div>
          <div>
            <small>Missões</small>
            <b>{d.missoes.length}</b>
          </div>
        </div>
      </section>

      <Secao titulo={`Rotina de hoje · ${SEMANA[diaDaSemana(hoje)]}`}>
        <div className="pt-card">
          <ul className="pt-linhas">
            {tarefas.map((t) => {
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
                    <small>{t.freq === 'diaria' ? 'Todo dia' : t.freq === 'semanal' ? `${[0, 6].includes(t.dia ?? 0) ? 'Todo' : 'Toda'} ${SEMANA[t.dia ?? 0]}` : 'Uma vez por mês'}</small>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </Secao>
      {festa && <Confete />}
    </div>
  )
}

function Zonas() {
  const { d, set } = useC()
  const [aberta, setAberta] = useState<string | null>(null)
  const [nova, setNova] = useState({ nome: '', comodo: '' })
  const comodos = [...new Set(d.zonas.map((z) => z.comodo))]
  const z = d.zonas.find((x) => x.id === aberta)
  const mudar = (id: string, c: Partial<Zona>) => set((x) => ({ ...x, zonas: x.zonas.map((y) => (y.id === id ? { ...y, ...c } : y)) }))
  return (
    <div className="pt-tela">
      <p className="dia-apoio">
        Divida a casa em micro-zonas (uma gaveta, a mesa, a pia). Uma por dia, 15 minutos. Zona organizada ganha uma regra de 2 minutos para não voltar a bagunçar.
      </p>
      {comodos.map((c) => (
        <Secao key={c} titulo={c}>
          <ul className="pt-mapa">
            {d.zonas
              .filter((x) => x.comodo === c)
              .map((x) => (
                <li key={x.id}>
                  <button className="pt-zona" style={{ ['--cor' as string]: CORES[x.estado] }} onClick={() => setAberta(x.id)}>
                    <b>{x.nome}</b>
                    <span className="pt-tag" data-cor={x.estado === 3 ? 'verde' : x.estado === 0 ? 'vermelho' : x.estado === 1 ? 'laranja' : undefined}>
                      {ESTADOS[x.estado]}
                    </span>
                    <small>{x.ultima ? `Cuidada em ${formatarDataCurta(x.ultima)}` : 'Ainda sem missão'}</small>
                  </button>
                </li>
              ))}
          </ul>
        </Secao>
      ))}
      <div className="pt-card">
        <b>Nova zona</b>
        <div className="pt-form">
          <input className="entrada" value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} placeholder="Ex.: Gaveta de cabos" aria-label="Nome da zona" />
          <input className="entrada" list="comodos" value={nova.comodo} onChange={(e) => setNova({ ...nova, comodo: e.target.value })} placeholder="Cômodo" aria-label="Cômodo" />
          <datalist id="comodos">
            {comodos.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <button
            className="btn btn-primario"
            disabled={!nova.nome.trim() || !nova.comodo.trim()}
            onClick={() => {
              set((x) => ({ ...x, zonas: [...x.zonas, { id: uid(), nome: nova.nome.trim(), comodo: nova.comodo.trim(), estado: 1 }] }))
              setNova({ nome: '', comodo: '' })
            }}
          >
            <Plus aria-hidden /> Criar
          </button>
        </div>
      </div>
      {z && (
        <div className="folha-fundo" onClick={() => setAberta(null)}>
          <div className="folha pt-folha-clara" role="dialog" aria-modal="true" aria-label={z.nome} onClick={(e) => e.stopPropagation()}>
            <div className="folha-alca" aria-hidden />
            <div className="tr-folha-topo">
              <h2>{z.nome}</h2>
              <button className="btn-icone" onClick={() => setAberta(null)} aria-label="Fechar">
                <X aria-hidden />
              </button>
            </div>
            <span className="pt-mini-texto">Como está agora?</span>
            <div className="pt-estados">
              {ESTADOS.map((e, i) => (
                <button key={e} className="pt-estado" data-n={i} aria-pressed={z.estado === i} onClick={() => mudar(z.id, { estado: i as Zona['estado'] })}>
                  {e}
                </button>
              ))}
            </div>
            <label className="campo">
              <span>Regra de 2 minutos para manter</span>
              <input className="entrada" value={z.regra ?? ''} onChange={(e) => mudar(z.id, { regra: e.target.value })} placeholder="Ex.: mesa limpa no fim do expediente" />
            </label>
            <button
              className="btn btn-fantasma"
              onClick={() => {
                set((x) => ({ ...x, zonas: x.zonas.filter((y) => y.id !== z.id) }))
                setAberta(null)
              }}
            >
              <Trash2 aria-hidden /> Apagar zona
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Rotina() {
  const { d, set } = useC()
  const [nova, setNova] = useState<{ nome: string; freq: Freq; dia: number }>({ nome: '', freq: 'semanal', dia: 6 })
  const grupos: [Freq, string][] = [
    ['diaria', 'Todo dia'],
    ['semanal', 'Toda semana'],
    ['mensal', 'Todo mês'],
  ]
  return (
    <div className="pt-tela">
      {grupos.map(([f, rot]) => (
        <Secao key={f} titulo={rot}>
          <div className="pt-card">
            <ul className="pt-linhas">
              {d.tarefas
                .filter((t) => t.freq === f)
                .map((t) => (
                  <li key={t.id} className="pt-linha">
                    <span>
                      <b>{t.nome}</b>
                      <small>
                        {f === 'semanal' && `${SEMANA[t.dia ?? 0]} · `}
                        {t.feitas.length ? `última vez ${formatarDataCurta(t.feitas[t.feitas.length - 1])}` : 'ainda não feita'}
                      </small>
                    </span>
                    <button className="btn-icone" aria-label={`Apagar ${t.nome}`} onClick={() => set((x) => ({ ...x, tarefas: x.tarefas.filter((y) => y.id !== t.id) }))}>
                      <X aria-hidden />
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </Secao>
      ))}
      <div className="pt-card">
        <b>Nova tarefa da casa</b>
        <input className="entrada" value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} placeholder="Ex.: regar as plantas" aria-label="Nome da tarefa" />
        <div className="tr-chips">
          {grupos.map(([f, rot]) => (
            <button key={f} className="dia-chip" aria-pressed={nova.freq === f} onClick={() => setNova({ ...nova, freq: f })}>
              {rot}
            </button>
          ))}
        </div>
        {nova.freq === 'semanal' && (
          <select className="entrada" value={nova.dia} onChange={(e) => setNova({ ...nova, dia: Number(e.target.value) })} aria-label="Dia da semana">
            {SEMANA.map((s, i) => (
              <option key={s} value={i}>
                {s}
              </option>
            ))}
          </select>
        )}
        <button
          className="btn btn-primario"
          disabled={!nova.nome.trim()}
          onClick={() => {
            set((x) => ({ ...x, tarefas: [...x.tarefas, { id: uid(), nome: nova.nome.trim(), freq: nova.freq, dia: nova.freq === 'semanal' ? nova.dia : undefined, feitas: [] }] }))
            setNova({ ...nova, nome: '' })
          }}
        >
          <Plus aria-hidden /> Adicionar
        </button>
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
  { para: '/casa/zonas', rotulo: 'Zonas', icone: LayoutGrid },
  { para: '/casa/rotina', rotulo: 'Rotina', icone: House },
  { para: '/casa/compras', rotulo: 'Compras', icone: ShoppingCart },
]

export default function CasaApp() {
  const [d, set, recomecar] = usePersistido<Dados>('tv-proto-casa', exemplo)
  const valor = useMemo(() => ({ d, set }), [d, set])
  return (
    <ShellModulo titulo="Rotina da casa" abas={ABAS}>
      <C.Provider value={valor}>
        <AvisoPrototipo aoRecomecar={recomecar} />
        <div style={{ height: 12 }} />
        <Routes>
          <Route index element={<Hoje />} />
          <Route path="zonas" element={<Zonas />} />
          <Route path="rotina" element={<Rotina />} />
          <Route path="compras" element={<Compras />} />
          <Route path="*" element={<Hoje />} />
        </Routes>
      </C.Provider>
    </ShellModulo>
  )
}
