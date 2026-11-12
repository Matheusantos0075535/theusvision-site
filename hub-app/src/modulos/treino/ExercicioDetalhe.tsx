import { Lightbulb, Target, TriangleAlert, X } from 'lucide-react'
import { useEffect } from 'react'
import { EXERCICIO, GRUPOS } from './catalogo'
import { DETALHES, porqueReps } from './detalhes'
import { ExercicioImagem } from './ExercicioImagem'

/** Abre o exercício: como funciona, o que trabalha e por que está no treino. */
export function ExercicioDetalhe({ id, alvo, aoFechar }: { id: string; alvo?: { series: number; min: number; max: number }; aoFechar: () => void }) {
  const ex = EXERCICIO[id]
  const d = DETALHES[id]
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aoFechar])
  if (!ex) return null
  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha tr-detalhe" role="dialog" aria-modal="true" aria-labelledby="tr-det" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <div className="tr-folha-topo">
          <h2 id="tr-det">{ex.nome}</h2>
          <button className="btn-icone" onClick={aoFechar} aria-label="Fechar">
            <X aria-hidden />
          </button>
        </div>
        <ExercicioImagem id={id} tamanho="grande" />
        <div className="tr-det-tags">
          <span className="tr-det-tag tr-det-tag-forte">{GRUPOS[ex.grupo]}</span>
          <span className="tr-det-tag">{ex.equipamento}</span>
          {alvo && (
            <span className="tr-det-tag">
              {alvo.series} × {alvo.min}–{alvo.max}
            </span>
          )}
        </div>
        {d && (
          <>
            <section className="tr-det-bloco">
              <h3>
                <Target aria-hidden /> O que trabalha
              </h3>
              <ul className="tr-det-musculos">
                {d.musculos.map((m, i) => (
                  <li key={m} data-principal={i === 0 || undefined}>
                    {m}
                  </li>
                ))}
              </ul>
            </section>
            <section className="tr-det-bloco">
              <h3>
                <Lightbulb aria-hidden /> Por que está no seu treino
              </h3>
              <p>{d.porque}</p>
              {alvo && <p className="tr-det-reps">{porqueReps(alvo.min, alvo.max)}</p>}
            </section>
            <section className="tr-det-bloco">
              <h3>Como funciona</h3>
              <p>{d.como}</p>
              <ul className="tr-det-passos">
                {ex.dicas.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
            <section className="tr-det-bloco tr-det-erro">
              <h3>
                <TriangleAlert aria-hidden /> Erro mais comum
              </h3>
              <p>{d.erro}</p>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
