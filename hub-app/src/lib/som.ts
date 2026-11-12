import { useSyncExternalStore } from 'react'

/**
 * Sons do Hub, sintetizados na hora com Web Audio (sem arquivo de áudio, nada para baixar).
 * Preferência do aparelho: ligada por padrão, com botão de silenciar em todo lugar.
 */
export type Som =
  | 'toque'
  | 'nav'
  | 'marcar'
  | 'desmarcar'
  | 'abrir'
  | 'fechar'
  | 'sucesso'
  | 'conquista'
  | 'recorde'
  | 'timer'
  | 'erro'
  | 'plantar'

const CHAVE = 'tv-som'
const ouvintes = new Set<() => void>()

function ler(): boolean {
  try {
    return localStorage.getItem(CHAVE) !== 'off'
  } catch {
    return true
  }
}
let ligado = ler()

export const somLigado = () => ligado
export function definirSom(v: boolean) {
  ligado = v
  try {
    localStorage.setItem(CHAVE, v ? 'on' : 'off')
  } catch {
    /* só nesta sessão */
  }
  ouvintes.forEach((f) => f())
  if (v) tocar('marcar', true)
}
export function useSomLigado() {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => ligado,
    () => true,
  )
}

let ctx: AudioContext | null = null
let mestre: GainNode | null = null
let ruidoBuf: AudioBuffer | null = null
const ultimo: Partial<Record<Som, number>> = {}

function motor() {
  if (ctx) return ctx
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  const comp = ctx.createDynamicsCompressor()
  mestre = ctx.createGain()
  mestre.gain.value = 0.9
  mestre.connect(comp).connect(ctx.destination)
  return ctx
}

type Tipo = OscillatorType

/** Uma nota com ataque rápido e queda suave. `ate` faz a frequência deslizar. */
function nota(c: AudioContext, freq: number, t: number, dur: number, vol: number, tipo: Tipo = 'sine', ate?: number) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = tipo
  o.frequency.setValueAtTime(freq, t)
  if (ate) o.frequency.exponentialRampToValueAtTime(ate, t + dur * 0.9)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(mestre!)
  o.start(t)
  o.stop(t + dur + 0.03)
}

/** Sino: fundamental e harmônico, queda longa. */
function sino(c: AudioContext, freq: number, t: number, vol: number, dur = 0.7) {
  nota(c, freq, t, dur, vol, 'sine')
  nota(c, freq * 2.01, t, dur * 0.6, vol * 0.45, 'sine')
  nota(c, freq * 3.02, t, dur * 0.3, vol * 0.18, 'sine')
}

function chiado(c: AudioContext, t: number, dur: number, vol: number, de: number, ate: number) {
  if (!ruidoBuf) {
    ruidoBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate)
    const d = ruidoBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const s = c.createBufferSource()
  s.buffer = ruidoBuf
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = 1.4
  f.frequency.setValueAtTime(de, t)
  f.frequency.exponentialRampToValueAtTime(ate, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  s.connect(f).connect(g).connect(mestre!)
  s.start(t)
  s.stop(t + dur + 0.02)
}

const RECEITAS: Record<Som, (c: AudioContext, t: number) => void> = {
  toque: (c, t) => {
    nota(c, 1250, t, 0.05, 0.035, 'triangle', 900)
  },
  nav: (c, t) => {
    nota(c, 660, t, 0.07, 0.05, 'triangle')
    nota(c, 990, t + 0.045, 0.09, 0.045, 'triangle')
  },
  marcar: (c, t) => {
    nota(c, 520, t, 0.11, 0.12, 'sine', 880)
    nota(c, 1320, t + 0.07, 0.16, 0.07, 'sine')
  },
  desmarcar: (c, t) => {
    nota(c, 420, t, 0.1, 0.07, 'sine', 280)
  },
  abrir: (c, t) => {
    chiado(c, t, 0.16, 0.05, 500, 3200)
    nota(c, 392, t + 0.02, 0.12, 0.035, 'sine', 523)
  },
  fechar: (c, t) => {
    chiado(c, t, 0.13, 0.04, 2800, 450)
  },
  sucesso: (c, t) => {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => nota(c, f, t + i * 0.075, 0.32, 0.1, 'triangle'))
    sino(c, 1568, t + 0.3, 0.05, 0.5)
  },
  conquista: (c, t) => {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => sino(c, f, t + i * 0.1, 0.085, 0.55))
    ;[1318.5, 1568, 2093].forEach((f, i) => sino(c, f, t + 0.42 + i * 0.03, 0.05, 1.1))
    chiado(c, t + 0.4, 0.5, 0.03, 4000, 9000)
  },
  recorde: (c, t) => {
    nota(c, 392, t, 0.5, 0.07, 'triangle', 1568)
    ;[783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => sino(c, f, t + 0.18 + i * 0.07, 0.075, 0.7))
  },
  timer: (c, t) => {
    ;[0, 0.22, 0.44].forEach((d, i) => sino(c, i === 2 ? 1174.66 : 880, t + d, 0.16, 0.6))
  },
  erro: (c, t) => {
    nota(c, 230, t, 0.14, 0.08, 'square', 190)
    nota(c, 190, t + 0.11, 0.18, 0.08, 'square', 150)
  },
  plantar: (c, t) => {
    nota(c, 330, t, 0.18, 0.09, 'sine', 495)
    nota(c, 660, t + 0.1, 0.25, 0.08, 'sine', 990)
    sino(c, 1318.5, t + 0.2, 0.06, 0.6)
  },
}

