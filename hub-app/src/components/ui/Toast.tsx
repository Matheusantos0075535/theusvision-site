import { Info } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type Ctx = { mostrar: (texto: string, opcoes?: { comNav?: boolean }) => void }
const ToastCtx = createContext<Ctx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [atual, setAtual] = useState<{ id: number; texto: string; comNav: boolean } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const mostrar = useCallback((texto: string, opcoes?: { comNav?: boolean }) => {
    window.clearTimeout(timer.current)
    setAtual({ id: Date.now(), texto, comNav: Boolean(opcoes?.comNav) })
    timer.current = window.setTimeout(() => setAtual(null), 3200)
  }, [])

  return (
    <ToastCtx.Provider value={{ mostrar }}>
      {children}
      <div aria-live="polite" role="status">
        {atual && (
          <div key={atual.id} className={`toast${atual.comNav ? ' com-nav' : ''}`}>
            <Info aria-hidden />
            <span>{atual.texto}</span>
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const v = useContext(ToastCtx)
  if (!v) throw new Error('useToast fora do ToastProvider')
  return v
}
