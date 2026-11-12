import { Hand, HandCoins, Hourglass, PiggyBank, Plus, Trash2, Wallet, X } from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Route, Routes } from 'react-router-dom'
import { BarrasHorizontais } from '../../components/compartilhado/Graficos'
import { Secao, ShellModulo } from '../../components/compartilhado/ShellModulo'
import { formatarDataCurta, hojeBrasiliaIso, somarDias } from '../../lib/tempo'
import '../dia/dia.css'
import { AvisoPrototipo } from '../prototipo/Aviso'
import { numero, real, uid, usePersistido } from '../prototipo/estado'
import '../prototipo/prototipo.css'

type Categoria = { id: string; nome: string; limite: number }
type Gasto = { id: string; dia: string; valor: number; cat: string; desc: string; impulso: boolean }
type Desejo = { id: string; nome: string; valor: number; criado: number; decisao?: 'comprei' | 'desisti' }
type Divida = { id: string; nome: string; original: number; saldo: number; parcela: number }
type Meta = { id: string; nome: string; alvo: number; guardado: number }
type Dados = { renda: number; freioHoras: number; categorias: Categoria[]; gastos: Gasto[]; desejos: Desejo[]; dividas: Divida[]; metas: Meta[] }

function exemplo(): Dados {
  const h = hojeBrasiliaIso()
  return {
    renda: 6000,
    freioHoras: 24,
    categorias: [
      { id: 'casa', nome: 'Casa e contas', limite: 1800 },
      { id: 'mercado', nome: 'Mercado', limite: 900 },
      { id: 'transporte', nome: 'Transporte', limite: 400 },
      { id: 'lazer', nome: 'Lazer e saídas', limite: 500 },
      { id: 'compras', nome: 'Compras pessoais', limite: 300 },
      { id: 'saude', nome: 'Saúde e academia', limite: 350 },
    ],
    gastos: [
      { id: uid(), dia: h.slice(0, 8) + '05', valor: 1650, cat: 'casa', desc: 'Aluguel e contas (exemplo)', impulso: false },
      { id: uid(), dia: somarDias(h, -3), valor: 310, cat: 'mercado', desc: 'Mercado da semana', impulso: false },
      { id: uid(), dia: somarDias(h, -1), valor: 189, cat: 'compras', desc: 'Tênis em promoção', impulso: true },
    ],
    desejos: [{ id: uid(), nome: 'Fone novo (exemplo)', valor: 450, criado: Date.now() - 1000 * 60 * 60 * 6 }],
    dividas: [
      { id: uid(), nome: 'Cartão (exemplo)', original: 3200, saldo: 2100, parcela: 400 },
      { id: uid(), nome: 'Empréstimo (exemplo)', original: 6000, saldo: 4800, parcela: 600 },
    ],
    metas: [
      { id: uid(), nome: 'Reserva de emergência', alvo: 12000, guardado: 1500 },
      { id: uid(), nome: 'Investimentos', alvo: 5000, guardado: 300 },
    ],
  }
}

type Ctx = { d: Dados; set: Dispatch<SetStateAction<Dados>> }
const C = createContext<Ctx | null>(null)
const useF = () => useContext(C)!

function NovoGasto({ aoFechar }: { aoFechar: () => void }) {
  const { d, set } = useF()
  const [valor, setValor] = useState('')
  const [cat, setCat] = useState(d.categorias[0]?.id ?? '')
  const [desc, setDesc] = useState('')
  const [impulso, setImpulso] = useState(false)
  const v = numero(valor)
  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha pt-folha-clara" role="dialog" aria-modal="true" aria-label="Lançar gasto" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <h2 className="dia-folha-titulo">Lançar gasto</h2>
        <input className="entrada pt-valor-grande" inputMode="decimal" autoFocus value={valor} placeholder="R$ 0" onChange={(e) => setValor(e.target.value.replace(/[^\d,.]/g, ''))} aria-label="Valor" />
        <div className="tr-chips">
          {d.categorias.map((c) => (
            <button key={c.id} className="dia-chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.nome}
            </button>
          ))}
        </div>
        <input className="entrada" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Com o quê? (opcional)" aria-label="Descrição" />
        <button className="dia-chip" aria-pressed={impulso} onClick={() => setImpulso((x) => !x)}>
          {impulso ? '⚡ Foi por impulso' : 'Foi por impulso?'}
        </button>
        <button
          className="btn btn-verde btn-grande"
          disabled={v <= 0}
          onClick={() => {
            set((x) => ({ ...x, gastos: [{ id: uid(), dia: hojeBrasiliaIso(), valor: v, cat, desc: desc.trim(), impulso }, ...x.gastos] }))
            aoFechar()
          }}
        >
          Lançar {v > 0 ? real(v) : ''}
        </button>
      </div>
    </div>
  )
}

