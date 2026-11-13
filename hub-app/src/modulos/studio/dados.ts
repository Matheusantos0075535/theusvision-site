import { useEffect, useState } from 'react'
import { comprimirImagem } from '../../lib/imagem'
import { supabase } from '../../lib/supabase'

export type TipoItem = 'nota' | 'texto' | 'imagem' | 'link' | 'cena' | 'titulo'
export type Cor = 'amarelo' | 'laranja' | 'rosa' | 'roxo' | 'azul' | 'verde' | 'branco'

export type Item = {
  id: string
  tipo: TipoItem
  x: number
  y: number
  w: number
  h: number
  z: number
  cor?: Cor
  texto?: string
  /** imagem: caminho no storage; bucket padrão = studio. */
  path?: string
  bucket?: string
  url?: string
  /** cena de storyboard */
  n?: number
  prompt?: string
  camera?: string
}
export type Ligacao = { id: string; de: string; para: string }
export type Quadro = { itens: Item[]; ligacoes: Ligacao[]; vista?: { x: number; y: number; zoom: number } }
export type Projeto = { id: string; titulo: string; descricao: string | null; ideia_id: string | null; quadro: Quadro; criado_em: string; atualizado_em: string }

export const BUCKET = 'studio'
export const CORES: { id: Cor; fundo: string; tinta: string; rotulo: string }[] = [
  { id: 'amarelo', fundo: '#ffe27a', tinta: '#3d2a00', rotulo: 'Amarelo' },
  { id: 'laranja', fundo: '#ffb347', tinta: '#3d1a00', rotulo: 'Laranja' },
  { id: 'rosa', fundo: '#ff9ec7', tinta: '#4a0b2a', rotulo: 'Rosa' },
  { id: 'roxo', fundo: '#c4a6ff', tinta: '#250a52', rotulo: 'Roxo' },
  { id: 'azul', fundo: '#9fd0ff', tinta: '#06274a', rotulo: 'Azul' },
  { id: 'verde', fundo: '#8ff0c3', tinta: '#053321', rotulo: 'Verde' },
  { id: 'branco', fundo: '#ffffff', tinta: '#3d1773', rotulo: 'Branco' },
]
export const corDe = (c?: Cor) => CORES.find((x) => x.id === c) ?? CORES[0]

export const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))

export const TAMANHO: Record<TipoItem, { w: number; h: number }> = {
  nota: { w: 200, h: 160 },
  texto: { w: 280, h: 60 },
  titulo: { w: 420, h: 70 },
  imagem: { w: 300, h: 220 },
  link: { w: 280, h: 96 },
  cena: { w: 300, h: 330 },
}

export function criarItem(tipo: TipoItem, x: number, y: number, extra: Partial<Item> = {}, z = 1): Item {
  const t = TAMANHO[tipo]
  return {
    id: novoId(),
    tipo,
    x: Math.round(x - t.w / 2),
    y: Math.round(y - t.h / 2),
    w: t.w,
    h: t.h,
    z,
    ...(tipo === 'nota' ? { cor: 'amarelo' as Cor } : {}),
    ...extra,
  }
}

/** Modelos para começar um projeto. */
export type Modelo = 'branco' | 'moodboard' | 'mapa' | 'storyboard'
export const MODELOS: { id: Modelo; nome: string; apoio: string }[] = [
  { id: 'branco', nome: 'Em branco', apoio: 'Comece do zero' },
  { id: 'storyboard', nome: 'Storyboard', apoio: 'Cenas para vídeo com IA' },
  { id: 'moodboard', nome: 'Mood board', apoio: 'Referências e prints' },
  { id: 'mapa', nome: 'Mapa mental', apoio: 'Ideia no centro, ramos em volta' },
]

