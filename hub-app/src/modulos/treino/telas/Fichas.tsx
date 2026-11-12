import { ArrowDown, ArrowUp, ChevronDown, Minus, Plus, Repeat2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Secao } from '../../../components/compartilhado/ShellModulo'
import { useToast } from '../../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { alternativas, EXERCICIOS, GRUPOS, nomeExercicio, type Grupo } from '../catalogo'
import { useTreino } from '../dados'
import { ExercicioDetalhe } from '../ExercicioDetalhe'
import { ExercicioImagem } from '../ExercicioImagem'
import { duracaoEstimada } from '../plano'
import type { Ficha, FichaItem } from '../tipos'

function Escolher({ titulo, opcoes, aoEscolher, aoFechar }: { titulo: string; opcoes: string[]; aoEscolher: (id: string) => void; aoFechar: () => void }) {
  const [grupo, setGrupo] = useState<Grupo | 'todos'>('todos')
  const lista = EXERCICIOS.filter((e) => opcoes.includes(e.id) && (grupo === 'todos' || e.grupo === grupo))
  const grupos = [...new Set(EXERCICIOS.filter((e) => opcoes.includes(e.id)).map((e) => e.grupo))]
  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha" role="dialog" aria-modal="true" aria-labelledby="tr-esc" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <h2 id="tr-esc" className="dia-folha-titulo">
          {titulo}
        </h2>
        {grupos.length > 1 && (
          <div className="tr-chips">
            <button className="dia-chip" aria-pressed={grupo === 'todos'} onClick={() => setGrupo('todos')}>
              Todos
            </button>
            {grupos.map((g) => (
              <button key={g} className="dia-chip" aria-pressed={grupo === g} onClick={() => setGrupo(g)}>
                {GRUPOS[g]}
              </button>
            ))}
          </div>
        )}
        <ul className="tr-alternativas">
          {lista.map((e) => (
            <li key={e.id}>
              <button onClick={() => aoEscolher(e.id)}>
                <ExercicioImagem id={e.id} tamanho="mini" />
                <span>
                  <b>{e.nome}</b>
                  <small>
                    {GRUPOS[e.grupo]} · {e.equipamento}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Item({ it, primeiro, ultimo, aoMover, aoMudar }: { it: FichaItem; primeiro: boolean; ultimo: boolean; aoMover: (d: -1 | 1) => void; aoMudar: () => Promise<void> }) {
  const { mostrar } = useToast()
  const [trocar, setTrocar] = useState(false)
  const [ver, setVer] = useState(false)
  async function atualizar(campos: Partial<FichaItem>) {
    const { error } = await supabase.from('treino_ficha_itens').update(campos).eq('id', it.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await aoMudar()
  }
  async function apagar() {
    const { error } = await supabase.from('treino_ficha_itens').delete().eq('id', it.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await aoMudar()
  }
  return (
    <li className="tr-item">
      <ExercicioImagem id={it.exercicio} tamanho="mini" />
      <div className="tr-item-corpo">
        <button className="tr-item-nome" onClick={() => setVer(true)}>
          {nomeExercicio(it.exercicio)}
        </button>
        <div className="tr-item-ajustes">
          <span className="tr-passo" aria-label="Séries">
            <button className="btn-icone" onClick={() => void atualizar({ series: Math.max(1, it.series - 1) })} aria-label="Menos uma série">
              <Minus aria-hidden />
            </button>
            <b>{it.series}</b>
            <button className="btn-icone" onClick={() => void atualizar({ series: Math.min(10, it.series + 1) })} aria-label="Mais uma série">
              <Plus aria-hidden />
            </button>
          </span>
          <span className="tr-x">séries ×</span>
          <select className="entrada tr-reps" value={`${it.reps_min}-${it.reps_max}`} onChange={(e) => {
            const [a, b] = e.target.value.split('-').map(Number)
            void atualizar({ reps_min: a, reps_max: b })
          }} aria-label="Repetições">
            {['4-6', '6-8', '6-10', '8-10', '8-12', '10-12', '10-15', '12-15', '15-20', `${it.reps_min}-${it.reps_max}`]
              .filter((v, i, l) => l.indexOf(v) === i)
              .map((v) => (
                <option key={v} value={v}>
                  {v.replace('-', '–')} reps
                </option>
              ))}
          </select>
        </div>
        <div className="tr-item-botoes">
          <button className="btn-icone" disabled={primeiro} onClick={() => aoMover(-1)} aria-label="Subir">
            <ArrowUp aria-hidden />
          </button>
          <button className="btn-icone" disabled={ultimo} onClick={() => aoMover(1)} aria-label="Descer">
            <ArrowDown aria-hidden />
          </button>
          <button className="btn-icone" onClick={() => setTrocar(true)} aria-label="Trocar exercício">
            <Repeat2 aria-hidden />
          </button>
          <button className="btn-icone" onClick={() => void apagar()} aria-label="Tirar da ficha">
            <Trash2 aria-hidden />
          </button>
        </div>
      </div>
      {ver && <ExercicioDetalhe id={it.exercicio} alvo={{ series: it.series, min: it.reps_min, max: it.reps_max }} aoFechar={() => setVer(false)} />}
      {trocar && (
        <Escolher
          titulo={`Trocar ${nomeExercicio(it.exercicio)}`}
          opcoes={alternativas(it.exercicio).map((e) => e.id)}
          aoFechar={() => setTrocar(false)}
          aoEscolher={(id) => {
            setTrocar(false)
            void atualizar({ exercicio: id })
          }}
        />
      )}
    </li>
  )
}

function CartaoFicha({ f, idx, total, aoMover }: { f: Ficha; idx: number; total: number; aoMover: (d: -1 | 1) => void }) {
  const { recarregar, perfil } = useTreino()
  const { mostrar } = useToast()
  const [aberta, setAberta] = useState(false)
  const [adicionar, setAdicionar] = useState(false)

  async function moverItem(i: number, d: -1 | 1) {
    const a = f.itens[i]
    const b = f.itens[i + d]
    if (!a || !b) return
    const r1 = await supabase.from('treino_ficha_itens').update({ ordem: b.ordem === a.ordem ? a.ordem + d : b.ordem }).eq('id', a.id)
    const r2 = await supabase.from('treino_ficha_itens').update({ ordem: a.ordem }).eq('id', b.id)
    const e = r1.error ?? r2.error
    if (e) mostrar(mensagemDeErroBanco(e), { comNav: true })
    await recarregar()
  }
  async function novoItem(ex: string) {
    setAdicionar(false)
    const ordem = Math.max(0, ...f.itens.map((i) => i.ordem)) + 1
    const { error } = await supabase.from('treino_ficha_itens').insert({ ficha_id: f.id, exercicio: ex, ordem, series: 3, reps_min: 10, reps_max: 12 })
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await recarregar()
  }
  async function alternarAtiva() {
    const { error } = await supabase.from('treino_fichas').update({ ativa: !f.ativa }).eq('id', f.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await recarregar()
  }
  const series = f.itens.reduce((t, i) => t + i.series, 0)
  return (
    <li className="tr-ficha" data-inativa={!f.ativa || undefined}>
      <div className="tr-ficha-cabeca">
        <span className="tr-ficha-num">{idx + 1}</span>
        <button className="tr-ficha-titulo" onClick={() => setAberta((a) => !a)} aria-expanded={aberta}>
          <b>{f.nome}</b>
          <small>
            {f.itens.length} exercícios · {series} séries · ~{duracaoEstimada(f.itens, perfil.descanso_seg)} min
          </small>
        </button>
        <button className="btn-icone" disabled={idx === 0} onClick={() => aoMover(-1)} aria-label={`Subir ${f.nome} na rotação`}>
          <ArrowUp aria-hidden />
        </button>
        <button className="btn-icone" disabled={idx === total - 1} onClick={() => aoMover(1)} aria-label={`Descer ${f.nome} na rotação`}>
          <ArrowDown aria-hidden />
        </button>
        <ChevronDown className="tr-ficha-seta" aria-hidden />
      </div>
      {aberta && (
        <div className="tr-ficha-corpo">
          {f.foco && <p className="dia-apoio">{f.foco}</p>}
          <ul className="tr-itens">
            {f.itens.map((it, i) => (
              <Item key={it.id} it={it} primeiro={i === 0} ultimo={i === f.itens.length - 1} aoMover={(d) => void moverItem(i, d)} aoMudar={recarregar} />
            ))}
          </ul>
          <div className="dia-prio-botoes">
            <button className="btn btn-fantasma" onClick={() => void alternarAtiva()}>
              {f.ativa ? 'Tirar da rotação' : 'Voltar para a rotação'}
            </button>
            <button className="btn btn-secundario" onClick={() => setAdicionar(true)}>
              <Plus aria-hidden /> Exercício
            </button>
          </div>
        </div>
      )}
      {adicionar && (
        <Escolher titulo={`Adicionar em ${f.nome}`} opcoes={EXERCICIOS.map((e) => e.id).filter((id) => !f.itens.some((i) => i.exercicio === id))} aoFechar={() => setAdicionar(false)} aoEscolher={(id) => void novoItem(id)} />
      )}
    </li>
  )
}

export function Fichas() {
  const { fichas, recarregar } = useTreino()
  const { mostrar } = useToast()
  const ordenadas = [...fichas].sort((a, b) => a.ordem - b.ordem)

  async function mover(i: number, d: -1 | 1) {
    const a = ordenadas[i]
    const b = ordenadas[i + d]
    if (!a || !b) return
    const r1 = await supabase.from('treino_fichas').update({ ordem: b.ordem === a.ordem ? a.ordem + d : b.ordem }).eq('id', a.id)
    const r2 = await supabase.from('treino_fichas').update({ ordem: a.ordem }).eq('id', b.id)
    const e = r1.error ?? r2.error
    if (e) mostrar(mensagemDeErroBanco(e), { comNav: true })
    await recarregar()
  }

  return (
    <div className="tr-fichas">
      <Secao titulo="Suas fichas">
        <p className="dia-apoio">
          A ordem é a rotação: depois de um treino vem o próximo da lista, e depois do último volta para o primeiro. Os dias de descanso entram sozinhos pelo seu perfil (engrenagem lá em cima).
        </p>
        <ol className="tr-lista-fichas">
          {ordenadas.map((f, i) => (
            <CartaoFicha key={f.id} f={f} idx={i} total={ordenadas.length} aoMover={(d) => void mover(i, d)} />
          ))}
        </ol>
      </Secao>
    </div>
  )
}
