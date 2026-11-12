import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { atualizarOuCriar } from '../../lib/salvar'

export type EstadoLivro = 'quero_ler' | 'lendo' | 'concluido' | 'pausado'

export type Livro = {
  id: string
  titulo: string
  autor: string | null
  capa_path: string | null
  total_paginas: number
  pagina_atual: number
  estado: EstadoLivro
  iniciado_em: string | null
  concluido_em: string | null
  nota_final: number | null
  resumo_final: string | null
  atualizado_em: string
}

export type Capitulo = { id: string; livro_id: string; ordem: number; nome: string; pagina_inicial: number }

export type EstadoLeitura = {
  hoje: string
  ofensiva: number
  melhor: number
  total_dias: number
  hoje_cumprido: boolean
  hoje_paginas: number
  hoje_minutos: number
  meta_paginas: number | null
  meta_minutos: number | null
  meta_anual: number
  proxima_meta: number
  meta_anterior: number
  livro_atual: { id: string; titulo: string; pct: number } | null
  congelamento_disponivel: boolean
  pode_congelar: boolean
  paginas_total: number
  livros_ano: number
}

export type ConfigLeitura = {
  meta_paginas: number | null
  meta_minutos: number | null
  meta_anual_livros: number
  som: boolean
  vibracao: boolean
}

const PADRAO: ConfigLeitura = { meta_paginas: 10, meta_minutos: 10, meta_anual_livros: 12, som: false, vibracao: true }

export const ROTULO_ESTADO: Record<EstadoLivro, string> = {
  lendo: 'Lendo',
  quero_ler: 'Quero ler',
  pausado: 'Pausado',
  concluido: 'Concluído',
}

type Ctx = {
  estado: EstadoLeitura | null
  livros: Livro[] | null
  config: ConfigLeitura
  erro: string | null
  recarregar: () => Promise<void>
  salvarConfig: (c: Partial<ConfigLeitura>) => Promise<string | null>
}

const LeituraCtx = createContext<Ctx | null>(null)

export function LeituraProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoLeitura | null>(null)
  const [livros, setLivros] = useState<Livro[] | null>(null)
  const [config, setConfig] = useState<ConfigLeitura>(PADRAO)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setErro(null)
    const [e, l, c] = await Promise.all([
      supabase.rpc('leit_estado'),
      supabase.from('leit_livros').select('*').order('atualizado_em', { ascending: false }),
      supabase.from('leit_config').select('meta_paginas, meta_minutos, meta_anual_livros, som, vibracao').maybeSingle(),
    ])
    if (e.error || l.error) {
      setErro(mensagemDeErroBanco(e.error ?? l.error))
      return
    }
    setEstado(e.data as EstadoLeitura)
    setLivros(l.data as Livro[])
    if (c.data) setConfig(c.data as ConfigLeitura)
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  const salvarConfig = useCallback(
    async (parcial: Partial<ConfigLeitura>) => {
      const novo = { ...config, ...parcial }
      setConfig(novo)
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id
      if (!uid) return 'Sessão expirada. Entre de novo.'
      const error = await atualizarOuCriar('leit_config', { user_id: uid }, { ...novo }, { user_id: uid, ...novo })
      if (error) return mensagemDeErroBanco(error)
      void recarregar()
      return null
    },
    [config, recarregar],
  )

  return (
    <LeituraCtx.Provider value={{ estado, livros, config, erro, recarregar, salvarConfig }}>{children}</LeituraCtx.Provider>
  )
}

export function useLeitura() {
  const v = useContext(LeituraCtx)
  if (!v) throw new Error('useLeitura fora do LeituraProvider')
  return v
}

export const pct = (l: Pick<Livro, 'pagina_atual' | 'total_paginas'>) =>
  Math.round((l.pagina_atual * 100) / Math.max(1, l.total_paginas))

/** Capítulos com página final; sem capítulos cadastrados, divide em 10 partes de 10%. */
export function divisoes(livro: Pick<Livro, 'total_paginas'>, capitulos: Capitulo[]) {
  if (capitulos.length) {
    const ord = [...capitulos].sort((a, b) => a.pagina_inicial - b.pagina_inicial || a.ordem - b.ordem)
    return ord.map((c, i) => ({
      id: c.id,
      capitulo_id: c.id as string | null,
      parte: null as number | null,
      rotulo: c.nome,
      inicio: c.pagina_inicial,
      fim: i < ord.length - 1 ? ord[i + 1].pagina_inicial - 1 : livro.total_paginas,
    }))
  }
  return Array.from({ length: 10 }, (_, i) => ({
    id: `parte-${i + 1}`,
    capitulo_id: null as string | null,
    parte: (i + 1) as number | null,
    rotulo: `Parte ${i + 1} de 10`,
    inicio: Math.ceil((livro.total_paginas * i) / 10) + 1,
    fim: Math.ceil((livro.total_paginas * (i + 1)) / 10),
  }))
}

export const MARCOS_OFENSIVA = [7, 14, 21, 30, 60, 100, 200, 365, 500, 730, 1000]
export const MARCOS_PAGINAS = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]

export function textoMeta(e: Pick<EstadoLeitura, 'meta_paginas' | 'meta_minutos'>) {
  const p = e.meta_paginas ? `${e.meta_paginas} páginas` : null
  const m = e.meta_minutos ? `${e.meta_minutos} minutos` : null
  return [p, m].filter(Boolean).join(' ou ')
}
