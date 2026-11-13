import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'

export type Pagamento = 'pix' | 'credito' | 'debito'
export type Categoria = { id: string; nome: string; limite: number; ordem: number }
export type Lancamento = {
  id: string
  tipo: 'entrada' | 'gasto'
  valor: number
  dia: string
  categoria_id: string | null
  descricao: string | null
  pagamento: Pagamento | null
  impulso: boolean
  criado_em: string
}
export type Fixa = {
  id: string
  nome: string
  valor: number
  dia_vencimento: number | null
  tipo: 'assinatura' | 'parcela' | 'conta'
  pagamento: Pagamento | null
  parcelas_total: number | null
  primeira_parcela: string | null
  ativa: boolean
}
export type Paga = { fixa_id: string; mes: string }
export type Desejo = { id: string; nome: string; valor: number; criado_em: string; decisao: 'comprei' | 'desisti' | null }
export type Divida = { id: string; nome: string; original: number; saldo: number; parcela: number }
export type Meta = { id: string; nome: string; alvo: number; ordem: number }
export type Aporte = { id: string; meta_id: string; valor: number; dia: string }

export const PAGAMENTOS: { id: Pagamento; rotulo: string }[] = [
  { id: 'pix', rotulo: 'Pix' },
  { id: 'credito', rotulo: 'Crédito' },
  { id: 'debito', rotulo: 'Débito' },
]
export const rotuloPagamento = (p: Pagamento | null) => PAGAMENTOS.find((x) => x.id === p)?.rotulo ?? ''

export const real = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })
/** Aceita "1.500", "1500,50", "1500.5". */
export const numero = (s: string) => {
  const t = s.trim()
  if (!t) return 0
  const limpo = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t
  const n = Number(limpo)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}
export const soValor = (s: string) => s.replace(/[^\d,.]/g, '')

export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const nomeMes = (mes: string) => `${MESES[Number(mes.slice(5, 7)) - 1]} ${mes.slice(0, 4)}`
export function somarMeses(mes: string, n: number) {
  const d = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)) - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
const mesesEntre = (a: string, b: string) => (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7))
export const diasNoMes = (mes: string) => new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).getUTCDate()

/** Em qual parcela a fixa está no mês (null = não é parcela). Fora do intervalo = não vale neste mês. */
export function parcelaNoMes(f: Fixa, mes: string) {
  if (f.tipo !== 'parcela' || !f.primeira_parcela || !f.parcelas_total) return null
  return { n: mesesEntre(f.primeira_parcela, mes) + 1, total: f.parcelas_total }
}
export function valeNoMes(f: Fixa, mes: string) {
  if (!f.ativa) return false
  const p = parcelaNoMes(f, mes)
  return !p || (p.n >= 1 && p.n <= p.total)
}

type Ctx = {
  hoje: string
  categorias: Categoria[]
  lancamentos: Lancamento[]
  fixas: Fixa[]
  pagas: Paga[]
  desejos: Desejo[]
  dividas: Divida[]
  metas: Meta[]
  aportes: Aporte[]
  recarregar: () => Promise<void>
  /** Roda uma escrita e recarrega. Devolve a mensagem de erro ou null. */
  escrever: (p: PromiseLike<{ error: unknown }>) => Promise<string | null>
}
const FinCtx = createContext<Ctx | null>(null)

const nums = <T,>(lista: unknown, campos: (keyof T)[]) =>
  (lista as T[]).map((x) => {
    const y = { ...x } as Record<string, unknown>
    for (const c of campos) if (y[c as string] != null) y[c as string] = Number(y[c as string])
    return y as T
  })

