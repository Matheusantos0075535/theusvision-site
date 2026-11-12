import { ChevronDown, MapPin } from 'lucide-react'
import { useState } from 'react'
import { FASES, ONDE_ESTOU as T } from './conteudo/textosSaude'

/** Fase da recuperação pelo tempo sem usar (a partir da sequência atual). */
export function faseDoDia(dias: number) {
  const d = Math.max(1, dias)
  const i = Math.max(0, FASES.findIndex((f) => f.ate === null || d <= f.ate))
  return { fase: FASES[i], indice: i, proxima: FASES[i + 1] ?? null }
}

export function OndeVoceEsta({ dias }: { dias: number }) {
  const [aberto, setAberto] = useState(false)
  const { fase, indice, proxima } = faseDoDia(dias)
  const d = Math.max(1, dias)
  const fim = fase.ate
  const fracao = fim ? Math.min(1, (d - fase.de + 1) / (fim - fase.de + 1)) : 1
  return (
    <section className="onde" aria-label={`${T.rotulo}: ${fase.nome}`}>
      <header className="onde-topo">
        <span className="onde-pino" aria-hidden>
          <MapPin />
        </span>
        <div className="onde-titulos">
          <span className="rotulo">{T.rotulo}</span>
          <h3>{fase.nome}</h3>
        </div>
        <span className="onde-periodo">{fase.periodo}</span>
      </header>

      <ol className="onde-fases" aria-hidden>
        {FASES.map((f, i) => (
          <li key={f.id} data-estado={i < indice ? 'feita' : i === indice ? 'atual' : 'futura'}>
            <i style={i === indice ? { ['--p' as string]: `${Math.round(fracao * 100)}%` } : undefined} />
          </li>
        ))}
      </ol>
      <small className="onde-prox">{proxima && fim ? T.proxima(fim - d + 1, proxima.nome) : T.ultima}</small>

      <p className="onde-normal">
        <b>{T.normal}.</b> {fase.normal}
      </p>
      <p className="onde-foco">
        <b>{T.foco}:</b> {fase.foco}
      </p>

      <button className="onde-mais" aria-expanded={aberto} onClick={() => setAberto((a) => !a)}>
        {aberto ? T.verMenos : T.verMais}
        <ChevronDown aria-hidden />
      </button>
      {aberto && (
        <div className="onde-detalhe">
          <ul>
            {fase.mais.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <small>{T.aviso}</small>
        </div>
      )}
    </section>
  )
}
