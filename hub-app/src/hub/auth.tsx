import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export type Perfil = 'admin' | 'editor' | 'viewer'
export type Acesso = { nome: string; perfil: Perfil }

type EstadoAuth = {
  carregando: boolean
  sessao: Session | null
  acesso: Acesso | null
  emailConfirmado: boolean
  falhaAoVerificar: boolean
  sair: () => Promise<void>
  recarregarAcesso: () => Promise<void>
}

const Ctx = createContext<EstadoAuth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [sessaoPronta, setSessaoPronta] = useState(false)
  const [acesso, setAcesso] = useState<Acesso | null>(null)
  const [acessoPronto, setAcessoPronto] = useState(false)
  const [falhaAoVerificar, setFalha] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setSessaoPronta(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSessao(s)
      setSessaoPronta(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = sessao?.user.id ?? null
  const emailConfirmado = Boolean(sessao?.user.email_confirmed_at)

  const recarregarAcesso = useCallback(async () => {
    if (!userId || !emailConfirmado) {
      setAcesso(null)
      setAcessoPronto(true)
      return
    }
    setAcessoPronto(false)
    const { data, error } = await supabase.rpc('hub_meu_acesso')
    if (error) {
      setFalha(true)
      setAcesso(null)
    } else {
      setFalha(false)
      const linha = Array.isArray(data) ? data[0] : null
      setAcesso(linha ? { nome: linha.nome, perfil: linha.perfil } : null)
    }
    setAcessoPronto(true)
  }, [userId, emailConfirmado])

  useEffect(() => {
    if (!sessaoPronta) return
    void recarregarAcesso()
  }, [sessaoPronta, recarregarAcesso])

  const sair = useCallback(async () => {
    await supabase.auth.signOut()
    setAcesso(null)
  }, [])

  const valor = useMemo<EstadoAuth>(
    () => ({
      carregando: !sessaoPronta || (Boolean(userId) && !acessoPronto),
      sessao,
      acesso,
      emailConfirmado,
      falhaAoVerificar,
      sair,
      recarregarAcesso,
    }),
    [sessaoPronta, userId, acessoPronto, sessao, acesso, emailConfirmado, falhaAoVerificar, sair, recarregarAcesso],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth fora do AuthProvider')
  return v
}
