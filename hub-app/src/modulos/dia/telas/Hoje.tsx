import { ArrowDownToLine, BellRing, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, MoonStar, NotebookPen, Pencil, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Secao } from '../../../components/compartilhado/ShellModulo'
import { useToast } from '../../../components/ui/Toast'
import { useAuth } from '../../../hub/auth'
import { dataPorExtensoDoBanco, diferencaDias, horaBrasilia, primeiroNome, saudacao, somarDias } from '../../../lib/tempo'
import { BLOCOS_FIM_DE_SEMANA, BLOCOS_SEMANA, TEXTOS } from '../conteudo'
import { Calendario, ANO } from '../Calendario'
import { itensDeHoje, MAX_PRIORIDADES, useDia, type Atrasada, type Item, type Prioridade } from '../dados'
import { PomodoroCartao } from '../Pomodoro'
import { tocar } from '../../../lib/som'

const horaAtual = () => Number(horaBrasilia().split(':')[0])

function Checklist({ titulo, itens, aberto }: { titulo: string; itens: Item[]; aberto: boolean }) {
  const { feitos, alternarFeito, editavel } = useDia()
  const { mostrar } = useToast()
  const [aberta, setAberta] = useState(aberto)
  const feitosAqui = itens.filter((i) => feitos.has(i.id)).length
  if (!itens.length) return null
  const completo = feitosAqui === itens.length
  return (
    <details className="dia-lista" open={aberta} onToggle={(e) => setAberta(e.currentTarget.open)} data-completo={completo || undefined}>
      <summary>
        <span className="dia-lista-titulo">{titulo}</span>
        <span className="dia-lista-conta">
          {feitosAqui}/{itens.length}
        </span>
        <ChevronDown aria-hidden />
      </summary>
      <ul>
        {itens.map((i) => (
          <li key={i.id}>
            <button
              className="dia-item"
              aria-pressed={feitos.has(i.id)}
              disabled={!editavel}
              onClick={async () => {
                const e = await alternarFeito(i.id)
                if (e) mostrar(e, { comNav: true })
              }}
            >
              <span className="dia-caixa" aria-hidden>
                <Check />
              </span>
              <span className="dia-item-textos">
                <b>{i.titulo}</b>
                {i.detalhe && <small>{i.detalhe}</small>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}

function Slot({ ordem, p, novo, aoFechar }: { ordem: number; p?: Prioridade; novo?: boolean; aoFechar?: () => void }) {
  const { salvarPrioridade, alternarPrioridade, apagarPrioridade, editavel } = useDia()
  const { mostrar } = useToast()
  const [editando, setEditandoBase] = useState(!!novo)
  const setEditando = (v: boolean) => {
    setEditandoBase(v)
    if (!v) aoFechar?.()
  }
  const [titulo, setTitulo] = useState(p?.titulo ?? '')
  const [acao, setAcao] = useState(p?.primeira_acao ?? '')
  const [salvando, setSalvando] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editando) ref.current?.focus()
  }, [editando])

  async function salvar() {
    if (!titulo.trim()) return
    setSalvando(true)
    const e = await salvarPrioridade(ordem, titulo, acao)
    setSalvando(false)
    if (e) return mostrar(e, { comNav: true })
    setEditando(false)
  }

  if (editando) {
    return (
      <li className="dia-prio dia-prio-edicao">
        <span className="dia-prio-num" aria-hidden>
          {ordem}
        </span>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void salvar()
          }}
        >
          <input ref={ref} className="entrada" maxLength={160} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="O que precisa ser feito hoje?" aria-label={`Prioridade ${ordem}`} />
          <input className="entrada" maxLength={200} value={acao} onChange={(e) => setAcao(e.target.value)} placeholder={TEXTOS.acaoExemplo} aria-label={TEXTOS.acaoRotulo} />
          <div className="dia-prio-botoes">
            <button type="button" className="btn btn-fantasma" onClick={() => setEditando(false)}>
              Cancelar
            </button>
            <button className="btn btn-primario" disabled={!titulo.trim() || salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </li>
    )
  }

  if (!p && !editavel) {
    return (
      <li className="dia-prio dia-prio-vazia">
        <span className="dia-prio-sem">
          <span className="dia-prio-num" aria-hidden>
            {ordem}
          </span>
          <span>Sem prioridade neste dia</span>
        </span>
      </li>
    )
  }

  if (!p) {
    return (
      <li className="dia-prio dia-prio-vazia">
        <button
          onClick={() => {
            setTitulo('')
            setAcao('')
            setEditando(true)
          }}
        >
          <span className="dia-prio-num" aria-hidden>
            {ordem}
          </span>
          <span>{TEXTOS.prioridadeVazia}</span>
          <Plus aria-hidden />
        </button>
      </li>
    )
  }

  return (
    <li className="dia-prio" data-feita={p.feita || undefined}>
      <button
        className="dia-prio-marca"
        aria-pressed={p.feita}
        disabled={!editavel}
        aria-label={p.feita ? `Desmarcar: ${p.titulo}` : `Concluir: ${p.titulo}`}
        onClick={async () => {
          const e = await alternarPrioridade(p)
          if (e) mostrar(e, { comNav: true })
        }}
      >
        <span className="dia-caixa" aria-hidden>
          <Check />
        </span>
      </button>
      <div className="dia-prio-textos">
        <b>{p.titulo}</b>
        {p.primeira_acao && <small>Começar por: {p.primeira_acao}</small>}
      </div>
      {editavel && (
      <button
        className="btn-icone"
        aria-label={`Editar prioridade ${ordem}`}
        onClick={() => {
          setTitulo(p.titulo)
          setAcao(p.primeira_acao ?? '')
          setEditando(true)
        }}
      >
        <Pencil aria-hidden />
      </button>
      )}
      {editavel && (
      <button
        className="btn-icone"
        aria-label={`Remover prioridade ${ordem}`}
        onClick={async () => {
          const e = await apagarPrioridade(p)
          if (e) mostrar(e, { comNav: true })
        }}
      >
        <X aria-hidden />
      </button>
      )}
    </li>
  )
}

function Encerrar() {
  const { encerrado, encerrarDia, editavel } = useDia()
  const { mostrar } = useToast()
  const [aberto, setAberto] = useState(false)
  const [acao, setAcao] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function confirmar() {
    setSalvando(true)
    const e = await encerrarDia(acao)
    setSalvando(false)
    if (e) return mostrar(e, { comNav: true })
    tocar('sucesso')
    setAberto(false)
  }

  if (encerrado) {
    return (
      <div className="cartao-info dia-encerrado">
        <MoonStar aria-hidden />
        <div>
          <b>{TEXTOS.encerrarFeito}</b>
          <p>{editavel ? 'Amanhã você já começa com a primeira ação pronta.' : 'Este dia foi encerrado.'}</p>
        </div>
      </div>
    )
  }
  if (!editavel) return null
  return (
    <>
      <button className="btn btn-secundario btn-grande dia-encerrar" onClick={() => setAberto(true)}>
        <MoonStar aria-hidden />
        {TEXTOS.encerrarTitulo}
      </button>
      {aberto && (
        <div className="folha-fundo" onClick={() => setAberto(false)}>
          <div className="folha" role="dialog" aria-modal="true" aria-labelledby="dia-enc" onClick={(e) => e.stopPropagation()}>
            <div className="folha-alca" aria-hidden />
            <h2 id="dia-enc" className="dia-folha-titulo">
              {TEXTOS.encerrarTitulo}
            </h2>
            <p className="dia-folha-apoio">{TEXTOS.encerrarApoio}</p>
            <label className="campo">
              <span>{TEXTOS.encerrarPergunta}</span>
              <input className="entrada" maxLength={200} autoFocus value={acao} onChange={(e) => setAcao(e.target.value)} placeholder={TEXTOS.acaoExemplo} />
            </label>
            <p className="dia-folha-apoio">
              Ficou algo solto na cabeça? <Link to="/dia/despejo">Esvazie no Despejo mental</Link> antes de dormir.
            </p>
            <div className="dia-prio-botoes">
              <button className="btn btn-fantasma" onClick={() => setAberto(false)}>
                Voltar
              </button>
              <button className="btn btn-verde" onClick={confirmar} disabled={salvando}>
                {salvando ? 'Salvando…' : 'Encerrar o dia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const DIA_CURTO = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
function quandoFoi(dia: string, hoje: string) {
  const d = diferencaDias(dia, hoje)
  if (d === -1) return 'ontem'
  if (d === -2) return 'anteontem'
  return DIA_CURTO.format(new Date(`${dia}T12:00:00Z`)).replace(/\./g, '')
}

/** Aviso do que ficou para trás nos últimos dias, com "trazer para hoje". */
function FicouParaTras() {
  const { atrasadas, trazerParaHoje, deixarPraLa, hojeReal } = useDia()
  const { mostrar } = useToast()
  const [aberto, setAberto] = useState(false)
  const [ocupado, setOcupado] = useState<string | null>(null)
  if (!atrasadas.length) return null
  async function agir(p: Atrasada, trazer: boolean) {
    setOcupado(p.id)
    const e = trazer ? await trazerParaHoje(p) : await deixarPraLa(p)
    setOcupado(null)
    if (e) return mostrar(e, { comNav: true })
    if (trazer) tocar('plantar')
  }
  const n = atrasadas.length
  return (
    <section className="dia-atras" data-aberto={aberto || undefined} aria-label="Ficou para trás">
      <button className="dia-atras-topo" onClick={() => setAberto((a) => !a)} aria-expanded={aberto}>
        <span className="dia-atras-sino" aria-hidden>
          <BellRing />
          <i>{n}</i>
        </span>
        <span className="dia-atras-textos">
          <b>{n === 1 ? '1 tarefa ficou para trás' : `${n} tarefas ficaram para trás`}</b>
          <small>{aberto ? 'Traga para hoje ou deixe ir. Sem culpa.' : 'Toque para ver e trazer para hoje'}</small>
        </span>
        <ChevronDown aria-hidden />
      </button>
      {aberto && (
        <ul className="dia-atras-lista">
          {atrasadas.map((p) => (
            <li key={p.id}>
              <div className="dia-atras-item">
                <b>{p.titulo}</b>
                <small>
                  {quandoFoi(p.dia, hojeReal)}
                  {p.primeira_acao && ` · começar por: ${p.primeira_acao}`}
                </small>
              </div>
              <div className="dia-atras-acoes">
                <button className="btn btn-fantasma" disabled={ocupado === p.id} onClick={() => void agir(p, false)}>
                  Deixar pra lá
                </button>
                <button className="btn btn-primario" disabled={ocupado === p.id} onClick={() => void agir(p, true)}>
                  <ArrowDownToLine aria-hidden />
                  Trazer para hoje
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Folha para escolher itens pendentes do Despejo mental e colocar no A fazer de hoje. */
function PuxarDoDespejo({ aoFechar }: { aoFechar: () => void }) {
  const { despejo, despejoParaHoje } = useDia()
  const { mostrar } = useToast()
  const [ocupado, setOcupado] = useState<string | null>(null)
  const abertos = despejo.filter((d) => !d.resolvido)
  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha" role="dialog" aria-modal="true" aria-labelledby="dia-puxar" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <h2 id="dia-puxar" className="dia-folha-titulo">
          Puxar do Despejo mental
        </h2>
        <p className="dia-folha-apoio">O item entra no A fazer de hoje e sai dos pendentes do despejo.</p>
        {abertos.length === 0 ? (
          <p className="vazio">Nada pendente no despejo.</p>
        ) : (
          <ul className="dia-puxar-lista">
            {abertos.map((d) => (
              <li key={d.id}>
                <div>
                  <b>{d.texto}</b>
                  {d.proxima_acao && <small>Próxima ação: {d.proxima_acao}</small>}
                </div>
                <button
                  className="btn btn-secundario"
                  disabled={ocupado === d.id}
                  onClick={async () => {
                    setOcupado(d.id)
                    const e = await despejoParaHoje(d)
                    setOcupado(null)
                    if (e) return mostrar(e, { comNav: true })
                    tocar('plantar')
                  }}
                >
                  <Plus aria-hidden />
                  Hoje
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="dia-prio-botoes">
          <button className="btn btn-fantasma" onClick={aoFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function Prioridades() {
  const { prioridades, editavel, dia, hojeReal, despejo } = useDia()
  const [extra, setExtra] = useState<number | null>(null)
  const [puxar, setPuxar] = useState(false)
  const usadas = new Set(prioridades.map((p) => p.ordem))
  // Três lugares sempre à vista; depois disso, as que você adicionou.
  const ordens = [...new Set([...(editavel || !prioridades.length ? [1, 2, 3] : []), ...usadas, ...(extra ? [extra] : [])])].sort((a, b) => a - b)
  const temVazia = ordens.some((n) => !usadas.has(n))
  const proxima = Array.from({ length: MAX_PRIORIDADES }, (_, i) => i + 1).find((n) => !usadas.has(n) && n !== extra)
  const pendentesDespejo = despejo.filter((d) => !d.resolvido).length
  const feitas = prioridades.filter((p) => p.feita).length
  return (
    <Secao titulo={TEXTOS.prioridadesTitulo}>
      {editavel && <p className="dia-apoio">{TEXTOS.prioridadesApoio}</p>}
      {prioridades.length > 3 && (
        <p className="dia-prio-conta">
          {feitas} de {prioridades.length} feitas
        </p>
      )}
      <ol className="dia-prios">
        {ordens.map((n) => {
          const p = prioridades.find((x) => x.ordem === n)
          return (
            <Slot
              key={`${dia}-${n}-${p?.id ?? 'novo'}`}
              ordem={n}
              p={p}
              novo={!p && n === extra}
              aoFechar={n === extra ? () => setExtra(null) : undefined}
            />
          )
        })}
      </ol>
      {editavel && (
        <div className="dia-prio-mais">
          {!temVazia && proxima && (
            <button className="btn btn-secundario" onClick={() => setExtra(proxima)}>
              <Plus aria-hidden />
              Adicionar mais uma
            </button>
          )}
          {dia === hojeReal && pendentesDespejo > 0 && (
            <button className="btn btn-fantasma" onClick={() => setPuxar(true)}>
              <NotebookPen aria-hidden />
              Puxar do Despejo ({pendentesDespejo})
            </button>
          )}
        </div>
      )}
      {puxar && <PuxarDoDespejo aoFechar={() => setPuxar(false)} />}
    </Secao>
  )
}

function rotuloDoDia(dia: string, hoje: string) {
  const d = diferencaDias(dia, hoje)
  if (d === 0) return 'Hoje'
  if (d === -1) return 'Ontem'
  if (d === 1) return 'Amanhã'
  return d < 0 ? 'Dia passado' : 'Dia futuro'
}

export function Hoje() {
  const { itens, prioridades, fimDeSemana, feitos, dia, hojeReal, irPara, editavel } = useDia()
  const { acesso } = useAuth()
  const [calendario, setCalendario] = useState(false)
  const [hora, setHora] = useState(horaAtual)
  const completoAntes = useRef<boolean | null>(null)
  useEffect(() => {
    const t = window.setInterval(() => setHora(horaAtual()), 60_000)
    return () => window.clearInterval(t)
  }, [])

  const ehHoje = dia === hojeReal
  const blocos = fimDeSemana ? BLOCOS_FIM_DE_SEMANA : BLOCOS_SEMANA
  const agora = hora < 12 ? blocos[0] : hora < 18 ? blocos[1] : blocos[2]
  const manha = itensDeHoje(itens, 'manha', fimDeSemana)
  const noite = itensDeHoje(itens, 'noite', fimDeSemana)
  const essenciais = itensDeHoje(itens, 'essencial', fimDeSemana)
  const total = [...manha, ...noite]
  const feitosTotal = total.filter((i) => feitos.has(i.id)).length + prioridades.filter((p) => p.feita).length
  const totalGeral = total.length + prioridades.length
  const completo = totalGeral > 0 && feitosTotal === totalGeral
  useEffect(() => {
    // Só toca quando você completa tudo agora (não ao abrir um dia que já estava completo).
    if (completoAntes.current === false && completo && editavel) tocar('sucesso')
    completoAntes.current = completo
  }, [completo, editavel, dia])
  const [diaSemana, resto] = dataPorExtensoDoBanco(dia).split(', ')
  const anterior = somarDias(dia, -1)
  const proximo = somarDias(dia, 1)

  return (
    <div className="dia-hoje">
      <section className="dia-hero" aria-label={rotuloDoDia(dia, hojeReal)} data-passado={!ehHoje || undefined}>
        <div className="dia-hero-nav">
          <button className="btn-icone" onClick={() => irPara(anterior)} disabled={!anterior.startsWith(`${ANO}-`)} aria-label="Dia anterior">
            <ChevronLeft aria-hidden />
          </button>
          <span className="dia-hero-tipo">{rotuloDoDia(dia, hojeReal)} · {fimDeSemana ? 'fim de semana' : 'dia útil'}</span>
          <button className="btn-icone" onClick={() => irPara(proximo)} disabled={!proximo.startsWith(`${ANO}-`)} aria-label="Próximo dia">
            <ChevronRight aria-hidden />
          </button>
          <button className="btn btn-secundario dia-cal-botao" onClick={() => setCalendario(true)} aria-label="Abrir calendário">
            <CalendarDays aria-hidden />
            <span className="dia-cal-texto">Calendário</span>
          </button>
        </div>
        {ehHoje ? (
          <p className="dia-hero-saudacao">
            {saudacao()}, <b>{acesso ? primeiroNome(acesso.nome) : ''}</b>
          </p>
        ) : (
          <p className="dia-hero-saudacao">
            {editavel ? 'Você ainda pode ajustar este dia.' : diferencaDias(dia, hojeReal) < 0 ? 'Só consulta: dias antigos não mudam.' : 'Este dia ainda não chegou.'}
          </p>
        )}
        <h2 className="dia-hero-data">
          <span>{diaSemana}</span>
          {resto}
        </h2>
        {ehHoje && (
          <div className="dia-hero-bloco">
            <b>{agora.nome}</b>
            <span>{agora.foco}</span>
          </div>
        )}
        {totalGeral > 0 && (
          <div className="dia-hero-conta">
            <span className="dia-hero-barra" aria-hidden>
              <i style={{ width: `${Math.round((feitosTotal / totalGeral) * 100)}%` }} />
            </span>
            <small>
              {feitosTotal} de {totalGeral} feitos
            </small>
          </div>
        )}
        {!ehHoje && (
          <button className="btn btn-primario dia-voltar-hoje" onClick={() => irPara(hojeReal)}>
            Voltar para hoje
          </button>
        )}
      </section>

      {ehHoje && <FicouParaTras />}
      {ehHoje && <PomodoroCartao />}

      <div className="dia-coluna">
        <Checklist key={`m-${dia}`} titulo="Rotina da manhã" itens={manha} aberto={!ehHoje || hora < 12} />

        <Prioridades />

        <Checklist key={`n-${dia}`} titulo="Rotina da noite" itens={noite} aberto={!ehHoje || hora >= 17} />
      </div>

      {essenciais.length > 0 && (
        <aside className="dia-essenciais" aria-label="Essenciais do dia">
          <span className="rotulo">Essenciais do dia</span>
          <p>{essenciais.map((i) => i.titulo).join(' · ')}</p>
        </aside>
      )}

      <Encerrar />
      {calendario && <Calendario aoFechar={() => setCalendario(false)} />}
    </div>
  )
}
