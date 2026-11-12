import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnelMeta } from '../../../components/compartilhado/AnelMeta'
import { GraficoColunas, Numeros } from '../../../components/compartilhado/Graficos'
import { Carregando, ErroCarregar, Secao } from '../../../components/compartilhado/ShellModulo'
import { TrilhaMetas } from '../../../components/compartilhado/TrilhaMetas'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { diferencaDias, FUSO, somarDias } from '../../../lib/tempo'
import { MARCOS_OFENSIVA, MARCOS_PAGINAS, useLeitura } from '../dados'

type Sessao = { dia: string; paginas: number; minutos: number | null; criado_em: string }

function horaSP(iso: string) {
  return Number(new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', hourCycle: 'h23' }).format(new Date(iso)))
}

export function Progresso() {
  const { estado, livros } = useLeitura()
  const [sessoes, setSessoes] = useState<Sessao[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErro(null)
    const { data, error } = await supabase.from('leit_sessoes').select('dia, paginas, minutos, criado_em').order('dia')
    if (error) return setErro(mensagemDeErroBanco(error))
    setSessoes(data as Sessao[])
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const a = useMemo(() => {
    if (!sessoes || !estado || !livros) return null
    const hoje = estado.hoje
    // Páginas por dia (últimos 30 dias)
    const dias30 = Array.from({ length: 30 }, (_, i) => somarDias(hoje, i - 29))
    const porDia = dias30.map((d) => sessoes.filter((s) => s.dia === d).reduce((x, s) => x + s.paginas, 0))
    // Minutos por semana (últimas 12 semanas)
    const semanas = Array.from({ length: 12 }, (_, i) => 11 - i)
    const iniSemana = semanas.map((k) => somarDias(somarDias(hoje, -7 * k), -6))
    const minSemana = semanas.map((k) => {
      const fim = somarDias(hoje, -7 * k)
      const ini = somarDias(fim, -6)
      return sessoes.filter((s) => s.dia >= ini && s.dia <= fim).reduce((x, s) => x + (s.minutos ?? 0), 0)
    })
    // Horários em que mais lê (pelo horário do registro)
    const horas = Array(24).fill(0)
    sessoes.forEach((s) => (horas[horaSP(s.criado_em)] += 1))
    const picoHora = horas.indexOf(Math.max(...horas))
    // Livros concluídos
    const ano = hoje.slice(0, 4)
    const concluidos = livros.filter((l) => l.estado === 'concluido' && l.concluido_em)
    const tempos = concluidos.filter((l) => l.iniciado_em).map((l) => diferencaDias(l.concluido_em!, l.iniciado_em!) + 1)
    const media = tempos.length ? Math.round(tempos.reduce((x, y) => x + y, 0) / tempos.length) : null
    const doAno = concluidos.filter((l) => l.concluido_em!.startsWith(ano))
    // Ritmo da meta anual
    const diaDoAno = diferencaDias(hoje, `${ano}-01-01`) + 1
    const esperado = (estado.meta_anual * diaDoAno) / 365
    const situacao =
      doAno.length >= esperado + 0.5 ? 'adiantado' : doAno.length <= esperado - 0.5 ? 'atrasado' : 'no ritmo'
    return { dias30, porDia, minSemana, iniSemana, horas, picoHora, media, doAno, esperado, situacao, ano }
  }, [sessoes, estado, livros])

  if (erro) return <ErroCarregar mensagem={erro} tentar={carregar} />
  if (!a || !estado) return <Carregando />

  const cadaQuantos = Math.round(365 / estado.meta_anual)

  return (
    <div className="le-progresso">
      <Secao titulo={`Meta de ${a.ano}`}>
        <div className="cartao-bloco le-anual">
          <AnelMeta valor={a.doAno.length} alvo={estado.meta_anual} tamanho={124} rotulo={`${a.doAno.length} de ${estado.meta_anual} livros`}>
            <b>{a.doAno.length}</b>
            <small>de {estado.meta_anual}</small>
          </AnelMeta>
          <div>
            <p className="le-anual-ritmo">
              Para fechar {estado.meta_anual} livros, o ritmo é de 1 a cada {cadaQuantos} dias.
            </p>
            <p className="le-anual-status" data-situacao={a.situacao}>
              Você está <b>{a.situacao}</b>.
            </p>
            <small>Pelo calendário, o esperado até hoje seria {a.esperado.toFixed(1).replace('.', ',')}.</small>
          </div>
        </div>
      </Secao>

      <Secao titulo="Marcos de ofensiva">
        <div className="cartao-bloco">
          <TrilhaMetas valor={estado.ofensiva} marcos={MARCOS_OFENSIVA} />
        </div>
      </Secao>

      <Secao titulo="Páginas lidas no total">
        <div className="cartao-bloco">
          <TrilhaMetas
            valor={estado.paginas_total}
            marcos={MARCOS_PAGINAS}
            unidade="páginas"
            rotuloValor={`${estado.paginas_total.toLocaleString('pt-BR')} páginas até agora`}
          />
        </div>
      </Secao>

      <Secao titulo="Números">
        <Numeros
          itens={[
            { rotulo: 'Livros no ano', valor: a.doAno.length, destaque: true },
            { rotulo: 'Tempo médio por livro', valor: a.media === null ? '—' : `${a.media} d` },
            { rotulo: 'Dias lidos', valor: estado.total_dias },
            { rotulo: 'Melhor sequência', valor: estado.melhor },
          ]}
        />
      </Secao>

      <Secao titulo="Páginas por dia">
        <div className="cartao-bloco">
          <GraficoColunas
            rotulos={a.dias30.map((d) => String(Number(d.slice(8))))}
            valores={a.porDia}
            destaque={29}
            rotuloAria="Páginas lidas por dia nos últimos 30 dias"
            explicacao="Cada coluna é um dia dos últimos 30 (o número embaixo é o dia do mês). A altura é quantas páginas você leu. A coluna laranja é hoje."
          />
        </div>
      </Secao>

      <Secao titulo="Minutos por semana">
        <div className="cartao-bloco">
          <GraficoColunas
            rotulos={a.iniSemana.map((d) => `${d.slice(8)}/${d.slice(5, 7)}`)}
            valores={a.minSemana}
            destaque={11}
            mostrarValores
            rotuloAria="Minutos de leitura por semana nas últimas 12 semanas"
            explicacao="Cada coluna é uma semana (embaixo, o dia em que ela começa). O número em cima são os minutos lidos. A coluna laranja é a semana atual."
          />
        </div>
      </Secao>

      <Secao titulo="Horários em que você mais lê">
        <div className="cartao-bloco">
          {sessoes && sessoes.length ? (
            <>
              <GraficoColunas
                rotulos={a.horas.map((_, h) => `${h}h`)}
                valores={a.horas}
                destaque={a.picoHora}
                rotuloAria="Sessões por hora do dia"
                explicacao={`Cada coluna é uma hora do dia (0h a 23h) e mostra em quantas sessões você registrou leitura nesse horário. Seu horário mais frequente é por volta das ${a.picoHora}h.`}
              />
            </>
          ) : (
            <p className="vazio">Os horários aparecem depois das primeiras sessões.</p>
          )}
        </div>
      </Secao>

      {a.doAno.length > 0 && (
        <Secao titulo={`Concluídos em ${a.ano}`}>
          <ul className="le-concluidos">
            {a.doAno.map((l) => (
              <li key={l.id}>
                <b>{l.titulo}</b>
                <small>{l.autor}</small>
              </li>
            ))}
          </ul>
        </Secao>
      )}
    </div>
  )
}