export function quadroDoModelo(m: Modelo, titulo: string): Quadro {
  const itens: Item[] = []
  const ligacoes: Ligacao[] = []
  if (m === 'storyboard') {
    itens.push(criarItem('titulo', 660, -60, { texto: titulo }))
    for (let i = 0; i < 4; i++) itens.push(criarItem('cena', 180 + i * 330, 230, { n: i + 1, prompt: '', camera: '' }, 2))
    itens.push(criarItem('nota', 180, 560, { texto: 'Estilo visual, referência de luz, trilha…', cor: 'roxo' }, 3))
  } else if (m === 'moodboard') {
    itens.push(criarItem('titulo', 400, -40, { texto: titulo }))
    const cores: Cor[] = ['amarelo', 'rosa', 'azul']
    ;['Paleta de cores', 'Sensação / clima', 'Referências'].forEach((t, i) => itens.push(criarItem('nota', 120 + i * 240, 120, { texto: t, cor: cores[i] }, 2)))
    itens.push(criarItem('texto', 400, 300, { texto: 'Cole prints aqui (Ctrl+V) ou arraste imagens' }, 3))
  } else if (m === 'mapa') {
    const centro = criarItem('nota', 0, 0, { texto: titulo, cor: 'laranja', w: 240, h: 140 })
    centro.x = -120
    centro.y = -70
    itens.push(centro)
    ;['Por quê?', 'Para quem?', 'Como?', 'Referências'].forEach((t, i) => {
      const a = (Math.PI / 2) * i - Math.PI / 4
      const filho = criarItem('nota', Math.cos(a) * 340, Math.sin(a) * 240, { texto: t, cor: 'amarelo' }, 2)
      itens.push(filho)
      ligacoes.push({ id: novoId(), de: centro.id, para: filho.id })
    })
  } else {
    itens.push(criarItem('nota', 0, 0, { texto: 'Dê dois cliques no quadro para criar uma nota' }))
  }
  return { itens, ligacoes }
}

const cacheUrl = new Map<string, { url: string; expira: number }>()
/** URL assinada temporária para imagens do quadro (buckets privados). */
export function useUrl(path?: string, bucket = BUCKET) {
  const chave = `${bucket}/${path}`
  const [url, setUrl] = useState<string | null>(() => {
    const c = path ? cacheUrl.get(chave) : undefined
    return c && c.expira > Date.now() ? c.url : null
  })
  useEffect(() => {
    if (!path) return setUrl(null)
    const c = cacheUrl.get(chave)
    if (c && c.expira > Date.now()) return setUrl(c.url)
    let vivo = true
    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!vivo || !data?.signedUrl) return
        cacheUrl.set(chave, { url: data.signedUrl, expira: Date.now() + 55 * 60_000 })
        setUrl(data.signedUrl)
      })
    return () => {
      vivo = false
    }
  }, [path, bucket, chave])
  return url
}

/** Comprime (mantendo PNG transparente como JPEG de boa qualidade) e envia para a pasta do usuário. */
export async function enviarImagem(projetoId: string, arquivo: Blob): Promise<{ path: string; w: number; h: number }> {
  const { data } = await supabase.auth.getUser()
  const uid = data.user?.id
  if (!uid) throw new Error('Sessão expirada. Entre de novo.')
  const blob = arquivo.type === 'image/gif' ? arquivo : await comprimirImagem(arquivo as File, 1600, 0.85)
  const ext = blob.type === 'image/gif' ? 'gif' : 'jpg'
  const path = `${uid}/${projetoId}/${novoId()}.${ext}`
  const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || 'image/jpeg' })
  if (up.error) throw up.error
  const dims = await new Promise<{ w: number; h: number }>((ok) => {
    const img = new Image()
    const u = URL.createObjectURL(blob)
    img.onload = () => {
      ok({ w: img.naturalWidth, h: img.naturalHeight })
      URL.revokeObjectURL(u)
    }
    img.onerror = () => ok({ w: 4, h: 3 })
    img.src = u
  })
  return { path, ...dims }
}

export async function apagarImagens(paths: string[]) {
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
}

export const dominio = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
export const pareceUrl = (t: string) => /^https?:\/\/\S+$/i.test(t.trim())
