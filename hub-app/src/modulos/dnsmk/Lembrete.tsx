import { useEffect, useMemo, useState } from 'react'
import { useMovimentoReduzido } from '../../lib/useMidia'
import { DOIS_CAMINHOS as T, FRASES_ANCORA, FRASES_CIENCIA } from './conteudo/textosSaude'

const INTERVALO = 10_000

type Item =
  | { tipo: 'par'; de: string; para: string }
  | { tipo: 'ancora'; situacao: string; frase: string }
  | { tipo: 'ciencia'; frase: string; fonte: string }

/** Pares "onde você estava → para onde está indo", frases-âncora e achados de pesquisa, alternados. */
const ITENS: Item[] = (() => {
  const out: Item[] = []
  const n = Math.max(T.lembretes.length, FRASES_ANCORA.length, FRASES_CIENCIA.length)
  for (let i = 0; i < n; i++) {
    if (T.lembretes[i]) out.push({ tipo: 'par', ...T.lembretes[i] })
    if (FRASES_CIENCIA[i]) out.push({ tipo: 'ciencia', ...FRASES_CIENCIA[i] })
    if (FRASES_ANCORA[i]) out.push({ tipo: 'ancora', ...FRASES_ANCORA[i] })
  }
  return out
})()
const N = ITENS.length

/** O item inicial muda a cada dia de Brasília (o "hoje" vem do banco); depois troca a cada 10 s. */
function indiceDoDia(hoje: string) {
  const dias = Math.floor(Date.parse(`${hoje}T12:00:00Z`) / 86_400_000)
  return ((dias % N) + N) % N
}

const textoDe = (it: Item) =>
  it.tipo === 'par' ? `${T.lembreteDe}: ${it.de} ${T.lembretePara}: ${it.para}.` : it.tipo === 'ciencia' ? `O que a ciência diz: ${it.frase} (${it.fonte})` : `${it.situacao}: ${it.frase}`

/**
 * Faixa curta antes da ofensiva. Troca sozinha; pausa com o mouse em cima, com foco ou com a aba escondida;
 * sem troca com movimento reduzido. Todos os itens ficam empilhados na mesma célula (só um visível),
 * assim a faixa tem sempre a altura do maior e a tela não "pula" a cada troca.
 */
export function Lembrete({ hoje, aoVerPorque }: { hoje: string; aoVerPorque: () => void }) {
  const reduzido = useMovimentoReduzido()
  const [indice, setIndice] = useState(() => indiceDoDia(hoje))
  const [ciclo, setCiclo] = useState(0)
  const [pausaPonteiro, setPausaPonteiro] = useState(false)
  const [pausaAba, setPausaAba] = useState(() => document.hidden)
  const pausado = pausaPonteiro || pausaAba

  useEffect(() => setIndice(indiceDoDia(hoje)), [hoje])

  useEffect(() => {
    const mudar = () => setPausaAba(document.hidden)
    document.addEventListener('visibilitychange', mudar)
    return () => document.removeEventListener('visibilitychange', mudar)
  }, [])

  useEffect(() => {
    if (reduzido || pausado) return
    const t = window.setTimeout(() => {
      setIndice((i) => (i + 1) % N)
      setCiclo((c) => c + 1)
    }, INTERVALO)
    return () => window.clearTimeout(t)
  }, [ciclo, pausado, reduzido])

  const lista = useMemo(() => ITENS, [])
  return (
    <button
      className="lembrete"
      onClick={aoVerPorque}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPausaPonteiro(true)}
      onPointerLeave={() => setPausaPonteiro(false)}
      onFocus={() => setPausaPonteiro(true)}
      onBlur={() => setPausaPonteiro(false)}
      aria-label={`${textoDe(lista[indice])} ${T.lembreteLink}`}
    >
      <span className="lembrete-brilho" aria-hidden />
      <span className="lembrete-pilha" aria-hidden>
        {lista.map((it, i) =>
          it.tipo === 'par' ? (
            <span key={i} className="lembrete-fluxo" data-ativo={i === indice || undefined}>
              <span className="lembrete-no lembrete-de">
                <span className="lembrete-rotulo">{T.lembreteDe}</span>
                <span className="lembrete-verso">{it.de}</span>
              </span>
              <span className="lembrete-fio">
                <i className="fio-ponta fio-ponta-de" />
                <i className="fio-linha" />
                <i className="fio-ponta fio-ponta-para" />
              </span>
              <span className="lembrete-no lembrete-para">
                <span className="lembrete-rotulo">{T.lembretePara}</span>
                <span className="lembrete-verso">{it.para}</span>
              </span>
            </span>
          ) : it.tipo === 'ciencia' ? (
            <span key={i} className="lembrete-fluxo lembrete-ancora lembrete-ciencia" data-ativo={i === indice || undefined}>
              <span className="lembrete-no">
                <span className="lembrete-rotulo">O que a ciência diz</span>
                <span className="lembrete-verso">{it.frase}</span>
                <span className="lembrete-fonte">({it.fonte})</span>
              </span>
            </span>
          ) : (
            <span key={i} className="lembrete-fluxo lembrete-ancora" data-ativo={i === indice || undefined}>
              <span className="lembrete-no">
                <span className="lembrete-rotulo">{it.situacao}</span>
                <span className="lembrete-verso">{it.frase}</span>
              </span>
            </span>
          ),
        )}
      </span>
      <span className="lembrete-link" aria-hidden>
        {T.lembreteLink}
      </span>
      {!reduzido && (
        <span className="lembrete-tempo" aria-hidden>
          <i key={`${indice}-${ciclo}-${pausado ? 'p' : 'r'}`} data-pausado={pausado || undefined} />
        </span>
      )}
    </button>
  )
}
