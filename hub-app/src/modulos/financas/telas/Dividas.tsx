import { HandCoins, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '../../../components/ui/Toast'
import { tocar } from '../../../lib/som'
import { supabase } from '../../../lib/supabase'
import { numero, real, soValor, useFin } from '../dados'

export function Dividas() {
  const { dividas, escrever } = useFin()
  const { mostrar } = useToast()
  const [pagar, setPagar] = useState<Record<string, string>>({})
  const [nova, setNova] = useState({ nome: '', saldo: '', parcela: '' })
  const ordem = dividas.filter((x) => x.saldo > 0).sort((a, b) => a.saldo - b.saldo)
  const total = dividas.reduce((t, x) => t + x.saldo, 0)
  const original = dividas.reduce((t, x) => t + x.original, 0)
  const meses = Math.max(0, ...dividas.map((x) => (x.parcela ? Math.ceil(x.saldo / x.parcela) : 0)))

  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Dívidas</span>
        <h2 className="dia-hero-data">
          <span>{real(total)}</span>
          {total ? `faltam${meses ? ` · livre em ~${meses} ${meses === 1 ? 'mês' : 'meses'}` : ''}` : dividas.length ? 'Livre de dívidas!' : 'Nenhuma dívida cadastrada'}
        </h2>
        {original > 0 && (
          <span className="pt-barra" aria-label="Quanto já foi pago">
            <i style={{ width: `${((original - total) / original) * 100}%` }} />
          </span>
        )}
        <p className="pt-mini-texto">Bola de neve: pague o mínimo em todas e jogue o dinheiro extra na menor. Cada dívida quitada libera a parcela para a próxima. Parcelas do cartão ficam em Fixas.</p>
      </section>
      <ul className="pt-cards">
        {ordem.map((x, i) => (
          <li key={x.id} className="pt-card">
            <div className="pt-card-topo">
              <b>{x.nome}</b>
              {i === 0 && (
                <span className="pt-tag" data-cor="laranja">
                  Foco agora
                </span>
              )}
            </div>
            <span className="pt-barra">
              <i style={{ width: `${((x.original - x.saldo) / x.original) * 100}%` }} />
            </span>
            <small>
              Falta {real(x.saldo)} de {real(x.original)}
              {x.parcela > 0 && ` · parcela ${real(x.parcela)} · ~${Math.ceil(x.saldo / x.parcela)} meses`}
            </small>
            <div className="pt-form">
              <input
                className="entrada"
                inputMode="decimal"
                placeholder={x.parcela ? `Pagamento (ex.: ${real(x.parcela)})` : 'Quanto pagou'}
                value={pagar[x.id] ?? ''}
                onChange={(e) => setPagar((p) => ({ ...p, [x.id]: soValor(e.target.value) }))}
                aria-label="Valor pago"
              />
              <button
                className="btn btn-secundario"
                disabled={!(numero(pagar[x.id] ?? '') || x.parcela)}
                onClick={async () => {
                  const v = numero(pagar[x.id] ?? '') || x.parcela
                  const saldo = Math.max(0, Math.round((x.saldo - v) * 100) / 100)
                  const e = await escrever(supabase.from('fin_dividas').update({ saldo }).eq('id', x.id))
                  if (e) return mostrar(e, { comNav: true })
                  tocar(saldo === 0 ? 'recorde' : 'sucesso')
                  setPagar((p) => ({ ...p, [x.id]: '' }))
                }}
              >
                <HandCoins aria-hidden /> Paguei
              </button>
            </div>
          </li>
        ))}
        {dividas
          .filter((x) => x.saldo === 0)
          .map((x) => (
            <li key={x.id} className="pt-card">
              <div className="pt-card-topo">
                <b>{x.nome}</b>
                <span className="pt-tag" data-cor="verde">
                  Quitada 🎉
                </span>
              </div>
              <button
                className="btn btn-fantasma"
                onClick={async () => {
                  const e = await escrever(supabase.from('fin_dividas').delete().eq('id', x.id))
                  if (e) mostrar(e, { comNav: true })
                }}
              >
                <Trash2 aria-hidden /> Tirar da lista
              </button>
            </li>
          ))}
      </ul>
      <form
        className="pt-card"
        onSubmit={async (ev) => {
          ev.preventDefault()
          const s = numero(nova.saldo)
          const e = await escrever(supabase.from('fin_dividas').insert({ nome: nova.nome.trim(), original: s, saldo: s, parcela: numero(nova.parcela) }))
          if (e) return mostrar(e, { comNav: true })
          setNova({ nome: '', saldo: '', parcela: '' })
        }}
      >
        <b>Nova dívida</b>
        <div className="pt-form">
          <input className="entrada" maxLength={80} value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} placeholder="Nome" aria-label="Nome da dívida" />
          <input className="entrada" inputMode="decimal" value={nova.saldo} onChange={(e) => setNova({ ...nova, saldo: soValor(e.target.value) })} placeholder="Quanto falta" aria-label="Saldo" />
          <input className="entrada" inputMode="decimal" value={nova.parcela} onChange={(e) => setNova({ ...nova, parcela: soValor(e.target.value) })} placeholder="Parcela" aria-label="Parcela" />
          <button className="btn btn-primario" disabled={!nova.nome.trim() || numero(nova.saldo) <= 0}>
            Adicionar
          </button>
        </div>
      </form>
    </div>
  )
}
