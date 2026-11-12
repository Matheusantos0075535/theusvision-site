import { CheckCircle2, ChevronRight, Clock, MoonStar, Play, Repeat2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Secao } from '../../../components/compartilhado/ShellModulo'
import { useToast } from '../../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { dataPorExtensoDoBanco, diaDaSemana, somarDias } from '../../../lib/tempo'
import { nomeExercicio } from '../catalogo'
import { novoId, useTreino } from '../dados'
import { ExercicioDetalhe } from '../ExercicioDetalhe'
import { ExercicioImagem } from '../ExercicioImagem'
import { duracaoEstimada, inicioDaSemana, planejar, type Plano } from '../plano'
import type { Ficha } from '../tipos'
import { atualizarOuCriar } from '../../../lib/salvar'

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const SEMANA_LONGA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export function resumoSeries(series: { carga_kg: number | null; reps: number | null }[]) {
  return series
    .map((s) => `${String(s.carga_kg ?? 0).replace('.', ',')}kg${s.reps != null ? `×${s.reps}` : ''}`)
    .join(' · ')
}

/** Folha para escolher outro treino (ou descanso) para um dia. */
export function EscolherTreino({ dia, aoFechar, aoEscolher }: { dia: string; aoFechar: () => void; aoEscolher?: (f: Ficha) => void }) {
  const { fichas, recarregar, agenda } = useTreino()
  const { mostrar } = useToast()
  async function definir(ficha: string | null | 'auto') {
    const erro =
      ficha === 'auto'
        ? (await supabase.from('treino_agenda').delete().eq('dia', dia)).error
        : await atualizarOuCriar('treino_agenda', { dia }, { ficha_id: ficha }, { dia, ficha_id: ficha })
    if (erro) return mostrar(mensagemDeErroBanco(erro), { comNav: true })
    await recarregar()
    aoFechar()
  }
  const temManual = agenda.some((a) => a.dia === dia)
  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha" role="dialog" aria-modal="true" aria-labelledby="tr-escolher" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <h2 id="tr-escolher" className="dia-folha-titulo">
          {dataPorExtensoDoBanco(dia)}
        </h2>
        <p className="dia-folha-apoio">{aoEscolher ? 'Qual treino você vai fazer agora?' : 'Escolha o treino deste dia. Os dias seguintes se reorganizam sozinhos.'}</p>
        <div className="tr-opcoes">
          {fichas
            .filter((f) => f.ativa)
            .map((f) => (
              <button key={f.id} className="tr-opcao" onClick={() => (aoEscolher ? (aoFechar(), aoEscolher(f)) : void definir(f.id))}>
                <b>{f.nome}</b>
                <small>{f.foco}</small>
              </button>
            ))}
          {!aoEscolher && (
            <button className="tr-opcao" onClick={() => void definir(null)}>
              <b>Descanso</b>
              <small>Dia livre para recuperar</small>
            </button>
          )}
          {temManual && (
            <button className="btn btn-fantasma" onClick={() => void definir('auto')}>
              Voltar ao automático
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function rotuloPlano(p: Plano | undefined, ficha: (id: string | null) => Ficha | undefined) {
  if (!p || p.tipo === 'vazio') return '—'
  if (p.tipo === 'descanso') return 'Descanso'
  if (p.tipo === 'feito') return p.sessoes[p.sessoes.length - 1].nome
  return ficha(p.fichaId)?.nome ?? 'Treino'
}

export function Hoje() {
  const { hoje, fichas, sessoes, agenda, perfil, fichaPorId, ultimoDesempenho, recarregar, series } = useTreino()
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const [escolher, setEscolher] = useState<string | null>(null)
  const [extra, setExtra] = useState(false)
  const [detalhe, setDetalhe] = useState<{ id: string; alvo: { series: number; min: number; max: number } } | null>(null)
  const [comecando, setComecando] = useState(false)

  const domingo = inicioDaSemana(hoje)
  const plano = useMemo(
    () => planejar({ hoje, desde: domingo, ate: somarDias(domingo, 13), fichas, sessoes, agenda, perfil }),
    [hoje, domingo, fichas, sessoes, agenda, perfil],
  )
  const p = plano.get(hoje)
  const aberta = sessoes.find((s) => s.dia === hoje && !s.concluido_em && !s.sem_registro)
  const fichaHoje = p?.tipo === 'treino' ? fichaPorId(p.fichaId) : undefined
  const feitosSemana = Array.from({ length: 7 }, (_, i) => plano.get(somarDias(domingo, i))).filter((x) => x?.tipo === 'feito').length
  const proximos = Array.from({ length: 7 }, (_, i) => somarDias(hoje, i + 1)).map((d) => ({ d, p: plano.get(d) }))
  const proximoTreino = proximos.find((x) => x.p?.tipo === 'treino')

  async function comecar(ficha: Ficha) {
    setComecando(true)
    const id = novoId()
    const { error } = await supabase.from('treino_sessoes').insert({ id, dia: hoje, ficha_id: ficha.id, nome: ficha.nome })
    if (error) {
      setComecando(false)
      return mostrar(mensagemDeErroBanco(error), { comNav: true })
    }
    await recarregar()
    navegar(`/treino/sessao/${id}`)
  }

  const feitaHoje = p?.tipo === 'feito' ? p.sessoes.filter((s) => s.concluido_em || s.sem_registro) : []
  const seriesHoje = series.filter((s) => feitaHoje.some((x) => x.id === s.sessao_id) && s.feita)

  return (
    <div className="tr-hoje">
      <section className="dia-hero tr-hero">
        <span className="dia-hero-tipo">
          Hoje · {SEMANA_LONGA[diaDaSemana(hoje)]}
        </span>
        {aberta ? (
          <>
            <p className="dia-hero-saudacao">Treino em andamento</p>
            <h2 className="dia-hero-data">
              <span>{aberta.nome}</span>
            </h2>
            <button className="btn btn-verde btn-grande" onClick={() => navegar(`/treino/sessao/${aberta.id}`)}>
              <Play aria-hidden /> Continuar treino
            </button>
          </>
        ) : p?.tipo === 'feito' ? (
          <>
            <p className="dia-hero-saudacao">Treino de hoje concluído</p>
            <h2 className="dia-hero-data">
              <span>{feitaHoje.map((s) => s.nome).join(' + ') || p.sessoes[0].nome}</span>
            </h2>
            <p className="tr-hero-linha">
              <CheckCircle2 aria-hidden /> {seriesHoje.length} séries · {Math.round(seriesHoje.reduce((t, s) => t + (s.carga_kg ?? 0) * (s.reps ?? 0), 0)).toLocaleString('pt-BR')} kg de volume
            </p>
            {proximoTreino && (
              <p className="tr-hero-prox">
                Próximo: <b>{SEMANA_LONGA[diaDaSemana(proximoTreino.d)]} · {rotuloPlano(proximoTreino.p, fichaPorId)}</b>
              </p>
            )}
          </>
        ) : p?.tipo === 'treino' && fichaHoje ? (
          <>
            <p className="dia-hero-saudacao">Treino de hoje</p>
            <h2 className="dia-hero-data">
              <span>{fichaHoje.nome}</span>
            </h2>
            <p className="tr-hero-linha">
              {fichaHoje.foco} · {fichaHoje.itens.length} exercícios
              <span className="tr-hero-tempo">
                <Clock aria-hidden /> ~{duracaoEstimada(fichaHoje.itens, perfil.descanso_seg)} min
              </span>
            </p>
            <button className="btn btn-verde btn-grande" onClick={() => void comecar(fichaHoje)} disabled={comecando}>
              <Play aria-hidden /> {comecando ? 'Abrindo…' : `Começar treino de ${fichaHoje.nome.toLowerCase()}`}
            </button>
          </>
        ) : (
          <>
            <p className="dia-hero-saudacao">Hoje é dia de</p>
            <h2 className="dia-hero-data">
              <span>Descanso</span>
            </h2>
            <p className="tr-hero-linha">
              <MoonStar aria-hidden /> O músculo cresce na recuperação. Durma bem e coma direito.
            </p>
            {proximoTreino && (
              <p className="tr-hero-prox">
                Próximo: <b>{SEMANA_LONGA[diaDaSemana(proximoTreino.d)]} · {rotuloPlano(proximoTreino.p, fichaPorId)}</b>
              </p>
            )}
          </>
        )}
        {!aberta && (
          <button className="btn btn-secundario tr-trocar" onClick={() => (p?.tipo === 'feito' ? setExtra(true) : setEscolher(hoje))}>
            <Repeat2 aria-hidden /> {p?.tipo === 'feito' ? 'Treinar mais alguma coisa' : 'Trocar o treino de hoje'}
          </button>
        )}
      </section>

      <Secao titulo={`Semana · ${feitosSemana} de ${perfil.dias_semana} treinos`}>
        <ol className="tr-semana">
          {Array.from({ length: 7 }, (_, i) => {
            const d = somarDias(domingo, i)
            const x = plano.get(d)
            return (
              <li key={d}>
                <button
                  className="tr-semana-dia"
                  data-tipo={x?.tipo}
                  data-hoje={d === hoje || undefined}
                  onClick={() => (d >= hoje ? setEscolher(d) : navegar('/treino/calendario'))}
                  aria-label={`${SEMANA_LONGA[diaDaSemana(d)]}: ${rotuloPlano(x, fichaPorId)}`}
                >
                  <small>{SEMANA[i]}</small>
                  <b>{Number(d.slice(8))}</b>
                  <span>{x?.tipo === 'feito' ? '✓' : x?.tipo === 'descanso' ? '☾' : ''}</span>
                  <em>{rotuloPlano(x, fichaPorId).split(/\s+/)[0]}</em>
                </button>
              </li>
            )
          })}
        </ol>
      </Secao>

      {fichaHoje && !aberta && p?.tipo === 'treino' && (
        <Secao titulo="Exercícios de hoje">
          <p className="dia-apoio">Toque num exercício para ver como funciona, o que trabalha e por que ele está no treino.</p>
          <ul className="tr-previa">
            {fichaHoje.itens.map((it, i) => {
              const ultimo = ultimoDesempenho(it.exercicio)
              return (
                <li key={it.id}>
                  <button className="tr-previa-item" onClick={() => setDetalhe({ id: it.exercicio, alvo: { series: it.series, min: it.reps_min, max: it.reps_max } })}>
                    <span className="tr-previa-num">{i + 1}</span>
                    <ExercicioImagem id={it.exercicio} tamanho="mini" />
                    <div>
                      <b>{nomeExercicio(it.exercicio)}</b>
                      <small>
                        {it.series} × {it.reps_min}–{it.reps_max}
                        {ultimo.length > 0 && ` · última: ${resumoSeries(ultimo.slice(0, 2))}`}
                      </small>
                    </div>
                    <ChevronRight aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        </Secao>
      )}

      <Secao titulo="Próximos dias">
        <ul className="tr-proximos">
          {proximos.map(({ d, p: x }) => (
            <li key={d}>
              <button onClick={() => setEscolher(d)}>
                <span>
                  {SEMANA_LONGA[diaDaSemana(d)]}, {Number(d.slice(8))}
                </span>
                <b data-tipo={x?.tipo}>{rotuloPlano(x, fichaPorId)}</b>
                {x && x.tipo !== 'vazio' && x.tipo !== 'feito' && x.manual && <i>ajustado</i>}
                <ChevronRight aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </Secao>

      {escolher && <EscolherTreino dia={escolher} aoFechar={() => setEscolher(null)} />}
      {detalhe && <ExercicioDetalhe id={detalhe.id} alvo={detalhe.alvo} aoFechar={() => setDetalhe(null)} />}
      {extra && <EscolherTreino dia={hoje} aoFechar={() => setExtra(false)} aoEscolher={(f) => void comecar(f)} />}
    </div>
  )
}
