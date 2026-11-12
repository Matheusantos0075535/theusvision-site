import { tocar } from '../../lib/som'

/** Vibração curta, só se o aparelho suportar e a pessoa tiver deixado ligada. */
export function vibrar(ligado: boolean, padrao: number | number[] = 22) {
  if (!ligado) return
  try {
    navigator.vibrate?.(padrao)
  } catch {
    /* aparelho sem suporte */
  }
}

/** Celebração: usa os sons do Hub (o botão de som decide se toca). O parâmetro antigo é ignorado. */
export function tocarSom(_ligado?: boolean, forte = false) {
  tocar(forte ? 'conquista' : 'sucesso')
}

export function sortear<T>(lista: T[], semente?: number): T {
  const i = semente === undefined ? Math.floor(Math.random() * lista.length) : Math.abs(semente) % lista.length
  return lista[i]
}
