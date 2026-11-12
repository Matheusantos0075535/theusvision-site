import { ChevronsDown, ChevronsRight, TriangleAlert, Trophy } from 'lucide-react'
import { DOIS_CAMINHOS as T } from './conteudo/textosSaude'

/** Par do dia: muda sozinho a cada dia de Brasília (o "hoje" vem do banco). */
function parDoDia(hoje: string) {
  const dias = Math.floor(Date.parse(`${hoje}T12:00:00Z`) / 86_400_000)
  return T.lembretes[((dias % T.lembretes.length) + T.lembretes.length) % T.lembretes.length]
}

/** Faixa curta antes da ofensiva: o que estou evitando → para onde vou. Tocar leva ao porquê completo. */
export function Lembrete({ hoje, aoVerPorque }: { hoje: string; aoVerPorque: () => void }) {
  const par = parDoDia(hoje)
  return (
    <button className="lembrete" onClick={aoVerPorque} aria-label={`${T.lembreteRotulo}: evitando ${par.evitando} Indo para ${par.indo} ${T.lembreteLink}`}>
      <span className="lembrete-brilho" aria-hidden />
      <span className="lembrete-lado lembrete-evitando">
        <span className="lembrete-rotulo">
          <TriangleAlert aria-hidden />
          {T.lembreteEvitando}
        </span>
        <span className="lembrete-verso" aria-hidden>
          {par.evitando}
        </span>
      </span>
      <span className="lembrete-seta" aria-hidden>
        <ChevronsDown className="seta-v" />
        <ChevronsRight className="seta-h" />
      </span>
      <span className="lembrete-lado lembrete-indo">
        <span className="lembrete-rotulo">
          <Trophy aria-hidden />
          {T.lembreteIndo}
        </span>
        <span className="lembrete-verso" aria-hidden>
          {par.indo}
        </span>
      </span>
      <span className="lembrete-link" aria-hidden>
        {T.lembreteLink}
      </span>
    </button>
  )
}
