import { Award } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMovimentoReduzido } from '../../lib/useMidia'
import { BarraProgresso } from './BarraProgresso'
import { Chama } from './Chama'
import { Confete } from './Confete'
import { tocarSom, vibrar } from './efeitos'

export type DadosCelebracao = {
  de: number
  para: number
  rotuloNumero: string // ex.: "dias sem fumar"
  metaAnterior: number
  proximaMeta: number
  mensagem: string
  marco: boolean
  seloNovo?: number | null
  rotuloSelo?: (n: number) => string
  extra?: ReactNode
  rotuloContinuar?: string
}

/**
 * Sequência de 2 a 3 s: número sobe com a chama pulsando, barra até a próxima meta avança,
 * mensagem de reforço. Nos marcos, confete sutil e selo novo. Com movimento reduzido, versão estática.
 */
export function Celebracao({
  dados,
  som,
  vibracao,
  aoFechar,
}: {
  dados: DadosCelebracao
  som: boolean
  vibracao: boolean
  aoFechar: () => void
}) {
  const reduzido = useMovimentoReduzido()
  const [numero, setNumero] = useState(reduzido ? dados.para : dados.de)
  const [fase, setFase] = useState(reduzido ? 3 : 0)
  const botao = useRef<HTMLButtonElement>(null)

  const faixa = Math.max(1, dados.proximaMeta - dados.metaAnterior)
  const fracaoDe = (dados.de - dados.metaAnterior) / faixa
  const fracaoPara = dados.para >= dados.proximaMeta ? 1 : (dados.para - dados.metaAnterior) / faixa
  const faltam = Math.max(0, dados.proximaMeta - dados.para)

  useEffect(() => {
    vibrar(vibracao, dados.marco ? [20, 60, 30] : 22)
    tocarSom(som, dados.marco)
    if (reduzido) return
    const timers: number[] = []
    timers.push(window.setTimeout(() => setFase(1), 250))
    // Contagem do número (geralmente +1, mas suporta saltos maiores).
    const passos = Math.max(1, dados.para - dados.de)
    const duracao = 650
    for (let i = 1; i <= passos; i++) {
      timers.push(
        window.setTimeout(() => setNumero(dados.de + i), 300 + Math.round((duracao * i) / passos)),
      )
    }
    timers.push(window.setTimeout(() => setFase(2), 900))
    timers.push(window.setTimeout(() => setFase(3), 1500))
    return () => timers.forEach(clearTimeout)
  }, [dados, reduzido, som, vibracao])

  useEffect(() => {
    if (fase === 3) botao.current?.focus()
  }, [fase])

  return (
    <div className="celebra" role="dialog" aria-modal="true" aria-labelledby="celebra-numero" data-marco={dados.marco || undefined}>
      {dados.marco && !reduzido && <Confete />}
      <div className="celebra-miolo">
        <div className="celebra-chama" data-fase={fase}>
          <Chama numero={numero} tamanho="gigante" pulsando={fase >= 1 && fase < 3 && !reduzido} />
        </div>
        <p id="celebra-numero" className="celebra-rotulo">
          <span className="so-leitor">{dados.para} </span>
          {dados.rotuloNumero}
        </p>

        <div className="celebra-meta" data-visivel={fase >= 1 || undefined}>
          <div className="celebra-meta-topo">
            <span className="rotulo">Próxima meta</span>
            <b>{dados.proximaMeta} dias</b>
          </div>
          <BarraProgresso fracao={fase >= 1 ? fracaoPara : fracaoDe} rotulo="Progresso até a próxima meta" />
          <small>{faltam === 0 ? 'Meta alcançada!' : `faltam ${faltam} ${faltam === 1 ? 'dia' : 'dias'} para ${dados.proximaMeta}`}</small>
        </div>

        {dados.extra && (
          <div className="celebra-extra" data-visivel={fase >= 2 || undefined}>
            {dados.extra}
          </div>
        )}

        <p className="celebra-mensagem" data-visivel={fase >= 2 || undefined}>
          {dados.mensagem}
        </p>

        {dados.seloNovo ? (
          <div className="celebra-selo" data-visivel={fase >= 2 || undefined}>
            <Award aria-hidden />
            <span>
              Selo novo na coleção: <b>{dados.rotuloSelo ? dados.rotuloSelo(dados.seloNovo) : `${dados.seloNovo} dias`}</b>
            </span>
          </div>
        ) : null}
      </div>
      <div className="celebra-rodape" data-visivel={fase >= 3 || undefined}>
        <button ref={botao} className="btn btn-primario btn-grande" onClick={aoFechar}>
          {dados.rotuloContinuar ?? 'Continuar'}
        </button>
      </div>
    </div>
  )
}
