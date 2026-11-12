import { HeartHandshake } from 'lucide-react'
import { useState } from 'react'
import { PassoAPasso } from '../../components/compartilhado/PassoAPasso'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { RECAIDA } from './conteudo/textosSaude'
import type { EstadoDnsmk } from './dados'

/** Fluxo acolhedor: sem punição, sem som triste. Só grava ao tocar em "Recomeçar agora". */
export function Recaida({
  estado,
  aoConcluir,
  aoFechar,
  aoPedirAjuda,
}: {
  estado: EstadoDnsmk
  aoConcluir: (e: EstadoDnsmk) => void
  aoFechar: () => void
  aoPedirAjuda: () => void
}) {
  const [passo, setPasso] = useState(0)
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const dias = estado.sequencia_atual ?? 0
  const total = estado.total ?? 0
  const melhor = estado.melhor ?? 0

  async function recomecar() {
    setEnviando(true)
    setErro(null)
    const { data, error } = await supabase.rpc('dnsmk_recaida', { p_nota: nota.trim() || null })
    setEnviando(false)
    if (error) return setErro(mensagemDeErroBanco(error))
    aoConcluir((data as { estado: EstadoDnsmk }).estado)
  }

  const telas = [
    {
      titulo: RECAIDA.titulo,
      apoio: RECAIDA.texto,
      conteudo: (
        <button className="btn btn-secundario recaida-ajuda" onClick={aoPedirAjuda}>
          <HeartHandshake aria-hidden />
          Quero falar com alguém agora
        </button>
      ),
      rodape: (
        <>
          <button className="btn btn-primario btn-grande" onClick={() => setPasso(1)}>
            Continuar
          </button>
          <button className="btn btn-fantasma" onClick={aoFechar}>
            Voltar, foi engano
          </button>
        </>
      ),
    },
    {
      titulo: RECAIDA.perguntaOpcional,
      apoio: RECAIDA.privado,
      conteudo: (
        <label className="campo">
          <span className="so-leitor">{RECAIDA.perguntaOpcional}</span>
          <textarea
            className="entrada"
            maxLength={500}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder={RECAIDA.placeholder}
          />
        </label>
      ),
      rodape: (
        <button className="btn btn-primario btn-grande" onClick={() => setPasso(2)}>
          {nota.trim() ? 'Continuar' : 'Pular'}
        </button>
      ),
    },
    {
      titulo: RECAIDA.diasQueFicam(dias),
      apoio: RECAIDA.totalQueFica(Math.max(total, dias), Math.max(melhor, dias)),
      conteudo: <p className="recaida-depois">{RECAIDA.depois}</p>,
      rodape: (
        <>
          {erro && (
            <div className="aviso aviso-erro" role="alert">
              {erro}
            </div>
          )}
          <button className="btn btn-primario btn-grande" onClick={recomecar} disabled={enviando}>
            {enviando ? 'Salvando…' : RECAIDA.recomecar}
          </button>
        </>
      ),
    },
  ]

  const t = telas[passo]
  return (
    <PassoAPasso
      passo={passo}
      total={telas.length}
      titulo={t.titulo}
      apoio={t.apoio}
      aoVoltar={() => setPasso((p) => Math.max(0, p - 1))}
      aoFechar={aoFechar}
      rotuloFechar="Fechar"
      rodape={t.rodape}
    >
      {t.conteudo}
    </PassoAPasso>
  )
}
