import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Secao } from '../../../components/compartilhado/ShellModulo'
import { useToast } from '../../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { useDia, type Bloco, type Item, type Quando } from '../dados'

const BLOCOS: { id: Bloco; titulo: string }[] = [
  { id: 'manha', titulo: 'Rotina da manhã' },
  { id: 'essencial', titulo: 'Essenciais do dia' },
  { id: 'noite', titulo: 'Rotina da noite' },
]
const QUANDOS: { id: Quando; rotulo: string }[] = [
  { id: 'semana', rotulo: 'Dias úteis' },
  { id: 'fim_de_semana', rotulo: 'Fim de semana' },
]

function Linha({ item, primeiro, ultimo, aoMover, aoMudar }: { item: Item; primeiro: boolean; ultimo: boolean; aoMover: (d: -1 | 1) => void; aoMudar: () => Promise<void> }) {
  const { mostrar } = useToast()
  const [titulo, setTitulo] = useState(item.titulo)
  const [detalhe, setDetalhe] = useState(item.detalhe ?? '')

  async function atualizar(campos: Record<string, unknown>) {
    const { error } = await supabase.from('dia_itens').update(campos).eq('id', item.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await aoMudar()
  }
  async function apagar() {
    const { error } = await supabase.from('dia_itens').delete().eq('id', item.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await aoMudar()
  }

  return (
    <li className="rot-item" data-inativo={!item.ativo || undefined}>
      <div className="rot-campos">
        <input
          className="entrada"
          maxLength={120}
          value={titulo}
          aria-label="Nome do item"
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={() => titulo.trim() && titulo !== item.titulo && void atualizar({ titulo: titulo.trim() })}
        />
        <input
          className="entrada rot-detalhe"
          maxLength={240}
          value={detalhe}
          placeholder="Detalhe (opcional)"
          aria-label="Detalhe"
          onChange={(e) => setDetalhe(e.target.value)}
          onBlur={() => detalhe !== (item.detalhe ?? '') && void atualizar({ detalhe: detalhe.trim() || null })}
        />
      </div>
      <div className="rot-acoes">
        <button className="btn-icone" disabled={primeiro} onClick={() => aoMover(-1)} aria-label="Subir">
          <ArrowUp aria-hidden />
        </button>
        <button className="btn-icone" disabled={ultimo} onClick={() => aoMover(1)} aria-label="Descer">
          <ArrowDown aria-hidden />
        </button>
        <button className="btn-icone" onClick={() => void atualizar({ ativo: !item.ativo })} aria-label={item.ativo ? 'Esconder do dia' : 'Mostrar no dia'}>
          {item.ativo ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
        </button>
        <button className="btn-icone" onClick={() => void apagar()} aria-label="Apagar item">
          <Trash2 aria-hidden />
        </button>
      </div>
    </li>
  )
}

export function Rotinas() {
  const { itens, recarregar } = useDia()
  const { mostrar } = useToast()
  const [quando, setQuando] = useState<Quando>('semana')
  const [novo, setNovo] = useState<Partial<Record<Bloco, string>>>({})

  const doQuando = (b: Bloco) => itens.filter((i) => i.bloco === b && (i.quando === quando || i.quando === 'todos')).sort((a, b2) => a.ordem - b2.ordem)

  async function mover(bloco: Bloco, idx: number, d: -1 | 1) {
    const l = doQuando(bloco)
    const a = l[idx]
    const b = l[idx + d]
    if (!a || !b) return
    // Troca as posições (e garante ordens distintas mesmo se estavam iguais).
    const oa = a.ordem === b.ordem ? a.ordem + (d === 1 ? 1 : -1) : a.ordem
    const r1 = await supabase.from('dia_itens').update({ ordem: b.ordem }).eq('id', a.id)
    const r2 = await supabase.from('dia_itens').update({ ordem: oa === b.ordem ? a.ordem : oa }).eq('id', b.id)
    const e = r1.error ?? r2.error
    if (e) mostrar(mensagemDeErroBanco(e), { comNav: true })
    await recarregar()
  }

  async function adicionar(bloco: Bloco) {
    const t = (novo[bloco] ?? '').trim()
    if (!t) return
    const maior = Math.max(0, ...itens.filter((i) => i.bloco === bloco).map((i) => i.ordem))
    const { error } = await supabase.from('dia_itens').insert({ bloco, quando, titulo: t, ordem: maior + 1 })
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    setNovo((n) => ({ ...n, [bloco]: '' }))
    await recarregar()
  }

  return (
    <div className="dia-rotinas">
      <p className="dia-apoio">Já veio preenchida com a sua rotina. Edite, reordene, esconda ou crie itens. Os dias úteis e o fim de semana têm roteiros separados.</p>
      <div className="dep-abas" role="group" aria-label="Qual roteiro">
        {QUANDOS.map((q) => (
          <button key={q.id} className="dia-chip" aria-pressed={quando === q.id} onClick={() => setQuando(q.id)}>
            {q.rotulo}
          </button>
        ))}
      </div>
      {BLOCOS.map((b) => {
        const lista = doQuando(b.id)
        return (
          <Secao key={b.id} titulo={b.titulo}>
            {lista.length === 0 && <p className="vazio">Nenhum item. Adicione abaixo.</p>}
            <ul className="rot-lista">
              {lista.map((i, idx) => (
                <Linha key={i.id} item={i} primeiro={idx === 0} ultimo={idx === lista.length - 1} aoMover={(d) => void mover(b.id, idx, d)} aoMudar={recarregar} />
              ))}
            </ul>
            <form
              className="dep-novo"
              onSubmit={(e) => {
                e.preventDefault()
                void adicionar(b.id)
              }}
            >
              <input className="entrada" maxLength={120} value={novo[b.id] ?? ''} onChange={(e) => setNovo((n) => ({ ...n, [b.id]: e.target.value }))} placeholder="Novo item" aria-label={`Novo item em ${b.titulo}`} />
              <button className="btn btn-secundario" disabled={!(novo[b.id] ?? '').trim()}>
                <Plus aria-hidden />
                Adicionar
              </button>
            </form>
          </Secao>
        )
      })}
    </div>
  )
}