export function FinProvider({ children }: { children: ReactNode }) {
  const [d, setD] = useState<Omit<Ctx, 'recarregar' | 'escrever'> | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setErro(null)
    const ini = await supabase.rpc('fin_iniciar')
    if (ini.error) return setErro(mensagemDeErroBanco(ini.error))
    const r = await Promise.all([
      supabase.from('fin_categorias').select('id, nome, limite, ordem').order('ordem'),
      supabase
        .from('fin_lancamentos')
        .select('id, tipo, valor, dia, categoria_id, descricao, pagamento, impulso, criado_em')
        .order('dia', { ascending: false })
        .order('criado_em', { ascending: false })
        .limit(2000),
      supabase.from('fin_fixas').select('id, nome, valor, dia_vencimento, tipo, pagamento, parcelas_total, primeira_parcela, ativa').order('dia_vencimento', { nullsFirst: false }),
      supabase.from('fin_fixas_pagas').select('fixa_id, mes'),
      supabase.from('fin_desejos').select('id, nome, valor, criado_em, decisao').order('criado_em', { ascending: false }),
      supabase.from('fin_dividas').select('id, nome, original, saldo, parcela').order('criado_em'),
      supabase.from('fin_metas').select('id, nome, alvo, ordem').order('ordem'),
      supabase.from('fin_aportes').select('id, meta_id, valor, dia').order('dia', { ascending: false }),
    ])
    const falha = r.find((x) => x.error)?.error
    if (falha) return setErro(mensagemDeErroBanco(falha))
    setD({
      hoje: (ini.data as { hoje: string }).hoje,
      categorias: nums<Categoria>(r[0].data, ['limite']),
      lancamentos: nums<Lancamento>(r[1].data, ['valor']),
      fixas: nums<Fixa>(r[2].data, ['valor']),
      pagas: r[3].data as Paga[],
      desejos: nums<Desejo>(r[4].data, ['valor']),
      dividas: nums<Divida>(r[5].data, ['original', 'saldo', 'parcela']),
      metas: nums<Meta>(r[6].data, ['alvo']),
      aportes: nums<Aporte>(r[7].data, ['valor']),
    })
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  const escrever = useCallback(
    async (p: PromiseLike<{ error: unknown }>) => {
      const { error } = await p
      if (error) return mensagemDeErroBanco(error as Parameters<typeof mensagemDeErroBanco>[0])
      await recarregar()
      return null
    },
    [recarregar],
  )

  const valor = useMemo(() => (d ? { ...d, recarregar, escrever } : null), [d, recarregar, escrever])

  if (!valor)
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
  return <FinCtx.Provider value={valor}>{children}</FinCtx.Provider>
}

export function useFin() {
  const v = useContext(FinCtx)
  if (!v) throw new Error('useFin fora do FinProvider')
  return v
}

/** Contas do mês: entradas, gastos, fixas e o que foi guardado. */
export function useResumoDoMes(mes: string) {
  const { lancamentos, fixas, pagas, aportes, hoje } = useFin()
  return useMemo(() => {
    const doMes = lancamentos.filter((l) => l.dia.startsWith(mes))
    const entradas = doMes.filter((l) => l.tipo === 'entrada')
    const gastos = doMes.filter((l) => l.tipo === 'gasto')
    const fixasMes = fixas.filter((f) => valeNoMes(f, mes))
    const pagasMes = new Set(pagas.filter((p) => p.mes === mes).map((p) => p.fixa_id))
    const soma = (l: { valor: number }[]) => l.reduce((t, x) => t + x.valor, 0)
    const totalEntradas = soma(entradas)
    const totalGastos = soma(gastos)
    const totalFixas = soma(fixasMes)
    const guardado = soma(aportes.filter((a) => a.dia.startsWith(mes)))
    const livre = totalEntradas - totalFixas - totalGastos - guardado
    const atual = mes === hoje.slice(0, 7)
    const restam = atual ? diasNoMes(mes) - Number(hoje.slice(8)) + 1 : mes > hoje.slice(0, 7) ? diasNoMes(mes) : 0
    const porPagamento = Object.fromEntries(
      (['pix', 'credito', 'debito'] as Pagamento[]).map((p) => [p, soma(gastos.filter((g) => g.pagamento === p)) + soma(fixasMes.filter((f) => f.pagamento === p))]),
    ) as Record<Pagamento, number>
    return {
      entradas,
      gastos,
      fixasMes,
      pagasMes,
      totalEntradas,
      totalGastos,
      totalFixas,
      guardado,
      livre,
      restam,
      porDia: restam > 0 ? Math.max(0, livre) / restam : 0,
      porPagamento,
      impulso: soma(gastos.filter((g) => g.impulso)),
      faltaPagarFixas: soma(fixasMes.filter((f) => !pagasMes.has(f.id))),
    }
  }, [lancamentos, fixas, pagas, aportes, hoje, mes])
}
