import { Flame, PenLine, Send } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { sequenciaDeDias } from '../../diario/dados'
import { supabase } from '../../lib/supabase'
import { hojeBrasiliaIso } from '../../lib/tempo'

/** Convite do Diário na tela inicial: captura rápida e o hábito do dia. Não é um módulo da grade. */
export function DiarioChamada() {
  const navegar = useNavigate()
  const [texto, setTexto] = useState('')
  const [dias, setDias] = useState<string[] | null>(null)

  useEffect(() => {
    let vivo = true
    supabase
      .from('diario_entradas')
      .select('dia')
      .order('dia', { ascending: false })
      .limit(400)
      .then(({ data, error }) => {
        // Sem a tabela ainda (SQL não rodado), o convite continua, só sem os números.
        if (vivo && !error) setDias((data as { dia: string }[]).map((x) => x.dia))
      })
    return () => {
      vivo = false
    }
  }, [])

  const hoje = hojeBrasiliaIso()
  const seq = dias ? sequenciaDeDias(dias, hoje) : 0
  const escreveuHoje = !!dias?.includes(hoje)

  function enviar(e: FormEvent) {
    e.preventDefault()
    navegar('/diario/escrever', { state: { texto: texto.trim() ? `${texto.trim()}\n` : '' } })
  }

  return (
    <section className="di-chamada" aria-label="Diário">
      <div className="di-chamada-topo">
        <span className="di-chamada-icone" aria-hidden>
          <PenLine />
        </span>
        <span className="di-chamada-titulo">
          <b>Diário</b>
          <small>{escreveuHoje ? 'Você já escreveu hoje. Quer continuar?' : 'Esvazie a cabeça: escreva o que está aí.'}</small>
        </span>
        {seq > 0 && (
          <span className="di-chamada-chama" title={`${seq} dias seguidos escrevendo`}>
            <Flame aria-hidden /> {seq}
          </span>
        )}
      </div>
      <form className="di-chamada-form" onSubmit={enviar}>
        <input className="entrada" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="O que está na sua mente?" aria-label="O que está na sua mente?" enterKeyHint="send" />
        <button className="btn btn-primario" aria-label="Escrever no diário">
          <Send aria-hidden />
        </button>
      </form>
      <div className="di-chamada-links">
        <Link to="/diario/calendario">Calendário</Link>
        <Link to="/diario/entradas">Entradas</Link>
      </div>
    </section>
  )
}
