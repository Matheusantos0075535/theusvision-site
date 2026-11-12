import { HeartHandshake, Phone, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { AJUDA, AVISO_EDUCATIVO } from './conteudo/textosSaude'

export function FolhaAjuda({ aoFechar }: { aoFechar: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aoFechar])

  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha ajuda" role="dialog" aria-modal="true" aria-labelledby="ajuda-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <div className="ajuda-topo">
          <span className="ajuda-icone" aria-hidden>
            <HeartHandshake />
          </span>
          <button ref={ref} className="fluxo-icone" onClick={aoFechar} aria-label="Fechar">
            <X aria-hidden />
          </button>
        </div>
        <h2 id="ajuda-titulo">{AJUDA.titulo}</h2>
        <p className="ajuda-apoio">{AJUDA.apoio}</p>
        <ul className="ajuda-contatos">
          {AJUDA.contatos.map((c) => (
            <li key={c.numero}>
              <a href={`tel:${c.numero}`} className="ajuda-ligar">
                <Phone aria-hidden />
                <span>
                  <b>Ligar {c.numero}</b>
                  <small>{c.nome}</small>
                </span>
              </a>
              <p>{c.detalhe}</p>
            </li>
          ))}
        </ul>
        <p className="ajuda-orientacao">{AJUDA.orientacao}</p>
        <p className="aviso-educativo">{AVISO_EDUCATIVO}</p>
      </div>
    </div>
  )
}

export function BotaoAjudaTopo({ aoAbrir }: { aoAbrir: () => void }) {
  return (
    <button className="ajuda-pilula" onClick={aoAbrir} aria-label={AJUDA.botao}>
      <HeartHandshake aria-hidden />
      <span>Ajuda</span>
    </button>
  )
}
