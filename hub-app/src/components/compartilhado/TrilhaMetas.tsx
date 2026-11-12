import { Check } from 'lucide-react'
import { AnelMeta } from './AnelMeta'

/**
 * Gráfico de metas: conquistadas preenchidas, a próxima em destaque com anel ("72 de 80")
 * e as futuras discretas.
 */
export function TrilhaMetas({
  valor,
  marcos,
  unidade = 'dias',
  rotuloValor,
}: {
  valor: number
  marcos: number[]
  unidade?: string
  rotuloValor?: string
}) {
  const idxProx = marcos.findIndex((m) => m > valor)
  const proxima = idxProx >= 0 ? marcos[idxProx] : null
  const anterior = idxProx > 0 ? marcos[idxProx - 1] : idxProx === -1 ? marcos[marcos.length - 1] : 0
  return (
    <div className="metas">
      {proxima !== null && (
        <div className="metas-destaque">
          <AnelMeta valor={valor} inicio={anterior} alvo={proxima} tamanho={124} rotulo={`${valor} de ${proxima} ${unidade}`}>
            <b>{valor}</b>
            <small>de {proxima}</small>
          </AnelMeta>
          <div>
            <span className="rotulo">Próxima meta</span>
            <p className="metas-prox">
              {proxima} {unidade}
            </p>
            <p className="metas-falta">
              {rotuloValor ?? `faltam ${proxima - valor}`}
            </p>
          </div>
        </div>
      )}
      <ol className="metas-lista" aria-label="Metas">
        {marcos.map((m) => {
          const estado = m <= valor ? 'feita' : m === proxima ? 'proxima' : 'futura'
          return (
            <li key={m} className="meta-no" data-estado={estado}>
              <span className="meta-bola">{estado === 'feita' ? <Check aria-hidden /> : null}</span>
              <span className="meta-num">{m.toLocaleString('pt-BR')}</span>
              <span className="so-leitor">{estado === 'feita' ? 'conquistada' : estado === 'proxima' ? 'próxima' : 'futura'}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
