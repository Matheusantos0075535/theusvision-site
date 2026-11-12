import { Check } from 'lucide-react'
import { useState } from 'react'
import { Opcoes, PassoAPasso } from '../../components/compartilhado/PassoAPasso'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { CHECKIN } from './conteudo/textosSaude'
import type { EstadoDnsmk } from './dados'
import { Rosto } from './Rosto'

export type ResultadoCheckin = {
  novo: boolean
  retroativo: boolean
  antes: number
  depois: number
  eh_marco: boolean
  selo_novo: number | null
  estado: EstadoDnsmk
}

const TOTAL = 7

export function CheckIn({
  dia,
  rotuloDia,
  aoConcluir,
  aoFechar,
}: {
  dia: string
  rotuloDia: 'Hoje' | 'Ontem' | 'Anteontem'
  aoConcluir: (r: ResultadoCheckin) => void
  aoFechar: () => void
}) {
  const [passo, setPasso] = useState(0)
  const [humor, setHumor] = useState<number | null>(null)
  const [fissura, setFissura] = useState<number | null>(null)
  const [sono, setSono] = useState<string | null>(null)
  const [ansiedade, setAnsiedade] = useState<string | null>(null)
  const [gatilhos, setGatilhos] = useState<string[]>([])
  const [ajudou, setAjudou] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const avancar = () => setPasso((p) => Math.min(TOTAL - 1, p + 1))
  const voltar = () => setPasso((p) => Math.max(0, p - 1))

  async function enviar() {
    setEnviando(true)
    setErro(null)
    const { data, error } = await supabase.rpc('dnsmk_checkin', {
      p_dia: dia,
      p_humor: humor,
      p_fissura: fissura,
      p_sono: sono,
      p_ansiedade: ansiedade,
      p_gatilhos: gatilhos,
      p_ajudou: ajudou.trim() || null,
    })
    setEnviando(false)
    if (error) return setErro(mensagemDeErroBanco(error))
    aoConcluir(data as ResultadoCheckin)
  }

  // Escolha única avança sozinha, com uma pausa curta para a pessoa ver a marcação.
  const escolherEAvancar = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    window.setTimeout(avancar, 220)
  }

  const p = CHECKIN.passos
  const telas = [
    {
      titulo: rotuloDia === 'Hoje' ? p.semFumar : p.semFumarRetro(rotuloDia),
      apoio: 'Confirme para começar o check-in. Leva menos de um minuto.',
      conteudo: (
        <div className="checkin-confirma">
          <span aria-hidden>
            <Check />
          </span>
        </div>
      ),
      rodape: (
        <button className="btn btn-primario btn-grande" onClick={avancar}>
          Sim, fiquei sem fumar
        </button>
      ),
    },
    {
      titulo: p.humor,
      conteudo: (
        <Opcoes
          rotulo={p.humor}
          colunas={5}
          valor={humor}
          aoMudar={escolherEAvancar(setHumor)}
          opcoes={([1, 2, 3, 4, 5] as const).map((n) => ({
            valor: n,
            rotulo: <Rosto nivel={n} />,
            sub: CHECKIN.humor[n - 1],
          }))}
        />
      ),
      pronto: humor !== null,
    },
    {
      titulo: p.fissura,
      apoio: p.fissuraApoio,
      conteudo: (
        <Opcoes
          rotulo={p.fissura}
          colunas={6}
          valor={fissura}
          aoMudar={escolherEAvancar(setFissura)}
          opcoes={Array.from({ length: 11 }, (_, n) => ({ valor: n, rotulo: String(n) }))}
        />
      ),
      pronto: fissura !== null,
    },
    {
      titulo: p.sono,
      conteudo: (
        <Opcoes rotulo={p.sono} colunas={3} valor={sono} aoMudar={escolherEAvancar(setSono)} opcoes={CHECKIN.sono} />
      ),
      pronto: sono !== null,
    },
    {
      titulo: p.ansiedade,
      conteudo: (
        <Opcoes
          rotulo={p.ansiedade}
          colunas={3}
          valor={ansiedade}
          aoMudar={escolherEAvancar(setAnsiedade)}
          opcoes={CHECKIN.ansiedade}
        />
      ),
      pronto: ansiedade !== null,
    },
    {
      titulo: p.gatilhos,
      apoio: p.gatilhosApoio,
      conteudo: (
        <Opcoes
          rotulo={p.gatilhos}
          colunas={2}
          multiplo
          valor={gatilhos}
          aoMudar={(v: string) => setGatilhos((g) => (g.includes(v) ? g.filter((x) => x !== v) : [...g, v]))}
          opcoes={CHECKIN.gatilhos}
        />
      ),
      rodape: (
        <button className="btn btn-primario btn-grande" onClick={avancar}>
          {gatilhos.length ? 'Continuar' : 'Nenhum hoje'}
        </button>
      ),
    },
    {
      titulo: p.ajudou,
      apoio: p.ajudouApoio,
      conteudo: (
        <label className="campo">
          <span className="so-leitor">{p.ajudou}</span>
          <textarea
            className="entrada"
            maxLength={280}
            value={ajudou}
            onChange={(e) => setAjudou(e.target.value)}
            placeholder="Ex.: caminhar depois do almoço"
          />
          <small>{280 - ajudou.length} caracteres restantes · só você vê</small>
        </label>
      ),
      rodape: (
        <>
          {erro && (
            <div className="aviso aviso-erro" role="alert">
              {erro}
            </div>
          )}
          <button className="btn btn-primario btn-grande" onClick={enviar} disabled={enviando}>
            {enviando ? 'Salvando…' : 'Concluir check-in'}
          </button>
        </>
      ),
    },
  ]

  const tela = telas[passo]
  return (
    <PassoAPasso
      passo={passo}
      total={TOTAL}
      titulo={tela.titulo}
      apoio={tela.apoio}
      aoVoltar={voltar}
      aoFechar={aoFechar}
      rotuloFechar="Sair do check-in"
      rodape={
        tela.rodape ?? (
          <button className="btn btn-primario btn-grande" onClick={avancar} disabled={!tela.pronto}>
            Continuar
          </button>
        )
      }
    >
      {tela.conteudo}
    </PassoAPasso>
  )
}
