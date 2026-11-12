import { AlertCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { mensagemDeErroAuth } from '../../lib/erros'
import { supabase, urlDeRetorno } from '../../lib/supabase'
import { CampoSenha } from '../CampoSenha'
import { LayoutAcesso } from '../LayoutAcesso'

export function PrimeiroAcesso() {
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(ev: FormEvent) {
    ev.preventDefault()
    setErro(null)
    if (senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.')
    if (senha !== confirmar) return setErro('As senhas não são iguais.')
    setEnviando(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { emailRedirectTo: urlDeRetorno() },
    })
    setEnviando(false)
    if (error) return setErro(mensagemDeErroAuth(error))
    // O Supabase não revela se o e-mail já existe: devolve um usuário sem identidades.
    if (data.user && data.user.identities?.length === 0) {
      return setErro('Este e-mail já tem conta. Entre com sua senha.')
    }
    if (data.session) {
      navegar('/', { replace: true })
      return
    }
    navegar('/confirme-email', { state: { email: email.trim(), recemCriada: true } })
  }

  return (
    <LayoutAcesso
      titulo="Primeiro acesso"
      apoio="Crie sua senha. Só e-mails convidados conseguem criar conta."
    >
      <form className="acesso-form" onSubmit={enviar}>
        {erro && (
          <div className="aviso aviso-erro" role="alert">
            <AlertCircle aria-hidden />
            <span>{erro}</span>
          </div>
        )}
        <label className="campo">
          <span>E-mail convidado</span>
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
        <CampoSenha
          valor={senha}
          aoMudar={setSenha}
          rotulo="Crie uma senha"
          autoComplete="new-password"
          dica="Pelo menos 8 caracteres."
        />
        <CampoSenha valor={confirmar} aoMudar={setConfirmar} rotulo="Repita a senha" autoComplete="new-password" />
        <button className="btn btn-primario btn-grande" disabled={enviando || !email || !senha || !confirmar}>
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
      <div className="acesso-alternativa">
        <span>Já tem conta?</span>
        <Link className="btn-link" to="/entrar">
          Entrar
        </Link>
      </div>
    </LayoutAcesso>
  )
}
