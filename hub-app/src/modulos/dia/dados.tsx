import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { diaDaSemana, hojeBrasiliaIso, somarDias } from '../../lib/tempo'
import { atualizarOuCriar } from '../../lib/salvar'

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
/** Prioridade de um dia anterior que não foi feita nem trazida para hoje. */
export type Atrasada = Prioridade & { dia: string }

/** Limite do banco: até 20 prioridades por dia. */
export const MAX_PRIORIDADES = 20

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
  /** O dia real de hoje (do banco) e o dia que está na tela. */
  hojeReal: string
  dia: string
  /** Só hoje e ontem aceitam marcações (regra do banco); os outros dias são só consulta. */
  editavel: boolean
  fimDeSemana: boolean
  irPara: (iso: string) => void
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
  /** O que ficou para trás nos últimos 7 dias. */
  atrasadas: Atrasada[]
  trazerParaHoje: (p: Atrasada) => Promise<string | null>
  deixarPraLa: (p: Atrasada) => Promise<string | null>
  /** Cria uma prioridade hoje (no primeiro número livre). */
  adicionarHoje: (titulo: string, acao: string | null) => Promise<string | null>
  /** Leva um item do Despejo para o A fazer de hoje e o marca como resolvido. */
  despejoParaHoje: (d: Despejo) => Promise<string | null>
}

const DiaCtx = createContext<Ctx | null>(null)

