/** Vibração curta, só se o aparelho suportar e a pessoa tiver deixado ligada. */
export function vibrar(ligado: boolean, padrao: number | number[] = 22) {
  if (!ligado) return
  try {
    navigator.vibrate?.(padrao)
  } catch {
    /* aparelho sem suporte */
  }
}

let ctx: AudioContext | null = null

/** Dois toques suaves, gerados na hora (sem arquivo de áudio). Desligado por padrão. */
export function tocarSom(ligado: boolean, forte = false) {
  if (!ligado) return
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx ??= new AC()
    const agora = ctx.currentTime
    const notas = forte ? [659.25, 783.99, 1046.5] : [659.25, 987.77]
    notas.forEach((freq, i) => {
      const osc = ctx!.createOscillator()
      const ganho = ctx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = agora + i * 0.11
      ganho.gain.setValueAtTime(0.0001, t)
      ganho.gain.exponentialRampToValueAtTime(0.12, t + 0.02)
      ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
      osc.connect(ganho).connect(ctx!.destination)
      osc.start(t)
      osc.stop(t + 0.55)
    })
  } catch {
    /* sem áudio disponível */
  }
}

export function sortear<T>(lista: T[], semente?: number): T {
  const i = semente === undefined ? Math.floor(Math.random() * lista.length) : Math.abs(semente) % lista.length
  return lista[i]
}
