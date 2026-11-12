import { ArrowRight, Hammer, X } from 'lucide-react'
import { forwardRef } from 'react'
import { ROTULO_STATUS, type Modulo } from '../modulos'
import type { DestaqueCard } from './CardModulo'
import { Miniatura } from './Miniatura'

type Props = {
  modulo: Modulo
  destaque?: DestaqueCard | null
  aoAbrir: (m: Modulo) => void
  aoFechar?: () => void
  variante: 'painel' | 'flutuante' | 'caixa'
  id?: string
}

export const Previa = forwardRef<HTMLDivElement, Props>(function Previa({ modulo, destaque, aoAbrir, aoFechar, variante, id }, ref) {
  const Icone = modulo.icone
  const disponivel = modulo.status === 'disponivel'
  const estado = (
    <span className="previa-status">
      <i aria-hidden />
      {disponivel ? ROTULO_STATUS.disponivel : 'Em construção'}
    </span>
  )
  return (
    <div ref={ref} id={id} className={`previa previa-${variante}`} data-status={modulo.status} key={modulo.id}>
      <div className="previa-topo">
        <span className="previa-icone" aria-hidden>
          <Icone />
        </span>
        <div className="previa-titulos">
          <span className="rotulo">{modulo.categoria}</span>
          <h3>{modulo.nome}</h3>
          {variante !== 'painel' && estado}
        </div>
        {variante === 'painel' && estado}
        {aoFechar && (
          <button className="previa-fechar" onClick={aoFechar} aria-label="Fechar prévia">
            <X aria-hidden />
          </button>
        )}
      </div>
      {variante !== 'flutuante' && (
        <div className="previa-vitrine">
          <Miniatura id={modulo.id} destaque={destaque} />
        </div>
      )}
      <p className="previa-resumo">{modulo.previa.resumo}</p>
      <span className="rotulo previa-sub">{disponivel ? 'O que você encontra aqui' : 'O que vai ter aqui'}</span>
      <ul className="previa-lista">
        {modulo.previa.itens.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      {disponivel ? (
        <button className="btn btn-verde previa-abrir" onClick={() => aoAbrir(modulo)}>
          Abrir {modulo.nome}
          <ArrowRight aria-hidden />
        </button>
      ) : (
        <div className="previa-construcao">
          <Hammer aria-hidden />
          <span>Em construção. Ainda não dá para abrir.</span>
        </div>
      )}
      {variante === 'painel' && disponivel && <p className="previa-dica">Clique no card para entrar</p>}
    </div>
  )
})