export function DiaProvider({ children }: { children: ReactNode }) {
  const [inicio, setInicio] = useState<Inicio | null>(null)
  const [itens, setItens] = useState<Item[] | null>(null)
  /** null = acompanhando "hoje" (segue sozinho na virada do dia). */
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const [feitos, setFeitos] = useState<Set<string>>(new Set())
  const [prioridades, setPrioridades] = useState<Prioridade[]>([])
  const [encerrado, setEncerrado] = useState(false)
  const [despejo, setDespejo] = useState<Despejo[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [atrasadas, setAtrasadas] = useState<Atrasada[]>([])
  const ultimaChecagem = useRef(0)

  const hojeReal = inicio?.hoje ?? ''
  const dia = escolhido ?? hojeReal

  const carregarBase = useCallback(async () => {
    setErro(null)
    const ini = await supabase.rpc('dia_iniciar')
    if (ini.error) return setErro(mensagemDeErroBanco(ini.error))
    const [it, de] = await Promise.all([
      supabase.from('dia_itens').select('id, bloco, quando, titulo, detalhe, ordem, ativo').order('ordem'),
      supabase
        .from('dia_despejo')
        .select('id, texto, categoria, proxima_acao, prioridade, origem, resolvido, criado_em')
        .order('criado_em', { ascending: false }),
    ])
    const falha = it.error ?? de.error
    if (falha) return setErro(mensagemDeErroBanco(falha))
    setInicio(ini.data as Inicio)
    setItens(it.data as Item[])
    setDespejo(de.data as Despejo[])
  }, [])

  const carregarDia = useCallback(async (d: string) => {
    const [fe, pr, en] = await Promise.all([
      supabase.from('dia_feitos').select('item_id').eq('dia', d),
      supabase.from('dia_prioridades').select('id, ordem, titulo, primeira_acao, feita').eq('dia', d).order('ordem'),
      supabase.from('dia_encerramentos').select('dia').eq('dia', d),
    ])
    const falha = fe.error ?? pr.error ?? en.error
    if (falha) return setErro(mensagemDeErroBanco(falha))
    setFeitos(new Set((fe.data as { item_id: string }[]).map((f) => f.item_id)))
    setPrioridades(pr.data as Prioridade[])
    setEncerrado((en.data as unknown[]).length > 0)
  }, [])

  const carregarAtrasadas = useCallback(async (hoje: string) => {
    const r = await supabase
      .from('dia_prioridades')
      .select('id, dia, ordem, titulo, primeira_acao, feita')
      .gte('dia', somarDias(hoje, -7))
      .lt('dia', hoje)
      .eq('feita', false)
      .eq('levada', false)
      .order('dia', { ascending: false })
      .order('ordem')
    // Sem a coluna nova (migração ainda não rodada) a lista só fica vazia.
    setAtrasadas(r.error ? [] : (r.data as Atrasada[]))
  }, [])

  const recarregar = useCallback(async () => {
    await carregarBase()
  }, [carregarBase])

  useEffect(() => {
    if (hojeReal) void carregarAtrasadas(hojeReal)
  }, [hojeReal, carregarAtrasadas])

  useEffect(() => {
    void carregarBase()
  }, [carregarBase])

  useEffect(() => {
    if (hojeReal) void carregarDia(dia)
  }, [dia, hojeReal, carregarDia])

  // Virada do dia: se o app ficou aberto na meia-noite, pede o dia novo ao banco (no máximo a cada 20 s).
  useEffect(() => {
    if (!hojeReal) return
    const checar = () => {
      if (document.hidden || hojeReal === hojeBrasiliaIso()) return
      if (Date.now() - ultimaChecagem.current < 20_000) return
      ultimaChecagem.current = Date.now()
      void carregarBase()
    }
    const t = window.setInterval(checar, 30_000)
    document.addEventListener('visibilitychange', checar)
    window.addEventListener('focus', checar)
    return () => {
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', checar)
      window.removeEventListener('focus', checar)
    }
  }, [hojeReal, carregarBase])

  const irPara = useCallback(
    (iso: string) => setEscolhido(iso === hojeReal ? null : iso),
    [hojeReal],
  )

  const editavel = !!hojeReal && (dia === hojeReal || dia === somarDias(hojeReal, -1))

  const alternarFeito = useCallback(
    async (item: string) => {
      if (!hojeReal) return null
      const tinha = feitos.has(item)
      setFeitos((s) => {
        const n = new Set(s)
        if (tinha) n.delete(item)
        else n.add(item)
        return n
      })
      const r = tinha
        ? await supabase.from('dia_feitos').delete().eq('item_id', item).eq('dia', dia)
        : await supabase.from('dia_feitos').insert({ item_id: item, dia })
      if (r.error) {
        void carregarDia(dia)
        return mensagemDeErroBanco(r.error)
      }
      return null
    },
    [hojeReal, dia, feitos, carregarDia],
  )

  const salvarPrioridade = useCallback(
    async (ordem: number, titulo: string, acao: string) => {
      const atual = prioridades.find((p) => p.ordem === ordem)
      const dados = { titulo: titulo.trim(), primeira_acao: acao.trim() || null }
      const r = atual
        ? await supabase.from('dia_prioridades').update(dados).eq('id', atual.id)
        : await supabase.from('dia_prioridades').insert({ dia, ordem, ...dados })
      if (r.error) return mensagemDeErroBanco(r.error)
      await carregarDia(dia)
      return null
    },
    [dia, prioridades, carregarDia],
  )

  const alternarPrioridade = useCallback(
    async (p: Prioridade) => {
      setPrioridades((l) => l.map((x) => (x.id === p.id ? { ...x, feita: !x.feita } : x)))
      const r = await supabase.from('dia_prioridades').update({ feita: !p.feita }).eq('id', p.id)
      if (r.error) {
        void carregarDia(dia)
        return mensagemDeErroBanco(r.error)
      }
      return null
    },
    [dia, carregarDia],
  )

  const apagarPrioridade = useCallback(
    async (p: Prioridade) => {
      const r = await supabase.from('dia_prioridades').delete().eq('id', p.id)
      if (r.error) return mensagemDeErroBanco(r.error)
      await carregarDia(dia)
      return null
    },
    [dia, carregarDia],
  )

  const encerrarDia = useCallback(
    async (primeiraAcao: string) => {
      const texto = primeiraAcao.trim() || null
      const erro = await atualizarOuCriar('dia_encerramentos', { dia }, { primeira_acao_amanha: texto }, { dia, primeira_acao_amanha: texto })
      if (erro) return mensagemDeErroBanco(erro)
      await carregarDia(dia)
      return null
    },
    [dia, carregarDia],
  )

  /** Primeiro número livre de hoje, olhando o banco (a tela pode estar em outro dia). */
  const proximaOrdemHoje = useCallback(async (): Promise<number | string> => {
    const r = await supabase.from('dia_prioridades').select('ordem').eq('dia', hojeReal)
    if (r.error) return mensagemDeErroBanco(r.error)
    const usadas = new Set((r.data as { ordem: number }[]).map((x) => x.ordem))
    for (let n = 1; n <= MAX_PRIORIDADES; n++) if (!usadas.has(n)) return n
    return `Hoje já tem ${MAX_PRIORIDADES} prioridades. Conclua ou remova alguma antes.`
  }, [hojeReal])

  const adicionarHoje = useCallback(
    async (titulo: string, acao: string | null) => {
      const ordem = await proximaOrdemHoje()
      if (typeof ordem === 'string') return ordem
      const r = await supabase
        .from('dia_prioridades')
        .insert({ dia: hojeReal, ordem, titulo: titulo.trim().slice(0, 160), primeira_acao: acao?.trim().slice(0, 200) || null })
      if (r.error) return mensagemDeErroBanco(r.error)
      if (dia === hojeReal) await carregarDia(dia)
      return null
    },
    [proximaOrdemHoje, hojeReal, dia, carregarDia],
  )

  const trazerParaHoje = useCallback(
    async (p: Atrasada) => {
      const e = await adicionarHoje(p.titulo, p.primeira_acao)
      if (e) return e
      const r = await supabase.from('dia_prioridades').update({ levada: true }).eq('id', p.id)
      setAtrasadas((l) => l.filter((x) => x.id !== p.id))
      return r.error ? mensagemDeErroBanco(r.error) : null
    },
    [adicionarHoje],
  )

  const deixarPraLa = useCallback(async (p: Atrasada) => {
    setAtrasadas((l) => l.filter((x) => x.id !== p.id))
    const r = await supabase.from('dia_prioridades').update({ levada: true }).eq('id', p.id)
    return r.error ? mensagemDeErroBanco(r.error) : null
  }, [])

  const despejoParaHoje = useCallback(
    async (d: Despejo) => {
      const e = await adicionarHoje(d.texto, d.proxima_acao)
      if (e) return e
      const r = await supabase.from('dia_despejo').update({ resolvido: true }).eq('id', d.id)
      setDespejo((l) => l.map((x) => (x.id === d.id ? { ...x, resolvido: true } : x)))
      return r.error ? mensagemDeErroBanco(r.error) : null
    },
    [adicionarHoje],
  )

  const valor: Ctx = {
    hojeReal,
    dia,
    editavel,
    fimDeSemana: dia ? [0, 6].includes(diaDaSemana(dia)) : false,
    irPara,
    itens: itens ?? [],
    feitos,
    prioridades,
    despejo,
    encerrado,
    erro,
    recarregar,
    alternarFeito,
    salvarPrioridade,
    alternarPrioridade,
    apagarPrioridade,
    encerrarDia,
    atrasadas,
    trazerParaHoje,
    deixarPraLa,
    adicionarHoje,
    despejoParaHoje,
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
