import { Check, ChevronDown, Flag, Info, Plus, Repeat2, Timer, Trash2, Trophy, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { alternativas, EXERCICIO, nomeExercicio } from '../catalogo'
import { novoId, useTreino } from '../dados'
import { ExercicioDetalhe } from '../ExercicioDetalhe'
import { ExercicioImagem } from '../ExercicioImagem'
import { umRM } from '../plano'
import type { Serie } from '../tipos'
import { tocar } from '../../../lib/som'

type Linha = { id: string; serie: number; carga: string; reps: string; feita: boolean; salva: boolean }
type Bloco = { chave: string; exercicio: string; alvo: string; descanso: number; linhas: Linha[] }

const kg = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')))
const int = (v: string) => (v.trim() === '' ? null : Number(v))
const fmt = (n: number | null | undefined) => (n == null ? '' : String(n).replace('.', ','))
const relogio = (seg: number) => {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = seg % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

function useAgora(intervalo = 1000) {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), intervalo)
    return () => window.clearInterval(t)
  }, [intervalo])
  return agora
}

function Descanso({ fim, total, aoMudar, aoParar }: { fim: number; total: number; aoMudar: (s: number) => void; aoParar: () => void }) {
  const agora = useAgora(250)
  const resta = Math.max(0, Math.ceil((fim - agora) / 1000))
  const avisou = useRef(false)
  useEffect(() => {
    if (resta === 0 && !avisou.current) {
      avisou.current = true
      tocar('timer')
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        /* sem vibração */
      }
    }
  }, [resta])
  return (
    <div className="tr-descanso" data-fim={resta === 0 || undefined} role="timer" aria-live="off">
      <Timer aria-hidden />
      <div className="tr-descanso-textos">
        <small>{resta === 0 ? 'Bora para a próxima série' : 'Descanso'}</small>
        <b>{relogio(resta)}</b>
      </div>
      <span className="tr-descanso-barra" aria-hidden>
        <i style={{ width: `${Math.min(100, ((total - resta) / total) * 100)}%` }} />
      </span>
      <button className="btn-icone" onClick={() => aoMudar(-15)} aria-label="Menos 15 segundos">
        −15
      </button>
      <button className="btn-icone" onClick={() => aoMudar(15)} aria-label="Mais 15 segundos">
        +15
      </button>
      <button className="btn-icone" onClick={aoParar} aria-label="Fechar descanso">
        <X aria-hidden />
      </button>
    </div>
  )
}

