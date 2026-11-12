import { useEffect, useState } from 'react'
import { useMovimentoReduzido } from '../../lib/useMidia'
import { DOIS_CAMINHOS as T } from './conteudo/textosSaude'

const INTERVALO = 10_000
const N = T.lembretes.length

/** O verso inicial muda a cada dia de Brasília (o "hoje" vem do banco); depois troca a cada 10 s. */
function indiceDoDia(hoje: string) {
  const dias = Math.floor(Date.parse(`${hoje}T12:00:00Z`) / 86_400_000)
  return ((dias % N) + N) % N
}

/**
 * Faixa curta antes da ofensiva: onde você estava → para onde você está indo.
 * Troca sozinha; pausa com o mouse em cima, com foco ou com a aba escondida; sem troca com movimento reduzido.
 */
export function Lembrete({ hoje, aoVerPorque }: { hoje: string; aoVerPorque: () => void }) {
  const reduzido = useMovimentoReduzido()
  const [indice, setIndice] = useState(() => indiceDoDia(hoje))
  const [ciclo, setCiclo] = useState(0)
  const [pausaPonteiro, setPausaPonteiro] = useState(false)
  const [pausaAba, setPausaAba] = useState(() => document.hidden)
  const pausado = pausaPonteiro || pausaAba

  useEffect(() => setIndice(indiceDoDia(hoje)), [hoje])

  useEffect(() => {
    const mudar = () => setPausaAba(document.hidden)
    document.addEventListener('visibilitychange', mudar)
    return () => document.removeEventListener('visibilitychange', mudar)
  }, [])

  useEffect(() => {
    if (reduzido || pausado) return
    const t = window.setTimeout(() => {
      setIndice((i) => (i + 1) % N)
      setCiclo((c) => c + 1)
    }, INTERVALO)
    return () => window.clearTimeout(t)
  }, [ciclo, pausado, reduzido])

  const par = T.lembretes[indice]
  return (
    <button
      className="lembrete"
      onClick={aoVerPorque}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPausaPonteiro(true)}
      onPointerLeave={() => setPausaPonteiro(false)}
      onFocus={() => setPausaPonteiro(true)}
      onBlur={() => setPausaPonteiro(false)}
      aria-label={`${T.lembreteDe}: ${par.de} ${T.lembretePara}: ${par.para}. ${T.lembreteLink}`}
    >
      <span className="lembrete-brilho" aria-hidden />
      <span className="lembrete-fluxo" key={indice} aria-hidden>
        <span className="lembrete-no lembrete-de">
          <span className="lembrete-rotulo">{T.lembreteDe}</span>
          <span className="lembrete-verso">{par.de}</span>
        </span>
        <span className="lembrete-fio">
          <i className="fio-ponta fio-ponta-de" />
          <i className="fio-linha" />
          <i className="fio-ponta fio-ponta-para" />
        </span>
        <span className="lembrete-no lembrete-para">
          <span className="lembrete-rotulo">{T.lembretePara}</span>
          <span className="lembrete-verso">{par.para}</span>
        </span>
      </span>
      <span className="lembrete-link" aria-hidden>
        {T.lembreteLink}
      </span>
      {!reduzido && (
        <span className="lembrete-tempo" aria-hidden>
          <i key={`${indice}-${ciclo}-${pausado ? 'p' : 'r'}`} data-pausado={pausado || undefined} />
        </span>
      )}
    </button>
  )
}
