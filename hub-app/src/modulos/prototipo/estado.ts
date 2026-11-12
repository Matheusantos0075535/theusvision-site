import { useCallback, useEffect, useState } from 'react'

/**
 * Estado dos protótipos: fica só neste aparelho (localStorage). Serve para testar o jeito de usar
 * antes de ligar no banco. Se o armazenamento falhar (aba anônima), funciona só na sessão.
 */
export function usePersistido<T>(chave: string, inicial: () => T) {
  const [valor, setValor] = useState<T>(() => {
    try {
      const s = localStorage.getItem(chave)
      if (s) return JSON.parse(s) as T
    } catch {
      /* sem armazenamento */
    }
    return inicial()
  })
  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor))
    } catch {
      /* sem armazenamento */
    }
  }, [chave, valor])
  const recomecar = useCallback(() => setValor(inicial()), [inicial])
  return [valor, setValor, recomecar] as const
}

export const uid = () => Math.random().toString(36).slice(2, 10)
export const real = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: v % 1 ? 2 : 0 })
export const numero = (s: string) => {
  const n = Number(s.replace(/\./g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}
