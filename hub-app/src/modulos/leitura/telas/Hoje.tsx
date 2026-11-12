import { BookPlus, Check, ChevronRight, Snowflake } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarraProgresso } from '../../../components/compartilhado/BarraProgresso'
import { Chama } from '../../../components/compartilhado/Chama'
import { Numeros } from '../../../components/compartilhado/Graficos'
import { useToast } from '../../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { Capa } from '../Capa'
import { pct, textoMeta, useLeitura } from '../dados'

export function Hoje({ aoRegistrar }: { aoRegistrar: (livroId?: string) => void }) {
  const { estado, livros, recarregar } = useLeitura()
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const [congelando, setCongelando] = useState(false)
  if (!estado || !livros) return null

  const lendo = livros.filter((l) => l.estado === 'lendo')
  const atual = estado.livro_atual ? livros.find((l) => l.id === estado.livro_atual!.id) : null
  const outros = lendo.filter((l) => l.id !== atual?.id)
  const faixa = Math.max(1, estado.proxima_meta - estado.meta_anterior)
  const faltam = estado.proxima_meta - estado.ofensiva

  const progressoMeta = Math.max(
    estado.meta_paginas ? estado.hoje_paginas / estado.meta_paginas : 0,
    estado.meta_minutos ? estado.hoje_minutos / estado.meta_minutos : 0,
  )

  async function congelar() {
    setCongelando(true)
    const { error } = await supabase.rpc('leit_congelar_ontem')
    setCongelando(false)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    mostrar('Ontem ficou protegido. Sua ofensiva continua.', { comNav: true })
    void recarregar()
  }

  if (!livros.length) {
    return (
      <div className="le-vazio-inicial">
        <span className="le-vazio-icone" aria-hidden>
          <BookPlus />
        </span>
        <h2>Sua estante está vazia</h2>
        <p>Adicione os livros que você está lendo, ou quer ler. Pode ter vários ao mesmo tempo.</p>
        <button className="btn btn-primario btn-grande" onClick={() => navegar('/leitura/novo')}>
          Adicionar meu primeiro livro
        </button>
      </div>
    )
  }

  return (
    <div className="le-hoje">
      <section className="bloco-ofensiva le-ofensiva" aria-label="Ofensiva de leitura">
        <Chama numero={estado.ofensiva} tamanho="grande" apagada={estado.ofensiva === 0} />
        <p className="bloco-ofensiva-rotulo">{estado.ofensiva === 1 ? 'dia seguido lendo' : 'dias seguidos lendo'}</p>
        <div className="bloco-meta">
          <BarraProgresso fracao={(estado.ofensiva - estado.meta_anterior) / faixa} rotulo="Progresso até o próximo marco" />
          <small>
            {faltam === 1 ? 'falta 1 dia' : `faltam ${faltam} dias`} para <b>{estado.proxima_meta}</b>
          </small>
        </div>
      </section>

      <div className="le-meta-dia" data-cumprida={estado.hoje_cumprido || undefined}>
        <span className="le-meta-check" aria-hidden>
          {estado.hoje_cumprido ? <Check /> : null}
        </span>
        <div>
          <b>{estado.hoje_cumprido ? 'Meta de hoje cumprida' : `Meta de hoje: ${textoMeta(estado)}`}</b>
          <BarraProgresso fina fracao={progressoMeta} rotulo="Meta do dia" />
          <small>
            Hoje: {estado.hoje_paginas} {estado.hoje_paginas === 1 ? 'página' : 'páginas'} · {estado.hoje_minutos} min
          </small>
        </div>
      </div>

      <button className="btn btn-primario btn-grande" onClick={() => aoRegistrar()}>
        Registrar leitura
      </button>

      {estado.pode_congelar && (
        <div className="cartao-info le-congelar">
          <Snowflake aria-hidden />
          <div>
            <b>Ontem ficou sem leitura</b>
            <p>
              Se esqueceu de marcar, registre ontem pelo botão acima. Se não leu mesmo, você pode usar sua proteção de 1 dia
              (uma a cada 30 dias). O dia fica marcado e não entra no total.
            </p>
            <button className="btn-link" onClick={congelar} disabled={congelando}>
              {congelando ? 'Protegendo…' : 'Usar proteção de 1 dia'}
            </button>
          </div>
        </div>
      )}

      {atual && (
        <section>
          <span className="rotulo">Continuar de onde parei</span>
          <div className="le-continuar">
            <Link to={`/leitura/livro/${atual.id}`} className="le-continuar-capa" aria-label={`Abrir ${atual.titulo}`}>
              <Capa titulo={atual.titulo} autor={atual.autor} path={atual.capa_path} tamanho="media" />
            </Link>
            <div className="le-continuar-info">
              <b>{atual.titulo}</b>
              {atual.autor && <small>{atual.autor}</small>}
              <BarraProgresso fracao={atual.pagina_atual / atual.total_paginas} rotulo={`Progresso em ${atual.titulo}`} />
              <small>
                pág. {atual.pagina_atual} de {atual.total_paginas} · {pct(atual)}%
              </small>
              <button className="btn btn-secundario" onClick={() => aoRegistrar(atual.id)}>
                Registrar neste livro
              </button>
            </div>
          </div>
        </section>
      )}

      {outros.length > 0 && (
        <section>
          <span className="rotulo">Também lendo</span>
          <ul className="le-lendo">
            {outros.map((l) => (
              <li key={l.id}>
                <Link to={`/leitura/livro/${l.id}`} className="le-lendo-item">
                  <Capa titulo={l.titulo} autor={l.autor} path={l.capa_path} tamanho="pequena" />
                  <span>
                    <b>{l.titulo}</b>
                    <BarraProgresso fina fracao={l.pagina_atual / l.total_paginas} />
                    <small>{pct(l)}%</small>
                  </span>
                  <ChevronRight aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Numeros
        itens={[
          { rotulo: 'Melhor sequência', valor: estado.melhor },
          { rotulo: 'Dias lidos', valor: estado.total_dias },
        ]}
      />
    </div>
  )
}
