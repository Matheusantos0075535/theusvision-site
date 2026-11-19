import { comprimirImagem } from '../lib/imagem'
import { supabase } from '../lib/supabase'
import { hojeBrasiliaIso, somarDias } from '../lib/tempo'

export type Tarefa = { id: string; texto: string; feita: boolean; levada: boolean }
export type Entrada = {
  id: string
  dia: string
  titulo: string | null
  texto: string
  humor: number | null
  etiquetas: string[]
  favorita: boolean
  tarefas: Tarefa[]
  criado_em: string
  atualizado_em: string
}
export type Anexo = { id: string; entrada_id: string; path: string; nome: string; tipo: string; tamanho: number }

export const CAMPOS = 'id, dia, titulo, texto, humor, etiquetas, favorita, tarefas, criado_em, atualizado_em'
export const BUCKET = 'diario'
export const LIMITE_ARQUIVO = 10 * 1024 * 1024
export const TIPOS_ARQUIVO = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

export const HUMORES = [
  { n: 1, emoji: '😞', rotulo: 'Pesado', cor: '#ff8f82' },
  { n: 2, emoji: '😕', rotulo: 'Meio ruim', cor: '#ffb347' },
  { n: 3, emoji: '😐', rotulo: 'Normal', cor: '#c4a6ff' },
  { n: 4, emoji: '🙂', rotulo: 'Bem', cor: '#7ab8ff' },
  { n: 5, emoji: '😄', rotulo: 'Ótimo', cor: '#3ddc97' },
]
export const humorDe = (n: number | null) => HUMORES.find((h) => h.n === n)

/** Pontos de partida para quando não sabe como começar a esvaziar a cabeça. */
export const GATILHOS = [
  'O que está ocupando minha cabeça agora:',
  'O que está me preocupando:',
  'O que eu preciso lembrar de fazer:',
  'O que eu estou sentindo:',
  'O que deu certo hoje:',
  'O que eu queria ter feito diferente:',
  'Uma ideia que não quero perder:',
]

export const novoId = () =>
  crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16))

export const palavras = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0)

export function entradaVazia(dia = hojeBrasiliaIso(), texto = ''): Entrada {
  const agora = new Date().toISOString()
  return { id: novoId(), dia, titulo: null, texto, humor: null, etiquetas: [], favorita: false, tarefas: [], criado_em: agora, atualizado_em: agora }
}

export const tituloOuInicio = (e: Pick<Entrada, 'titulo' | 'texto'>) => {
  if (e.titulo?.trim()) return e.titulo.trim()
  const linha = e.texto.split('\n').find((l) => l.trim())?.trim() ?? ''
  return linha ? (linha.length > 70 ? `${linha.slice(0, 70)}…` : linha) : 'Sem título'
}

export const hora = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(iso))

const DIA_LONGO = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
export const diaLongo = (iso: string) => DIA_LONGO.format(new Date(`${iso}T12:00:00Z`))
export const diaCurto = (iso: string) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`)).replace('.', '')

/** Dias seguidos escrevendo, terminando hoje (ou ontem, se hoje ainda não escreveu). */
export function sequenciaDeDias(dias: Iterable<string>, hoje = hojeBrasiliaIso()) {
  const s = new Set(dias)
  let n = 0
  let d = s.has(hoje) ? hoje : somarDias(hoje, -1)
  while (s.has(d)) {
    n++
    d = somarDias(d, -1)
  }
  return n
}

export const tamanhoLegivel = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`)

