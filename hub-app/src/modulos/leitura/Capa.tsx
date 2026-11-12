import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const PALETAS = [
  ['#3D1773', '#FFC266'],
  ['#1C0752', '#FF9F11'],
  ['#2A0F63', '#EFEAF7'],
  ['#E08707', '#1A0A00'],
  ['#150240', '#B9A3F0'],
  ['#5B2A9E', '#EFEAF7'],
]

function hash(t: string) {
  let h = 0
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0
  return Math.abs(h)
}

const cache = new Map<string, { url: string; expira: number }>()

/** URL assinada temporária para a capa privada (bucket leit-capas). */
export function useUrlCapa(path: string | null) {
  const [url, setUrl] = useState<string | null>(() => {
    const c = path ? cache.get(path) : undefined
    return c && c.expira > Date.now() ? c.url : null
  })
  useEffect(() => {
    if (!path) return setUrl(null)
    const c = cache.get(path)
    if (c && c.expira > Date.now()) return setUrl(c.url)
    let vivo = true
    supabase.storage
      .from('leit-capas')
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!vivo || !data?.signedUrl) return
        cache.set(path, { url: data.signedUrl, expira: Date.now() + 55 * 60_000 })
        setUrl(data.signedUrl)
      })
    return () => {
      vivo = false
    }
  }, [path])
  return url
}

export function esquecerCapa(path: string | null) {
  if (path) cache.delete(path)
}

/** Capa do livro: a imagem enviada ou uma capa tipográfica elegante gerada a partir do título. */
export function Capa({
  titulo,
  autor,
  path,
  tamanho = 'media',
  previaLocal,
}: {
  titulo: string
  autor?: string | null
  path: string | null
  tamanho?: 'pequena' | 'media' | 'grande'
  previaLocal?: string | null
}) {
  const remota = useUrlCapa(previaLocal ? null : path)
  const url = previaLocal ?? remota
  const [fundo, tinta] = PALETAS[hash(titulo) % PALETAS.length]
  return (
    <div className={`capa capa-${tamanho}`} role="img" aria-label={`Capa de ${titulo}`}>
      {url ? (
        <img src={url} alt="" loading="lazy" />
      ) : (
        <div className="capa-tipo" style={{ background: fundo, color: tinta }}>
          <span className="capa-filete" style={{ background: tinta }} />
          <b>{titulo}</b>
          {autor && <small>{autor}</small>}
        </div>
      )}
    </div>
  )
}
