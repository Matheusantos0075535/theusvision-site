import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Pencil, Plus, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { Secao } from '../../../components/compartilhado/ShellModulo'
import { useToast } from '../../../components/ui/Toast'
import { tocar } from '../../../lib/som'
import { supabase } from '../../../lib/supabase'
import { formatarDataCurta } from '../../../lib/tempo'
import { nomeMes, numero, PAGAMENTOS, real, rotuloPagamento, soValor, somarMeses, useFin, useResumoDoMes, type Lancamento, type Pagamento } from '../dados'

function Lancar({ tipo, editar, aoFechar }: { tipo: 'entrada' | 'gasto'; editar?: Lancamento; aoFechar: () => void }) {
  const { hoje, categorias, escrever } = useFin()
  const { mostrar } = useToast()
  const [valor, setValor] = useState(editar ? String(editar.valor).replace('.', ',') : '')
  const [dia, setDia] = useState(editar?.dia ?? hoje)
  const [cat, setCat] = useState<string | null>(editar?.categoria_id ?? (tipo === 'gasto' ? (categorias[0]?.id ?? null) : null))
  const [pag, setPag] = useState<Pagamento>(editar?.pagamento ?? 'pix')
  const [desc, setDesc] = useState(editar?.descricao ?? '')
  const [impulso, setImpulso] = useState(editar?.impulso ?? false)
  const [salvando, setSalvando] = useState(false)
  const v = numero(valor)
  const gasto = tipo === 'gasto'

  async function salvar() {
    setSalvando(true)
    const dados = {
      tipo,
      valor: v,
      dia,
      categoria_id: gasto ? cat : null,
      descricao: desc.trim() || null,
      pagamento: gasto ? pag : null,
      impulso: gasto && impulso,
    }
    const e = await escrever(editar ? supabase.from('fin_lancamentos').update(dados).eq('id', editar.id) : supabase.from('fin_lancamentos').insert(dados))
    setSalvando(false)
    if (e) return mostrar(e, { comNav: true })
    tocar(gasto ? 'marcar' : 'sucesso')
    aoFechar()
  }

  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha fin-folha" role="dialog" aria-modal="true" aria-labelledby="fin-lancar" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <h2 id="fin-lancar" className="dia-folha-titulo">
          {editar ? 'Editar' : gasto ? 'Lançar gasto' : 'Lançar entrada'}
        </h2>
        <input
          className="entrada fin-valor-grande"
          data-tipo={tipo}
          inputMode="decimal"
          autoFocus
          value={valor}
          placeholder="R$ 0"
          onChange={(e) => setValor(soValor(e.target.value))}
          aria-label="Valor"
        />
        {gasto && (
          <>
            <span className="fin-rotulo">Forma de pagamento</span>
            <div className="fin-chips" role="group" aria-label="Forma de pagamento">
              {PAGAMENTOS.map((p) => (
                <button key={p.id} type="button" className="dia-chip" aria-pressed={pag === p.id} onClick={() => setPag(p.id)}>
                  {p.rotulo}
                </button>
              ))}
            </div>
            <span className="fin-rotulo">Categoria</span>
            <div className="fin-chips" role="group" aria-label="Categoria">
              {categorias.map((c) => (
                <button key={c.id} type="button" className="dia-chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                  {c.nome}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="fin-linha-campos">
          <label className="campo">
            <span>{gasto ? 'Com o quê?' : 'De onde veio?'}</span>
            <input className="entrada" maxLength={200} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={gasto ? 'Opcional' : 'Ex.: cliente, presente, venda'} />
          </label>
          <label className="campo fin-campo-dia">
            <span>Dia</span>
            <input className="entrada" type="date" max={hoje} value={dia} onChange={(e) => setDia(e.target.value || hoje)} />
          </label>
        </div>
        {gasto && (
          <button type="button" className="dia-chip fin-impulso" aria-pressed={impulso} onClick={() => setImpulso((x) => !x)}>
            {impulso ? '⚡ Foi por impulso' : 'Foi por impulso?'}
          </button>
        )}
        <button className={`btn btn-grande ${gasto ? 'btn-primario' : 'btn-verde'}`} disabled={v <= 0 || salvando || dia > hoje} onClick={() => void salvar()}>
          {salvando ? 'Salvando…' : `${editar ? 'Salvar' : 'Lançar'} ${v > 0 ? real(v) : ''}`}
        </button>
      </div>
    </div>
  )
}

function Limites({ aoFechar }: { aoFechar: () => void }) {
  const { categorias, escrever } = useFin()
  const { mostrar } = useToast()
  const [valores, setValores] = useState<Record<string, string>>(() => Object.fromEntries(categorias.map((c) => [c.id, c.limite ? String(c.limite) : ''])))
  const [nova, setNova] = useState('')
  async function salvar() {
    for (const c of categorias) {
      const v = numero(valores[c.id] ?? '')
      if (v !== c.limite) {
        const e = await escrever(supabase.from('fin_categorias').update({ limite: v }).eq('id', c.id))
        if (e) return mostrar(e, { comNav: true })
      }
    }
    aoFechar()
  }
  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha fin-folha" role="dialog" aria-modal="true" aria-labelledby="fin-limites" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <h2 id="fin-limites" className="dia-folha-titulo">
          Limites por categoria
        </h2>
        <p className="dia-folha-apoio">Quanto você combina gastar por mês em cada uma. Deixe em branco para só acompanhar, sem limite.</p>
        <ul className="fin-limites">
          {categorias.map((c) => (
            <li key={c.id}>
              <span>{c.nome}</span>
              <input
                className="entrada"
                inputMode="decimal"
                placeholder="sem limite"
                value={valores[c.id] ?? ''}
                onChange={(e) => setValores((v) => ({ ...v, [c.id]: soValor(e.target.value) }))}
                aria-label={`Limite de ${c.nome}`}
              />
            </li>
          ))}
        </ul>
        <form
          className="pt-form"
          onSubmit={async (ev) => {
            ev.preventDefault()
            if (!nova.trim()) return
            const e = await escrever(supabase.from('fin_categorias').insert({ nome: nova.trim(), ordem: categorias.length + 1 }))
            if (e) return mostrar(e, { comNav: true })
            setNova('')
          }}
        >
          <input className="entrada" maxLength={60} value={nova} onChange={(e) => setNova(e.target.value)} placeholder="Nova categoria" aria-label="Nova categoria" />
          <button className="btn btn-secundario" disabled={!nova.trim()}>
            <Plus aria-hidden /> Criar
          </button>
        </form>
        <div className="dia-prio-botoes">
          <button className="btn btn-fantasma" onClick={aoFechar}>
            Voltar
          </button>
          <button className="btn btn-primario" onClick={() => void salvar()}>
            Salvar limites
          </button>
        </div>
      </div>
    </div>
  )
}

function Linha({ l, aoEditar }: { l: Lancamento; aoEditar: () => void }) {
  const { categorias, escrever } = useFin()
  const { mostrar } = useToast()
  const cat = categorias.find((c) => c.id === l.categoria_id)?.nome
  const entrada = l.tipo === 'entrada'
  return (
    <li className="pt-linha fin-linha">
      <span className="fin-linha-icone" data-tipo={l.tipo} aria-hidden>
        {entrada ? <ArrowDownLeft /> : <ArrowUpRight />}
      </span>
      <span>
        <b>
          {l.descricao || cat || (entrada ? 'Entrada' : 'Gasto')}
          {l.impulso && ' ⚡'}
        </b>
        <small>{[formatarDataCurta(l.dia), !entrada && l.descricao ? cat : null, rotuloPagamento(l.pagamento)].filter(Boolean).join(' · ')}</small>
      </span>
      <span className="pt-valor" data-sinal={entrada ? 'mais' : 'menos'}>
        {entrada ? '+' : '−'}
        {real(l.valor)}
      </span>
      <button className="btn-icone" aria-label="Editar" onClick={aoEditar}>
        <Pencil aria-hidden />
      </button>
      <button
        className="btn-icone"
        aria-label="Apagar"
        onClick={async () => {
          if (!window.confirm(`Apagar ${entrada ? 'esta entrada' : 'este gasto'} de ${real(l.valor)}?`)) return
          const e = await escrever(supabase.from('fin_lancamentos').delete().eq('id', l.id))
          if (e) mostrar(e, { comNav: true })
        }}
      >
        <X aria-hidden />
      </button>
    </li>
  )
}

export function Mes() {
  const { hoje, categorias } = useFin()
  const [mes, setMes] = useState(hoje.slice(0, 7))
  const r = useResumoDoMes(mes)
  const [lancar, setLancar] = useState<'entrada' | 'gasto' | null>(null)
  const [editar, setEditar] = useState<Lancamento | null>(null)
  const [limites, setLimites] = useState(false)
  const atual = mes === hoje.slice(0, 7)
  const futuro = mes > hoje.slice(0, 7)
  const comLimite = categorias.filter((c) => c.limite > 0)

  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero fin-hero">
        <div className="fin-mes-nav">
          <button className="btn-icone" onClick={() => setMes((m) => somarMeses(m, -1))} aria-label="Mês anterior">
            <ChevronLeft aria-hidden />
          </button>
          <span className="dia-hero-tipo">{nomeMes(mes)}</span>
          <button className="btn-icone" onClick={() => setMes((m) => somarMeses(m, 1))} disabled={atual} aria-label="Próximo mês">
            <ChevronRight aria-hidden />
          </button>
        </div>
        {atual ? (
          <h2 className="dia-hero-data">
            <span>{real(Math.floor(r.porDia))}</span>
            pode gastar por dia até o fim do mês
          </h2>
        ) : (
          <h2 className="dia-hero-data">
            <span data-negativo={r.livre < 0 || undefined}>{real(r.livre)}</span>
            {r.livre >= 0 ? 'sobrou neste mês' : 'passou do que entrou'}
          </h2>
        )}
        <div className="pt-hero-mini fin-mini">
          <div>
            <small>Entrou</small>
            <b className="fin-mais">{real(r.totalEntradas)}</b>
          </div>
          <div>
            <small>Contas fixas</small>
            <b>{real(r.totalFixas)}</b>
          </div>
          <div>
            <small>Gastos</small>
            <b>{real(r.totalGastos)}</b>
          </div>
          <div>
            <small>Guardado</small>
            <b className="fin-mais">{real(r.guardado)}</b>
          </div>
        </div>
        {atual && (
          <p className="pt-mini-texto">
            Livre no mês: <b>{real(r.livre)}</b>
            {r.faltaPagarFixas > 0 && ` · ainda faltam ${real(r.faltaPagarFixas)} de contas fixas para pagar`}
            {r.totalEntradas === 0 && ' · lance o que entrou para ver quanto pode gastar'}
          </p>
        )}
        {!futuro && (
          <div className="fin-hero-botoes">
            <button className="btn btn-verde btn-grande" onClick={() => setLancar('entrada')}>
              <ArrowDownLeft aria-hidden /> Entrada
            </button>
            <button className="btn btn-primario btn-grande" onClick={() => setLancar('gasto')}>
              <ArrowUpRight aria-hidden /> Gasto
            </button>
          </div>
        )}
      </section>

      {(r.totalGastos > 0 || r.totalFixas > 0) && (
        <Secao titulo="Por forma de pagamento">
          <div className="fin-pagamentos">
            {PAGAMENTOS.map((p) => (
              <div key={p.id} className="pt-card fin-pag" data-pag={p.id}>
                <small>{p.rotulo}</small>
                <b>{real(r.porPagamento[p.id])}</b>
              </div>
            ))}
          </div>
          {r.porPagamento.credito > 0 && <p className="dia-apoio fin-nota">No crédito entram os gastos e as contas fixas do cartão deste mês: é o que deve vir na próxima fatura.</p>}
        </Secao>
      )}

      <Secao titulo="Por categoria">
        <div className="fin-secao-acao">
          <button className="btn btn-fantasma" onClick={() => setLimites(true)}>
            <SlidersHorizontal aria-hidden /> {comLimite.length ? 'Ajustar limites' : 'Definir limites'}
          </button>
        </div>
        <ul className="pt-cards">
          {categorias
            .map((c) => ({ c, g: r.gastos.filter((x) => x.categoria_id === c.id).reduce((t, x) => t + x.valor, 0) }))
            .filter(({ c, g }) => g > 0 || c.limite > 0)
            .map(({ c, g }) => {
              const p = c.limite ? g / c.limite : 0
              return (
                <li key={c.id} className="pt-card">
                  <div className="pt-card-topo">
                    <b>{c.nome}</b>
                    <span className="pt-valor">
                      {real(g)} {c.limite > 0 && <small>de {real(c.limite)}</small>}
                    </span>
                  </div>
                  {c.limite > 0 && (
                    <span className="pt-barra" data-estado={p > 1 ? 'estourou' : p > 0.8 ? 'alerta' : undefined}>
                      <i style={{ width: `${Math.min(100, p * 100)}%` }} />
                    </span>
                  )}
                  {p > 1 && <small>Passou {real(g - c.limite)} do combinado. Tudo bem: ajuste nas outras.</small>}
                </li>
              )
            })}
        </ul>
        {r.totalGastos === 0 && comLimite.length === 0 && <p className="vazio">Nenhum gasto neste mês.</p>}
      </Secao>

      <Secao titulo="Entradas do mês">
        <div className="pt-card">
          {r.entradas.length === 0 ? (
            <small>Nada entrou ainda neste mês.</small>
          ) : (
            <ul className="pt-linhas">
              {r.entradas.map((l) => (
                <Linha key={l.id} l={l} aoEditar={() => setEditar(l)} />
              ))}
            </ul>
          )}
        </div>
      </Secao>

      <Secao titulo="Gastos do mês">
        <div className="pt-card">
          {r.gastos.length === 0 ? (
            <small>Nenhum gasto lançado.</small>
          ) : (
            <ul className="pt-linhas">
              {r.gastos.map((l) => (
                <Linha key={l.id} l={l} aoEditar={() => setEditar(l)} />
              ))}
            </ul>
          )}
        </div>
      </Secao>

      {lancar && <Lancar tipo={lancar} aoFechar={() => setLancar(null)} />}
      {editar && <Lancar tipo={editar.tipo} editar={editar} aoFechar={() => setEditar(null)} />}
      {limites && <Limites aoFechar={() => setLimites(false)} />}
    </div>
  )
}
