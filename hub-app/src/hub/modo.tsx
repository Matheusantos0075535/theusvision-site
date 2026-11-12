import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { Modo } from './modulos'

const CHAVE = 'tv-modo'

function ler(): Modo {
  try {
    return localStorage.getItem(CHAVE) === 'work' ? 'work' : 'pessoal'
  } catch {
    return 'pessoal'
  }
}

type Ctx = { modo: Modo; trocar: (m: Modo) => void }
const ModoCtx = createContext<Ctx | null>(null)

/** Pessoal ou Work: lembrado neste aparelho. Só muda quais módulos aparecem no painel. */
export function ModoProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<Modo>(ler)
  const trocar = useCallback((m: Modo) => {
    setModo(m)
    try {
      localStorage.setItem(CHAVE, m)
    } catch {
      /* sem armazenamento: segue só nesta sessão */
    }
  }, [])
  return <ModoCtx.Provider value={{ modo, trocar }}>{children}</ModoCtx.Provider>
}

export function useModo() {
  const v = useContext(ModoCtx)
  if (!v) throw new Error('useModo fora do ModoProvider')
  return v
}
