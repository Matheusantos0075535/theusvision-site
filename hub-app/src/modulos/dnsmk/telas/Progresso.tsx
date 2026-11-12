import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarrasHorizontais, GraficoColunas, GraficoLinhas, Numeros } from '../../../components/compartilhado/Graficos'
import { Carregando, ErroCarregar, Secao } from '../../../components/compartilhado/ShellModulo'
import { TrilhaMetas } from '../../../components/compartilhado/TrilhaMetas'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { diaDaSemana, formatarDataCurta, somarDias } from '../../../lib/tempo'
import { AVISO_EDUCATIVO, CHECKIN } from '../conteudo/textosSaude'
import { marcosAte, useDnsmk } from '../dados'

type Checkin = { dia: string; humor: number; fissura: number; sono: string; ansiedade: string; gatilhos: string[] }
type RecaidaLinha = { dia: string; sequencia_encerrada: number }

const DIAS_SEMANA = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados']
const MESES = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

const real = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export function Progresso() {
  const { estado, config } = useDnsmk()
  const [checkins, setCheckins] = useState<Checkin[] | null>(null)
  const [recaidas, setRecaidas] = useState<RecaidaLinha[]>([])
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErro(null)
    const [c, r] = await Promise.all([
      supabase.from('dnsmk_checkins').select('dia, humor, fissura, sono, ansiedade, gatilhos').order('dia'),
      supabase.from('dnsmk_recaidas').select('dia, sequencia_encerrada').order('dia'),
    ])
    if (c.error || r.error) return setErro(mensagemDeErroBanco(c.error ?? r.error))
    setCheckins(c.data as Checkin[])
    setRecaidas(r.data as RecaidaLinha[])
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const analise = useMemo(() => {
    if (!checkins || !estado?.tem_jornada) return null
    const ultimos = checkins.slice(-30)
    const sono = CHECKIN.sono.map((s) => ({ rotulo: s.rotulo, valor: checkins.filter((c) => c.sono === s.valor).length }))
    const gatilhos = CHECKIN.gatilhos
      .map((g) => ({ rotulo: g.rotulo, valor: checkins.filter((c) => c.gatilhos.includes(g.valor)).length }))
      .filter((g) => g.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)

    // Padrão por dia da semana: só com dados suficientes e diferença clara.
    let padrao: string | null = null
    if (checkins.length >= 14) {
      const soma = Array(7).fill(0)
      const qtd = Array(7).fill(0)
      checkins.forEach((c) => {
        const d = diaDaSemana(c.dia)
        soma[d] += c.fissura
        qtd[d] += 1
      })
      const media = checkins.reduce((a, c) => a + c.fissura, 0) / checkins.length
      let pior = -1
      let piorMedia = -1
      soma.forEach((s, d) => {
        if (qtd[d] >= 2 && s / qtd[d] > piorMedia) {
          piorMedia = s / qtd[d]
          pior = d
        }
      })
      if (pior >= 0 && piorMedia - media >= 1) {
        padrao = `Seus dias de fissura mais forte costumam ser às ${DIAS_SEMANA[pior]}. Vale ter um plano pronto para esse dia.`
      }
    }

    // Linha do tempo do ano: dias sem fumar por mês, a partir das sequências.
    const ano = estado.hoje!.slice(0, 4)
    const limpos = new Set<string>()
    const marcar = (de: string, ate: string) => {
      for (let d = de; d <= ate; d = somarDias(d, 1)) if (d.startsWith(ano)) limpos.add(d)
    }
    recaidas.forEach((r) => r.sequencia_encerrada > 0 && marcar(somarDias(r.dia, -r.sequencia_encerrada), somarDias(r.dia, -1)))
    if (estado.inicio_sequencia! <= estado.hoje!) {
      marcar(estado.inicio_sequencia!, estado.checkin_hoje ? estado.hoje! : somarDias(estado.hoje!, -1))
    }
    const porMes = Array(12).fill(0)
    limpos.forEach((d) => (porMes[Number(d.slice(5, 7)) - 1] += 1))

    return { ultimos, sono, gatilhos, padrao, porMes, ano, mesAtual: Number(estado.hoje!.slice(5, 7)) - 1 }
  }, [checkins, recaidas, estado])

  if (erro) return <ErroCarregar mensagem={erro} tentar={carregar} />
  if (!estado || !checkins) return <Carregando />
  if (!estado.tem_jornada || !analise) return <p className="vazio">Comece sua jornada na aba Hoje para ver seu progresso.</p>

  const total = estado.total ?? 0
  const economia = config.gasto_semanal ? (total / 7) * config.gasto_semanal : null

  return (
    <div className="dn-progresso">
      <Secao titulo="Metas">
        <div className="cartao-bloco">
          <TrilhaMetas valor={estado.sequencia_atual ?? 0} marcos={marcosAte(estado.sequencia_atual ?? 0)} />
        </div>
      </Secao>

      <Secao titulo="Números">
        <Numeros
          itens={[
            { rotulo: 'Dias sem fumar', valor: total, destaque: true },
            { rotulo: 'Melhor sequência', valor: estado.melhor ?? 0 },
            { rotulo: 'Check-ins', valor: checkins.length },
            { rotulo: 'Economia estimada', valor: economia === null ? '—' : real(economia) },
          ]}
        />
        {economia === null && <p className="dica">Informe quanto gastava por semana no Perfil para ver a economia estimada.</p>}
      </Secao>

      <Secao titulo={`Linha do tempo de ${analise.ano}`}>
        <div className="cartao-bloco">
          <GraficoColunas
            rotulos={MESES}
            valores={analise.porMes}
            destaque={analise.mesAtual}
            rotuloAria={`Dias sem fumar por mês em ${analise.ano}`}
          />
        </div>
      </Secao>

      <Secao titulo="Humor e fissura">
        <div className="cartao-bloco">
          {analise.ultimos.length < 2 ? (
            <p className="vazio">O gráfico aparece depois de alguns check-ins.</p>
          ) : (
            <GraficoLinhas
              rotulos={analise.ultimos.map((c) => formatarDataCurta(c.dia))}
              series={[
                { nome: 'Humor (1 a 5)', cor: '#FF9F11', valores: analise.ultimos.map((c) => c.humor), min: 1, max: 5 },
                { nome: 'Fissura (0 a 10)', cor: '#A98BEA', valores: analise.ultimos.map((c) => c.fissura), max: 10 },
              ]}
            />
          )}
          {analise.padrao && <p className="dn-padrao">{analise.padrao}</p>}
        </div>
      </Secao>

      <Secao titulo="Sono">
        <div className="cartao-bloco">
          <BarrasHorizontais itens={analise.sono} />
        </div>
      </Secao>

      <Secao titulo="Gatilhos mais frequentes">
        <div className="cartao-bloco">
          {analise.gatilhos.length ? <BarrasHorizontais itens={analise.gatilhos} /> : <p className="vazio">Nenhum gatilho marcado ainda.</p>}
        </div>
      </Secao>

      <p className="aviso-educativo">{AVISO_EDUCATIVO}</p>
    </div>
  )
}
