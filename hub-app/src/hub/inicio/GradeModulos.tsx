import { MousePointer2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast'
import { useModoInteracao, useMovimentoReduzido } from '../../lib/useMidia'
import type { Modulo } from '../modulos'
import { CardModulo, type DestaqueCard } from './CardModulo'
import { Previa } from './Previa'

const ID_PREVIA = 'previa-modulo'

export function GradeModulos({ modulos, destaques }: { modulos: Modulo[]; destaques: Record<string, DestaqueCard | null> }) {
  const modo = useModoInteracao()
  const reduzido = useMovimentoReduzido()
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const [ativoId, setAtivoId] = useState<string | null>(null)
  const refPrevia = useRef<HTMLDivElement>(null)

  const ativoIdx = modulos.findIndex((m) => m.id === ativoId)
  const ativo = ativoIdx >= 0 ? modulos[ativoIdx] : null

  // Troca de modo (ex.: girar o tablet ou redimensionar a janela) limpa a seleção.
  useEffect(() => setAtivoId(null), [modo])

  useEffect(() => {
    if (modo !== 'toque' || !ativoId) return
    refPrevia.current?.scrollIntoView({ behavior: reduzido ? 'auto' : 'smooth', block: 'nearest' })
  }, [ativoId, modo, reduzido])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAtivoId(null)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])

  function abrir(m: Modulo) {
    if (m.status === 'disponivel' && m.rota) navegar(m.rota)
    else mostrar(`${m.nome} ainda está em construção.`)
  }

  // Na grade de 2 colunas, a caixa de prévia entra logo depois da linha do card tocado.
  const fimDaLinha = ativoIdx >= 0 ? Math.min(ativoIdx - (ativoIdx % 2) + 1, modulos.length - 1) : -1

  const itens = modulos.flatMap((m, i) => {
    const el = (
      <CardModulo
        key={m.id}
        modulo={m}
        ativo={ativoId === m.id}
        destaque={destaques[m.id]}
        idPrevia={ID_PREVIA}
        modoToque={modo === 'toque'}
        aoEntrar={() => modo !== 'toque' && setAtivoId(m.id)}
        aoEscolher={() => (modo === 'toque' ? setAtivoId(m.id) : abrir(m))}
        aoAbrir={() => abrir(m)}
      >
        {modo === 'flutuante' && ativoId === m.id && (
          <div className={`mod-flutuante ${i % 2 === 1 ? 'a-direita' : ''}`}>
            <Previa modulo={m} aoAbrir={abrir} variante="flutuante" />
          </div>
        )}
      </CardModulo>
    )
    if (modo === 'toque' && i === fimDaLinha && ativo) {
      return [
        el,
        <li key="previa" className="mod-previa-linha">
          <Previa ref={refPrevia} id={ID_PREVIA} modulo={ativo} aoAbrir={abrir} variante="caixa" />
        </li>,
      ]
    }
    return [el]
  })

  return (
    <div className={`modulos modulos-${modo}`}>
      <ul
        className="grade"
        aria-label="Módulos"
        onMouseLeave={() => modo === 'flutuante' && setAtivoId(null)}
      >
        {itens}
      </ul>
      {modo === 'painel' && (
        <aside className="painel" aria-live="polite">
          {ativo ? (
            <Previa modulo={ativo} aoAbrir={abrir} variante="painel" />
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