function Trocar({ atual, aoEscolher, aoFechar }: { atual: string; aoEscolher: (id: string) => void; aoFechar: () => void }) {
  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha" role="dialog" aria-modal="true" aria-labelledby="tr-trocar" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <h2 id="tr-trocar" className="dia-folha-titulo">
          Trocar {nomeExercicio(atual)}
        </h2>
        <p className="dia-folha-apoio">Aparelho ocupado ou não tem na academia? Escolha outro que trabalha o mesmo músculo.</p>
        <ul className="tr-alternativas">
          {alternativas(atual).map((e) => (
            <li key={e.id}>
              <button onClick={() => aoEscolher(e.id)}>
                <ExercicioImagem id={e.id} tamanho="mini" />
                <span>
                  <b>{e.nome}</b>
                  <small>{e.equipamento}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function SessaoTela() {
  const { id = '' } = useParams()
  const { sessoes, series, fichaPorId, ultimoDesempenho, perfil, recarregar } = useTreino()
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const sessao = sessoes.find((s) => s.id === id)
  const ficha = fichaPorId(sessao?.ficha_id)
  const [blocos, setBlocos] = useState<Bloco[] | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const [dicas, setDicas] = useState<string | null>(null)
  const [trocar, setTrocar] = useState<string | null>(null)
  const [descanso, setDescanso] = useState<{ fim: number; total: number } | null>(null)
  const [fim, setFim] = useState<null | { duracao: number; series: number; volume: number; recordes: string[] }>(null)
  const [fresco, setFresco] = useState(false)
  const agora = useAgora(1000)

  // Ao abrir, busca de novo as séries salvas: se você saiu do treino e voltou, elas já estão no banco.
  useEffect(() => {
    let vivo = true
    void recarregar().then(() => vivo && setFresco(true))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Monta os blocos uma vez: séries já salvas (retomando) ou o plano da ficha, com a carga da última vez.
  useEffect(() => {
    if (!sessao || blocos || !fresco) return
    const salvas = series.filter((s) => s.sessao_id === sessao.id)
    const ordem: string[] = []
    ;(ficha?.itens ?? []).forEach((i) => ordem.push(i.exercicio))
    salvas
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .forEach((s) => !ordem.includes(s.exercicio) && ordem.push(s.exercicio))
    const novos: Bloco[] = ordem.map((ex, idx) => {
      const item = ficha?.itens.find((i) => i.exercicio === ex)
      const minhas = salvas.filter((s) => s.exercicio === ex).sort((a, b) => a.serie - b.serie)
      const anterior = ultimoDesempenho(ex, sessao.id)
      const n = Math.max(item?.series ?? 3, minhas.length ? minhas[minhas.length - 1].serie : 0)
      return {
        chave: `${ex}-${idx}`,
        exercicio: ex,
        alvo: item ? `${item.series} × ${item.reps_min}–${item.reps_max}` : '',
        descanso: item?.descanso_seg ?? perfil.descanso_seg,
        linhas: Array.from({ length: n }, (_, k) => {
          const s = minhas.find((x) => x.serie === k + 1)
          const ant = anterior.find((x) => x.serie === k + 1) ?? anterior[anterior.length - 1]
          return s
            ? { id: s.id, serie: k + 1, carga: fmt(s.carga_kg), reps: fmt(s.reps), feita: s.feita, salva: true }
            : { id: novoId(), serie: k + 1, carga: fmt(ant?.carga_kg), reps: '', feita: false, salva: false }
        }),
      }
    })
    setBlocos(novos)
    const primeiro = novos.find((b) => b.linhas.some((l) => !l.feita))
    setAberto(primeiro?.chave ?? novos[0]?.chave ?? null)
  }, [sessao, ficha, series, blocos, fresco, ultimoDesempenho, perfil.descanso_seg])

  const salvar = useCallback(
    async (b: Bloco, l: Linha, idx: number, existe = l.salva) => {
      if (!sessao) return
      const linha = {
        id: l.id,
        sessao_id: sessao.id,
        exercicio: b.exercicio,
        ordem: idx + 1,
        serie: l.serie,
        carga_kg: kg(l.carga),
        reps: int(l.reps),
        feita: l.feita,
      }
      const { id: _id, sessao_id: _s, serie: _n, ...mudaveis } = linha
      // Série já salva: só atualiza. Nova: cria (e, se a criação duplicar por repetição do toque, atualiza).
      let erro = existe
        ? (await supabase.from('treino_series').update(mudaveis).eq('id', l.id)).error
        : (await supabase.from('treino_series').insert(linha)).error
      if (erro && (erro as { code?: string }).code === '23505') erro = (await supabase.from('treino_series').update(mudaveis).eq('id', l.id)).error
      if (erro) mostrar(mensagemDeErroBanco(erro), { comNav: true })
    },
    [sessao, mostrar],
  )

  if (!sessao) {
    return (
      <div className="bloco-erro">
        <p>Esse treino não foi encontrado.</p>
        <button className="btn btn-secundario" onClick={() => navegar('/treino')}>
          Voltar
        </button>
      </div>
    )
  }
  if (!blocos)
    return (
      <div className="bloco-carregando" role="status" aria-label="Carregando">
        <span className="giro" />
      </div>
    )

  const alterarLinha = (bi: number, li: number, mudanca: Partial<Linha>) =>
    setBlocos((bs) => bs!.map((b, i) => (i !== bi ? b : { ...b, linhas: b.linhas.map((l, j) => (j !== li ? l : { ...l, ...mudanca })) })))

  async function marcar(bi: number, li: number) {
    const b = blocos![bi]
    const l = b.linhas[li]
    const nova = { ...l, feita: !l.feita, salva: true }
    if (nova.feita && !nova.reps) {
      const item = ficha?.itens.find((i) => i.exercicio === b.exercicio)
      nova.reps = String(item?.reps_max ?? 10)
    }
    alterarLinha(bi, li, nova)
    await salvar(b, nova, bi, l.salva)
    if (nova.feita) {
      setDescanso({ fim: Date.now() + b.descanso * 1000, total: b.descanso })
      const restantes = b.linhas.filter((x, j) => j !== li && !x.feita).length
      if (restantes === 0) {
        tocar('sucesso')
        const prox = blocos!.find((x, j) => j > bi && x.linhas.some((y) => !y.feita))
        if (prox) setAberto(prox.chave)
      }
    }
  }

  function addSerie(bi: number) {
    setBlocos((bs) =>
      bs!.map((b, i) => {
        if (i !== bi) return b
        const ult = b.linhas[b.linhas.length - 1]
        return { ...b, linhas: [...b.linhas, { id: novoId(), serie: b.linhas.length + 1, carga: ult?.carga ?? '', reps: '', feita: false, salva: false }] }
      }),
    )
  }

  async function trocarExercicio(bi: number, novo: string) {
    const b = blocos![bi]
    const salvas = b.linhas.filter((l) => l.salva)
    if (salvas.length) {
      await supabase.from('treino_series').update({ exercicio: novo }).in('id', salvas.map((l) => l.id))
    }
    const anterior = ultimoDesempenho(novo, sessao!.id)
    setBlocos((bs) =>
      bs!.map((x, i) =>
        i !== bi ? x : { ...x, exercicio: novo, linhas: x.linhas.map((l) => (l.salva ? l : { ...l, carga: fmt((anterior.find((a) => a.serie === l.serie) ?? anterior[anterior.length - 1])?.carga_kg) })) },
      ),
    )
    setTrocar(null)
  }

  async function finalizar() {
    const feitas = blocos!.flatMap((b) => b.linhas.filter((l) => l.feita).map((l) => ({ b, l })))
    if (!feitas.length && !window.confirm('Nenhuma série marcada. Finalizar mesmo assim?')) return
    const { error } = await supabase.from('treino_sessoes').update({ concluido_em: new Date().toISOString() }).eq('id', sessao!.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    const recordes: string[] = []
    for (const b of blocos!) {
      const minhas = b.linhas.filter((l) => l.feita && kg(l.carga) != null)
      if (!minhas.length) continue
      const melhorAgora = Math.max(...minhas.map((l) => umRM(kg(l.carga)!, int(l.reps) ?? 1)))
      const antes = series.filter((s: Serie) => s.exercicio === b.exercicio && s.feita && s.sessao_id !== sessao!.id && s.carga_kg != null)
      const melhorAntes = antes.length ? Math.max(...antes.map((s) => umRM(s.carga_kg!, s.reps ?? 1))) : 0
      if (antes.length && melhorAgora > melhorAntes) {
        const top = minhas.reduce((a, l) => (kg(l.carga)! > kg(a.carga)! ? l : a))
        recordes.push(`${nomeExercicio(b.exercicio)}: ${top.carga} kg × ${top.reps}`)
      }
    }
    setDescanso(null)
    tocar(recordes.length ? 'recorde' : 'conquista')
    setFim({
      duracao: Math.round((Date.now() - Date.parse(sessao!.iniciado_em)) / 60000),
      series: feitas.length,
      volume: Math.round(feitas.reduce((t, x) => t + (kg(x.l.carga) ?? 0) * (int(x.l.reps) ?? 0), 0)),
      recordes,
    })
    try {
      navigator.vibrate?.([60, 40, 120])
    } catch {
      /* sem vibração */
    }
  }

  async function descartar() {
    if (!window.confirm('Apagar este treino e todas as séries anotadas?')) return
    const { error } = await supabase.from('treino_sessoes').delete().eq('id', sessao!.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await recarregar()
    navegar('/treino')
  }

  const decorrido = Math.max(0, Math.floor((agora - Date.parse(sessao.iniciado_em)) / 1000))
  const total = blocos.reduce((t, b) => t + b.linhas.length, 0)
  const feitas = blocos.reduce((t, b) => t + b.linhas.filter((l) => l.feita).length, 0)
  const limite = perfil.duracao_max_min * 60
  const concluida = !!sessao.concluido_em

  return (
    <div className="tr-sessao">
      <header className="tr-sessao-topo">
        <div>
          <span className="rotulo">{concluida ? 'Treino concluído' : 'Treinando agora'}</span>
          <h2>{sessao.nome}</h2>
        </div>
        {!concluida && (
          <div className="tr-sessao-relogio" data-passou={decorrido > limite || undefined}>
            <b>{relogio(decorrido)}</b>
            <small>de {relogio(limite)}</small>
          </div>
        )}
        <span className="tr-sessao-barra" aria-label={`${feitas} de ${total} séries`}>
          <i style={{ width: `${total ? (feitas / total) * 100 : 0}%` }} />
        </span>
        <small className="tr-sessao-conta">
          {feitas} de {total} séries
        </small>
      </header>

      <ol className="tr-blocos">
        {blocos.map((b, bi) => {
          const ex = EXERCICIO[b.exercicio]
          const anterior = ultimoDesempenho(b.exercicio, sessao.id)
          const prontas = b.linhas.filter((l) => l.feita).length
          const ehAberto = aberto === b.chave
          return (
            <li key={b.chave} className="tr-bloco" data-aberto={ehAberto || undefined} data-completo={prontas === b.linhas.length || undefined}>
              <button className="tr-bloco-cabeca" onClick={() => setAberto(ehAberto ? null : b.chave)} aria-expanded={ehAberto}>
                <ExercicioImagem id={b.exercicio} tamanho="mini" />
                <span className="tr-bloco-titulos">
                  <b>
                    {bi + 1}. {nomeExercicio(b.exercicio)}
                  </b>
                  <small>
                    {b.alvo && `${b.alvo} · `}
                    {prontas}/{b.linhas.length} séries
                  </small>
                </span>
                <ChevronDown aria-hidden />
              </button>
              {ehAberto && (
                <div className="tr-bloco-corpo">
                  <ExercicioImagem id={b.exercicio} tamanho="grande" />
                  <div className="tr-bloco-acoes">
                    <span className="tr-equip">{ex?.equipamento}</span>
                    <button className="btn-link" onClick={() => setDicas(b.chave)}>
                      <Info aria-hidden /> Sobre o exercício
                    </button>
                    <button className="btn-link" onClick={() => setTrocar(b.chave)}>
                      <Repeat2 aria-hidden /> Trocar
                    </button>
                  </div>
                  {anterior.length > 0 && (
                    <p className="tr-anterior">
                      Última vez: <b>{anterior.map((s) => `${fmt(s.carga_kg)}kg×${s.reps ?? '?'}`).join('  ·  ')}</b>
                    </p>
                  )}
                  <div className="tr-tabela" role="table" aria-label={`Séries de ${nomeExercicio(b.exercicio)}`}>
                    <div className="tr-linha tr-linha-cabeca" role="row">
                      <span role="columnheader">Série</span>
                      <span role="columnheader">kg</span>
                      <span role="columnheader">Reps</span>
                      <span role="columnheader" className="sr-only">
                        Feita
                      </span>
                    </div>
                    {b.linhas.map((l, li) => {
                      const ant = anterior.find((a) => a.serie === l.serie)
                      return (
                        <div key={l.id} className="tr-linha" role="row" data-feita={l.feita || undefined}>
                          <span className="tr-linha-num" role="cell">
                            {l.serie}
                          </span>
                          <input
                            className="entrada"
                            inputMode="decimal"
                            value={l.carga}
                            placeholder={ant ? fmt(ant.carga_kg) : 'kg'}
                            aria-label={`Carga da série ${l.serie}`}
                            onChange={(e) => alterarLinha(bi, li, { carga: e.target.value.replace(/[^\d,.]/g, '') })}
                            onBlur={() => l.salva && void salvar(b, l, bi)}
                          />
                          <input
                            className="entrada"
                            inputMode="numeric"
                            value={l.reps}
                            placeholder={ant?.reps != null ? String(ant.reps) : b.alvo.split('× ')[1] ?? 'reps'}
                            aria-label={`Repetições da série ${l.serie}`}
                            onChange={(e) => alterarLinha(bi, li, { reps: e.target.value.replace(/\D/g, '') })}
                            onBlur={() => l.salva && void salvar(b, l, bi)}
                          />
                          <button className="tr-check" aria-pressed={l.feita} aria-label={l.feita ? `Desmarcar série ${l.serie}` : `Concluir série ${l.serie}`} onClick={() => void marcar(bi, li)}>
                            <Check aria-hidden />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <button className="btn btn-fantasma tr-add-serie" onClick={() => addSerie(bi)}>
                    <Plus aria-hidden /> Adicionar série
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <div className="tr-sessao-fim">
        {!concluida ? (
          <button className="btn btn-verde btn-grande" onClick={() => void finalizar()}>
            <Flag aria-hidden /> Finalizar treino
          </button>
        ) : (
          <button className="btn btn-secundario btn-grande" onClick={() => navegar('/treino')}>
            Voltar
          </button>
        )}
        <button className="btn btn-fantasma tr-descartar" onClick={() => void descartar()}>
          <Trash2 aria-hidden /> Apagar este treino
        </button>
      </div>

      {descanso && !fim && (
        <Descanso
          key={descanso.fim - descanso.total * 1000}
          fim={descanso.fim}
          total={descanso.total}
          aoMudar={(s) => setDescanso((d) => (d ? { fim: Math.max(Date.now(), d.fim + s * 1000), total: Math.max(15, d.total + s) } : d))}
          aoParar={() => setDescanso(null)}
        />
      )}
      {dicas && (() => {
        const b = blocos.find((x) => x.chave === dicas)
        const item = b && ficha?.itens.find((i) => i.exercicio === b.exercicio)
        return b ? (
          <ExercicioDetalhe id={b.exercicio} alvo={item ? { series: item.series, min: item.reps_min, max: item.reps_max } : undefined} aoFechar={() => setDicas(null)} />
        ) : null
      })()}
      {trocar && (
        <Trocar
          atual={blocos.find((b) => b.chave === trocar)!.exercicio}
          aoFechar={() => setTrocar(null)}
          aoEscolher={(novo) => void trocarExercicio(blocos.findIndex((b) => b.chave === trocar), novo)}
        />
      )}
      {fim && (
        <div className="folha-fundo">
          <div className="folha tr-resumo" role="dialog" aria-modal="true" aria-labelledby="tr-fim">
            <div className="folha-alca" aria-hidden />
            <span className="tr-resumo-icone" aria-hidden>
              <Trophy />
            </span>
            <h2 id="tr-fim">Treino concluído!</h2>
            <dl className="numeros">
              <div>
                <dt>Duração</dt>
                <dd>{fim.duracao} min</dd>
              </div>
              <div>
                <dt>Séries</dt>
                <dd>{fim.series}</dd>
              </div>
              <div data-destaque>
                <dt>Volume</dt>
                <dd>{fim.volume.toLocaleString('pt-BR')} kg</dd>
              </div>
            </dl>
            {fim.recordes.length > 0 && (
              <div className="tr-recordes">
                <b>Recordes novos</b>
                <ul>
                  {fim.recordes.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="btn btn-verde btn-grande"
              onClick={async () => {
                await recarregar()
                navegar('/treino')
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
