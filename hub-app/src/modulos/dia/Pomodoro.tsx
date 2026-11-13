import { Pause, Play, RotateCcw, Settings2, Timer } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { tocar, tremer } from '../../lib/som'
import { hojeBrasiliaIso } from '../../lib/tempo'

type Fase = 'foco' | 'pausa'
type Estado = {
  foco: number
  pausa: number
  fase: Fase
  /** Quando a fase acaba (ms desde 1970); null = parado. */
  fimEm: number | null
  /** Tempo que falta quando está parado (ms). */
  restante: number
  ciclos: number
  diaCiclos: string
}

const CHAVE = 'tv-pomodoro'
const MIN = 60_000

function inicial(): Estado {
  const padrao: Estado = { foco: 20, pausa: 10, fase: 'foco', fimEm: null, restante: 20 * MIN, ciclos: 0, diaCiclos: hojeBrasiliaIso() }
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? 'null') as Estado | null
    if (!salvo || typeof salvo.foco !== 'number') return padrao
    const e = { ...padrao, ...salvo }
    if (e.diaCiclos !== hojeBrasiliaIso()) return { ...e, ciclos: 0, diaCiclos: hojeBrasiliaIso() }
    return e
  } catch {
    return padrao
  }
}

type Ctx = {
  e: Estado
  falta: number
  total: number
  rodando: boolean
  comecou: boolean
  alternar: () => void
  zerar: () => void
  ajustar: (foco: number, pausa: number) => void
  cartaoVisivel: boolean
  setCartaoVisivel: (v: boolean) => void
}
const PomoCtx = createContext<Ctx | null>(null)

/** O timer vive acima das abas: continua contando no Despejo, nas Rotinas e com a tela rolada. */
export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [e, setE] = useState<Estado>(inicial)
  const [agora, setAgora] = useState(() => Date.now())
  const [cartaoVisivel, setCartaoVisivel] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(e))
    } catch {
      /* sem armazenamento: o timer só não sobrevive ao recarregar */
    }
  }, [e])

  useEffect(() => {
    if (e.fimEm == null) return
    const t = window.setInterval(() => setAgora(Date.now()), 500)
    return () => window.clearInterval(t)
  }, [e.fimEm])

  // Fim de uma fase: foco vira descanso (já contando); descanso termina parado, pronto para o próximo foco.
  useEffect(() => {
    if (e.fimEm == null || agora < e.fimEm) return
    // Só toca se acabou agora (não ao voltar para o app muito depois).
    if (agora - e.fimEm < 5000) {
      tocar('timer')
      tremer([180, 90, 180])
    }
    setE((x) => {
      if (x.fimEm == null) return x
      const hoje = hojeBrasiliaIso()
      if (x.fase === 'foco') {
        const ciclos = x.diaCiclos === hoje ? x.ciclos + 1 : 1
        const fimPausa = x.fimEm + x.pausa * MIN
        if (Date.now() >= fimPausa) return { ...x, fase: 'foco', fimEm: null, restante: x.foco * MIN, ciclos, diaCiclos: hoje }
        return { ...x, fase: 'pausa', fimEm: fimPausa, restante: x.pausa * MIN, ciclos, diaCiclos: hoje }
      }
      return { ...x, fase: 'foco', fimEm: null, restante: x.foco * MIN }
    })
  }, [agora, e.fimEm])

  const total = (e.fase === 'foco' ? e.foco : e.pausa) * MIN
  const falta = e.fimEm != null ? Math.max(0, e.fimEm - agora) : e.restante
  const rodando = e.fimEm != null
  const comecou = rodando || falta < total

  const alternar = useCallback(() => {
    setAgora(Date.now())
    setE((x) => (x.fimEm != null ? { ...x, fimEm: null, restante: Math.max(0, x.fimEm - Date.now()) } : { ...x, fimEm: Date.now() + x.restante }))
  }, [])
  const zerar = useCallback(() => setE((x) => ({ ...x, fase: 'foco', fimEm: null, restante: x.foco * MIN })), [])
  const ajustar = useCallback(
    (foco: number, pausa: number) =>
      setE((x) => {
        const f = Math.min(120, Math.max(1, Math.round(foco)))
        const p = Math.min(60, Math.max(1, Math.round(pausa)))
        // Se estava parado no começo de uma fase, já mostra o tempo novo.
        const parado = x.fimEm == null && x.restante === (x.fase === 'foco' ? x.foco : x.pausa) * MIN
        return { ...x, foco: f, pausa: p, restante: parado ? (x.fase === 'foco' ? f : p) * MIN : x.restante }
      }),
    [],
  )

  return (
    <PomoCtx.Provider value={{ e, falta, total, rodando, comecou, alternar, zerar, ajustar, cartaoVisivel, setCartaoVisivel }}>
      {children}
      <PomodoroFlutuante />
    </PomoCtx.Provider>
  )
}

function usePomodoro() {
  const v = useContext(PomoCtx)
  if (!v) throw new Error('usePomodoro fora do PomodoroProvider')
  return v
}