function Mes() {
  const { d, set } = useF()
  const [novo, setNovo] = useState(false)
  const hoje = hojeBrasiliaIso()
  const mes = hoje.slice(0, 7)
  const doMes = d.gastos.filter((g) => g.dia.startsWith(mes))
  const totalLimites = d.categorias.reduce((t, c) => t + c.limite, 0)
  const gasto = doMes.reduce((t, g) => t + g.valor, 0)
  const ultimoDia = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5)), 0)).getUTCDate()
  const restamDias = ultimoDia - Number(hoje.slice(8)) + 1
  const livre = Math.max(0, totalLimites - gasto)
  const porDia = livre / Math.max(1, restamDias)
  const impulsos = doMes.filter((g) => g.impulso)
  const sobra = d.renda - totalLimites
  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Pode gastar hoje</span>
        <h2 className="dia-hero-data">
          <span>{real(Math.floor(porDia))}</span>
          por dia até o fim do mês
        </h2>
        <div className="pt-hero-mini">
          <div>
            <small>Gasto no mês</small>
            <b>{real(gasto)}</b>
          </div>
          <div>
            <small>Ainda livre</small>
            <b>{real(livre)}</b>
          </div>
          <div>
            <small>Por impulso</small>
            <b>{real(impulsos.reduce((t, g) => t + g.valor, 0))}</b>
          </div>
        </div>
        <button className="btn btn-verde btn-grande" onClick={() => setNovo(true)}>
          <Plus aria-hidden /> Lançar gasto
        </button>
      </section>

      <Secao titulo="Por categoria">
        <ul className="pt-cards">
          {d.categorias.map((c) => {
            const g = doMes.filter((x) => x.cat === c.id).reduce((t, x) => t + x.valor, 0)
            const p = c.limite ? g / c.limite : 0
            return (
              <li key={c.id} className="pt-card">
                <div className="pt-card-topo">
                  <b>{c.nome}</b>
                  <span className="pt-valor">
                    {real(g)} <small>de {real(c.limite)}</small>
                  </span>
                </div>
                <span className="pt-barra" data-estado={p > 1 ? 'estourou' : p > 0.8 ? 'alerta' : undefined}>
                  <i style={{ width: `${Math.min(100, p * 100)}%` }} />
                </span>
                {p > 1 && <small>Passou {real(g - c.limite)} do combinado. Tudo bem: ajuste nas outras categorias.</small>}
              </li>
            )
          })}
        </ul>
      </Secao>

      <Secao titulo="Plano da renda">
        <div className="pt-card">
          <label className="campo">
            <span className="pt-sub">Renda do mês</span>
            <input className="entrada" inputMode="decimal" value={String(d.renda)} onChange={(e) => set((x) => ({ ...x, renda: numero(e.target.value) }))} />
          </label>
          <small>
            Gastos combinados: {real(totalLimites)}. Sobra para dívidas e futuro: <b>{real(Math.max(0, sobra))}</b>
            {sobra < 0 && ' (os limites passam da renda: reveja)'}.
          </small>
        </div>
      </Secao>

      <Secao titulo="Últimos lançamentos">
        <div className="pt-card">
          {d.gastos.length === 0 ? (
            <small>Nada lançado ainda.</small>
          ) : (
            <ul className="pt-linhas">
              {d.gastos.slice(0, 12).map((g) => (
                <li key={g.id} className="pt-linha">
                  <span>
                    <b>
                      {g.desc || d.categorias.find((c) => c.id === g.cat)?.nome}
                      {g.impulso && ' ⚡'}
                    </b>
                    <small>
                      {formatarDataCurta(g.dia)} · {d.categorias.find((c) => c.id === g.cat)?.nome}
                    </small>
                  </span>
                  <span className="pt-valor" data-sinal="menos">
                    −{real(g.valor)}
                  </span>
                  <button className="btn-icone" aria-label="Apagar" onClick={() => set((x) => ({ ...x, gastos: x.gastos.filter((y) => y.id !== g.id) }))}>
                    <X aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Secao>
      {novo && <NovoGasto aoFechar={() => setNovo(false)} />}
    </div>
  )
}

function useAgora() {
  const [a, setA] = useState(Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setA(Date.now()), 30_000)
    return () => window.clearInterval(t)
  }, [])
  return a
}

function Freio() {
  const { d, set } = useF()
  const agora = useAgora()
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const espera = d.freioHoras * 3600_000
  const abertos = d.desejos.filter((x) => !x.decisao)
  const economizado = d.desejos.filter((x) => x.decisao === 'desisti').reduce((t, x) => t + x.valor, 0)
  const decidir = (id: string, decisao: 'comprei' | 'desisti') => set((x) => ({ ...x, desejos: x.desejos.map((y) => (y.id === id ? { ...y, decisao } : y)) }))
  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Freio de compra</span>
        <h2 className="dia-hero-data">
          <span>{real(economizado)}</span>
          que você não gastou por impulso
        </h2>
        <p className="pt-mini-texto">Deu vontade de comprar? Anota aqui e espera {d.freioHoras} horas. A vontade costuma passar; se não passar, era vontade de verdade.</p>
      </section>
      <div className="pt-card">
        <b>Quero comprar…</b>
        <div className="pt-form">
          <input className="entrada" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="O quê?" aria-label="O que quer comprar" />
          <input className="entrada" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d,.]/g, ''))} placeholder="R$" aria-label="Valor" style={{ flex: '0 1 110px' }} />
          <button
            className="btn btn-primario"
            disabled={!nome.trim() || numero(valor) <= 0}
            onClick={() => {
              set((x) => ({ ...x, desejos: [{ id: uid(), nome: nome.trim(), valor: numero(valor), criado: Date.now() }, ...x.desejos] }))
              setNome('')
              setValor('')
            }}
          >
            <Hourglass aria-hidden /> Esperar
          </button>
        </div>
        <div className="tr-chips">
          {[24, 48, 72].map((h) => (
            <button key={h} className="dia-chip" aria-pressed={d.freioHoras === h} onClick={() => set((x) => ({ ...x, freioHoras: h }))}>
              {h} horas
            </button>
          ))}
        </div>
      </div>
      <ul className="pt-cards">
        {abertos.map((x) => {
          const falta = Math.max(0, x.criado + espera - agora)
          const p = 1 - falta / espera
          return (
            <li key={x.id} className="pt-card">
              <div className="pt-card-topo">
                <b>{x.nome}</b>
                <span className="pt-valor">{real(x.valor)}</span>
              </div>
              <span className="pt-barra" data-estado={falta > 0 ? 'alerta' : undefined}>
                <i style={{ width: `${p * 100}%` }} />
              </span>
              {falta > 0 ? (
                <small>
                  Faltam {Math.floor(falta / 3600_000)}h{String(Math.floor((falta % 3600_000) / 60_000)).padStart(2, '0')} para decidir. Se quiser, desista agora.
                </small>
              ) : (
                <small>Passou o tempo. Ainda faz sentido?</small>
              )}
              <div className="dia-prio-botoes">
                <button className="btn btn-secundario" onClick={() => decidir(x.id, 'desisti')}>
                  <Hand aria-hidden /> Desisti
                </button>
                {falta === 0 && (
                  <button className="btn btn-primario" onClick={() => decidir(x.id, 'comprei')}>
                    Vou comprar
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {d.desejos.some((x) => x.decisao) && (
        <Secao titulo="Decididos">
          <div className="pt-card">
            <ul className="pt-linhas">
              {d.desejos
                .filter((x) => x.decisao)
                .map((x) => (
                  <li key={x.id} className="pt-linha">
                    <span>
                      <b>{x.nome}</b>
                      <small>{x.decisao === 'desisti' ? 'Desistiu: dinheiro que ficou' : 'Comprou depois de pensar'}</small>
                    </span>
                    <span className="pt-tag" data-cor={x.decisao === 'desisti' ? 'verde' : 'laranja'}>
                      {real(x.valor)}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </Secao>
      )}
    </div>
  )
}

function Dividas() {
  const { d, set } = useF()
  const [pagar, setPagar] = useState<Record<string, string>>({})
  const [nova, setNova] = useState({ nome: '', saldo: '', parcela: '' })
  const ordem = [...d.dividas].filter((x) => x.saldo > 0).sort((a, b) => a.saldo - b.saldo)
  const total = d.dividas.reduce((t, x) => t + x.saldo, 0)
  const original = d.dividas.reduce((t, x) => t + x.original, 0)
  const meses = Math.max(0, ...d.dividas.map((x) => (x.parcela ? Math.ceil(x.saldo / x.parcela) : 0)))
  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Dívidas</span>
        <h2 className="dia-hero-data">
          <span>{real(total)}</span>
          {total ? `faltam · livre em ~${meses} ${meses === 1 ? 'mês' : 'meses'}` : 'Livre de dívidas!'}
        </h2>
        <span className="pt-barra" aria-label="Quanto já foi pago">
          <i style={{ width: `${original ? ((original - total) / original) * 100 : 0}%` }} />
        </span>
        <p className="pt-mini-texto">Método bola de neve: pague o mínimo em todas e jogue qualquer dinheiro extra na menor. Cada dívida quitada dá ânimo e libera a parcela para a próxima.</p>
      </section>
      <ul className="pt-cards">
        {ordem.map((x, i) => (
          <li key={x.id} className="pt-card">
            <div className="pt-card-topo">
              <b>{x.nome}</b>
              {i === 0 && <span className="pt-tag" data-cor="laranja">Foco agora</span>}
            </div>
            <span className="pt-barra">
              <i style={{ width: `${((x.original - x.saldo) / x.original) * 100}%` }} />
            </span>
            <small>
              Falta {real(x.saldo)} de {real(x.original)} · parcela {real(x.parcela)} · ~{x.parcela ? Math.ceil(x.saldo / x.parcela) : '—'} meses
            </small>
            <div className="pt-form">
              <input className="entrada" inputMode="decimal" placeholder={`Pagamento (ex.: ${real(x.parcela)})`} value={pagar[x.id] ?? ''} onChange={(e) => setPagar((p) => ({ ...p, [x.id]: e.target.value.replace(/[^\d,.]/g, '') }))} aria-label="Valor pago" />
              <button
                className="btn btn-secundario"
                onClick={() => {
                  const v = numero(pagar[x.id] ?? '') || x.parcela
                  set((s) => ({ ...s, dividas: s.dividas.map((y) => (y.id === x.id ? { ...y, saldo: Math.max(0, y.saldo - v) } : y)) }))
                  setPagar((p) => ({ ...p, [x.id]: '' }))
                }}
              >
                <HandCoins aria-hidden /> Paguei
              </button>
            </div>
          </li>
        ))}
        {d.dividas
          .filter((x) => x.saldo === 0)
          .map((x) => (
            <li key={x.id} className="pt-card">
              <div className="pt-card-topo">
                <b>{x.nome}</b>
                <span className="pt-tag" data-cor="verde">Quitada 🎉</span>
              </div>
              <button className="btn btn-fantasma" onClick={() => set((s) => ({ ...s, dividas: s.dividas.filter((y) => y.id !== x.id) }))}>
                <Trash2 aria-hidden /> Tirar da lista
              </button>
            </li>
          ))}
      </ul>
      <div className="pt-card">
        <b>Nova dívida</b>
        <div className="pt-form">
          <input className="entrada" value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} placeholder="Nome" aria-label="Nome da dívida" />
          <input className="entrada" inputMode="decimal" value={nova.saldo} onChange={(e) => setNova({ ...nova, saldo: e.target.value })} placeholder="Quanto falta" aria-label="Saldo" />
          <input className="entrada" inputMode="decimal" value={nova.parcela} onChange={(e) => setNova({ ...nova, parcela: e.target.value })} placeholder="Parcela" aria-label="Parcela" />
          <button
            className="btn btn-primario"
            disabled={!nova.nome.trim() || numero(nova.saldo) <= 0}
            onClick={() => {
              const s = numero(nova.saldo)
              set((x) => ({ ...x, dividas: [...x.dividas, { id: uid(), nome: nova.nome.trim(), original: s, saldo: s, parcela: numero(nova.parcela) }] }))
              setNova({ nome: '', saldo: '', parcela: '' })
            }}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}

function Metas() {
  const { d, set } = useF()
  const [valor, setValor] = useState<Record<string, string>>({})
  const [nova, setNova] = useState({ nome: '', alvo: '' })
  const guardado = d.metas.reduce((t, m) => t + m.guardado, 0)
  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Futuro</span>
        <h2 className="dia-hero-data">
          <span>{real(guardado)}</span>
          guardados para o que importa
        </h2>
        <p className="pt-mini-texto">Pague-se primeiro: assim que a renda entrar, separe a parte do futuro antes de gastar.</p>
      </section>
      <ul className="pt-cards pt-cards-2">
        {d.metas.map((m) => (
          <li key={m.id} className="pt-card">
            <div className="pt-card-topo">
              <b>{m.nome}</b>
              <span className="pt-tag" data-cor={m.guardado >= m.alvo ? 'verde' : undefined}>
                {Math.round((m.guardado / m.alvo) * 100)}%
              </span>
            </div>
            <span className="pt-barra">
              <i style={{ width: `${Math.min(100, (m.guardado / m.alvo) * 100)}%` }} />
            </span>
            <small>
              {real(m.guardado)} de {real(m.alvo)}
            </small>
            <div className="pt-form">
              <input className="entrada" inputMode="decimal" placeholder="Valor" value={valor[m.id] ?? ''} onChange={(e) => setValor((v) => ({ ...v, [m.id]: e.target.value.replace(/[^\d,.]/g, '') }))} aria-label="Valor para guardar" />
              <button
                className="btn btn-secundario"
                disabled={numero(valor[m.id] ?? '') <= 0}
                onClick={() => {
                  set((x) => ({ ...x, metas: x.metas.map((y) => (y.id === m.id ? { ...y, guardado: y.guardado + numero(valor[m.id] ?? '') } : y)) }))
                  setValor((v) => ({ ...v, [m.id]: '' }))
                }}
              >
                <PiggyBank aria-hidden /> Guardar
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="pt-card">
        <b>Nova meta</b>
        <div className="pt-form">
          <input className="entrada" value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} placeholder="Ex.: viagem, equipamento" aria-label="Nome da meta" />
          <input className="entrada" inputMode="decimal" value={nova.alvo} onChange={(e) => setNova({ ...nova, alvo: e.target.value })} placeholder="Quanto" aria-label="Valor da meta" />
          <button
            className="btn btn-primario"
            disabled={!nova.nome.trim() || numero(nova.alvo) <= 0}
            onClick={() => {
              set((x) => ({ ...x, metas: [...x.metas, { id: uid(), nome: nova.nome.trim(), alvo: numero(nova.alvo), guardado: 0 }] }))
              setNova({ nome: '', alvo: '' })
            }}
          >
            Criar
          </button>
        </div>
      </div>
      <Secao titulo="Para onde foi o dinheiro neste mês">
        <div className="pt-card">
          <BarrasHorizontais
            itens={d.categorias.map((c) => ({
              rotulo: c.nome,
              valor: Math.round(d.gastos.filter((g) => g.cat === c.id && g.dia.startsWith(hojeBrasiliaIso().slice(0, 7))).reduce((t, g) => t + g.valor, 0)),
            }))}
          />
        </div>
      </Secao>
    </div>
  )
}

const ABAS = [
  { para: '/financas', rotulo: 'Mês', icone: Wallet, fim: true },
  { para: '/financas/freio', rotulo: 'Freio', icone: Hourglass },
  { para: '/financas/dividas', rotulo: 'Dívidas', icone: HandCoins },
  { para: '/financas/metas', rotulo: 'Futuro', icone: PiggyBank },
]

export default function FinancasApp() {
  const [d, set, recomecar] = usePersistido<Dados>('tv-proto-financas', exemplo)
  const valor = useMemo(() => ({ d, set }), [d, set])
  return (
    <ShellModulo titulo="Finanças" abas={ABAS}>
      <C.Provider value={valor}>
        <AvisoPrototipo aoRecomecar={recomecar} />
        <div style={{ height: 12 }} />
        <Routes>
          <Route index element={<Mes />} />
          <Route path="freio" element={<Freio />} />
          <Route path="dividas" element={<Dividas />} />
          <Route path="metas" element={<Metas />} />
          <Route path="*" element={<Mes />} />
        </Routes>
      </C.Provider>
    </ShellModulo>
  )
}
