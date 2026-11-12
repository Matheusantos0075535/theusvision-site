import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'

export type Status = 'ideia' | 'planejando' | 'executando' | 'feita' | 'arquivada'
export type Area = 'conteudo' | 'negocio' | 'pessoal' | 'projeto' | 'outro'

export type Etapa = { id: string; ideia_id: string; ordem: number; texto: string; feita: boolean }
export type Ideia = {
  id: string
  titulo: string
  link: string | null
  imagem_path: string | null
  proposito: string | null
  notas: string | null
  area: Area | null
  status: Status
  executar_em: string | null
  favorita: boolean
  criado_em: string
  atualizado_em: string
  etapas: Etapa[]
}

export const STATUS: { id: Status; rotulo: string }[] = [
  { id: 'ideia', rotulo: 'Ideia' },
  { id: 'planejando', rotulo: 'Planejando' },
  { id: 'executando', rotulo: 'Executando' },
  { id: 'feita', rotulo: 'Feita' },
  { id: 'arquivada', rotulo: 'Arquivada' },
]
export const AREAS: { id: Area; rotulo: string }[] = [
  { id: 'conteudo', rotulo: 'Conteúdo' },
  { id: 'negocio', rotulo: 'Negócio' },
  { id: 'projeto', rotulo: 'Projeto' },
  { id: 'pessoal', rotulo: 'Pessoal' },
  { id: 'outro', rotulo: 'Outro' },
]

type Ctx = {
  ideias: Ideia[]
  recarregar: () => Promise<void>
  atualizar: (id: string, campos: Partial<Omit<Ideia, 'id' | 'etapas'>>) => Promise<string | null>
}
const IdeiasCtx = createContext<Ctx | null>(null)

export function IdeiasProvider({ children }: { children: ReactNode }) {
  const [ideias, setIdeias] = useState<Ideia[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    const [i, e] = await Promise.all([
      supabase.from('ideias').select('id, titulo, link, imagem_path, proposito, notas, area, status, executar_em, favorita, criado_em, atualizado_em').order('atualizado_em', { ascending: false }),
      supabase.from('ideias_etapas').select('id, ideia_id, ordem, texto, feita').order('ordem'),
    ])
    const falha = i.error ?? e.error
    if (falha) return setErro(mensagemDeErroBanco(falha))
    setErro(null)
    const etapas = e.data as Etapa[]
    setIdeias((i.data as Omit<Ideia, 'etapas'>[]).map((x) => ({ ...x, etapas: etapas.filter((t) => t.ideia_id === x.id) })))
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  const atualizar = useCallback(
    async (id: string, campos: Partial<Omit<Ideia, 'id' | 'etapas'>>) => {
      setIdeias((l) => l?.map((x) => (x.id === id ? { ...x, ...campos } : x)) ?? l)
      const { error } = await supabase.from('ideias').update({ ...campos, atualizado_em: new Date().toISOString() }).eq('id', id)
      if (error) {
        void recarregar()
        return mensagemDeErroBanco(error)
      }
      return null
    },
    [recarregar],
  )

  if (!ideias) {
    return erro ? (
      <div className="bloco-erro" role="alert">
        <p>{erro}</p>
        <button className="btn btn-secundario" onClick={() => void recarregar()}>
          Tentar de novo
        </button>
      </div>
    ) : (
      <div className="carregando" role="status" aria-label="Carregando">
        <span className="giro" />
      </div>
    )
  }
  return <IdeiasCtx.Provider value={{ ideias, recarregar, atualizar }}>{children}</IdeiasCtx.Provider>
}

export function useIdeias() {
  const v = useContext(IdeiasCtx)
  if (!v) throw new Error('useIdeias fora do IdeiasProvider')
  return v
}
