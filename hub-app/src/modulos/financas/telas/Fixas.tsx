import { Check, CreditCard, Pencil, Plus, Repeat, Trash2, Zap } from 'lucide-react'
import { useState } from 'react'
import { Secao } from '../../../components/compartilhado/ShellModulo'
import { useToast } from '../../../components/ui/Toast'
import { tocar } from '../../../lib/som'
import { supabase } from '../../../lib/supabase'
import { nomeMes, numero, PAGAMENTOS, parcelaNoMes, real, rotuloPagamento, soValor, useFin, useResumoDoMes, valeNoMes, type Fixa, type Pagamento } from '../dados'

const TIPOS: { id: Fixa['tipo']; rotulo: string; plural: string; icone: typeof Repeat; apoio: string }[] = [
  { id: 'assinatura', rotulo: 'Assinatura', plural: 'Assinaturas', icone: Repeat, apoio: 'Streaming, apps, academia…' },
  { id: 'parcela', rotulo: 'Parcela', plural: 'Parcelas', icone: CreditCard, apoio: 'Compra parcelada no cartão' },
  { id: 'conta', rotulo: 'Conta fixa', plural: 'Contas fixas', icone: Zap, apoio: 'Aluguel, luz, internet, celular…' },
]

function Editor({ editar, aoFechar }: { editar?: Fixa; aoFechar: () => void }) {
  const { hoje, escrever } = useFin()
  const { mostrar } = useToast()
  const [tipo, setTipo] = useState<Fixa['tipo']>(editar?.tipo ?? 'assinatura')
  const [nome, setNome] = useState(editar?.nome ?? '')
  const [valor, setValor] = useState(editar ? String(editar.valor).replace('.', ',') : '')
  const [vence, setVence] = useState(editar?.dia_vencimento ? String(editar.dia_vencimento) : '')
  const [pag, setPag] = useState<Pagamento | null>(editar?.pagamento ?? (tipo === 'parcela' ? 'credito' : null))
  const [total, setTotal] = useState(editar?.parcelas_total ? String(editar.parcelas_total) : '')
  // "Estou na parcela N" é mais fácil de responder do que "quando foi a primeira".
  const atualN = editar ? parcelaNoMes(editar, hoje.slice(0, 7))?.n : undefined
  const [naParcela, setNaParcela] = useState(atualN ? String(atualN) : '1')
  const [salvando, setSalvando] = useState(false)
  const v = numero(valor)
  const parcela = tipo === 'parcela'
  const totalN = Math.round(numero(total))
  const nAgora = Math.round(numero(naParcela))
  const ok = nome.trim() && v > 0 && (!parcela || (totalN >= 1 && nAgora >= 1 && nAgora <= totalN))

  async function salvar() {
    setSalvando(true)
    let primeira: string | null = null
    if (parcela) {
      const [a, m] = hoje.slice(0, 7).split('-').map(Number)
      const d = new Date(Date.UTC(a, m - 1 - (nAgora - 1), 1))
      primeira = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    }
    const dados = {
      tipo,
      nome: nome.trim(),
      valor: v,
      dia_vencimento: vence ? Math.min(31, Math.max(1, Math.round(numero(vence)))) : null,
      pagamento: pag,
      parcelas_total: parcela ? totalN : null,
      primeira_parcela: primeira,
    }
    const e = await escrever(editar ? supabase.from('fin_fixas').update(dados).eq('id', editar.id) : supabase.from('fin_fixas').insert(dados))
    setSalvando(false)
    if (e) return mostrar(e, { comNav: true })
    aoFechar()
  }

  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha fin-folha" role="dialog" aria-modal="true" aria-labelledby="fin-fixa" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <h2 id="fin-fixa" className="dia-folha-titulo">
          {editar ? 'Editar conta fixa' : 'Nova conta fixa'}
        </h2>
        <div className="fin-tipos" role="group" aria-label="Tipo">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="fin-tipo"
              aria-pressed={tipo === t.id}
              onClick={() => {
                setTipo(t.id)
                if (t.id === 'parcela' && !pag) setPag('credito')
              }}
            >
              <t.icone aria-hidden />
              <b>{t.rotulo}</b>
              <small>{t.apoio}</small>
            </button>
          ))}
        </div>
        <label className="campo">
          <span>Nome</span>
          <input className="entrada" maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} placeholder={parcela ? 'Ex.: Celular novo' : 'Ex.: Internet'} />
        </label>
        <div className="fin-linha-campos">
          <label className="campo">
            <span>{parcela ? 'Valor da parcela' : 'Valor por mês'}</span>
            <input className="entrada" inputMode="decimal" value={valor} onChange={(e) => setValor(soValor(e.target.value))} placeholder="R$" />
          </label>
          <label className="campo fin-campo-dia">
            <span>Vence dia</span>
            <input className="entrada" inputMode="numeric" value={vence} onChange={(e) => setVence(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="—" />
          </label>
        </div>
        {parcela && (
          <div className="fin-linha-campos">
            <label className="campo">
              <span>Este mês é a parcela</span>
              <input className="entrada" inputMode="numeric" value={naParcela} onChange={(e) => setNaParcela(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </label>
            <label className="campo">
              <span>de quantas?</span>
              <input className="entrada" inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Ex.: 10" />
            </label>
          </div>
        )}
        <span className="fin-rotulo">Paga com</span>
        <div className="fin-chips" role="group" aria-label="Forma de pagamento">
          {PAGAMENTOS.map((p) => (
            <button key={p.id} type="button" className="dia-chip" aria-pressed={pag === p.id} onClick={() => setPag(pag === p.id ? null : p.id)}>
              {p.rotulo}
            </button>
          ))}
        </div>
        {parcela && totalN > 0 && v > 0 && nAgora <= totalN && (
          <p className="dia-folha-apoio">
            Faltam {totalN - nAgora + 1} {totalN - nAgora + 1 === 1 ? 'parcela' : 'parcelas'}: {real(v * (totalN - nAgora + 1))} até quitar.
          </p>
        )}
        <button className="btn btn-primario btn-grande" disabled={!ok || salvando} onClick={() => void salvar()}>
          {salvando ? 'Salvando…' : editar ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </div>
  )
}

function CartaoFixa({ f, mes, paga }: { f: Fixa; mes: string; paga: boolean }) {
  const { escrever } = useFin()
  const { mostrar } = useToast()
  const [editar, setEditar] = useState(false)
  const p = parcelaNoMes(f, mes)
  const detalhes = [f.dia_vencimento ? `vence dia ${f.dia_vencimento}` : null, rotuloPagamento(f.pagamento) || null, p ? `parcela ${p.n} de ${p.total}` : null].filter(Boolean)
  return (
    <li className="fin-fixa" data-paga={paga || undefined}>
      <button
        className="dia-prio-marca"
        aria-pressed={paga}
        aria-label={paga ? `Desmarcar pagamento: ${f.nome}` : `Marcar como paga: ${f.nome}`}
        onClick={async () => {
          const e = await escrever(
            paga ? supabase.from('fin_fixas_pagas').delete().eq('fixa_id', f.id).eq('mes', mes) : supabase.from('fin_fixas_pagas').insert({ fixa_id: f.id, mes }),
          )
          if (e) mostrar(e, { comNav: true })
        }}
      >
        <span className="dia-caixa" aria-hidden>
          <Check />
        </span>
      </button>
      <div className="fin-fixa-textos">
        <b>{f.nome}</b>
        <small>{detalhes.join(' · ') || 'todo mês'}</small>
        {p && (
          <span className="pt-barra fin-parcelas" aria-hidden>
            <i style={{ width: `${(p.n / p.total) * 100}%` }} />
          </span>
        )}
      </div>
      <span className="pt-valor">{real(f.valor)}</span>
      <button className="btn-icone" aria-label={`Editar ${f.nome}`} onClick={() => setEditar(true)}>
        <Pencil aria-hidden />
      </button>
      {editar && <Editor editar={f} aoFechar={() => setEditar(false)} />}
    </li>
  )
}

export function Fixas() {
  const { hoje, fixas, escrever } = useFin()
  const { mostrar } = useToast()
  const mes = hoje.slice(0, 7)
  const r = useResumoDoMes(mes)
  const [nova, setNova] = useState(false)
  const pagas = r.fixasMes.filter((f) => r.pagasMes.has(f.id)).length
  const encerradas = fixas.filter((f) => !valeNoMes(f, mes))
  const assinaturas = r.fixasMes.filter((f) => f.tipo === 'assinatura').reduce((t, f) => t + f.valor, 0)

  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Contas fixas · {nomeMes(mes)}</span>
        <h2 className="dia-hero-data">
          <span>{real(r.totalFixas)}</span>
          comprometidos todo mês
        </h2>
        {r.fixasMes.length > 0 && (
          <>
            <span className="pt-barra" aria-label={`${pagas} de ${r.fixasMes.length} pagas`}>
              <i style={{ width: `${(pagas / r.fixasMes.length) * 100}%` }} />
            </span>
            <p className="pt-mini-texto">
              {pagas} de {r.fixasMes.length} pagas · faltam <b>{real(r.faltaPagarFixas)}</b>
              {assinaturas > 0 && ` · só de assinaturas: ${real(assinaturas)}/mês (${real(assinaturas * 12)} por ano)`}
            </p>
          </>
        )}
        <button className="btn btn-primario btn-grande" onClick={() => setNova(true)}>
          <Plus aria-hidden /> Nova conta fixa
        </button>
      </section>

      {r.fixasMes.length === 0 && <p className="vazio">Cadastre assinaturas, parcelas do cartão e contas que vêm todo mês. Elas já saem do quanto você pode gastar.</p>}

      {TIPOS.map((t) => {
        const lista = r.fixasMes
          .filter((f) => f.tipo === t.id)
          .sort((a, b) => Number(r.pagasMes.has(a.id)) - Number(r.pagasMes.has(b.id)) || (a.dia_vencimento ?? 99) - (b.dia_vencimento ?? 99))
        if (!lista.length) return null
        return (
          <Secao key={t.id} titulo={`${t.plural} · ${real(lista.reduce((s, f) => s + f.valor, 0))}`}>
            <ul className="fin-fixas">
              {lista.map((f) => (
                <CartaoFixa key={f.id} f={f} mes={mes} paga={r.pagasMes.has(f.id)} />
              ))}
            </ul>
          </Secao>
        )
      })}

      {encerradas.length > 0 && (
        <Secao titulo="Encerradas ou pausadas">
          <ul className="pt-cards">
            {encerradas.map((f) => {
              const p = parcelaNoMes(f, mes)
              return (
                <li key={f.id} className="pt-card fin-encerrada">
                  <div className="pt-card-topo">
                    <b>{f.nome}</b>
                    <span className="pt-tag" data-cor={p && p.n > p.total ? 'verde' : undefined}>
                      {p && p.n > p.total ? 'Quitada 🎉' : p && p.n < 1 ? 'Começa depois' : 'Pausada'}
                    </span>
                  </div>
                  <div className="dia-prio-botoes">
                    {!f.ativa && (
                      <button className="btn btn-secundario" onClick={async () => {
                        const e = await escrever(supabase.from('fin_fixas').update({ ativa: true }).eq('id', f.id))
                        if (e) mostrar(e, { comNav: true })
                      }}>
                        Reativar
                      </button>
                    )}
                    <button
                      className="btn btn-fantasma"
                      onClick={async () => {
                        if (!window.confirm(`Apagar "${f.nome}" de vez?`)) return
                        const e = await escrever(supabase.from('fin_fixas').delete().eq('id', f.id))
                        if (e) mostrar(e, { comNav: true })
                      }}
                    >
                      <Trash2 aria-hidden /> Apagar
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Secao>
      )}

      {r.fixasMes.length > 0 && (
        <Secao titulo="Cancelou alguma?">
          <div className="pt-card">
            <small>Pausar tira a conta do mês sem apagar o histórico.</small>
            <div className="fin-chips">
              {r.fixasMes.map((f) => (
                <button
                  key={f.id}
                  className="dia-chip"
                  onClick={async () => {
                    const e = await escrever(supabase.from('fin_fixas').update({ ativa: false }).eq('id', f.id))
                    if (e) return mostrar(e, { comNav: true })
                    tocar('desmarcar')
                  }}
                >
                  Pausar {f.nome}
                </button>
              ))}
            </div>
          </div>
        </Secao>
      )}

      {nova && <Editor aoFechar={() => setNova(false)} />}
    </div>
  )
}
