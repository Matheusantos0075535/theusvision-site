import { Check, ClipboardList, MessageSquareText, Plus, Trash2, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Secao, ShellModulo } from '../../components/compartilhado/ShellModulo'
import { diferencaDias, formatarDataCurta, hojeBrasiliaIso } from '../../lib/tempo'
import '../dia/dia.css'
import { AvisoPrototipo } from '../prototipo/Aviso'
import { uid } from '../prototipo/estado'
import '../prototipo/prototipo.css'
import { STATUS_ENTREGA, useWork, type Cliente, type Entrega, type Status, type Work } from './dados'
import { PROCESSO, PROCESSOS } from './processos'

type Ctx = ReturnType<typeof useWork>

function prazoTexto(p?: string) {
  if (!p) return 'sem prazo'
  const d = diferencaDias(p, hojeBrasiliaIso())
  if (d < 0) return `atrasada ${Math.abs(d)}d`
  if (d === 0) return 'hoje'
  if (d === 1) return 'amanhã'
  return d < 7 ? `em ${d} dias` : formatarDataCurta(p)
}

function CartaoCliente({ c, aoAbrir }: { c: Cliente; aoAbrir: () => void }) {
  const abertas = c.entregas.filter((e) => e.status !== 'entregue')
  const prox = [...abertas].filter((e) => e.prazo).sort((a, b) => a.prazo!.localeCompare(b.prazo!))[0]
  const atrasadas = abertas.filter((e) => e.prazo && e.prazo < hojeBrasiliaIso()).length
  return (
    <li>
      <button className="pt-card wk-cliente" onClick={aoAbrir}>
        <div className="pt-card-topo">
          <b>{c.nome}</b>
          <span className="pt-tag" data-cor={c.fixo ? 'laranja' : undefined}>
            {c.fixo ? 'Fixo' : 'Esporádico'}
          </span>
        </div>
        <small>{c.servico || 'Sem descrição'}</small>
        <span className="wk-mini">
          <span className="pt-tag">{abertas.length} em andamento</span>
          {atrasadas > 0 && (
            <span className="pt-tag" data-cor="vermelho">
              {atrasadas} atrasada{atrasadas > 1 ? 's' : ''}
            </span>
          )}
          {c.pendencias.some((p) => !p.feita) && <span className="pt-tag">{c.pendencias.filter((p) => !p.feita).length} pendência(s)</span>}
        </span>
        {prox && (
          <small>
            Próxima: <b>{prox.titulo}</b> · {prazoTexto(prox.prazo)}
          </small>
        )}
      </button>
    </li>
  )
}

