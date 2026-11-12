import { Check, Lock, Star } from 'lucide-react'
import { useEffect, useRef } from 'react'

export type EstadoItem = 'feita' | 'disponivel' | 'bloqueada'

export type ItemTrilha = {
  id: string
  rotulo: string
  estado: EstadoItem
  dica?: string
}

export type SecaoTrilha = {
  id: string
  titulo: string
  subtitulo: string
  resumo?: string
  estado: 'concluida' | 'atual' | 'futura'
  itens: ItemTrilha[]
}

const DESLOCAMENTO = [0, 34, 52, 34, 0, -34, -52, -34]

/** Trilha vertical estilo Duolingo: unidades em sequência e lições como nós em zigue-zague. */
export function TrilhaVertical({
  secoes,
  aoEscolher,
  destaqueId,
}: {
  secoes: SecaoTrilha[]
  aoEscolher: (item: ItemTrilha, secao: SecaoTrilha) => void
  destaqueId?: string
}) {
  const refAtual = useRef<HTMLLIElement>(null)
  useEffect(() => {
    refAtual.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <ol className="trilha">
      {secoes.map((s) => (
        <li key={s.id} className="trilha-secao" data-estado={s.estado}>
          <div className="trilha-cabeca">
            <span className="rotulo">{s.subtitulo}</span>
            <h3>{s.titulo}</h3>
            {s.resumo && <p>{s.resumo}</p>}
          </div>
          <ol className="trilha-nos">
            {s.itens.map((it, i) => {
              const atual = it.id === destaqueId
              return (
                <li
                  key={it.id}
                  ref={atual ? refAtual : undefined}
                  className="trilha-no"
                  style={{ ['--desloc' as string]: `${DESLOCAMENTO[i % DESLOCAMENTO.length]}px` }}
                  data-estado={it.estado}
                  data-atual={atual || undefined}
                >
                  <button
                    type="button"
                    onClick={() => aoEscolher(it, s)}
                    aria-label={`${it.rotulo}. ${
                      it.estado === 'feita' ? 'Concluída' : it.estado === 'disponivel' ? 'Disponível' : it.dica ?? 'Bloqueada'
                    }`}
                  >
                    {it.estado === 'feita' ? <Star aria-hidden /> : it.estado === 'bloqueada' ? <Lock aria-hidden /> : <Check aria-hidden />}
                  </button>
                  <span className="trilha-rotulo">
                    {it.rotulo}
                    {it.estado === 'bloqueada' && it.dica && <small>{it.dica}</small>}
                  </span>
                </li>
              )
            })}
          </ol>
        </li>
      ))}
    </ol>
  )
}
