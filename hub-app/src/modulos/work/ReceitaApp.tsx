import { ChevronLeft, ChevronRight, Coins, Plus, Send, Target, X } from 'lucide-react'
import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { GraficoColunas } from '../../components/compartilhado/Graficos'
import { Secao, ShellModulo } from '../../components/compartilhado/ShellModulo'
import { hojeBrasiliaIso } from '../../lib/tempo'
import '../dia/dia.css'
import { AvisoPrototipo } from '../prototipo/Aviso'
import { numero, real, uid } from '../prototipo/estado'
import '../prototipo/prototipo.css'
import { ETAPAS, useWork, type Etapa } from './dados'

type Ctx = ReturnType<typeof useWork>
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const CURTOS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

function Caixa({ ctx }: { ctx: Ctx }) {
  const { w, setW } = ctx
  const hoje = hojeBrasiliaIso()
  const [mes, setMes] = useState(Number(hoje.slice(5, 7)) - 1)
  const chave = `${hoje.slice(0, 4)}-${String(mes + 1).padStart(2, '0')}`
  const dado = (m: string, f: string) => w.caixa[m]?.[f] ?? { previsto: 0, recebido: 0 }
  const totalMes = (m: string, campo: 'previsto' | 'recebido') => w.fontes.reduce((t, f) => t + dado(m, f.id)[campo], 0)
  const prev = totalMes(chave, 'previsto')
  const rec = totalMes(chave, 'recebido')
  const mudar = (f: string, campo: 'previsto' | 'recebido', v: number) =>
    setW((x) => ({ ...x, caixa: { ...x.caixa, [chave]: { ...x.caixa[chave], [f]: { ...dado(chave, f), [campo]: v } } } }))
  const porMes = Array.from({ length: 12 }, (_, i) => Math.round(totalMes(`${hoje.slice(0, 4)}-${String(i + 1).padStart(2, '0')}`, 'recebido') / 100) / 10)
  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Fluxo de caixa · {MESES[mes]}</span>
        <h2 className="dia-hero-data">
          <span>{real(rec)}</span>
          {prev ? `de ${real(prev)} previstos (${Math.round((rec / prev) * 100)}%)` : 'recebidos neste mês'}
        </h2>
        <span className="pt-barra" aria-hidden>
          <i style={{ width: `${prev ? Math.min(100, (rec / prev) * 100) : 0}%` }} />
        </span>
        <p className="pt-mini-texto">Suas fontes de renda do mês. Preencha o previsto no começo e o recebido conforme entra.</p>
      </section>
      <div className="cal-topo">
        <button className="btn-icone" onClick={() => setMes((m) => m - 1)} disabled={mes === 0} aria-label="Mês anterior">
          <ChevronLeft aria-hidden />
        </button>
        <h2>
          {MESES[mes]} <span>{hoje.slice(0, 4)}</span>
        </h2>
        <button className="btn-icone" onClick={() => setMes((m) => m + 1)} disabled={mes === 11} aria-label="Próximo mês">
          <ChevronRight aria-hidden />
        </button>
      </div>
      <ul className="pt-cards">
        {w.fontes.map((f) => {
          const d = dado(chave, f.id)
          const falta = Math.max(0, d.previsto - d.recebido)
          return (
            <li key={f.id} className="pt-card">
              <div className="pt-card-topo">
                <input className="wk-nome wk-nome-claro" value={f.nome} onChange={(e) => setW((x) => ({ ...x, fontes: x.fontes.map((y) => (y.id === f.id ? { ...y, nome: e.target.value } : y)) }))} aria-label="Nome da fonte" />
                {d.previsto > 0 && (
                  <span className="pt-tag" data-cor={d.recebido >= d.previsto ? 'verde' : 'laranja'}>
                    {d.recebido >= d.previsto ? 'Recebido' : `falta ${real(falta)}`}
                  </span>
                )}
              </div>
              <span className="pt-barra">
                <i style={{ width: `${d.previsto ? Math.min(100, (d.recebido / d.previsto) * 100) : 0}%` }} />
              </span>
              <div className="wk-duas">
                <label className="campo">
                  <span className="pt-sub">Previsto</span>
                  <input className="entrada" inputMode="decimal" value={d.previsto || ''} placeholder="R$ 0" onChange={(e) => mudar(f.id, 'previsto', numero(e.target.value))} />
                </label>
                <label className="campo">
                  <span className="pt-sub">Recebido</span>
                  <input className="entrada" inputMode="decimal" value={d.recebido || ''} placeholder="R$ 0" onChange={(e) => mudar(f.id, 'recebido', numero(e.target.value))} />
                </label>
              </div>
            </li>
          )
        })}
      </ul>
      <Secao titulo="Recebido por mês">
        <div className="cartao-bloco">
          <GraficoColunas
            rotulos={CURTOS}
            valores={porMes}
            destaque={mes}
            mostrarValores
            sufixo="k"
            rotuloAria="Valor recebido por mês, em milhares de reais"
            explicacao="Cada coluna é um mês de 2026, em milhares de reais (k). A coluna laranja é o mês que você está olhando."
          />
        </div>
      </Secao>
    </div>
  )
}

