import { BookOpen, CalendarCheck, ChevronRight, HeartHandshake, Lock, Sunrise } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarraProgresso } from '../../../components/compartilhado/BarraProgresso'
import { Celebracao, type DadosCelebracao } from '../../../components/compartilhado/Celebracao'
import { Chama } from '../../../components/compartilhado/Chama'
import { sortear } from '../../../components/compartilhado/efeitos'
import { Numeros } from '../../../components/compartilhado/Graficos'
import { useToast } from '../../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { diferencaDias } from '../../../lib/tempo'
import { CheckIn, type ResultadoCheckin } from '../CheckIn'
import { APOIO_HUMOR, AVISO_EDUCATIVO, COMECAR, LICOES_POR_ID, MENSAGENS_MARCO, MENSAGENS_REFORCO, RECAIDA } from '../conteudo/textosSaude'
import { useDnsmk, type EstadoDnsmk } from '../dados'
import { Recaida } from '../Recaida'

function Comecar() {
  const { estado, definirEstado } = useDnsmk()
  const [data, setData] = useState(estado?.hoje ?? '')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function comecar() {
    setEnviando(true)
    setErro(null)
    const { data: novo, error } = await supabase.rpc('dnsmk_iniciar', { p_inicio: data })
    setEnviando(false)
    if (error) return setErro(mensagemDeErroBanco(error))
    definirEstado(novo as EstadoDnsmk)
  }

  return (
    <div className="dn-comecar">
      <span className="dn-comecar-icone" aria-hidden>
        <Sunrise />
      </span>
      <h2>{COMECAR.titulo}</h2>
      <p>{COMECAR.texto}</p>
      <label className="campo">
        <span>Primeiro dia sem fumar</span>
        <input className="entrada" type="date" value={data} max={estado?.hoje} onChange={(e) => setData(e.target.value)} />
      </label>
      <small className="dn-comecar-aviso">{COMECAR.aviso}</small>
      {erro && (
        <div className="aviso aviso-erro" role="alert">
          {erro}
        </div>
      )}
      <button className="btn btn-primario btn-grande" onClick={comecar} disabled={!data || enviando}>
        {enviando ? 'Começando…' : 'Começar jornada'}
      </button>
    </div>
  )
}

