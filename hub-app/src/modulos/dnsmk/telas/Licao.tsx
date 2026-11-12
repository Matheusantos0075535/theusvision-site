import { ArrowLeft, Dumbbell, Lightbulb, MessageCircleQuestion, Star } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { tocarSom, vibrar } from '../../../components/compartilhado/efeitos'
import { Carregando } from '../../../components/compartilhado/ShellModulo'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { AVISO_EDUCATIVO, LICOES_POR_ID, ROTULO_TIPO } from '../conteudo/textosSaude'
import { useDnsmk, type EstadoDnsmk } from '../dados'
import { useLicoes } from './Trilha'

export function Licao() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const { estado, definirEstado, config } = useDnsmk()
  const { dados } = useLicoes()
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [concluida, setConcluida] = useState(false)

  const item = LICOES_POR_ID[id]
  if (!item) {
    return (
      <div className="vazio">
        Lição não encontrada. <Link to="/dnsmk/trilha">Voltar para a trilha</Link>
      </div>
    )
  }
  if (!dados || !estado) return <Carregando />

  const { licao, unidade } = item
  const dia = dados.dias[id] ?? 9999
  const jaFeita = dados.feitas.has(id)
  const liberada = jaFeita || dia <= (estado.dia_da_jornada ?? 0)

  async function concluir() {
    setEnviando(true)
    setErro(null)
    const { data, error } = await supabase.rpc('dnsmk_concluir_licao', { p_licao: id })
    setEnviando(false)
    if (error) return setErro(mensagemDeErroBanco(error))
    const r = data as { novo: boolean; estado: EstadoDnsmk }
    definirEstado(r.estado)
    if (r.novo) {
      vibrar(config.vibracao)
      tocarSom(config.som)
    }
    setConcluida(true)
  }

  if (concluida) {
    return (
      <div className="dn-licao-fim">
        <span className="dn-estrela" aria-hidden>
          <Star />
        </span>
        <h2>Lição concluída</h2>
        <p>Mais uma estrela na sua trilha.</p>
        <button className="btn btn-primario btn-grande" onClick={() => navegar('/dnsmk/trilha')}>
          Ver trilha
        </button>
        <Link className="btn btn-fantasma" to="/dnsmk">
          Voltar para Hoje
        </Link>
      </div>
    )
  }

  return (
    <article className="dn-licao-pagina">
      <Link to="/dnsmk/trilha" className="link-voltar">
        <ArrowLeft aria-hidden />
        Trilha
      </Link>
      <span className="olho">
        Unidade {unidade.numero} · {ROTULO_TIPO[licao.tipo]}
      </span>
      <h2>{licao.titulo}</h2>
      {!liberada ? (
        <p className="vazio">Essa lição libera no dia {dia} da jornada.</p>
      ) : (
        <>
          <section className="dn-bloco">
            <h3>
              <Lightbulb aria-hidden /> Entender
            </h3>
            <p>{licao.educacao}</p>
          </section>
          <section className="dn-bloco">
            <h3>
              <Dumbbell aria-hidden /> Praticar
            </h3>
            <p>{licao.exercicio}</p>
          </section>
          <section className="dn-bloco">
            <h3>
              <MessageCircleQuestion aria-hidden /> Refletir
            </h3>
            <p>{licao.reflexao}</p>
            <small>Pense ou escreva onde preferir. Sua resposta não é salva.</small>
          </section>
          {erro && (
            <div className="aviso aviso-erro" role="alert">
              {erro}
            </div>
          )}
          {jaFeita ? (
            <p className="dn-ja-feita">
              <Star aria-hidden /> Você já concluiu esta lição.
            </p>
          ) : (
            <button className="btn btn-primario btn-grande" onClick={concluir} disabled={enviando}>
              {enviando ? 'Salvando…' : 'Concluir lição'}
            </button>
          )}
        </>
      )}
      <p className="aviso-educativo">{AVISO_EDUCATIVO}</p>
    </article>
  )
}
