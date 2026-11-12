import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useToast } from '../../components/ui/Toast'
import { definirSom, useSomLigado } from '../../lib/som'
import { useLeitura } from './dados'

const num = (v: string) => (v.trim() === '' ? null : Number(v))

export function FolhaAjustes({ aoFechar }: { aoFechar: () => void }) {
  const { config, salvarConfig } = useLeitura()
  const { mostrar } = useToast()
  const [paginas, setPaginas] = useState(config.meta_paginas?.toString() ?? '')
  const [minutos, setMinutos] = useState(config.meta_minutos?.toString() ?? '')
  const [anual, setAnual] = useState(String(config.meta_anual_livros))
  const som = useSomLigado()
  const [vibracao, setVibracao] = useState(config.vibracao)
  const [erro, setErro] = useState<string | null>(null)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    ref.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aoFechar])

  async function salvar() {
    const p = num(paginas)
    const m = num(minutos)
    const a = num(anual)
    if (p === null && m === null) return setErro('Defina pelo menos uma meta diária: páginas ou minutos.')
    if ((p !== null && (p < 1 || p > 500)) || (m !== null && (m < 1 || m > 600))) return setErro('Use valores entre 1 e 500 páginas ou 1 e 600 minutos.')
    if (a === null || a < 1 || a > 365) return setErro('A meta anual precisa ser entre 1 e 365 livros.')
    const e = await salvarConfig({ meta_paginas: p, meta_minutos: m, meta_anual_livros: a, vibracao })
    if (e) return setErro(e)
    mostrar('Ajustes salvos.', { comNav: true })
    aoFechar()
  }

  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha" role="dialog" aria-modal="true" aria-labelledby="ajustes-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <div className="ajuda-topo">
          <h2 id="ajustes-titulo" className="le-ajustes-titulo">
            Ajustes da leitura
          </h2>
          <button ref={ref} className="fluxo-icone" onClick={aoFechar} aria-label="Fechar">
            <X aria-hidden />
          </button>
        </div>
        <p className="le-ajustes-apoio">A meta pequena é proposital: o hábito vem da constância, não do volume. Vale o que vier primeiro.</p>
        <div className="le-ajustes-linha">
          <label className="campo">
            <span>Páginas por dia</span>
            <input className="entrada" inputMode="numeric" placeholder="desligado" value={paginas} onChange={(e) => setPaginas(e.target.value.replace(/\D/g, ''))} />
          </label>
          <label className="campo">
            <span>ou minutos por dia</span>
            <input className="entrada" inputMode="numeric" placeholder="desligado" value={minutos} onChange={(e) => setMinutos(e.target.value.replace(/\D/g, ''))} />
          </label>
        </div>
        <label className="campo" style={{ marginTop: 14 }}>
          <span>Meta de livros no ano</span>
          <input className="entrada" inputMode="numeric" value={anual} onChange={(e) => setAnual(e.target.value.replace(/\D/g, ''))} />
        </label>
        <div className="cartao-bloco" style={{ marginTop: 16, padding: '4px 16px' }}>
          <div className="interruptor">
            <span>
              Sons do Hub<small>Vale para todos os módulos, neste aparelho.</small>
            </span>
            <button className="chave" role="switch" aria-checked={som} aria-label="Sons do Hub" onClick={() => definirSom(!som)} />
          </div>
          <div className="interruptor">
            <span>Vibração</span>
            <button className="chave" role="switch" aria-checked={vibracao} aria-label="Vibração" onClick={() => setVibracao(!vibracao)} />
          </div>
        </div>
        {erro && (
          <div className="aviso aviso-erro" role="alert" style={{ marginTop: 14 }}>
            {erro}
          </div>
        )}
        <button className="btn btn-primario btn-grande" style={{ marginTop: 16 }} onClick={salvar}>
          Salvar
        </button>
      </div>
    </div>
  )
}