export function Hoje({ aoPedirAjuda }: { aoPedirAjuda: () => void }) {
  const { estado, definirEstado, recarregar, config } = useDnsmk()
  const { mostrar } = useToast()
  const [checkin, setCheckin] = useState<{ dia: string; rotulo: 'Hoje' | 'Ontem' | 'Anteontem' } | null>(null)
  const [recaida, setRecaida] = useState(false)
  const [celebrar, setCelebrar] = useState<DadosCelebracao | null>(null)

  if (!estado) return null
  if (!estado.tem_jornada) return <Comecar />

  const e = estado as Required<EstadoDnsmk>
  const faixa = Math.max(1, e.proxima_meta - e.meta_anterior)
  const faltam = e.proxima_meta - e.sequencia_atual
  const licao = e.proxima_licao ? LICOES_POR_ID[e.proxima_licao.id] : null

  function aoConcluirCheckin(r: ResultadoCheckin) {
    setCheckin(null)
    if (!r.novo) {
      mostrar('Esse dia já tinha check-in. Nada foi alterado.', { comNav: true })
      definirEstado(r.estado)
      return
    }
    if (r.retroativo) {
      mostrar('Check-in registrado. Obrigado por completar o histórico.', { comNav: true })
      definirEstado(r.estado)
      return
    }
    setCelebrar({
      de: r.antes,
      para: r.depois,
      rotuloNumero: r.depois === 1 ? 'dia sem fumar' : 'dias sem fumar',
      metaAnterior: e.meta_anterior,
      proximaMeta: e.proxima_meta,
      mensagem: sortear(r.eh_marco ? MENSAGENS_MARCO : MENSAGENS_REFORCO),
      marco: r.eh_marco,
      seloNovo: r.selo_novo,
    })
    definirEstado(r.estado)
  }

  const rotuloPendente = (d: string) => (diferencaDias(e.hoje, d) === 1 ? 'Ontem' : 'Anteontem')

  return (
    <div className="dn-hoje">
      <section className="dn-ofensiva" aria-label="Sua ofensiva">
        <Chama numero={e.sequencia_atual} tamanho="grande" apagada={e.sequencia_atual === 0} />
        <p className="dn-ofensiva-rotulo">{e.sequencia_atual === 1 ? 'dia sem fumar' : 'dias sem fumar'}</p>
        <div className="dn-meta">
          <BarraProgresso
            fracao={(e.sequencia_atual - e.meta_anterior) / faixa}
            rotulo={`Progresso até a meta de ${e.proxima_meta} dias`}
          />
          <small>
            {faltam === 1 ? 'falta 1 dia' : `faltam ${faltam} dias`} para <b>{e.proxima_meta}</b>
          </small>
        </div>
      </section>

      {e.recaida_hoje ? (
        <div className="dn-cartao dn-recomeco">
          <Sunrise aria-hidden />
          <div>
            <b>Hoje é dia de recomeço.</b>
            <p>{RECAIDA.depois}</p>
          </div>
        </div>
      ) : e.checkin_hoje ? (
        <div className="dn-cartao dn-feito">
          <CalendarCheck aria-hidden />
          <div>
            <b>Check-in de hoje feito</b>
            <p>Volte amanhã para manter o ritual.</p>
          </div>
        </div>
      ) : (
        <button className="btn btn-primario btn-grande dn-cta" onClick={() => setCheckin({ dia: e.hoje, rotulo: 'Hoje' })}>
          Fazer check-in de hoje
        </button>
      )}

      {e.pendentes.length > 0 && !e.recaida_hoje && (
        <div className="dn-pendentes">
          <span>Esqueceu de marcar?</span>
          {e.pendentes.map((d) => (
            <button key={d} className="btn btn-secundario" onClick={() => setCheckin({ dia: d, rotulo: rotuloPendente(d) })}>
              {rotuloPendente(d)}
            </button>
          ))}
        </div>
      )}

      {e.apoio_humor && (
        <div className="dn-cartao dn-apoio">
          <HeartHandshake aria-hidden />
          <div>
            <b>{APOIO_HUMOR.titulo}</b>
            <p>{APOIO_HUMOR.texto}</p>
            <button className="btn-link" onClick={aoPedirAjuda}>
              {APOIO_HUMOR.acao}
            </button>
          </div>
        </div>
      )}

      {licao && e.proxima_licao && (
        <Link
          className="dn-licao"
          to={`/dnsmk/licao/${e.proxima_licao.id}`}
          aria-disabled={!e.proxima_licao.liberada || undefined}
          onClick={(ev) => {
            if (!e.proxima_licao?.liberada) {
              ev.preventDefault()
              mostrar(`Essa lição libera no dia ${e.proxima_licao?.dia} da jornada.`, { comNav: true })
            }
          }}
        >
          <span className="dn-licao-icone" aria-hidden>
            {e.proxima_licao.liberada ? <BookOpen /> : <Lock />}
          </span>
          <span className="dn-licao-textos">
            <span className="rotulo">{e.proxima_licao.liberada ? 'Lição de hoje' : `Próxima lição · dia ${e.proxima_licao.dia}`}</span>
            <b>{licao.licao.titulo}</b>
            <small>
              Unidade {licao.unidade.numero} · {licao.unidade.titulo}
            </small>
          </span>
          <ChevronRight aria-hidden />
        </Link>
      )}

      <Numeros
        itens={[
          { rotulo: 'Melhor sequência', valor: e.melhor },
          { rotulo: 'Total sem fumar', valor: e.total },
        ]}
      />

      <div className="dn-rodape">
        {!e.recaida_hoje && (
          <button className="btn btn-fantasma dn-recaida-btn" onClick={() => setRecaida(true)}>
            {RECAIDA.botao}
          </button>
        )}
        <p className="aviso-educativo">{AVISO_EDUCATIVO}</p>
      </div>

      {checkin && (
        <CheckIn dia={checkin.dia} rotuloDia={checkin.rotulo} aoConcluir={aoConcluirCheckin} aoFechar={() => setCheckin(null)} />
      )}
      {recaida && (
        <Recaida
          estado={e}
          aoFechar={() => setRecaida(false)}
          aoPedirAjuda={aoPedirAjuda}
          aoConcluir={(novo) => {
            setRecaida(false)
            definirEstado(novo)
          }}
        />
      )}
      {celebrar && (
        <Celebracao
          dados={celebrar}
          som={config.som}
          vibracao={config.vibracao}
          aoFechar={() => {
            setCelebrar(null)
            void recarregar()
          }}
        />
      )}
    </div>
  )
}
