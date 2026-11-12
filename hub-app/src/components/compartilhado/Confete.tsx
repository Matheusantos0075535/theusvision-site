import { useEffect, useRef } from 'react'

const CORES = ['#FF9F11', '#FFC266', '#EFEAF7', '#9B7BE0', '#E08707']

/** Confete sutil: poucas peças, cai em ~2,4 s e some. Não é usado com movimento reduzido. */
export function Confete() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const c = canvas.getContext('2d')
    if (!c) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    c.scale(dpr, dpr)
    const pecas = Array.from({ length: 70 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.5,
      y: h * 0.32 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 7,
      vy: -Math.random() * 9 - 3,
      g: 0.22 + Math.random() * 0.08,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      tam: 5 + Math.random() * 5,
      cor: CORES[Math.floor(Math.random() * CORES.length)],
    }))
    const inicio = performance.now()
    let quadro = 0
    const passo = (t: number) => {
      const decorrido = t - inicio
      c.clearRect(0, 0, w, h)
      const alfa = decorrido > 1800 ? Math.max(0, 1 - (decorrido - 1800) / 600) : 1
      for (const p of pecas) {
        p.vy += p.g
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.r += p.vr
        c.save()
        c.globalAlpha = alfa
        c.translate(p.x, p.y)
        c.rotate(p.r)
        c.fillStyle = p.cor
        c.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2)
        c.restore()
      }
      if (decorrido < 2400) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [])
  return <canvas ref={ref} className="confete" aria-hidden />
}
