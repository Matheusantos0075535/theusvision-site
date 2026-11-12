import { useEffect, useState } from 'react'

export function useMidia(consulta: string) {
  const [bate, setBate] = useState(() => window.matchMedia(consulta).matches)
  useEffect(() => {
    const m = window.matchMedia(consulta)
    const mudar = () => setBate(m.matches)
    mudar()
    m.addEventListener('change', mudar)
    return () => m.removeEventListener('change', mudar)
  }, [consulta])
  return bate
}

export function useMovimentoReduzido() {
  return useMidia('(prefers-reduced-motion: reduce)')
}

/** Com mouse: 'painel' (largo) ou 'flutuante' (até 640px). Sem mouse: 'toque'. */
export type ModoInteracao = 'painel' | 'flutuante' | 'toque'

export function useModoInteracao(): ModoInteracao {
  const temMouse = useMidia('(hover: hover) and (pointer: fine)')
  const estreito = useMidia('(max-width: 640px)')
  if (!temMouse) return 'toque'
  return estreito ? 'flutuante' : 'painel'
}