/** Envia imagem (comprimida) ou PDF para a pasta do usuário e registra o anexo. */
export async function enviarAnexo(entradaId: string, arquivo: File | Blob, nomeOriginal: string): Promise<Anexo> {
  const tipo = arquivo.type
  if (!TIPOS_ARQUIVO.includes(tipo)) throw new Error('Use imagem (JPG, PNG, WEBP, GIF) ou PDF.')
  const { data } = await supabase.auth.getUser()
  const uid = data.user?.id
  if (!uid) throw new Error('Sessão expirada. Entre de novo.')
  let blob: Blob = arquivo
  let tipoFinal = tipo
  if (tipo.startsWith('image/') && tipo !== 'image/gif') {
    blob = await comprimirImagem(arquivo as File, 1800, 0.85)
    tipoFinal = 'image/jpeg'
  }
  if (blob.size > LIMITE_ARQUIVO) throw new Error(`Arquivo grande demais (máximo ${tamanhoLegivel(LIMITE_ARQUIVO)}).`)
  const ext = tipoFinal === 'application/pdf' ? 'pdf' : tipoFinal === 'image/gif' ? 'gif' : 'jpg'
  const id = novoId()
  const path = `${uid}/${entradaId}/${id}.${ext}`
  const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: tipoFinal })
  if (up.error) throw up.error
  const nome = (nomeOriginal || `arquivo.${ext}`).slice(0, 200)
  const linha = { id, entrada_id: entradaId, path, nome, tipo: tipoFinal, tamanho: blob.size }
  const r = await supabase.from('diario_anexos').insert(linha)
  if (r.error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw r.error
  }
  return linha
}

export async function removerAnexo(a: Anexo) {
  const r = await supabase.from('diario_anexos').delete().eq('id', a.id)
  if (r.error) return r.error
  await supabase.storage.from(BUCKET).remove([a.path])
  return null
}

export async function abrirAnexo(a: Anexo) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(a.path, 600, { download: false })
  if (error || !data?.signedUrl) throw error ?? new Error('Não deu para abrir o arquivo.')
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}

/** Apaga a entrada e os arquivos dela. */
export async function apagarEntrada(id: string) {
  const { data } = await supabase.from('diario_anexos').select('path').eq('entrada_id', id)
  const r = await supabase.from('diario_entradas').delete().eq('id', id)
  if (r.error) return r.error
  const paths = ((data ?? []) as { path: string }[]).map((x) => x.path)
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
  return null
}

/** Cria uma prioridade no A fazer de hoje (primeiro número livre). Devolve a mensagem de erro ou null. */
export async function levarParaOAFazer(texto: string): Promise<string | null> {
  const hoje = hojeBrasiliaIso()
  const usadas = await supabase.from('dia_prioridades').select('ordem').eq('dia', hoje)
  if (usadas.error) return 'Não deu para abrir o A fazer agora.'
  const ocupadas = new Set((usadas.data as { ordem: number }[]).map((x) => x.ordem))
  let ordem = 0
  for (let n = 1; n <= 20; n++) {
    if (!ocupadas.has(n)) {
      ordem = n
      break
    }
  }
  if (!ordem) return 'O A fazer de hoje já está com 20 tarefas.'
  const r = await supabase.from('dia_prioridades').insert({ dia: hoje, ordem, titulo: texto.trim().slice(0, 160) })
  return r.error ? 'Não deu para levar para o A fazer. Tente de novo.' : null
}

export function paraMarkdown(entradas: Entrada[]) {
  const porDia = new Map<string, Entrada[]>()
  for (const e of [...entradas].sort((a, b) => a.dia.localeCompare(b.dia) || a.criado_em.localeCompare(b.criado_em))) porDia.set(e.dia, [...(porDia.get(e.dia) ?? []), e])
  const partes = ['# Meu diário\n']
  for (const [dia, lista] of porDia) {
    partes.push(`\n## ${diaLongo(dia)}\n`)
    for (const e of lista) {
      const h = humorDe(e.humor)
      partes.push(`\n### ${tituloOuInicio(e)} (${hora(e.criado_em)})${h ? ` ${h.emoji}` : ''}\n`)
      if (e.etiquetas.length) partes.push(`\nEtiquetas: ${e.etiquetas.map((t) => `#${t}`).join(' ')}\n`)
      if (e.texto.trim()) partes.push(`\n${e.texto.trim()}\n`)
      if (e.tarefas.length) partes.push(`\n${e.tarefas.map((t) => `- [${t.feita ? 'x' : ' '}] ${t.texto}`).join('\n')}\n`)
    }
  }
  return partes.join('')
}