const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function Anel({ falta, total, tamanho }: { falta: number; total: number; tamanho: number }) {
  const r = tamanho / 2 - 4
  const c = 2 * Math.PI * r
  const feito = total > 0 ? 1 - falta / total : 0
  return (
    <svg className="pomo-anel" width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden>
      <circle cx={tamanho / 2} cy={tamanho / 2} r={r} className="pomo-anel-fundo" />
      <circle
        cx={tamanho / 2}
        cy={tamanho / 2}
        r={r}
        className="pomo-anel-progresso"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - feito)}
        transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
      />
    </svg>
  )
}

/** Cartão discreto entre o topo do dia e a rotina da manhã. */
export function PomodoroCartao() {
  const { e, falta, total, rodando, comecou, alternar, zerar, ajustar, setCartaoVisivel } = usePomodoro()
  const ref = useRef<HTMLElement>(null)
  const [ajustes, setAjustes] = useState(false)
  const [foco, setFoco] = useState(String(e.foco))
  const [pausa, setPausa] = useState(String(e.pausa))

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const o = new IntersectionObserver(([x]) => setCartaoVisivel(x.isIntersecting), { threshold: 0.15 })
    o.observe(el)
    return () => {
      o.disconnect()
      setCartaoVisivel(false)
    }
  }, [setCartaoVisivel])

  const descanso = e.fase === 'pausa'
  return (
    <section ref={ref} id="pomodoro" className="pomo" data-fase={e.fase} data-rodando={rodando || undefined} aria-label="Timer de foco">
      <div className="pomo-relogio">
        <Anel falta={falta} total={total} tamanho={56} />
        <Timer aria-hidden />
      </div>
      <div className="pomo-textos">
        <span className="pomo-fase">{descanso ? 'Descanso' : 'Foco'}{e.ciclos > 0 && <i> · {e.ciclos} {e.ciclos === 1 ? 'ciclo' : 'ciclos'} hoje</i>}</span>
        <b className="pomo-tempo" aria-live="off">
          {mmss(falta)}
        </b>
        <small>{descanso ? 'Levante, beba água, olhe longe.' : rodando ? 'Uma coisa só até o sino.' : `${e.foco} min de foco · ${e.pausa} de descanso`}</small>
      </div>
      <div className="pomo-botoes">
        {comecou && (
          <button className="btn-icone" onClick={zerar} aria-label="Recomeçar o timer">
            <RotateCcw aria-hidden />
          </button>
        )}
        <button className="btn-icone" onClick={() => setAjustes((a) => !a)} aria-expanded={ajustes} aria-label="Ajustar tempos">
          <Settings2 aria-hidden />
        </button>
        <button className="pomo-play" onClick={alternar} aria-label={rodando ? 'Pausar' : comecou ? 'Continuar' : 'Começar foco'}>
          {rodando ? <Pause aria-hidden /> : <Play aria-hidden />}
        </button>
      </div>
      {ajustes && (
        <form
          className="pomo-ajustes"
          onSubmit={(ev) => {
            ev.preventDefault()
            ajustar(Number(foco) || e.foco, Number(pausa) || e.pausa)
            setAjustes(false)
          }}
        >
          <label>
            <span>Foco (min)</span>
            <input className="entrada" type="number" inputMode="numeric" min={1} max={120} value={foco} onChange={(ev) => setFoco(ev.target.value)} />
          </label>
          <label>
            <span>Descanso (min)</span>
            <input className="entrada" type="number" inputMode="numeric" min={1} max={60} value={pausa} onChange={(ev) => setPausa(ev.target.value)} />
          </label>
          <button className="btn btn-primario">Salvar</button>
        </form>
      )}
    </section>
  )
}

/** Quando o cartão sai da tela (rolou ou mudou de aba), o timer vira um botão flutuante. */
function PomodoroFlutuante() {
  const { e, falta, total, rodando, comecou, alternar, cartaoVisivel } = usePomodoro()
  const navegar = useNavigate()
  const { pathname } = useLocation()
  if (!comecou || cartaoVisivel) return null
  const voltar = () => {
    const ir = () => document.getElementById('pomodoro')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    if (pathname.replace(/\/$/, '').endsWith('/dia')) ir()
    else {
      navegar('/dia')
      window.setTimeout(ir, 120)
    }
  }
  return (
    <div className="pomo-flutuante" data-fase={e.fase} data-rodando={rodando || undefined}>
      <button className="pomo-flut-tempo" onClick={voltar} aria-label={`${e.fase === 'foco' ? 'Foco' : 'Descanso'}: faltam ${mmss(falta)}. Ir para o timer`}>
        <Anel falta={falta} total={total} tamanho={40} />
        <b>{mmss(falta)}</b>
      </button>
      <button className="pomo-flut-play" onClick={alternar} aria-label={rodando ? 'Pausar' : 'Continuar'}>
        {rodando ? <Pause aria-hidden /> : <Play aria-hidden />}
      </button>
    </div>
  )
}
