import { AlertCircle, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { mensagemDeErroAuth } from '../../lib/erros'
import { supabase, urlDeRetorno } from '../../lib/supabase'
import { useAuth } from '../auth'
import { LayoutAcesso } from '../LayoutAcesso'

export function ConfirmeEmail() {
  const { sessao, sair } = useAuth()
  const estado = useLocation().state as { email?: string; recemCriada?: boolean } | null
  const [email, setEmail] = useState(estado?.email ?? sessao?.user.email ?? '')
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function reenviar() {
    setEnviando(true)
    setMensagem(null)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: urlDeRetorno() },
    })
    setEnviando(false)
    setMensagem(
      error
        ? { tipo: 'erro', texto: mensagemDeErroAuth(error) }
        : { tipo: 'ok', texto: 'Enviamos um novo link. Pode levar alguns minutos.' },
    )
  }

  return (
    <LayoutAcesso
      titulo="Confirme seu e-mail"
      apoio={
        estado?.recemCriada
          ? 'Conta criada. Enviamos um link de confirmação. Abra o e-mail e toque no link para entrar.'
          : 'Para entrar, confirme seu e-mail pelo link que enviamos.'
      }
    >
      <div className="envelope" aria-hidden style={{ marginTop: 22 }}>
        <MailCheck />
      </div>
      {mensagem && (
        <div className={`aviso ${mensagem.tipo === 'ok' ? 'aviso-info' : 'aviso-erro'}`} role="status">
          <AlertCircle aria-hidden />
          <span>{mensagem.texto}</span>
        </div>
      )}
      <div className="acesso-form" style={{ marginTop: mensagem ? 16 : 0 }}>
        <label className="campo">
          <span>E-mail</span>
          <input
            className="entrada"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <small>Não chegou? Confira o spam ou peça um novo link.</small>
        </label>
        <button className="btn btn-secundario btn-grande" onClick={reenviar} disabled={enviando || !email}>
          {enviando ? 'Enviando…' : 'Reenviar link de confirmação'}
        </button>
      </div>
      <div className="acesso-alternativa">
        {sessao ? (
          <button className="btn-link" onClick={() => void sair()}>
            Sair e usar outra conta
          </button>
        ) : (
          <Link className="btn-link" to="/entrar">
            Voltar para entrar
          </Link>
        )}
      </div>
    </LayoutAcesso>
  )
}
