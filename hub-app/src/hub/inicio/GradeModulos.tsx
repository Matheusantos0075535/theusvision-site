import { ChevronDown, MousePointer2 } from 'lucide-react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast'
import { useMidia, useMovimentoReduzido } from '../../lib/useMidia'
import type { Grupo, Modulo } from '../modulos'
import { CardModulo, type DestaqueCard } from './CardModulo'
import { Previa } from './Previa'

const ID_PREVIA = 'previa-modulo'
const CHAVE_GRUPOS = 'tv-grupos-abertos'

function lerAbertos(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_GRUPOS) ?? '{}')
  } catch {
    return {}
  }
}

type Ponteiro = 'mouse' | 'toque'

/**
 * Comportamento:
 * - Tela larga (acima de 640 px): cartões grandes e painel fixo ao lado. Com mouse, passar por cima abre a prévia
 *   no painel e clicar abre o módulo. No toque, tocar escolhe o módulo (o painel mostra) e a seta abre.
 * - Tela estreita com mouse: quadradinhos; a prévia flutua junto ao card e clicar abre o módulo.
 * - Tela estreita no toque: quadradinhos; tocar seleciona e abre a prévia no FIM da lista (rolagem suave);
 *   tocar de novo no mesmo recolhe. Só a seta do quadrado ou o botão da prévia abrem o módulo.
 * O tipo de ponteiro é lido a cada interação, então notebooks com tela de toque funcionam nos dois jeitos.
 */
