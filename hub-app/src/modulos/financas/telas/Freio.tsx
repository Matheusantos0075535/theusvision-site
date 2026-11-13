import { Hand, Hourglass, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Secao } from '../../../components/compartilhado/ShellModulo'
import { useToast } from '../../../components/ui/Toast'
import { tocar } from '../../../lib/som'
import { supabase } from '../../../lib/supabase'
import { numero, real, soValor, useFin } from '../dados'

const CHAVE = 'tv-fin-freio-horas'
function lerHoras() {
  try {
    const n = Number(localStorage.getItem(CHAVE))
    return [24, 48, 72].includes(n) ? n : 24
  } catch {
    return 24
  }
}

function useAgora() {
  const [a, setA] = useState(Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setA(Date.now()), 30_000)
    return () => window.clearInterval(t)
  }, [])
  return a
}

export function Freio() {
  const { desejos, escrever } = useFin()
  const { mostrar } = useToast()
  const agora = useAgora()
  const [horas, setHorasBase] = useState(lerHoras)
  const setHoras = (h: number) => {
    setHorasBase(h)
    try {
      localStorage.setItem(CHAVE, String(h))
    } catch {
      /* fica só nesta sessão */
    }
  }
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const espera = horas * 3600_000
  const abertos = desejos.filter((x) => !x.decisao)
  const decididos = desejos.filter((x) => x.decisao)
  const economizado = desejos.filter((x) => x.decisao === 'desisti').reduce((t, x) => t + x.valor, 0)

  async function decidir(id: string, decisao: 'comprei' | 'desisti') {
    const e = await escrever(supabase.from('fin_desejos').update({ decisao }).eq('id', id))
    if (e) return mostrar(e, { comNav: true })
    tocar(decisao === 'desisti' ? 'conquista' : 'marcar')
  }

  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Freio de compra</span>
        <h2 className="dia-hero-data">
          <span>{real(economizado)}</span>
          que você não gastou por impulso
        </h2>
        <p className="pt-mini-texto">Deu vontade de comprar? Anote aqui e espere {horas} horas. A vontade costuma passar; se não passar, era vontade de verdade.</p>
      </section>
      <form
        className="pt-card"
        onSubmit={async (ev) => {
          ev.preventDefault()
          const e = await escrever(supabase.from('fin_desejos').insert({ nome: nome.trim(), valor: numero(valor) }))
          if (e) return mostrar(e, { comNav: true })
          setNome('')
          setValor('')
        }}
      >
        <b>Quero comprar…</b>
        <div className="pt-form">
          <input className="entrada" maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="O quê?" aria-label="O que quer comprar" />
          <input className="entrada" inputMode="decimal" value={valor} onChange={(e) => setValor(soValor(e.target.value))} placeholder="R$" aria-label="Valor" style={{ flex: '0 1 110px' }} />
          <button className="btn btn-primario" disabled={!nome.trim() || numero(valor) <= 0}>
            <Hourglass aria-hidden /> Esperar
          </button>
        </div>
        <div className="fin-chips">
          {[24, 48, 72].map((h) => (
            <button key={h} type="button" className="dia-chip" aria-pressed={horas === h} onClick={() => setHoras(h)}>
              {h} horas
            </button>
          ))}
        </div>
      </form>
      <ul className="pt-cards">
        {abertos.map((x) => {
          const falta = Math.max(0, new Date(x.criado_em).getTime() + espera - agora)
          return (
            <li key={x.id} className="pt-card">
              <div className="pt-card-topo">
                <b>{x.nome}</b>
                <span className="pt-valor">{real(x.valor)}</span>
              </div>
              <span className="pt-barra" data-estado={falta > 0 ? 'alerta' : undefined}>
                <i style={{ width: `${(1 - falta / espera) * 100}%` }} />
              </span>
              <small>
                {falta > 0
                  ? `Faltam ${Math.floor(falta / 3600_000)}h${String(Math.floor((falta % 3600_000) / 60_000)).padStart(2, '0')} para decidir. Se quiser, desista agora.`
                  : 'Passou o tempo. Ainda faz sentido?'}
              </small>
              <div className="dia-prio-botoes">
                <button className="btn btn-secundario" onClick={() => void decidir(x.id, 'desisti')}>
                  <Hand aria-hidden /> Desisti
                </button>
                {falta === 0 && (
                  <button className="btn btn-primario" onClick={() => void decidir(x.id, 'comprei')}>
                    Vou comprar
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {decididos.length > 0 && (
        <Secao titulo="Decididos">
          <div className="pt-card">
            <ul className="pt-linhas">
              {decididos.map((x) => (
                <li key={x.id} className="pt-linha">
                  <span>
                    <b>{x.nome}</b>
                    <small>{x.decisao === 'desisti' ? 'Desistiu: dinheiro que ficou' : 'Comprou depois de pensar'}</small>
                  </span>
                  <span className="pt-tag" data-cor={x.decisao === 'desisti' ? 'verde' : 'laranja'}>
                    {real(x.valor)}
                  </span>
                  <button
                    className="btn-icone"
                    aria-label={`Apagar ${x.nome}`}
                    onClick={async () => {
                      const e = await escrever(supabase.from('fin_desejos').delete().eq('id', x.id))
                      if (e) mostrar(e, { comNav: true })
                    }}
                  >
                    <Trash2 aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Secao>
      )}
    </div>
  )
}