function Detalhe({ ctx, id, aoFechar }: { ctx: Ctx; id: string; aoFechar: () => void }) {
  const { w, setW } = ctx
  const c = w.clientes.find((x) => x.id === id)
  const [nova, setNova] = useState({ titulo: '', prazo: '', processo: '' })
  const [pend, setPend] = useState({ texto: '', acao: '' })
  if (!c) return null
  const mudar = (campos: Partial<Cliente>) => setW((x) => ({ ...x, clientes: x.clientes.map((y) => (y.id === id ? { ...y, ...campos } : y)) }))
  const mudarEntrega = (eid: string, campos: Partial<Entrega>) => mudar({ entregas: c.entregas.map((e) => (e.id === eid ? { ...e, ...campos } : e)) })
  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha pt-folha-clara wk-folha" role="dialog" aria-modal="true" aria-label={c.nome} onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <div className="tr-folha-topo">
          <input className="wk-nome" value={c.nome} onChange={(e) => mudar({ nome: e.target.value })} aria-label="Nome do cliente" />
          <button className="btn-icone" onClick={aoFechar} aria-label="Fechar">
            <X aria-hidden />
          </button>
        </div>
        <div className="tr-chips">
          <button className="dia-chip" aria-pressed={c.fixo} onClick={() => mudar({ fixo: true })}>
            Fixo
          </button>
          <button className="dia-chip" aria-pressed={!c.fixo} onClick={() => mudar({ fixo: false })}>
            Esporádico
          </button>
        </div>
        <input className="entrada" value={c.servico} onChange={(e) => mudar({ servico: e.target.value })} placeholder="O que você faz para ele" aria-label="Serviço" />
        <input className="entrada" value={c.contato} onChange={(e) => mudar({ contato: e.target.value })} placeholder="Contato principal" aria-label="Contato" />

        <Secao titulo="Entregas">
          <div className="pt-card">
            <ul className="pt-linhas">
              {c.entregas.map((e) => (
                <li key={e.id} className="pt-linha wk-entrega">
                  <span>
                    <b>{e.titulo}</b>
                    <small>
                      {prazoTexto(e.prazo)}
                      {e.processo && ` · processo ${PROCESSO[e.processo]?.numero}`}
                    </small>
                    <select className="entrada wk-select" value={e.status} onChange={(ev) => mudarEntrega(e.id, { status: ev.target.value as Status })} aria-label="Status">
                      {STATUS_ENTREGA.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.rotulo}
                        </option>
                      ))}
                    </select>
                  </span>
                  <button className="btn-icone" aria-label={`Apagar ${e.titulo}`} onClick={() => mudar({ entregas: c.entregas.filter((x) => x.id !== e.id) })}>
                    <X aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <div className="pt-form">
              <input className="entrada" value={nova.titulo} onChange={(e) => setNova({ ...nova, titulo: e.target.value })} placeholder="Nova entrega" aria-label="Nova entrega" />
              <input className="entrada" type="date" value={nova.prazo} onChange={(e) => setNova({ ...nova, prazo: e.target.value })} aria-label="Prazo" style={{ flex: '0 1 150px' }} />
              <select className="entrada" value={nova.processo} onChange={(e) => setNova({ ...nova, processo: e.target.value })} aria-label="Processo">
                <option value="">Sem processo</option>
                {PROCESSOS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.numero} · {p.nome}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primario"
                disabled={!nova.titulo.trim()}
                onClick={() => {
                  mudar({ entregas: [...c.entregas, { id: uid(), titulo: nova.titulo.trim(), prazo: nova.prazo || undefined, status: 'a_fazer', processo: nova.processo || undefined }] })
                  setNova({ titulo: '', prazo: '', processo: '' })
                }}
              >
                <Plus aria-hidden /> Entrega
              </button>
            </div>
          </div>
        </Secao>

        <Secao titulo="Pendências (com a primeira ação)">
          <div className="pt-card">
            <ul className="pt-linhas">
              {c.pendencias.map((p) => (
                <li key={p.id} className="pt-linha" data-feita={p.feita || undefined}>
                  <button className="dia-prio-marca" aria-pressed={p.feita} aria-label={p.feita ? 'Desmarcar' : 'Concluir'} onClick={() => mudar({ pendencias: c.pendencias.map((x) => (x.id === p.id ? { ...x, feita: !x.feita } : x)) })}>
                    <span className="dia-caixa" aria-hidden>
                      <Check />
                    </span>
                  </button>
                  <span>
                    <b>{p.texto}</b>
                    {p.acao && <small>Começar por: {p.acao}</small>}
                  </span>
                  <button className="btn-icone" aria-label="Apagar" onClick={() => mudar({ pendencias: c.pendencias.filter((x) => x.id !== p.id) })}>
                    <X aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <div className="pt-form">
              <input className="entrada" value={pend.texto} onChange={(e) => setPend({ ...pend, texto: e.target.value })} placeholder="O que está parado?" aria-label="Pendência" />
              <input className="entrada" value={pend.acao} onChange={(e) => setPend({ ...pend, acao: e.target.value })} placeholder="Primeira ação (menos de 10 min)" aria-label="Primeira ação" />
              <button
                className="btn btn-secundario"
                disabled={!pend.texto.trim()}
                onClick={() => {
                  mudar({ pendencias: [...c.pendencias, { id: uid(), texto: pend.texto.trim(), acao: pend.acao.trim(), feita: false }] })
                  setPend({ texto: '', acao: '' })
                }}
              >
                <Plus aria-hidden />
              </button>
            </div>
          </div>
        </Secao>

        <Secao titulo="Notas do cliente">
          <textarea className="entrada" rows={3} value={c.notas} onChange={(e) => mudar({ notas: e.target.value })} placeholder="Preferências, estilo de comunicação, aprendizados" aria-label="Notas" />
        </Secao>
        <button
          className="btn btn-fantasma"
          onClick={() => {
            if (!window.confirm(`Apagar ${c.nome} e tudo dele?`)) return
            setW((x: Work) => ({ ...x, clientes: x.clientes.filter((y) => y.id !== id) }))
            aoFechar()
          }}
        >
          <Trash2 aria-hidden /> Apagar cliente
        </button>
      </div>
    </div>
  )
}

function Clientes({ ctx }: { ctx: Ctx }) {
  const { w, setW } = ctx
  const [aberto, setAberto] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const fixos = w.clientes.filter((c) => c.fixo)
  const espor = w.clientes.filter((c) => !c.fixo)
  return (
    <div className="pt-tela">
      <Secao titulo="Clientes fixos">
        <ul className="pt-cards pt-cards-2">
          {fixos.map((c) => (
            <CartaoCliente key={c.id} c={c} aoAbrir={() => setAberto(c.id)} />
          ))}
        </ul>
      </Secao>
      <Secao titulo="Esporádicos">
        {espor.length === 0 ? (
          <p className="vazio">Nenhum esporádico agora. Adicione quando aparecer um trabalho avulso.</p>
        ) : (
          <ul className="pt-cards pt-cards-2">
            {espor.map((c) => (
              <CartaoCliente key={c.id} c={c} aoAbrir={() => setAberto(c.id)} />
            ))}
          </ul>
        )}
      </Secao>
      <div className="pt-card">
        <b>Novo cliente ou projeto</b>
        <div className="pt-form">
          <input className="entrada" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" aria-label="Nome do cliente" />
          <button
            className="btn btn-primario"
            disabled={!nome.trim()}
            onClick={() => {
              const id = uid()
              setW((x) => ({ ...x, clientes: [...x.clientes, { id, nome: nome.trim(), fixo: false, servico: '', contato: '', notas: '', entregas: [], pendencias: [] }] }))
              setNome('')
              setAberto(id)
            }}
          >
            <Plus aria-hidden /> Criar
          </button>
        </div>
      </div>
      {aberto && <Detalhe ctx={ctx} id={aberto} aoFechar={() => setAberto(null)} />}
    </div>
  )
}

function Semana({ ctx }: { ctx: Ctx }) {
  const { w } = ctx
  const hoje = hojeBrasiliaIso()
  const todas = w.clientes.flatMap((c) => c.entregas.filter((e) => e.status !== 'entregue').map((e) => ({ c, e })))
  const grupos: [string, typeof todas][] = [
    ['Atrasadas', todas.filter((x) => x.e.prazo && x.e.prazo < hoje)],
    ['Hoje e amanhã', todas.filter((x) => x.e.prazo && diferencaDias(x.e.prazo, hoje) >= 0 && diferencaDias(x.e.prazo, hoje) <= 1)],
    ['Esta semana', todas.filter((x) => x.e.prazo && diferencaDias(x.e.prazo, hoje) >= 2 && diferencaDias(x.e.prazo, hoje) <= 7)],
    ['Depois', todas.filter((x) => x.e.prazo && diferencaDias(x.e.prazo, hoje) > 7)],
    ['Sem prazo', todas.filter((x) => !x.e.prazo)],
  ]
  return (
    <div className="pt-tela">
      <p className="dia-apoio">Todas as entregas abertas de todos os clientes, pela urgência. Tipo 2 (entrega de cliente) vai no Bloco 2 do dia, com o prazo visível.</p>
      {grupos.map(([t, l]) =>
        l.length ? (
          <Secao key={t} titulo={`${t} · ${l.length}`}>
            <div className="pt-card">
              <ul className="pt-linhas">
                {l
                  .sort((a, b) => (a.e.prazo ?? '9').localeCompare(b.e.prazo ?? '9'))
                  .map(({ c, e }) => (
                    <li key={e.id} className="pt-linha">
                      <span>
                        <b>{e.titulo}</b>
                        <small>
                          {c.nome} · {prazoTexto(e.prazo)} · {STATUS_ENTREGA.find((s) => s.id === e.status)?.rotulo}
                        </small>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </Secao>
        ) : null,
      )}
      {todas.length === 0 && <p className="vazio">Nenhuma entrega aberta. Aproveite para prospectar.</p>}
    </div>
  )
}

const MENSAGENS = [
  { t: 'Confirmação de recebimento', x: 'Oi! Recebi aqui, obrigado. Já vou olhar e te confirmo o prazo ainda hoje.' },
  { t: 'Prazo', x: 'Consigo te entregar até [dia] às [hora]. Se algo mudar, aviso antes.' },
  { t: 'Envio para aprovação', x: 'Segue o material para você aprovar: [link]. Qualquer ajuste, me fala por aqui e eu corrijo.' },
  { t: 'Cobrança gentil', x: 'Oi! Passando para lembrar do pagamento de [referência], com vencimento em [data]. Se já fez, pode desconsiderar. Obrigado!' },
]

function Mensagens() {
  return (
    <div className="pt-tela">
      <p className="dia-apoio">Mensagens-padrão economizam decisão: responder um cliente vira uma tarefa de 2 minutos, não algo que você adia por dois dias. Toque para copiar.</p>
      <ul className="pt-cards">
        {MENSAGENS.map((m) => (
          <li key={m.t} className="pt-card">
            <b>{m.t}</b>
            <small>{m.x}</small>
            <button className="btn btn-secundario" onClick={() => void navigator.clipboard?.writeText(m.x)}>
              Copiar
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const ABAS = [
  { para: '/clientes', rotulo: 'Clientes', icone: Users, fim: true },
  { para: '/clientes/entregas', rotulo: 'Entregas', icone: ClipboardList },
  { para: '/clientes/mensagens', rotulo: 'Mensagens', icone: MessageSquareText },
]

export default function ClientesApp() {
  const ctx = useWork()
  return (
    <ShellModulo titulo="Clientes e entregas" abas={ABAS}>
      <AvisoPrototipo aoRecomecar={ctx.recomecar} />
      <div style={{ height: 12 }} />
      <Routes>
        <Route index element={<Clientes ctx={ctx} />} />
        <Route path="entregas" element={<Semana ctx={ctx} />} />
        <Route path="mensagens" element={<Mensagens />} />
        <Route path="*" element={<Clientes ctx={ctx} />} />
      </Routes>
    </ShellModulo>
  )
}
