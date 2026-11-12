import { useMemo, useState } from 'react'
import { GraficoColunas, GraficoLinhas, Numeros } from '../../../components/compartilhado/Graficos'
import { Secao } from '../../../components/compartilhado/ShellModulo'
import { formatarDataCurta, somarDias } from '../../../lib/tempo'
import { EXERCICIO, GRUPOS, nomeExercicio, SERIES_SEMANA, type Grupo } from '../catalogo'
import { useTreino } from '../dados'
import { inicioDaSemana, umRM } from '../plano'

export function Evolucao() {
  const { hoje, sessoes, series, perfil } = useTreino()
  const domingo = inicioDaSemana(hoje)
  const diaDaSessao = useMemo(() => new Map(sessoes.map((s) => [s.id, s.dia])), [sessoes])
  const feitas = useMemo(() => series.filter((s) => s.feita), [series])
  const comCarga = useMemo(() => [...new Set(feitas.filter((s) => s.carga_kg != null).map((s) => s.exercicio))], [feitas])
  const [exercicio, setExercicio] = useState<string>(comCarga[0] ?? '')

  const analise = useMemo(() => {
    const doAno = sessoes.filter((s) => s.dia.startsWith(hoje.slice(0, 4)) && (s.concluido_em || s.sem_registro))
    const diasSemana = new Set(sessoes.filter((s) => s.dia >= domingo && s.dia <= hoje).map((s) => s.dia)).size
    const daSemana = feitas.filter((s) => (diaDaSessao.get(s.sessao_id) ?? '') >= domingo)
    const porGrupo = new Map<Grupo, number>()
    daSemana.forEach((s) => {
      const ex = EXERCICIO[s.exercicio]
      if (!ex) return
      porGrupo.set(ex.grupo, (porGrupo.get(ex.grupo) ?? 0) + 1)
      ex.apoio?.forEach((g) => porGrupo.set(g, (porGrupo.get(g) ?? 0) + 0.5))
    })
    const volume = (l: typeof feitas) => l.reduce((t, s) => t + (s.carga_kg ?? 0) * (s.reps ?? 0), 0)
    const semanas = Array.from({ length: 8 }, (_, i) => somarDias(domingo, -7 * (7 - i)))
    const volSemanas = semanas.map((ini) => {
      const fim = somarDias(ini, 6)
      return Math.round(volume(feitas.filter((s) => {
        const d = diaDaSessao.get(s.sessao_id) ?? ''
        return d >= ini && d <= fim
      })) / 100) / 10
    })
    const recordes = [...new Set(feitas.map((s) => s.exercicio))]
      .map((ex) => {
        const l = feitas.filter((s) => s.exercicio === ex && s.carga_kg != null)
        if (!l.length) return null
        const top = l.reduce((a, s) => (s.carga_kg! > a.carga_kg! || (s.carga_kg === a.carga_kg && (s.reps ?? 0) > (a.reps ?? 0)) ? s : a))
        return { ex, top, dia: diaDaSessao.get(top.sessao_id) ?? '' }
      })
      .filter(Boolean) as { ex: string; top: (typeof feitas)[number]; dia: string }[]
    return { doAno: doAno.length, diasSemana, seriesSemana: daSemana.length, volumeSemana: volume(daSemana), porGrupo, semanas, volSemanas, recordes }
  }, [sessoes, feitas, hoje, domingo, diaDaSessao])

  const linha = useMemo(() => {
    const porSessao = new Map<string, { dia: string; max: number; rm: number }>()
    feitas
      .filter((s) => s.exercicio === exercicio && s.carga_kg != null)
      .forEach((s) => {
        const dia = diaDaSessao.get(s.sessao_id) ?? ''
        const atual = porSessao.get(s.sessao_id) ?? { dia, max: 0, rm: 0 }
        atual.max = Math.max(atual.max, s.carga_kg!)
        atual.rm = Math.max(atual.rm, Math.round(umRM(s.carga_kg!, s.reps ?? 1)))
        porSessao.set(s.sessao_id, atual)
      })
    return [...porSessao.values()].sort((a, b) => a.dia.localeCompare(b.dia)).slice(-20)
  }, [feitas, exercicio, diaDaSessao])

  const grupos = (Object.keys(GRUPOS) as Grupo[]).filter((g) => !['lombar', 'trapezio'].includes(g))
  const maxLinha = Math.max(1, ...linha.map((l) => l.rm))

  return (
    <div className="tr-evolucao">
      <Numeros
        itens={[
          { rotulo: 'Treinos em 2026', valor: analise.doAno, destaque: true },
          { rotulo: 'Nesta semana', valor: `${analise.diasSemana}/${perfil.dias_semana}` },
          { rotulo: 'Séries na semana', valor: analise.seriesSemana },
          { rotulo: 'Volume na semana', valor: `${(analise.volumeSemana / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t` },
        ]}
      />

      <Secao titulo="Séries por músculo nesta semana">
        <p className="dia-apoio">
          Para ganhar massa, a faixa usada como referência é de {SERIES_SEMANA.min} a {SERIES_SEMANA.max} séries por músculo na semana. Exercícios que ajudam outro músculo contam meia série para ele.
        </p>
        <ul className="tr-grupos">
          {grupos.map((g) => {
            const v = analise.porGrupo.get(g) ?? 0
            const estado = v >= SERIES_SEMANA.min ? (v > SERIES_SEMANA.max ? 'acima' : 'ok') : 'abaixo'
            return (
              <li key={g} data-estado={estado}>
                <span>{GRUPOS[g]}</span>
                <span className="tr-grupo-trilho" aria-hidden>
                  <i className="tr-grupo-faixa" style={{ left: `${(SERIES_SEMANA.min / 25) * 100}%`, width: `${((SERIES_SEMANA.max - SERIES_SEMANA.min) / 25) * 100}%` }} />
                  <i className="tr-grupo-valor" style={{ width: `${Math.min(100, (v / 25) * 100)}%` }} />
                </span>
                <b>{v.toLocaleString('pt-BR')}</b>
              </li>
            )
          })}
        </ul>
      </Secao>

      <Secao titulo="Volume por semana">
        <div className="cartao-bloco">
          <GraficoColunas
            rotulos={analise.semanas.map((s) => formatarDataCurta(s))}
            valores={analise.volSemanas}
            destaque={7}
            mostrarValores
            sufixo="t"
            rotuloAria="Volume de treino por semana, em toneladas"
            explicacao="Volume = carga × repetições de todas as séries, somado na semana (em toneladas). A coluna laranja é esta semana. Subir aos poucos é o sinal de progresso."
          />
        </div>
      </Secao>

      <Secao titulo="Evolução de carga">
        {comCarga.length === 0 ? (
          <p className="vazio">Anote as cargas nos treinos e a evolução de cada exercício aparece aqui.</p>
        ) : (
          <div className="cartao-bloco">
            <select className="entrada" value={exercicio} onChange={(e) => setExercicio(e.target.value)} aria-label="Exercício">
              {comCarga.map((ex) => (
                <option key={ex} value={ex}>
                  {nomeExercicio(ex)}
                </option>
              ))}
            </select>
            {linha.length < 2 ? (
              <p className="vazio">O gráfico aparece a partir do segundo treino com este exercício.</p>
            ) : (
              <GraficoLinhas
                rotulos={linha.map((l) => `${l.dia.slice(8)}/${l.dia.slice(5, 7)}`)}
                explicacao="Cada ponto é um treino. Carga máxima usada e a força estimada para 1 repetição (calculada pelas repetições feitas)."
                series={[
                  { nome: 'Carga máxima (kg)', cor: '#FF9F11', valores: linha.map((l) => l.max), max: maxLinha * 1.05 },
                  { nome: '1 repetição estimada (kg)', cor: '#3ddc97', valores: linha.map((l) => l.rm), max: maxLinha * 1.05 },
                ]}
              />
            )}
          </div>
        )}
      </Secao>

      <Secao titulo="Recordes">
        {analise.recordes.length === 0 ? (
          <p className="vazio">Seus recordes aparecem aqui conforme você anota as cargas.</p>
        ) : (
          <ul className="tr-lista-recordes">
            {analise.recordes
              .sort((a, b) => b.dia.localeCompare(a.dia))
              .map((r) => (
                <li key={r.ex}>
                  <span>{nomeExercicio(r.ex)}</span>
                  <b>
                    {String(r.top.carga_kg).replace('.', ',')} kg × {r.top.reps ?? '?'}
                  </b>
                  <small>{r.dia && formatarDataCurta(r.dia)}</small>
                </li>
              ))}
          </ul>
        )}
      </Secao>
    </div>
  )
}
