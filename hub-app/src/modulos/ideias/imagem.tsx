import { ImagePlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { comprimirImagem } from '../../lib/imagem'
import { supabase } from '../../lib/supabase'

const BUCKET = 'ideias-imagens'
const cache = new Map<string, { url: string; expira: number }>()

/** URL assinada temporária (bucket privado). */
export function useUrlImagem(path: string | null) {
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
      .from(BUCKET)
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

/** Comprime, envia para a pasta do usuário e devolve o caminho. */
export async function enviarImagem(ideiaId: string, arquivo: File): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const uid = data.user?.id
  if (!uid) throw new Error('Sessão expirada. Entre de novo.')
  const blob = await comprimirImagem(arquivo, 1280, 0.82)
  const caminho = `${uid}/${ideiaId}-${Date.now()}.jpg`
  const up = await supabase.storage.from(BUCKET).upload(caminho, blob, { contentType: 'image/jpeg' })
  if (up.error) throw up.error
  return caminho
}

export async function apagarImagem(path: string | null) {
  if (!path) return
  cache.delete(path)
  await supabase.storage.from(BUCKET).remove([path])
}

/** Imagem da ideia, ou (sem imagem) um bloco colorido com a inicial, para o cartão não ficar vazio. */
export function ImagemIdeia({ path, titulo, aoClicar, previa }: { path: string | null; titulo: string; aoClicar?: () => void; previa?: string | null }) {
  const url = useUrlImagem(path)
  const src = previa ?? url
  if (!src) {
    if (!aoClicar) return null
    return (
      <button type="button" className="id-img id-img-vazia" onClick={aoClicar}>
        <ImagePlus aria-hidden />
        <span>Adicionar imagem da ideia</span>
      </button>
    )
  }
  return (
    <span className="id-img">
      <img src={src} alt={`Imagem da ideia: ${titulo}`} loading="lazy" decoding="async" />
    </span>
  )
}
