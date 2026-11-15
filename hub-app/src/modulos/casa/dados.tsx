import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useToast } from '../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { hojeBrasiliaIso } from '../../lib/tempo'

export type Freq = 'diaria' | 'semanal' | 'mensal'
export type Tarefa = { id: string; nome: string; freq: Freq; dia?: number; feitas: string[] }
export type Item = { id: string; nome: string; comprado: boolean }
export type Dados = { tarefas: Tarefa[]; compras: Item[]; missoes: string[]; timer: { fim: number; pausado?: number } | null }

export const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)))

const CHAVE_TIMER = 'tv-casa-timer'
const CHAVE_ANTIGA = 'tv-proto-casa'
const DATA = /^\d{4}-\d{2}-\d{2}$/

function lerTimer(): Dados['timer'] {
  try {
    const t = JSON.parse(localStorage.getItem(CHAVE_TIMER) ?? 'null')
    return t && typeof t.fim === 'number' ? t : null
  } catch {
    return null
  }
}

/** Dados do protótipo antigo (só no aparelho), se existirem. */
function lerAntigo(): Omit<Dados, 'timer'> | null {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_ANTIGA) ?? 'null')
    if (!bruto || !Array.isArray(bruto.tarefas)) return null
    const hoje = hojeBrasiliaIso()
    const ok = (d: unknown): d is string => typeof d === 'string' && DATA.test(d) && d <= hoje
    return {
      tarefas: bruto.tarefas
        .filter((t: Tarefa) => t && typeof t.nome === 'string' && t.nome.trim() && ['diaria', 'semanal', 'mensal'].includes(t.freq))
        .map((t: Tarefa) => ({ id: novoId(), nome: t.nome.trim().slice(0, 80), freq: t.freq, dia: t.freq === 'semanal' ? Math.min(6, Math.max(0, Number(t.dia ?? 0))) : undefined, feitas: [...new Set((t.feitas ?? []).filter(ok))].sort() })),
      compras: (bruto.compras ?? []).filter((c: Item) => c && typeof c.nome === 'string' && c.nome.trim()).map((c: Item) => ({ id: novoId(), nome: c.nome.trim().slice(0, 120), comprado: !!c.comprado })),
      missoes: [...new Set(((bruto.missoes ?? []) as unknown[]).filter(ok))].sort(),
    }
  } catch {
    return null
  }
}

type Linha<T> = { error: unknown } & T

/**
 * Estado da casa no banco, com a mesma interface de "set" do protótipo: as telas mudam o estado e
 * a diferença (tarefas, feitas, compras, missões) é gravada em fila, na ordem. Se algo falhar,
 * recarrega do banco e avisa. O timer fica só neste aparelho.
 */
