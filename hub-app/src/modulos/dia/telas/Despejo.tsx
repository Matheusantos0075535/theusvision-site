import { Check, ChevronDown, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Secao } from '../../../components/compartilhado/ShellModulo'
import { useToast } from '../../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { CATEGORIAS, PRIORIDADES, TEXTOS } from '../conteudo'
import { useDia, type Despejo as ItemDespejo } from '../dados'

function Cartao({ d, aoMudar }: { d: ItemDespejo; aoMudar: () => Promise<void> }) {
  const { mostrar } = useToast()
  const [aberto, setAberto] = useState(false)
  const [acao, setAcao] = useState(d.proxima_acao ?? '')

  async function atualizar(campos: Record<string, unknown>) {
    const { error } = await supabase.from('dia_despejo').update(campos).eq('id', d.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await aoMudar()
  }
  async function apagar() {
    const { error } = await supabase.from('dia_despejo').delete().eq('id', d.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await aoMudar()
  }
  const semTriagem = !d.categoria && !d.proxima_acao && !d.prioridade

  return (
    <li className="dep-cartao" data-resolvido={d.resolvido || undefined} data-aberto={aberto || undefined}>
      <div className="dep-linha">
        <button
          className="dia-prio-marca"
          aria-pressed={d.resolvido}
          aria-label={d.resolvido ? 'Reabrir' : 'Marcar como resolvido'}
          onClick={() => void atualizar({ resolvido: !d.resolvido })}
        >
          <span className="dia-caixa" aria-hidden>
            <Check />
          </span>
        </button>
        <button className="dep-texto" onClick={() => setAberto((a) => !a)} aria-expanded={aberto}>
          <b>{d.texto}</b>
          <span className="dep-selos">
            {semTriagem && <i className="dep-selo dep-selo-novo">fazer triagem</i>}
            {d.categoria && <i className="dep-selo">{CATEGORIAS.find((c) => c.id === d.categoria)?.rotulo}</i>}
            {d.prioridade && (
              <i className="dep-selo" data-p={d.prioridade}>
                {PRIORIDADES.find((p) => p.id === d.prioridade)?.rotulo}
              </i>
            )}
          </span>
          {d.proxima_acao && <small>Próxima ação: {d.proxima_acao}</small>}
        </button>
        <ChevronDown className="dep-seta" aria-hidden />
      </div>
      {aberto && (
        <div className="dep-triagem">
          <div className="dep-grupo" role="group" aria-label="Categoria">
            {CATEGORIAS.map((c) => (
              <button key={c.id} className="dia-chip" aria-pressed={d.categoria === c.id} onClick={() => void atualizar({ categoria: d.categoria === c.id ? null : c.id })}>
                {c.rotulo}
              </button>
            ))}
          </div>
          <div className="dep-grupo" role="group" aria-label="Prioridade">
            {PRIORIDADES.map((p) => (
              <button key={p.id} className="dia-chip" data-p={p.id} aria-pressed={d.prioridade === p.id} onClick={() => void atualizar({ prioridade: d.prioridade === p.id ? null : p.id })}>
                {p.rotulo}
              </button>
            ))}
          </div>
          <label className="campo">
            <span>Próxima ação direta</span>
            <input className="entrada" maxLength={200} value={acao} onChange={(e) => setAcao(e.target.value)} onBlur={() => acao !== (d.proxima_acao ?? '') && void atualizar({ proxima_acao: acao.trim() || null })} placeholder={TEXTOS.acaoExemplo} />
          </label>
          <button className="btn btn-fantasma dep-apagar" onClick={() => void apagar()}>
            <Trash2 aria-hidden />
            Apagar
          </button>
        </div>
      )}
    </li>
  )
}

export function Despejo() {
  const { despejo, recarregar } = useDia()
  const { mostrar } = useToast()
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [filtro, setFiltro] = useState<'abertos' | 'resolvidos'>('abertos')

  async function adicionar() {
    const t = texto.trim()
    if (!t) return
    setEnviando(true)
    const hora = Number(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
    const { error } = await supabase.from('dia_despejo').insert({ texto: t, origem: hora >= 18 ? 'noite' : 'manual' })
    setEnviando(false)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    setTexto('')
    await recarregar()
  }

  const abertos = despejo.filter((d) => !d.resolvido)
  const resolvidos = despejo.filter((d) => d.resolvido)
  const lista = filtro === 'abertos' ? abertos : resolvidos
  const semTriagem = abertos.filter((d) => !d.categoria && !d.proxima_acao && !d.prioridade).length

  return (
    <div className="dia-despejo">
      <Secao titulo="Despejo mental">
        <p className="dia-apoio">{TEXTOS.despejoApoio}</p>
        <form
          className="dep-novo"
          onSubmit={(e) => {
            e.preventDefault()
            void adicionar()
          }}
        >
          <input className="entrada" maxLength={500} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva e aperte Enter" aria-label="Novo item do despejo" enterKeyHint="send" />
          <button className="btn btn-verde" disabled={!texto.trim() || enviando}>
            Guardar
          </button>
        </form>
      </Secao>

      <Secao>
        <div className="dep-abas" role="group" aria-label="Filtro">
          <button className="dia-chip" aria-pressed={filtro === 'abertos'} onClick={() => setFiltro('abertos')}>
            Pendentes {abertos.length > 0 && `(${abertos.length})`}
          </button>
          <button className="dia-chip" aria-pressed={filtro === 'resolvidos'} onClick={() => setFiltro('resolvidos')}>
            Resolvidos {resolvidos.length > 0 && `(${resolvidos.length})`}
          </button>
        </div>
        {filtro === 'abertos' && semTriagem > 0 && (
          <p className="dia-apoio">
            {semTriagem === 1 ? '1 item espera triagem.' : `${semTriagem} itens esperam triagem.`} Toque num item para dar categoria, prioridade e a próxima ação.
          </p>
        )}
        {lista.length === 0 ? (
          <p className="vazio">{filtro === 'abertos' ? 'Cabeça vazia. Quando algo surgir, jogue aqui.' : 'Nada resolvido ainda.'}</p>
        ) : (
          <ul className="dep-lista">
            {lista.map((d) => (
              <Cartao key={d.id} d={d} aoMudar={recarregar} />
            ))}
          </ul>
        )}
      </Secao>
    </div>
  )
}