/** Toca um som. `forcar` ignora o silenciar (usado para o pré-ouvir ao ligar o botão). */
export function tocar(nome: Som, forcar = false) {
  if (!ligado && !forcar) return
  try {
    const agora = performance.now()
    if (!forcar && agora - (ultimo[nome] ?? -1000) < 45) return
    ultimo[nome] = agora
    const c = motor()
    if (!c) return
    if (c.state === 'suspended') void c.resume()
    RECEITAS[nome](c, c.currentTime + 0.005)
  } catch {
    /* sem áudio disponível */
  }
}

/** Vibração curta junto do som (só onde o aparelho deixa). */
export function tremer(padrao: number | number[] = 14) {
  if (!ligado) return
  try {
    navigator.vibrate?.(padrao)
  } catch {
    /* sem suporte */
  }
}

/**
 * Sons automáticos para o app inteiro, sem mexer em cada tela:
 * - botões de marcar (checks) tocam "marcar" ou "desmarcar";
 * - abas e links tocam "nav"; os demais botões, um toque suave;
 * - folhas que abrem e fecham tocam "abrir" e "fechar";
 * - avisos de erro tocam "erro".
 */
export function instalarSomGlobal() {
  const CHECKS = '.dia-caixa, .tr-check, .wk-passo-marca, .id-estrela, .dia-prio-marca'
  document.addEventListener(
    'click',
    (e) => {
      if (!(e.target instanceof Element)) return
      const alvo = e.target.closest('button, a, summary')
      if (!alvo || (alvo as HTMLButtonElement).disabled || alvo.hasAttribute('data-sem-som')) return
      if (alvo.matches(`button:has(${CHECKS}), button${CHECKS}`)) {
        const marcado = alvo.getAttribute('aria-pressed') === 'true'
        tocar(marcado ? 'desmarcar' : 'marcar')
        tremer(marcado ? 8 : 14)
        return
      }
      if (alvo.closest('.shell-nav') || alvo.tagName === 'A') return tocar('nav')
      if (alvo.matches('input, select, textarea')) return
      tocar('toque')
    },
    true,
  )
  new MutationObserver((lista) => {
    for (const m of lista) {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof Element)) return
        if (n.matches('.folha-fundo') || n.querySelector('.folha-fundo')) tocar('abrir')
        if (n.matches('.aviso-erro, .bloco-erro') || n.querySelector('.aviso-erro')) tocar('erro')
      })
      m.removedNodes.forEach((n) => {
        if (n instanceof Element && (n.matches('.folha-fundo') || n.querySelector('.folha-fundo'))) tocar('fechar')
      })
    }
  }).observe(document.body, { childList: true, subtree: true })
}
