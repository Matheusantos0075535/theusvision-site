export type TipoLink = 'instagram' | 'youtube' | 'tiktok' | 'site'

export function tipoDoLink(url: string): TipoLink {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '')
    if (h.endsWith('instagram.com')) return 'instagram'
    if (h.endsWith('youtube.com') || h === 'youtu.be') return 'youtube'
    if (h.endsWith('tiktok.com')) return 'tiktok'
  } catch {
    /* link inválido */
  }
  return 'site'
}

export const ROTULO_LINK: Record<TipoLink, string> = { instagram: 'Instagram', youtube: 'YouTube', tiktok: 'TikTok', site: 'Link' }

export function dominio(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Endereço do player embutido (prévia), quando a plataforma permite. */
export function embedDoLink(url: string): string | null {
  try {
    const u = new URL(url)
    const tipo = tipoDoLink(url)
    if (tipo === 'instagram') {
      const m = u.pathname.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/)
      if (m) return `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/embed/`
    }
    if (tipo === 'youtube') {
      const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') ?? u.pathname.match(/\/(shorts|embed)\/([^/?]+)/)?.[2]
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`
    }
  } catch {
    /* sem prévia */
  }
  return null
}

/** Aceita colar só "instagram.com/..." sem https. */
export function normalizarLink(v: string) {
  const t = v.trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}