export function useCasaDados() {
  const { mostrar } = useToast()
  const [d, setD] = useState<Dados | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const ref = useRef<Dados | null>(null)
  const fila = useRef<Promise<void>>(Promise.resolve())

  const carregar = useCallback(async () => {
    const [ta, fe, co, mi] = await Promise.all([
      supabase.from('casa_tarefas').select('id, nome, freq, dia, ordem, criado_em').order('ordem').order('criado_em'),
      supabase.from('casa_feitas').select('tarefa_id, dia').order('dia'),
      supabase.from('casa_compras').select('id, nome, comprado, criado_em').order('criado_em', { ascending: false }),
      supabase.from('casa_missoes').select('dia').order('dia'),
    ])
    const falha = ta.error ?? fe.error ?? co.error ?? mi.error
    if (falha) throw falha
    const feitas = new Map<string, string[]>()
    for (const f of fe.data as { tarefa_id: string; dia: string }[]) feitas.set(f.tarefa_id, [...(feitas.get(f.tarefa_id) ?? []), f.dia])
    return {
      tarefas: (ta.data as { id: string; nome: string; freq: Freq; dia: number | null }[]).map((t) => ({ id: t.id, nome: t.nome, freq: t.freq, dia: t.dia ?? undefined, feitas: feitas.get(t.id) ?? [] })),
      compras: (co.data as Item[]).map((c) => ({ id: c.id, nome: c.nome, comprado: c.comprado })),
      missoes: (mi.data as { dia: string }[]).map((m) => m.dia),
    }
  }, [])

  const iniciar = useCallback(async () => {
    setErro(null)
    try {
      const antigo = lerAntigo()
      const r = await supabase.rpc('casa_iniciar', { p_semear: !antigo })
      if (r.error) throw r.error
      if ((r.data as { novo: boolean }).novo && antigo) {
        // Primeira vez com dados do aparelho: leva a rotina que você organizou para o banco.
        const erros = [
          antigo.tarefas.length && (await supabase.from('casa_tarefas').insert(antigo.tarefas.map((t, i) => ({ id: t.id, nome: t.nome, freq: t.freq, dia: t.dia ?? null, ordem: i + 1 })))).error,
          antigo.compras.length && (await supabase.from('casa_compras').insert(antigo.compras.map((c) => ({ id: c.id, nome: c.nome, comprado: c.comprado })))).error,
          antigo.missoes.length && (await supabase.from('casa_missoes').insert(antigo.missoes.map((dia) => ({ dia })))).error,
        ].filter(Boolean)
        if (erros.length) throw erros[0]
        const feitas = antigo.tarefas.flatMap((t) => t.feitas.map((dia) => ({ tarefa_id: t.id, dia })))
        if (feitas.length) {
          const f = await supabase.from('casa_feitas').insert(feitas)
          if (f.error) throw f.error
        }
      }
      if (antigo) {
        try {
          localStorage.removeItem(CHAVE_ANTIGA)
        } catch {
          /* sem armazenamento */
        }
      }
      const base = await carregar()
      const novo = { ...base, timer: lerTimer() }
      ref.current = novo
      setD(novo)
    } catch (e) {
      setErro(mensagemDeErroBanco(e as Parameters<typeof mensagemDeErroBanco>[0]))
    }
  }, [carregar])

  useEffect(() => {
    void iniciar()
  }, [iniciar])

  const gravar = useCallback(
    async (a: Dados, b: Dados) => {
      const ops: PromiseLike<Linha<unknown>>[] = []
      const antes = new Map(a.tarefas.map((t) => [t.id, t]))
      const depois = new Map(b.tarefas.map((t) => [t.id, t]))
      b.tarefas.forEach((t, i) => {
        const o = antes.get(t.id)
        if (!o) ops.push(supabase.from('casa_tarefas').insert({ id: t.id, nome: t.nome, freq: t.freq, dia: t.dia ?? null, ordem: i + 1 }))
        else if (o.nome !== t.nome || o.freq !== t.freq || o.dia !== t.dia) ops.push(supabase.from('casa_tarefas').update({ nome: t.nome, freq: t.freq, dia: t.dia ?? null }).eq('id', t.id))
      })
      for (const o of a.tarefas) if (!depois.has(o.id)) ops.push(supabase.from('casa_tarefas').delete().eq('id', o.id))
      // Feitas só depois de a tarefa existir (a fila é sequencial, então basta a ordem).
      const aposTarefas = async () => {
        for (const t of b.tarefas) {
          const o = antes.get(t.id)
          const novas = t.feitas.filter((f) => !o?.feitas.includes(f))
          const tiradas = (o?.feitas ?? []).filter((f) => !t.feitas.includes(f))
          if (novas.length) await supabase.from('casa_feitas').insert(novas.map((dia) => ({ tarefa_id: t.id, dia }))).then((r) => r.error && Promise.reject(r.error))
          for (const dia of tiradas) await supabase.from('casa_feitas').delete().eq('tarefa_id', t.id).eq('dia', dia).then((r) => r.error && Promise.reject(r.error))
        }
      }
      const ca = new Map(a.compras.map((c) => [c.id, c]))
      const cb = new Map(b.compras.map((c) => [c.id, c]))
      for (const c of b.compras) {
        const o = ca.get(c.id)
        if (!o) ops.push(supabase.from('casa_compras').insert({ id: c.id, nome: c.nome, comprado: c.comprado }))
        else if (o.nome !== c.nome || o.comprado !== c.comprado) ops.push(supabase.from('casa_compras').update({ nome: c.nome, comprado: c.comprado }).eq('id', c.id))
      }
      for (const o of a.compras) if (!cb.has(o.id)) ops.push(supabase.from('casa_compras').delete().eq('id', o.id))
      const novasMissoes = b.missoes.filter((m) => !a.missoes.includes(m))
      if (novasMissoes.length) ops.push(supabase.from('casa_missoes').insert(novasMissoes.map((dia) => ({ dia }))))

      for (const op of ops) {
        const r = (await op) as { error: unknown }
        if (r.error) throw r.error
      }
      await aposTarefas()
    },
    [],
  )

  const set: Dispatch<SetStateAction<Dados>> = useCallback(
    (fn) => {
      const antes = ref.current
      if (!antes) return
      const depois = typeof fn === 'function' ? fn(antes) : fn
      ref.current = depois
      setD(depois)
      if (depois.timer !== antes.timer) {
        try {
          if (depois.timer) localStorage.setItem(CHAVE_TIMER, JSON.stringify(depois.timer))
          else localStorage.removeItem(CHAVE_TIMER)
        } catch {
          /* o timer só não sobrevive ao recarregar */
        }
      }
      fila.current = fila.current
        .then(() => gravar(antes, depois))
        .catch(async (e) => {
          mostrar(mensagemDeErroBanco(e as Parameters<typeof mensagemDeErroBanco>[0]), { comNav: true })
          try {
            const base = await carregar()
            const novo = { ...base, timer: ref.current?.timer ?? null }
            ref.current = novo
            setD(novo)
          } catch {
            /* mantém o que está na tela */
          }
        })
    },
    [gravar, carregar, mostrar],
  )

  return useMemo(() => ({ d, set, erro, recarregar: iniciar }), [d, set, erro, iniciar])
}
