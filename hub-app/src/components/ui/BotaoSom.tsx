import { Volume2, VolumeX } from 'lucide-react'
import { definirSom, useSomLigado } from '../../lib/som'

/** Liga e desliga todos os sons do Hub neste aparelho. */
export function BotaoSom() {
  const ligado = useSomLigado()
  return (
    <button type="button" data-sem-som className="btn-icone" aria-pressed={ligado} aria-label={ligado ? 'Silenciar sons' : 'Ligar sons'} title={ligado ? 'Sons ligados' : 'Sons desligados'} onClick={() => definirSom(!ligado)}>
      {ligado ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
    </button>
  )
}
