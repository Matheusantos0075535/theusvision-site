import { ArrowRight, Hammer } from 'lucide-react'
import { forwardRef } from 'react'
import { ROTULO_STATUS, type Modulo } from '../modulos'

type Props = {
  modulo: Modulo
  aoAbrir: (m: Modulo) => void
  variante: 'painel' | 'flutuante' | 'caixa'
  id?: string
}

export const Previa = forwardRef<HTMLDivElement, Props>(function Previa({ modulo, aoAbrir, variante, id }, ref) {
  const Icone = modulo.icone
  const disponivel = modulo.status === 'disponivel'
  return (
    <div ref={ref} id={id} className={`previa previa-${variante}`} data-status={modulo.status} key={modulo.id}>
      <div className="previa-topo">
        <span className="previa-icone" aria-hidden>
          <Icone />
        </span>
        <div>
          <span className="rotulo">{modulo.categoria}</span>
          <h3>{modulo.nome}</h3>
        </div>
        <span className="previa-status">{disponivel ? ROTULO_STATUS.disponivel : 'Em construção'}</span>
      </div>
      <p className="previa-resumo">{modulo.previa.resumo}</p>
      <span className="rotulo previa-sub">{disponivel ? 'O que tem dentro' : 'O que vai ter dentro'}</span>
      <ul className="previa-lista">
        {modulo.previa.itens.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      {disponivel ? (
        <button className="btn btn-primario previa-abrir" onClick={() => aoAbrir(modulo)}>
          Abrir {modulo.nome}
          <ArrowRight aria-hidden />
        </button>
      ) : (
        <div className="previa-construcao">
          <Hammer aria-hidden />
          <span>Em construção. Ainda não dá para abrir.</span>
        </div>
      )}
    </div>
  )
})
