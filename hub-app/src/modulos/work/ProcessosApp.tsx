import { Check, ChevronLeft, Hammer, Layers, Play, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { Confete } from '../../components/compartilhado/Confete'
import { Secao, ShellModulo } from '../../components/compartilhado/ShellModulo'
import { formatarDataCurta, hojeBrasiliaIso } from '../../lib/tempo'
import '../dia/dia.css'
import { AvisoPrototipo } from '../prototipo/Aviso'
import { uid } from '../prototipo/estado'
import '../prototipo/prototipo.css'
import { semanaDe, useWork } from './dados'
import { PROCESSO, PROCESSOS } from './processos'

type Ctx = ReturnType<typeof useWork>

function Caixa({ ctx }: { ctx: Ctx }) {
  const { w, setW } = ctx
  const navegar = useNavigate()
  const [novo, setNovo] = useState<{ processo: string; clienteId: string; titulo: string } | null>(null)
  const andamento = w.execucoes.filter((e) => !e.fim)
  const iniciar = () => {
    if (!novo) return
    const p = PROCESSO[novo.processo]
    const id = uid()
    setW((x) => ({ ...x, execucoes: [{ id, processo: p.id, clienteId: novo.clienteId || undefined, titulo: novo.titulo.trim() || p.nome, feitos: [], criado: hojeBrasiliaIso() }, ...x.execucoes] }))
    setNovo(null)
    navegar(`/construcao/execucao/${id}`)
  }
  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Caixa de ferramentas</span>
        <p className="dia-hero-saudacao">Os processos da TheusVision, passo a passo, sem depender de lembrar a ordem.</p>
        <div className="pt-hero-mini">
          <div>
            <small>Processos</small>
            <b>{PROCESSOS.length}</b>
          </div>
          <div>
            <small>Em andamento</small>
            <b>{andamento.length}</b>
          </div>
          <div>
            <small>Concluídos</small>
            <b>{w.execucoes.filter((e) => e.fim).length}</b>
          </div>
        </div>
      </section>

      {andamento.length > 0 && (
        <Secao titulo="Em andamento">
          <ul className="pt-cards">
            {andamento.map((e) => {
              const p = PROCESSO[e.processo]
              const c = w.clientes.find((x) => x.id === e.clienteId)
              return (
                <li key={e.id}>
                  <button className="pt-card wk-cliente" onClick={() => navegar(`/construcao/execucao/${e.id}`)}>
                    <div className="pt-card-topo">
                      <b>{e.titulo}</b>
                      <span className="pt-tag">
                        {e.feitos.length}/{p.passos.length}
                      </span>
                    </div>
                    <span className="pt-barra">
                      <i style={{ width: `${(e.feitos.length / p.passos.length) * 100}%` }} />
                    </span>
                    <small>
                      Nº {p.numero} {c ? `· ${c.nome}` : ''} · próximo: {p.passos[e.feitos.length >= p.passos.length ? p.passos.length - 1 : [...p.passos.keys()].find((i) => !e.feitos.includes(i)) ?? 0].t}
                    </small>
                  </button>
                </li>
              )
            })}
          </ul>
        </Secao>
      )}

      <Secao titulo="Todos os processos">
        <ul className="pt-cards pt-cards-2">
          {PROCESSOS.map((p) => (
            <li key={p.id} className="pt-card">
              <div className="pt-card-topo">
                <b>{p.nome}</b>
                <span className="pt-tag">Nº {p.numero}</span>
              </div>
              <small>{p.resumo}</small>
              <small>
                {p.passos.length} passos · termina em <b>{p.final.toLowerCase()}</b>
              </small>
              <div className="dia-prio-botoes">
                <button className="btn btn-secundario" onClick={() => navegar(`/construcao/processo/${p.id}`)}>
                  Ver passos
                </button>
                <button className="btn btn-primario" onClick={() => setNovo({ processo: p.id, clienteId: '', titulo: '' })}>
                  <Play aria-hidden /> Executar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Secao>

      {novo && (
        <div className="folha-fundo" onClick={() => setNovo(null)}>
          <div className="folha pt-folha-clara" role="dialog" aria-modal="true" aria-label="Executar processo" onClick={(e) => e.stopPropagation()}>
            <div className="folha-alca" aria-hidden />
            <div className="tr-folha-topo">
              <h2>{PROCESSO[novo.processo].nome}</h2>
              <button className="btn-icone" onClick={() => setNovo(null)} aria-label="Fechar">
                <X aria-hidden />
              </button>
            </div>
            <label className="campo">
              <span>Para qual cliente?</span>
              <select className="entrada" value={novo.clienteId} onChange={(e) => setNovo({ ...novo, clienteId: e.target.value })}>
                <option value="">Sem cliente</option>
                {w.clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span>Nome desta execução (opcional)</span>
              <input className="entrada" value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} placeholder="Ex.: Vídeo de novembro" />
            </label>
            <button className="btn btn-verde btn-grande" onClick={iniciar}>
              Começar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Passos({ passos, feitos, aoMarcar, somenteLeitura }: { passos: { t: string; d: string }[]; feitos: number[]; aoMarcar?: (i: number) => void; somenteLeitura?: boolean }) {
  const proximo = passos.findIndex((_, i) => !feitos.includes(i))
  return (
    <ol className="wk-passos">
      {passos.map((p, i) => (
        <li key={i} data-feito={feitos.includes(i) || undefined} data-atual={(!somenteLeitura && i === proximo) || undefined}>
          <button className="wk-passo-marca" aria-pressed={feitos.includes(i)} disabled={somenteLeitura} aria-label={`Passo ${i + 1}: ${p.t}`} onClick={() => aoMarcar?.(i)}>
            {feitos.includes(i) ? <Check aria-hidden /> : <b>{i + 1}</b>}
          </button>
          <div>
            <b>{p.t}</b>
            <small>{p.d}</small>
          </div>
        </li>
      ))}
    </ol>
  )
}

function Processo() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const p = PROCESSO[id]
  if (!p) return null
  return (
    <div className="pt-tela">
      <button className="btn-link" onClick={() => navegar('/construcao')}>
        <ChevronLeft aria-hidden /> Caixa de ferramentas
      </button>
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Processo nº {p.numero}</span>
        <h2 className="dia-hero-data">{p.nome}</h2>
        <p className="pt-mini-texto">{p.resumo}</p>
      </section>
      <div className="pt-card">
        <Passos passos={p.passos} feitos={[]} somenteLeitura />
        <span className="pt-tag" data-cor="verde">
          {p.final}
        </span>
      </div>
      <aside className="wk-regra">
        <b>Regra fixa</b>
        <p>{p.regra}</p>
      </aside>
    </div>
  )
}

function Execucao({ ctx }: { ctx: Ctx }) {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const { w, setW } = ctx
  const e = w.execucoes.find((x) => x.id === id)
  const [festa, setFesta] = useState(false)
  if (!e) return <p className="vazio">Execução não encontrada.</p>
  const p = PROCESSO[e.processo]
  const c = w.clientes.find((x) => x.id === e.clienteId)
  const marcar = (i: number) => {
    const feitos = e.feitos.includes(i) ? e.feitos.filter((x) => x !== i) : [...e.feitos, i]
    const completo = feitos.length === p.passos.length
    setW((x) => ({ ...x, execucoes: x.execucoes.map((y) => (y.id === id ? { ...y, feitos, fim: completo ? hojeBrasiliaIso() : undefined } : y)) }))
    if (completo && !e.fim) setFesta(true)
  }
  return (
    <div className="pt-tela">
      <button className="btn-link" onClick={() => navegar('/construcao')}>
        <ChevronLeft aria-hidden /> Caixa de ferramentas
      </button>
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Nº {p.numero} · {p.nome}</span>
        <h2 className="dia-hero-data">{e.titulo}</h2>
        <p className="pt-mini-texto">{c ? c.nome : 'Sem cliente'} · começou em {formatarDataCurta(e.criado)}</p>
        <span className="pt-barra">
          <i style={{ width: `${(e.feitos.length / p.passos.length) * 100}%` }} />
        </span>
        <p className="pt-mini-texto">
          {e.fim ? `${p.final}! Concluído em ${formatarDataCurta(e.fim)}.` : `${e.feitos.length} de ${p.passos.length} passos`}
        </p>
      </section>
      <div className="pt-card">
        <Passos passos={p.passos} feitos={e.feitos} aoMarcar={marcar} />
      </div>
      <aside className="wk-regra">
        <b>Regra fixa</b>
        <p>{p.regra}</p>
      </aside>
      <button
        className="btn btn-fantasma"
        onClick={() => {
          if (!window.confirm('Apagar esta execução?')) return
          setW((x) => ({ ...x, execucoes: x.execucoes.filter((y) => y.id !== id) }))
          navegar('/construcao')
        }}
      >
        <Trash2 aria-hidden /> Apagar execução
      </button>
      {festa && <Confete />}
    </div>
  )
}

function Servicos({ ctx }: { ctx: Ctx }) {
  const { w, setW } = ctx
  const semana = semanaDe(hojeBrasiliaIso())
  const feito = w.construcao.includes(semana)
  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">O que a TheusVision faz</span>
        <p className="dia-hero-saudacao">Cada serviço tem um processo. Quando o processo está escrito, qualquer entrega fica mais rápida e sem retrabalho.</p>
      </section>
      <ul className="pt-cards pt-cards-2">
        {PROCESSOS.map((p) => (
          <li key={p.id} className="pt-card">
            <b>{p.servico}</b>
            <small>Processo nº {p.numero}: {p.nome}</small>
            <small>
              Executado {w.execucoes.filter((e) => e.processo === p.id).length}x
            </small>
          </li>
        ))}
      </ul>
      <Secao titulo="Construção da semana">
        <div className="pt-card">
          <small>Trabalhar NO negócio, não dentro dele: 2 horas por semana para documentar um processo, criar um modelo de proposta, organizar a oferta ou montar uma automação.</small>
          <button className={feito ? 'btn btn-secundario' : 'btn btn-verde'} onClick={() => setW((x) => ({ ...x, construcao: feito ? x.construcao.filter((s) => s !== semana) : [...x.construcao, semana] }))}>
            <Hammer aria-hidden /> {feito ? 'Bloco desta semana feito ✓' : 'Fiz meu bloco de construção'}
          </button>
          <small>{w.construcao.length} {w.construcao.length === 1 ? 'semana' : 'semanas'} com bloco de construção.</small>
        </div>
      </Secao>
    </div>
  )
}

const ABAS = [
  { para: '/construcao', rotulo: 'Processos', icone: Layers, fim: true },
  { para: '/construcao/servicos', rotulo: 'Serviços', icone: Hammer },
]

export default function ProcessosApp() {
  const ctx = useWork()
  return (
    <ShellModulo titulo="Construção do negócio" abas={ABAS}>
      <AvisoPrototipo aoRecomecar={ctx.recomecar} />
      <div style={{ height: 12 }} />
      <Routes>
        <Route index element={<Caixa ctx={ctx} />} />
        <Route path="processo/:id" element={<Processo />} />
        <Route path="execucao/:id" element={<Execucao ctx={ctx} />} />
        <Route path="servicos" element={<Servicos ctx={ctx} />} />
        <Route path="*" element={<Caixa ctx={ctx} />} />
      </Routes>
    </ShellModulo>
  )
}
