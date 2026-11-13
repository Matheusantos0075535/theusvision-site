import { ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EXERCICIOS, GRUPOS, type Grupo } from '../catalogo'
import { useTreino } from '../dados'
import { DETALHES } from '../detalhes'
import { ExercicioDetalhe } from '../ExercicioDetalhe'
import { ExercicioImagem } from '../ExercicioImagem'

const ORDEM: Grupo[] = ['peito', 'costas', 'ombros', 'trapezio', 'biceps', 'triceps', 'pernas', 'panturrilha', 'abdomen', 'lombar']

/** Todos os exercícios do app, por parte do corpo, com a explicação de cada um. */
export function Exercicios() {
  const { fichas } = useTreino()
  const [grupo, setGrupo] = useState<Grupo | 'todos'>('todos')
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState<string | null>(null)

  const naFicha = useMemo(() => {
    const m = new Map<string, string[]>()
    fichas.forEach((f) => f.itens.forEach((i) => m.set(i.exercicio, [...(m.get(i.exercicio) ?? []), f.nome])))
    return m
  }, [fichas])

  const q = busca.trim().toLowerCase()
  const lista = EXERCICIOS.filter(
    (e) => (grupo === 'todos' || e.grupo === grupo) && (!q || e.nome.toLowerCase().includes(q) || DETALHES[e.id]?.musculos.join(' ').toLowerCase().includes(q)),
  )
  const grupos = ORDEM.filter((g) => lista.some((e) => e.grupo === g))

  return (
    <div className="tr-exercicios">
      <section className="dia-hero tr-hero">
        <span className="dia-hero-tipo">Biblioteca</span>
        <h2 className="dia-hero-data">
          <span>{EXERCICIOS.length}</span>
          exercícios com explicação
        </h2>
        <p className="tr-hero-linha">Toque em um para ver o movimento, os músculos que trabalha e por que ele vale a pena.</p>
      </section>
      <label className="id-busca">
        <Search aria-hidden />
        <input className="entrada" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar exercício ou músculo" aria-label="Buscar exercício" />
      </label>
      <div className="tr-chips" role="group" aria-label="Parte do corpo">
        <button className="dia-chip" aria-pressed={grupo === 'todos'} onClick={() => setGrupo('todos')}>
          Todos
        </button>
        {ORDEM.map((g) => (
          <button key={g} className="dia-chip" aria-pressed={grupo === g} onClick={() => setGrupo(g)}>
            {GRUPOS[g]}
          </button>
        ))}
      </div>
      {grupos.length === 0 && <p className="vazio">Nenhum exercício encontrado.</p>}
      {grupos.map((g) => {
        const doGrupo = lista.filter((e) => e.grupo === g)
        return (
          <section key={g} className="tr-ex-grupo">
            <h3>
              {GRUPOS[g]} <small>{doGrupo.length}</small>
            </h3>
            <ul className="tr-ex-lista">
              {doGrupo.map((e) => (
                <li key={e.id}>
                  <button className="tr-ex-cartao" onClick={() => setAberto(e.id)}>
                    <ExercicioImagem id={e.id} tamanho="medio" />
                    <span className="tr-ex-textos">
                      <b>{e.nome}</b>
                      <small>{DETALHES[e.id]?.musculos.slice(0, 3).join(' · ')}</small>
                      <span className="tr-ex-tags">
                        <i>{e.equipamento}</i>
                        {naFicha.get(e.id)?.map((f) => (
                          <i key={f} data-ficha>
                            {f}
                          </i>
                        ))}
                      </span>
                    </span>
                    <ChevronRight aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {aberto && <ExercicioDetalhe id={aberto} aoFechar={() => setAberto(null)} />}
    </div>
  )
}
