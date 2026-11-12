import { Flame } from 'lucide-react'

export function Chama({
  numero,
  tamanho = 'grande',
  pulsando = false,
  apagada = false,
}: {
  numero: number | string
  tamanho?: 'pequena' | 'media' | 'grande' | 'gigante'
  pulsando?: boolean
  apagada?: boolean
}) {
  return (
    <span className={`chama chama-${tamanho}`} data-pulsando={pulsando || undefined} data-apagada={apagada || undefined}>
      <Flame aria-hidden />
      <b>{numero}</b>
    </span>
  )
}
