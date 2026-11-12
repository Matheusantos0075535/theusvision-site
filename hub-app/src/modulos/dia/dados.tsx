import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'

export type Bloco = 'manha' | 'noite' | 'essencial'
export type Quando = 'todos' | 'semana' | 'fim_de_semana'

export type Item = {
  id: string
  bloco: Bloco
  quando: Quando
  titulo: string
  detalhe: string | null
  ordem: number
  ativo: boolean
}

export type Prioridade = { id: string; ordem: number; titulo: string; primeira_acao: string | null; feita: boolean }

export type Despejo = {
  id: string
  texto: string
  categoria: 'pessoal' | 'trabalho' | 'saude' | 'financas' | 'casa' | null
  proxima_acao: string | null
  prioridade: 'alta' | 'media' | 'baixa' | null
  origem: 'manual' | 'noite'
  resolvido: boolean
  criado_em: string
}

type Inicio = { hoje: string; dow: number; encerrado: boolean }

type Ctx = {
  hoje: string
  fimDeSemana: boolean
  itens: Item[]
  feitos: Set<string>
  prioridades: Prioridade[]
  despejo: Despejo[]
  encerrado: boolean
  erro: string | null
  recarregar: () => Promise<void>
  /** Cada ação devolve uma mensagem de erro ou null. */
  alternarFeito: (item: string) => Promise<string | null>
  salvarPrioridade: (ordem: number, titulo: string, acao: string) => Promise<string | null>
  alternarPrioridade: (p: Prioridade) => Promise<string | null>
  apagarPrioridade: (p: Prioridade) => Promise<string | null>
  encerrarDia: (primeiraAcao: string) => Promise<string | null>
}

const DiaCtx = createContext<Ctx | null>(null)

export function DiaProvider({ children }: { children: ReactNode }) {
  const [inicio, setInicio] = useState<Inicio | null>(null)
  const [itens, setItens] = useState<Item[] | null>(null)
  const [feitos, setFeitos] = useState<Set<string>>(new Set())
  const [prioridades, setPrioridades] = useState<Prioridade[]>([])
  const [despejo, setDespejo] = useState<Despejo[]>([])
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setErro(null)
    const ini = await supabase.rpc('dia_iniciar')
    if (ini.error) return setErro(mensagemDeErroBanco(ini.error))
    const i = ini.data as Inicio
    const [it, fe, pr, de] = await Promise.all([
      supabase.from('dia_itens').select('id, bloco, quando, titulo, detalhe, ordem, ativo').order('ordem'),
      supabase.from('dia_feitos').select('item_id').eq('dia', i.hoje),
      supabase.from('dia_prioridades').select('id, ordem, titulo, primeira_acao, feita').eq('dia', i.hoje).order('ordem'),
      supabase
        .from('dia_despejo')
        .select('id, texto, categoria, proxima_acao, prioridade, origem, resolvido, criado_em')
        .order('criado_em', { ascending: false }),
    ])
    const falha = it.error ?? fe.error ?? pr.error ?? de.error
    if (falha) return setErro(mensagemDeErroBanco(falha))
    setInicio(i)
    setItens(it.data as Item[])
    setFeitos(new Set((fe.data as { item_id: string }[]).map((f) => f.item_id)))
    setPrioridades(pr.data as Prioridade[])
    setDespejo(de.data as Despejo[])
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  const alternarFeito = useCallback(
    async (item: string) => {
      if (!inicio) return null
      const tinha = feitos.has(item)
      setFeitos((s) => {
        const n = new Set(s)
        if (tinha) n.delete(item)
        else n.add(item)
        return n
      })
      const r = tinha
        ? await supabase.from('dia_feitos').delete().eq('item_id', item).eq('dia', inicio.hoje)
        : await supabase.from('dia_feitos').insert({ item_id: item, dia: inicio.hoje })
      if (r.error) {
        void recarregar()
        return mensagemDeErroBanco(r.error)
      }
      return null
    },
    [inicio, feitos, recarregar],
  )

  const salvarPrioridade = useCallback(
    async (ordem: number, titulo: string, acao: string) => {
      if (!inicio) return null
      const atual = prioridades.find((p) => p.ordem === ordem)
      const dados = { titulo: titulo.trim(), primeira_acao: acao.trim() || null }
      const r = atual
        ? await supabase.from('dia_prioridades').update(dados).eq('id', atual.id)
        : await supabase.from('dia_prioridades').insert({ dia: inicio.hoje, ordem, ...dados })
      if (r.error) return mensagemDeErroBanco(r.error)
      await recarregar()
      return null
    },
    [inicio, prioridades, recarregar],
  )

  const alternarPrioridade = useCallback(
    async (p: Prioridade) => {
      setPrioridades((l) => l.map((x) => (x.id === p.id ? { ...x, feita: !x.feita } : x)))
      const r = await supabase.from('dia_prioridades').update({ feita: !p.feita }).eq('id', p.id)
      if (r.error) {
        void recarregar()
        return mensagemDeErroBanco(r.error)
      }
      return null
    },
    [recarregar],
  )

  const apagarPrioridade = useCallback(
    async (p: Prioridade) => {
      const r = await supabase.from('dia_prioridades').delete().eq('id', p.id)
      if (r.error) return mensagemDeErroBanco(r.error)
      await recarregar()
      return null
    },
    [recarregar],
  )

  const encerrarDia = useCallback(
    async (primeiraAcao: string) => {
      if (!inicio) return null
      const r = await supabase
        .from('dia_encerramentos')
        .upsert({ dia: inicio.hoje, primeira_acao_amanha: primeiraAcao.trim() || null }, { onConflict: 'user_id,dia' })
      if (r.error) return mensagemDeErroBanco(r.error)
      await recarregar()
      return null
    },
    [inicio, recarregar],
  )

  const valor: Ctx = {
    hoje: inicio?.hoje ?? '',
    fimDeSemana: inicio ? inicio.dow === 0 || inicio.dow === 6 : false,
    itens: itens ?? [],
    feitos,
    prioridades,
    despejo,
    encerrado: inicio?.encerrado ?? false,
    erro,
    recarregar,
    alternarFeito,
    salvarPrioridade,
    alternarPrioridade,
    apagarPrioridade,
    encerrarDia,
  }
  return (
    <DiaCtx.Provider value={valor}>
      {inicio && itens ? children : erro ? <PlaceholderErro erro={erro} tentar={recarregar} /> : <PlaceholderCarregando />}
    </DiaCtx.Provider>
  )
}

function PlaceholderCarregando() {
  return (
    <div className="carregando" role="status" aria-label="Carregando">
      <span className="giro" />
    </div>
  )
}
function PlaceholderErro({ erro, tentar }: { erro: string; tentar: () => void }) {
  return (
    <div className="bloco-erro" role="alert">
      <p>{erro}</p>
      <button className="btn btn-secundario" onClick={tentar}>
        Tentar de novo
      </button>
    </div>
  )
}

export function useDia() {
  const v = useContext(DiaCtx)
  if (!v) throw new Error('useDia fora do DiaProvider')
  return v
}

/** Itens que valem para o dia de hoje (semana x fim de semana), ativos e na ordem. */
export function itensDeHoje(itens: Item[], bloco: Bloco, fimDeSemana: boolean) {
  const quando: Quando = fimDeSemana ? 'fim_de_semana' : 'semana'
  return itens.filter((i) => i.bloco === bloco && i.ativo && (i.quando === 'todos' || i.quando === quando)).sort((a, b) => a.ordem - b.ordem)
}
