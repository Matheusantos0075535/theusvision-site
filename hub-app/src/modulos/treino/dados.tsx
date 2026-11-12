import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { hojeBrasiliaIso } from '../../lib/tempo'
import { PERFIL_PADRAO, type Agenda, type Ficha, type FichaItem, type Perfil, type Serie, type Sessao } from './tipos'

type Ctx = {
  hoje: string
  perfil: Perfil
  fichas: Ficha[]
  sessoes: Sessao[]
  series: Serie[]
  agenda: Agenda[]
  recarregar: () => Promise<void>
  fichaPorId: (id: string | null | undefined) => Ficha | undefined
  /** Séries da sessão mais recente (antes de `antesDe`) que tem esse exercício. */
  ultimoDesempenho: (exercicio: string, ignorarSessao?: string) => Serie[]
}

const TreinoCtx = createContext<Ctx | null>(null)

/** O PostgREST devolve no máximo 1000 linhas por vez: busca em páginas. */
async function todasAsSeries() {
  const out: Serie[] = []
  for (let de = 0; ; de += 1000) {
    const r = await supabase
      .from('treino_series')
      .select('id, sessao_id, exercicio, ordem, serie, carga_kg, reps, feita, criado_em')
      .order('criado_em')
      .range(de, de + 999)
    if (r.error) throw r.error
    out.push(...(r.data as Serie[]))
    if (r.data.length < 1000) return out
  }
}

export function TreinoProvider({ children }: { children: ReactNode }) {
  const [hoje, setHoje] = useState('')
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_PADRAO)
  const [fichas, setFichas] = useState<Ficha[] | null>(null)
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [series, setSeries] = useState<Serie[]>([])
  const [agenda, setAgenda] = useState<Agenda[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const ultimaChecagem = useRef(0)

  const recarregar = useCallback(async () => {
    setErro(null)
    try {
      const ini = await supabase.rpc('treino_iniciar')
      if (ini.error) throw ini.error
      const [pe, fi, it, se, ag, sr] = await Promise.all([
        supabase.from('treino_perfil').select('peso_kg, altura_cm, dias_semana, folgas, descanso_seg, duracao_max_min').maybeSingle(),
        supabase.from('treino_fichas').select('id, nome, foco, ordem, ativa').order('ordem'),
        supabase.from('treino_ficha_itens').select('id, ficha_id, ordem, exercicio, series, reps_min, reps_max, descanso_seg, nota').order('ordem'),
        supabase.from('treino_sessoes').select('id, dia, ficha_id, nome, iniciado_em, concluido_em, sem_registro').order('dia'),
        supabase.from('treino_agenda').select('dia, ficha_id'),
        todasAsSeries(),
      ])
      const falha = pe.error ?? fi.error ?? it.error ?? se.error ?? ag.error
      if (falha) throw falha
      const itens = (it.data ?? []) as FichaItem[]
      setHoje((ini.data as { hoje: string }).hoje)
      if (pe.data) setPerfil({ ...PERFIL_PADRAO, ...(pe.data as Perfil), peso_kg: pe.data.peso_kg === null ? null : Number(pe.data.peso_kg) })
      setFichas((fi.data as Omit<Ficha, 'itens'>[]).map((f) => ({ ...f, itens: itens.filter((i) => i.ficha_id === f.id).sort((a, b) => a.ordem - b.ordem) })))
      setSessoes(se.data as Sessao[])
      setAgenda(ag.data as Agenda[])
      setSeries(sr.map((s) => ({ ...s, carga_kg: s.carga_kg === null ? null : Number(s.carga_kg) })))
    } catch (e) {
      setErro(mensagemDeErroBanco(e as Parameters<typeof mensagemDeErroBanco>[0]))
    }
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  // Virada do dia com o app aberto.
  useEffect(() => {
    if (!hoje) return
    const checar = () => {
      if (document.hidden || hoje === hojeBrasiliaIso() || Date.now() - ultimaChecagem.current < 20_000) return
      ultimaChecagem.current = Date.now()
      void recarregar()
    }
    const t = window.setInterval(checar, 30_000)
    document.addEventListener('visibilitychange', checar)
    return () => {
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', checar)
    }
  }, [hoje, recarregar])

  const fichaPorId = useCallback((id: string | null | undefined) => fichas?.find((f) => f.id === id), [fichas])

  const ordemSessao = useMemo(() => {
    const m = new Map<string, string>()
    sessoes.forEach((s) => m.set(s.id, s.dia + s.iniciado_em))
    return m
  }, [sessoes])

  const ultimoDesempenho = useCallback(
    (exercicio: string, ignorarSessao?: string) => {
      let melhor: string | null = null
      let chave = ''
      for (const s of series) {
        if (s.exercicio !== exercicio || !s.feita || s.sessao_id === ignorarSessao) continue
        const k = ordemSessao.get(s.sessao_id) ?? ''
        if (k > chave) {
          chave = k
          melhor = s.sessao_id
        }
      }
      return melhor ? series.filter((s) => s.sessao_id === melhor && s.exercicio === exercicio && s.feita).sort((a, b) => a.serie - b.serie) : []
    },
    [series, ordemSessao],
  )

  if (erro && !fichas) {
    return (
      <div className="bloco-erro" role="alert">
        <p>{erro}</p>
        <button className="btn btn-secundario" onClick={() => void recarregar()}>
          Tentar de novo
        </button>
      </div>
    )
  }
  if (!fichas || !hoje) {
    return (
      <div className="carregando" role="status" aria-label="Carregando">
        <span className="giro" />
      </div>
    )
  }
  return (
    <TreinoCtx.Provider value={{ hoje, perfil, fichas, sessoes, series, agenda, recarregar, fichaPorId, ultimoDesempenho }}>
      {children}
    </TreinoCtx.Provider>
  )
}

export function useTreino() {
  const v = useContext(TreinoCtx)
  if (!v) throw new Error('useTreino fora do TreinoProvider')
  return v
}

export const novoId = () => crypto.randomUUID()