export function GradeModulos({ modulos, grupos, destaques }: { modulos: Modulo[]; grupos: Grupo[]; destaques: Record<string, DestaqueCard | null> }) {
  const larga = useMidia('(min-width: 641px)')
  const temMouse = useMidia('(hover: hover) and (pointer: fine)')
  const reduzido = useMovimentoReduzido()
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const [ponteiro, setPonteiro] = useState<Ponteiro | null>(null)
  const [ativoId, setAtivoId] = useState<string | null>(larga ? modulos[0].id : null)
  const [abertos, setAbertos] = useState<Record<string, boolean>>(lerAbertos)
  const refPrevia = useRef<HTMLDivElement>(null)
  const refGrade = useRef<HTMLUListElement>(null)

  const modo: Ponteiro = ponteiro ?? (temMouse ? 'mouse' : 'toque')
  const caixaNoFim = !larga && modo === 'toque'
  const flutuante = !larga && modo === 'mouse'
  const painel = larga

  // A primeira categoria (os pilares) começa aberta; as outras começam recolhidas. A escolha fica salva neste aparelho.
  const estaAberto = (g: Grupo) => abertos[g.id] ?? grupos[0]?.id === g.id
  const visiveis = modulos.filter((m) => estaAberto(grupos.find((g) => g.id === m.grupo)!))
  const ativo = visiveis.find((m) => m.id === ativoId) ?? null

  function alternarGrupo(g: Grupo) {
    const novo = { ...abertos, [g.id]: !estaAberto(g) }
    setAbertos(novo)
    try {
      localStorage.setItem(CHAVE_GRUPOS, JSON.stringify(novo))
    } catch {
      /* sem armazenamento: vale só nesta sessão */
    }
    if (estaAberto(g) && ativoId && modulos.find((m) => m.id === ativoId)?.grupo === g.id) setAtivoId(null)
  }

  useEffect(() => {
    setAtivoId(larga ? visiveis[0]?.id ?? null : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [larga, modulos, abertos])

  useEffect(() => {
    if (flutuante || caixaNoFim) setAtivoId(null)
  }, [flutuante, caixaNoFim])

  useEffect(() => {
    if (!caixaNoFim || !ativoId) return
    const t = window.setTimeout(
      () => refPrevia.current?.scrollIntoView({ behavior: reduzido ? 'auto' : 'smooth', block: 'start' }),
      60,
    )
    return () => window.clearTimeout(t)
  }, [ativoId, caixaNoFim, reduzido])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !larga && setAtivoId(null)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [larga])

  const abrir = useCallback(
    (m: Modulo) => {
      if (m.status === 'disponivel' && m.rota) navegar(m.rota)
      else mostrar(`${m.nome} ainda está em construção.`)
    },
    [navegar, mostrar],
  )

  const fechar = useCallback(() => {
    setAtivoId(null)
    refGrade.current?.scrollIntoView({ behavior: reduzido ? 'auto' : 'smooth', block: 'nearest' })
  }, [reduzido])

  const lerPonteiro = (tipo: string) => {
    const novo: Ponteiro = tipo === 'touch' ? 'toque' : 'mouse'
    setPonteiro((atual) => (atual === novo ? atual : novo))
  }

  return (
    <div
      className={`modulos ${larga ? 'modulos-larga' : 'modulos-estreita'} modulos-${modo}`}
      onPointerDownCapture={(e) => lerPonteiro(e.pointerType)}
      onPointerEnter={(e) => lerPonteiro(e.pointerType)}
    >
      <ul ref={refGrade} className="grade" aria-label="Módulos" onMouseLeave={() => flutuante && setAtivoId(null)}>
        {grupos.map((g) => {
          const doGrupo = modulos.filter((m) => m.grupo === g.id)
          if (!doGrupo.length) return null
          return (
            <Fragment key={g.id}>
              <li className="grupo-cabeca" role="presentation" data-fechado={!estaAberto(g) || undefined}>
                <button type="button" className="grupo-botao" aria-expanded={estaAberto(g)} onClick={() => alternarGrupo(g)}>
                  <span className="grupo-textos">
                    <span className="grupo-nome">{g.nome}</span>
                    <span className="grupo-apoio">{g.apoio}</span>
                  </span>
                  {!estaAberto(g) && (
                    <span className="grupo-leque" aria-hidden>
                      {doGrupo.map((m) => {
                        const Icone = m.icone
                        return (
                          <i key={m.id}>
                            <Icone />
                          </i>
                        )
                      })}
                    </span>
                  )}
                  <span className="grupo-conta">{doGrupo.length}</span>
                  <ChevronDown className="grupo-seta" aria-hidden />
                </button>
              </li>
              {estaAberto(g) && doGrupo.map((m, i) => (
                <CardModulo
                  key={m.id}
                  modulo={m}
                  ativo={ativoId === m.id}
                  destaque={destaques[m.id]}
                  idPrevia={ID_PREVIA}
                  aoExpandir={caixaNoFim}
                  aoEntrar={() => modo === 'mouse' && setAtivoId(m.id)}
                  aoEscolher={() => {
                    if (modo === 'mouse' && !caixaNoFim) return abrir(m)
                    setAtivoId((atual) => (caixaNoFim && atual === m.id ? null : m.id))
                  }}
                  aoAbrir={() => abrir(m)}
                >
                  {flutuante && ativoId === m.id && (
                    <div className={`mod-flutuante ${i % 2 === 1 ? 'a-direita' : ''}`}>
                      <Previa modulo={m} destaque={destaques[m.id]} aoAbrir={abrir} variante="flutuante" />
                    </div>
                  )}
                </CardModulo>
              ))}
              {estaAberto(g) && caixaNoFim && ativo && ativo.grupo === g.id && (
                <li className="mod-previa-fim">
                  <Previa ref={refPrevia} id={ID_PREVIA} modulo={ativo} destaque={destaques[ativo.id]} aoAbrir={abrir} aoFechar={fechar} variante="caixa" />
                </li>
              )}
            </Fragment>
          )
        })}
      </ul>

      {painel && (
        <aside className="painel" aria-live="polite">
          {ativo ? (
            <Previa modulo={ativo} destaque={destaques[ativo.id]} aoAbrir={abrir} variante="painel" />
          ) : (
            <div className="painel-vazio">
              <MousePointer2 aria-hidden />
              <p>Passe o mouse sobre um módulo para ver o que tem dentro.</p>
            </div>
          )}
        </aside>
      )}
    </div>
  )
}
