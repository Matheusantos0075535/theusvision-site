import { MousePointer2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast'
import { useMidia, useMovimentoReduzido } from '../../lib/useMidia'
import type { Modulo } from '../modulos'
import { CardModulo, type DestaqueCard } from './CardModulo'
import { Previa } from './Previa'

const ID_PREVIA = 'previa-modulo'

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
export function GradeModulos({ modulos, destaques }: { modulos: Modulo[]; destaques: Record<string, DestaqueCard | null> }) {
  const larga = useMidia('(min-width: 641px)')
  const temMouse = useMidia('(hover: hover) and (pointer: fine)')
  const reduzido = useMovimentoReduzido()
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const [ponteiro, setPonteiro] = useState<Ponteiro | null>(null)
  const [ativoId, setAtivoId] = useState<string | null>(larga ? modulos[0].id : null)
  const refPrevia = useRef<HTMLDivElement>(null)
  const refGrade = useRef<HTMLUListElement>(null)

  const modo: Ponteiro = ponteiro ?? (temMouse ? 'mouse' : 'toque')
  const caixaNoFim = !larga && modo === 'toque'
  const flutuante = !larga && modo === 'mouse'
  const painel = larga

  const ativo = modulos.find((m) => m.id === ativoId) ?? null

  useEffect(() => {
    setAtivoId(larga ? modulos[0].id : null)
  }, [larga, modulos])

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
        {modulos.map((m, i) => (
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
      </ul>

      {caixaNoFim && ativo && (
        <div className="mod-previa-fim">
          <Previa
            ref={refPrevia}
            id={ID_PREVIA}
            modulo={ativo}
            destaque={destaques[ativo.id]}
            aoAbrir={abrir}
            aoFechar={fechar}
            variante="caixa"
          />
        </div>
      )}

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
