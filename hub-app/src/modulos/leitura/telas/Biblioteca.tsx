import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Capa } from '../Capa'
import { pct, ROTULO_ESTADO, useLeitura, type EstadoLivro } from '../dados'

const FILTROS: { valor: EstadoLivro | 'todos'; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'lendo', rotulo: 'Lendo' },
  { valor: 'quero_ler', rotulo: 'Quero ler' },
  { valor: 'pausado', rotulo: 'Pausados' },
  { valor: 'concluido', rotulo: 'Concluídos' },
]

export function Biblioteca() {
  const { livros } = useLeitura()
  const [filtro, setFiltro] = useState<EstadoLivro | 'todos'>('todos')
  if (!livros) return null
  const lista = filtro === 'todos' ? livros : livros.filter((l) => l.estado === filtro)

  return (
    <div className="le-biblioteca">
      <div className="le-bib-topo">
        <div className="le-filtros" role="radiogroup" aria-label="Filtrar por estado">
          {FILTROS.map((f) => {
            const n = f.valor === 'todos' ? livros.length : livros.filter((l) => l.estado === f.valor).length
            return (
              <button key={f.valor} role="radio" aria-checked={filtro === f.valor} onClick={() => setFiltro(f.valor)}>
                {f.rotulo}
                <span>{n}</span>
              </button>
            )
          })}
        </div>
      </div>
      <Link to="/leitura/novo" className="btn btn-secundario le-adicionar">
        <Plus aria-hidden />
        Adicionar livro
      </Link>
      {lista.length === 0 ? (
        <p className="vazio">Nenhum livro aqui ainda.</p>
      ) : (
        <ul className="estante">
          {lista.map((l) => (
            <li key={l.id}>
              <Link to={`/leitura/livro/${l.id}`} className="estante-livro">
                <Capa titulo={l.titulo} autor={l.autor} path={l.capa_path} tamanho="media" />
                <span className="estante-titulo">{l.titulo}</span>
                <span className="estante-sub">
                  {l.estado === 'lendo' ? `${pct(l)}%` : ROTULO_ESTADO[l.estado]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