function Prospeccao({ ctx }: { ctx: Ctx }) {
  const { w, setW } = ctx
  const hoje = hojeBrasiliaIso()
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const feitaHoje = w.iniciativas.includes(hoje)
  const abertos = w.prospects.filter((p) => p.etapa !== 'fechado' && p.etapa !== 'perdido')
  const potencial = abertos.reduce((t, p) => t + p.valor, 0)
  const mover = (id: string, etapa: Etapa) => setW((x) => ({ ...x, prospects: x.prospects.map((p) => (p.id === id ? { ...p, etapa } : p)) }))
  const semana = w.iniciativas.filter((d) => d >= new Date(Date.now() - 6 * 86400_000).toISOString().slice(0, 10)).length
  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Iniciativa do dia</span>
        <p className="dia-hero-saudacao">Uma ação que ninguém pediu: mandar mensagem, follow-up, sugerir uma ideia.</p>
        <button
          className={feitaHoje ? 'btn btn-secundario btn-grande' : 'btn btn-verde btn-grande'}
          onClick={() => setW((x) => ({ ...x, iniciativas: feitaHoje ? x.iniciativas.filter((d) => d !== hoje) : [...x.iniciativas, hoje] }))}
        >
          <Send aria-hidden /> {feitaHoje ? 'Iniciativa feita hoje ✓' : 'Fiz minha iniciativa de hoje'}
        </button>
        <div className="pt-hero-mini">
          <div>
            <small>Na semana</small>
            <b>{semana}/7</b>
          </div>
          <div>
            <small>Em aberto</small>
            <b>{abertos.length}</b>
          </div>
          <div>
            <small>Potencial</small>
            <b>{real(potencial)}</b>
          </div>
        </div>
      </section>

      {ETAPAS.filter((e) => e.id !== 'perdido').map((e) => {
        const l = w.prospects.filter((p) => p.etapa === e.id)
        if (!l.length && e.id === 'fechado') return null
        return (
          <Secao key={e.id} titulo={`${e.rotulo} · ${l.length}`}>
            {l.length === 0 ? (
              <p className="vazio">{e.id === 'mente' ? 'Quem você tem em mente para prospectar? Adicione abaixo.' : 'Ninguém nessa etapa.'}</p>
            ) : (
              <ul className="pt-cards pt-cards-2">
                {l.map((p) => (
                  <li key={p.id} className="pt-card">
                    <div className="pt-card-topo">
                      <b>{p.nome}</b>
                      <span className="pt-valor">{p.valor ? real(p.valor) : ''}</span>
                    </div>
                    <input className="entrada" value={p.acao} onChange={(ev) => setW((x) => ({ ...x, prospects: x.prospects.map((y) => (y.id === p.id ? { ...y, acao: ev.target.value } : y)) }))} placeholder="Próxima ação" aria-label="Próxima ação" />
                    <div className="tr-chips">
                      {ETAPAS.filter((x) => x.id !== p.etapa).map((x) => (
                        <button key={x.id} className="dia-chip" onClick={() => mover(p.id, x.id)}>
                          → {x.rotulo}
                        </button>
                      ))}
                      <button className="btn-icone" aria-label={`Apagar ${p.nome}`} onClick={() => setW((s) => ({ ...s, prospects: s.prospects.filter((y) => y.id !== p.id) }))}>
                        <X aria-hidden />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Secao>
        )
      })}
      <div className="pt-card">
        <b>Quem eu tenho em mente</b>
        <div className="pt-form">
          <input className="entrada" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome ou negócio" aria-label="Nome do prospect" />
          <input className="entrada" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor estimado" aria-label="Valor estimado" style={{ flex: '0 1 140px' }} />
          <button
            className="btn btn-primario"
            disabled={!nome.trim()}
            onClick={() => {
              setW((x) => ({ ...x, prospects: [{ id: uid(), nome: nome.trim(), contato: '', etapa: 'mente', acao: '', valor: numero(valor), criado: hoje }, ...x.prospects] }))
              setNome('')
              setValor('')
            }}
          >
            <Plus aria-hidden /> Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}

const ABAS = [
  { para: '/receita', rotulo: 'Caixa', icone: Coins, fim: true },
  { para: '/receita/prospeccao', rotulo: 'Prospecção', icone: Target },
]

export default function ReceitaApp() {
  const ctx = useWork()
  return (
    <ShellModulo titulo="Receita e prospecção" abas={ABAS}>
      <AvisoPrototipo aoRecomecar={ctx.recomecar} />
      <div style={{ height: 12 }} />
      <Routes>
        <Route index element={<Caixa ctx={ctx} />} />
        <Route path="prospeccao" element={<Prospeccao ctx={ctx} />} />
        <Route path="*" element={<Caixa ctx={ctx} />} />
      </Routes>
    </ShellModulo>
  )
}
