type ErroLike = { message?: string; code?: string; status?: number } | null | undefined

export function mensagemDeErroAuth(erro: ErroLike): string {
  if (!erro) return 'Algo deu errado. Tente de novo.'
  const msg = (erro.message ?? '').toLowerCase()
  const code = erro.code ?? ''

  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return 'Sem conexão com o servidor. Confira sua internet e tente de novo.'
  }
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Abra o link que enviamos para sua caixa de entrada.'
  }
  if (msg.includes('não tem acesso') || (erro.status === 403 && msg.includes('hook'))) {
    return 'Este e-mail não está na lista de acesso do TheusVision Hub.'
  }
  if (code === 'user_already_exists' || msg.includes('already registered')) {
    return 'Este e-mail já tem conta. Entre com sua senha.'
  }
  if (code === 'weak_password' || msg.includes('password should')) {
    return 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.'
  }
  if (code.startsWith('over_') || msg.includes('rate limit') || erro.status === 429) {
    return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
  }
  if (code === 'signup_disabled') return 'Novos cadastros estão desligados no momento.'
  if (code === 'otp_expired' || msg.includes('expired')) {
    return 'O link de confirmação expirou. Peça um novo abaixo.'
  }
  return 'Algo deu errado. Tente de novo em instantes.'
}

export function mensagemDeErroBanco(erro: ErroLike): string {
  if (!erro) return 'Algo deu errado. Tente de novo.'
  const msg = erro.message ?? ''
  if (msg.toLowerCase().includes('failed to fetch')) return 'Sem conexão. Seus dados não foram perdidos, tente de novo.'
  // Mensagens das nossas funções já vêm em português, prefixadas.
  const m = msg.match(/^TV: (.*)$/)
  if (m) return m[1]
  return 'Não foi possível salvar agora. Tente de novo em instantes.'
}
