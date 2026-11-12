import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'

export type EstadoDnsmk = {
  tem_jornada: boolean
  hoje: string
  inicio_sequencia?: string
  dia_da_jornada?: number
  sequencia_atual?: number
  checkin_hoje?: boolean
  melhor?: number
  total?: number
  proxima_meta?: number
  meta_anterior?: number
  pendentes?: string[]
  apoio_humor?: boolean
  recaida_hoje?: boolean
  proxima_licao?: { id: string; unidade: number; dia: number; liberada: boolean } | null
}

export type EstadoComJornada = Required<Omit<EstadoDnsmk, 'proxima_licao'>> & Pick<EstadoDnsmk, 'proxima_licao'>

export type ConfigDnsmk = { som: boolean; vibracao: boolean; gasto_semanal: number | null }

const PADRAO: ConfigDnsmk = { som: false, vibracao: true, gasto_semanal: null }

type Ctx = {
  estado: EstadoDnsmk | null
  erro: string | null
  recarregar: () => Promise<void>
  definirEstado: (e: EstadoDnsmk) => void
  config: ConfigDnsmk
  salvarConfig: (c: Partial<ConfigDnsmk>) => Promise<string | null>
}

const DnsmkCtx = createContext<Ctx | null>(null)

export function DnsmkProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoDnsmk | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [config, setConfig] = useState<ConfigDnsmk>(PADRAO)

  const recarregar = useCallback(async () => {
    setErro(null)
    const [e, c] = await Promise.all([
      supabase.rpc('dnsmk_estado'),
      supabase.from('dnsmk_config').select('som, vibracao, gasto_semanal').maybeSingle(),
    ])
    if (e.error) {
      setErro(mensagemDeErroBanco(e.error))
      return
    }
    setEstado(e.data as EstadoDnsmk)
    if (c.data) setConfig({ ...c.data, gasto_semanal: c.data.gasto_semanal === null ? null : Number(c.data.gasto_semanal) })
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  const salvarConfig = useCallback(
    async (parcial: Partial<ConfigDnsmk>) => {
      const novo = { ...config, ...parcial }
      setConfig(novo)
      const { data } = await supabase.auth.getUser()
      const { error } = await supabase.from('dnsmk_config').upsert({ user_id: data.user?.id, ...novo })
      return error ? mensagemDeErroBanco(error) : null
    },
    [config],
  )

  return (
    <DnsmkCtx.Provider value={{ estado, erro, recarregar, definirEstado: setEstado, config, salvarConfig }}>
      {children}
    </DnsmkCtx.Provider>
  )
}

export function useDnsmk() {
  const v = useContext(DnsmkCtx)
  if (!v) throw new Error('useDnsmk fora do DnsmkProvider')
  return v
}

export const MARCOS_BASE = [7, 14, 21, 30, 45, 60, 72, 80, 90, 100, 120, 150, 180, 270, 365]

/** Marcos até um pouco depois do valor atual (depois de 365, de 90 em 90). */
export function marcosAte(valor: number) {
  const lista = [...MARCOS_BASE]
  let m = 455
  while (m <= Math.max(valor, 365) + 180) {
    lista.push(m)
    m += 90
  }
  return lista
}
