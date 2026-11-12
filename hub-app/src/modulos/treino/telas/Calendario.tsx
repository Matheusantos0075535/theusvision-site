import { ChevronLeft, ChevronRight, Dumbbell, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { dataPorExtensoDoBanco, diaDaSemana } from '../../../lib/tempo'
import { nomeExercicio } from '../catalogo'
import { novoId, useTreino } from '../dados'
import { planejar, type Plano } from '../plano'
import { EscolherTreino, resumoSeries } from './Hoje'

const ANO = 2026
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const dois = (n: number) => String(n).padStart(2, '0')

function curto(nome: string) {
  const p = nome.split(/\s+/)[0]
  return p.length > 7 ? p.slice(0, 6) + '.' : p
}

function DiaDetalhe({ dia, plano, aoFechar }: { dia: string; plano: Plano | undefined; aoFechar: () => void }) {
  const { hoje, fichas, series, recarregar, fichaPorId } = useTreino()
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const [planejarDia, setPlanejarDia] = useState(false)

  async function registrar(fichaId: string, comSeries: boolean) {
    const f = fichaPorId(fichaId)!
    const id = novoId()
    const { error } = await supabase.from('treino_sessoes').insert({
      id,
      dia,
      ficha_id: f.id,
      nome: f.nome,
      sem_registro: !comSeries,
      concluido_em: comSeries ? null : new Date().toISOString(),
    })
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await recarregar()
    if (comSeries) navegar(`/treino/sessao/${id}`)
    else aoFechar()
  }

  async function apagar(id: string) {
    if (!window.confirm('Apagar este treino?')) return
    const { error } = await supabase.from('treino_sessoes').delete().eq('id', id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await recarregar()
    aoFechar()
  }

  if (planejarDia) return <EscolherTreino dia={dia} aoFechar={aoFechar} />

  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha" role="dialog" aria-modal="true" aria-labelledby="tr-dia" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <h2 id="tr-dia" className="dia-folha-titulo">
          {dataPorExtensoDoBanco(dia)}
        </h2>
        {plano?.tipo === 'feito' ? (
          plano.sessoes.map((s) => {
            const minhas = series.filter((x) => x.sessao_id === s.id && x.feita)
            const porEx = [...new Set(minhas.map((x) => x.exercicio))]
            return (
              <div key={s.id} className="tr-dia-sessao">
                <b>
                  <Dumbbell aria-hidden /> {s.nome}
                </b>
                {s.sem_registro ? (
                  <p className="dia-folha-apoio">Treino registrado sem anotar as séries.</p>
                ) : porEx.length ? (
                  <ul>
                    {porEx.map((ex) => (
                      <li key={ex}>
                        <span>{nomeExercicio(ex)}</span>
                        <small>{resumoSeries(minhas.filter((x) => x.exercicio === ex).sort((a, b) => a.serie - b.serie))}</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dia-folha-apoio">Nenhuma série marcada.</p>
                )}
                <div className="dia-prio-botoes">
                  {!s.sem_registro && (
                    <button className="btn btn-secundario" onClick={() => navegar(`/treino/sessao/${s.id}`)}>
                      Abrir
                    </button>
                  )}
                  <button className="btn btn-fantasma" onClick={() => void apagar(s.id)}>
                    <Trash2 aria-hidden /> Apagar
                  </button>
                </div>
              </div>
            )
          })
        ) : dia > hoje ? (
          <>
            <p className="dia-folha-apoio">
              Planejado: <b>{plano?.tipo === 'treino' ? fichaPorId(plano.fichaId)?.nome : 'Descanso'}</b>
              {plano && plano.tipo !== 'vazio' && 'manual' in plano && plano.manual ? ' (ajustado por você)' : ' (automático)'}
            </p>
            <button className="btn btn-primario btn-grande" onClick={() => setPlanejarDia(true)}>
              Mudar o plano deste dia
            </button>
          </>
        ) : (
          <>
            <p className="dia-folha-apoio">{dia === hoje ? 'Ainda sem treino hoje.' : 'Nenhum treino registrado neste dia. Treinou e esqueceu de anotar?'}</p>
            <div className="tr-opcoes">
              {fichas
                .filter((f) => f.ativa)
                .map((f) => (
                  <div key={f.id} className="tr-opcao tr-opcao-dupla">
                    <b>{f.nome}</b>
                    <div>
                      <button className="btn btn-secundario" onClick={() => void registrar(f.id, false)}>
                        Só marcar
                      </button>
                      <button className="btn btn-primario" onClick={() => void registrar(f.id, true)}>
                        Anotar séries
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            {dia === hoje && (
              <button className="btn btn-fantasma" onClick={() => setPlanejarDia(true)}>
                Planejar descanso hoje
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function Calendario() {
  const { hoje, fichas, sessoes, agenda, perfil, fichaPorId } = useTreino()
  const [mes, setMes] = useState(hoje.startsWith(`${ANO}-`) ? Number(hoje.slice(5, 7)) - 1 : 0)
  const [aberto, setAberto] = useState<string | null>(null)
  const plano = useMemo(
    () => planejar({ hoje, desde: `${ANO}-01-01`, ate: `${ANO}-12-31`, fichas, sessoes, agenda, perfil }),
    [hoje, fichas, sessoes, agenda, perfil],
  )
  const primeiro = `${ANO}-${dois(mes + 1)}-01`
  const ultimoDia = new Date(Date.UTC(ANO, mes + 1, 0)).getUTCDate()
  const dias = Array.from({ length: ultimoDia }, (_, i) => `${ANO}-${dois(mes + 1)}-${dois(i + 1)}`)
  const feitosMes = dias.filter((d) => plano.get(d)?.tipo === 'feito').length

  return (
    <div className="tr-calendario">
      <div className="cal-topo">
        <button className="btn-icone" onClick={() => setMes((m) => m - 1)} disabled={mes === 0} aria-label="Mês anterior">
          <ChevronLeft aria-hidden />
        </button>
        <h2>
          {MESES[mes]} <span>{ANO}</span>
        </h2>
        <button className="btn-icone" onClick={() => setMes((m) => m + 1)} disabled={mes === 11} aria-label="Próximo mês">
          <ChevronRight aria-hidden />
        </button>
      </div>
      <p className="dia-apoio tr-cal-resumo">
        {feitosMes} {feitosMes === 1 ? 'treino' : 'treinos'} em {MESES[mes].toLowerCase()}. Toque num dia para ver, registrar ou mudar o plano.
      </p>
      <div className="cal-grade tr-cal-grade">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <span key={i} className="cal-semana" aria-hidden>
            {d}
          </span>
        ))}
        {Array.from({ length: diaDaSemana(primeiro) }, (_, i) => (
          <span key={`v${i}`} />
        ))}
        {dias.map((d) => {
          const p = plano.get(d)
          const rotulo =
            p?.tipo === 'feito' ? p.sessoes[p.sessoes.length - 1].nome : p?.tipo === 'treino' ? fichaPorId(p.fichaId)?.nome ?? '' : p?.tipo === 'descanso' ? 'Descanso' : ''
          return (
            <button key={d} className="tr-cal-dia" data-tipo={p?.tipo} data-hoje={d === hoje || undefined} onClick={() => setAberto(d)} aria-label={`${dataPorExtensoDoBanco(d)}: ${rotulo || 'nada'}`}>
              <b>{Number(d.slice(8))}</b>
              <small>{p?.tipo === 'descanso' ? '☾' : rotulo ? curto(rotulo) : ''}</small>
            </button>
          )
        })}
      </div>
      <div className="cal-legenda">
        <span>
          <i className="tr-leg" data-tipo="feito" /> feito
        </span>
        <span>
          <i className="tr-leg" data-tipo="treino" /> planejado
        </span>
        <span>
          <i className="tr-leg" data-tipo="descanso" /> descanso
        </span>
      </div>
      {aberto && <DiaDetalhe dia={aberto} plano={plano.get(aberto)} aoFechar={() => setAberto(null)} />}
    </div>
  )
}
