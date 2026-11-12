import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'

export function CampoSenha({
  valor,
  aoMudar,
  rotulo = 'Senha',
  autoComplete,
  dica,
}: {
  valor: string
  aoMudar: (v: string) => void
  rotulo?: string
  autoComplete: 'current-password' | 'new-password'
  dica?: string
}) {
  const [visivel, setVisivel] = useState(false)
  const id = useId()
  return (
    <label className="campo" htmlFor={id}>
      <span>{rotulo}</span>
      <div className="senha-caixa">
        <input
          id={id}
          className="entrada"
          type={visivel ? 'text' : 'password'}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          autoComplete={autoComplete}
          required
          minLength={autoComplete === 'new-password' ? 8 : undefined}
        />
        <button
          type="button"
          className="senha-olho"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? 'Esconder senha' : 'Mostrar senha'}
        >
          {visivel ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </button>
      </div>
      {dica && <small>{dica}</small>}
    </label>
  )
}
