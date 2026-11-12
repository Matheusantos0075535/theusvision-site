import { AlertCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { mensagemDeErroAuth } from '../../lib/erros'
import { consumirErroDoLink } from '../../lib/inicioDaUrl'
import { supabase } from '../../lib/supabase'
import { CampoSenha } from '../CampoSenha'
import { LayoutAcesso } from '../LayoutAcesso'


export function Entrar() {
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const e = consumirErroDoLink()
    if (e) setErro(mensagemDeErroAuth(e))
  }, [])

  async function enviar(ev: FormEvent) {
    ev.preventDefault()
    setErro(null)
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) {
      if (error.code === 'email_not_confirmed') {
        navegar('/confirme-email', { state: { email: email.trim() } })
        return
      }
      setErro(mensagemDeErroAuth(error))
      return
    }
    navegar('/', { replace: true })
  }

  return (
    <LayoutAcesso titulo="Entrar" apoio="Use o e-mail e a senha da sua conta.">
      <form className="acesso-form" onSubmit={enviar} noValidate={false}>
        {erro && (
          <div className="aviso aviso-erro" role="alert">
            <AlertCircle aria-hidden />
            <span>{erro}</span>
          </div>
        )}
        <label className="campo">
          <span>E-mail</span>
          <input
            className="entrada"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <CampoSenha valor={senha} aoMudar={setSenha} autoComplete="current-password" />
        <button className="btn btn-primario btn-grande" disabled={enviando || !email || !senha}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <div className="acesso-alternativa">
        <span>Primeira vez aqui?</span>
        <Link className="btn-link" to="/primeiro-acesso">
          Criar minha conta
        </Link>
      </div>
    </LayoutAcesso>
  )
}
