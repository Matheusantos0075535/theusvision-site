// Roda antes de tudo (primeiro import do main.tsx).
// 1) GitHub Pages não tem rotas de SPA: o 404.html da raiz manda /hub/qualquer/rota para /hub/?rota=qualquer/rota.
//    Aqui restauramos o caminho original antes do roteador montar.
// 2) Se o link de confirmação do e-mail voltou com erro (ex.: expirado), guardamos a mensagem para a tela de entrar.
const busca = new URLSearchParams(window.location.search)
const rota = busca.get('rota')
if (rota !== null) {
  busca.delete('rota')
  const resto = busca.toString()
  const destino = `${import.meta.env.BASE_URL}${rota.replace(/^\/+/, '')}${resto ? `?${resto}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', destino)
}

const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
const codigoErro = hash.get('error_code') ?? busca.get('error_code')
const descricaoErro = hash.get('error_description') ?? busca.get('error_description')
if (codigoErro || descricaoErro) {
  sessionStorage.setItem('tv_erro_link', JSON.stringify({ code: codigoErro, message: descricaoErro ?? '' }))
  window.history.replaceState(null, '', window.location.pathname)
}

export function consumirErroDoLink(): { code?: string; message: string } | null {
  const bruto = sessionStorage.getItem('tv_erro_link')
  if (!bruto) return null
  sessionStorage.removeItem('tv_erro_link')
  try {
    const v = JSON.parse(bruto)
    return { code: v.code ?? undefined, message: v.message ?? '' }
  } catch {
    return null
  }
}
