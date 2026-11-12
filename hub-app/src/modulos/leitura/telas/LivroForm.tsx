import { ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Carregando } from '../../../components/compartilhado/ShellModulo'
import { useToast } from '../../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { comprimirImagem } from '../../../lib/imagem'
import { supabase } from '../../../lib/supabase'
import { Capa, esquecerCapa } from '../Capa'
import { ROTULO_ESTADO, useLeitura, type Capitulo, type EstadoLivro } from '../dados'

type CapForm = { id?: string; nome: string; pagina: string }

export function LivroForm() {
  const { id } = useParams()
  const editando = Boolean(id)
  const { livros, recarregar } = useLeitura()
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const original = livros?.find((l) => l.id === id)

  const [titulo, setTitulo] = useState('')
  const [autor, setAutor] = useState('')
  const [paginas, setPaginas] = useState('')
  const [estado, setEstado] = useState<EstadoLivro>('lendo')
  const [arquivo, setArquivo] = useState<Blob | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [removerCapa, setRemoverCapa] = useState(false)
  const [caps, setCaps] = useState<CapForm[]>([])
  const [capsOriginais, setCapsOriginais] = useState<Capitulo[]>([])
  const [carregado, setCarregado] = useState(!editando)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!editando || !original) return
    setTitulo(original.titulo)
    setAutor(original.autor ?? '')
    setPaginas(String(original.total_paginas))
    setEstado(original.estado)
    supabase
      .from('leit_capitulos')
      .select('*')
      .eq('livro_id', original.id)
      .order('ordem')
      .then(({ data }) => {
        const lista = (data ?? []) as Capitulo[]
        setCapsOriginais(lista)
        setCaps(lista.map((c) => ({ id: c.id, nome: c.nome, pagina: String(c.pagina_inicial) })))
        setCarregado(true)
      })
  }, [editando, original])

  useEffect(() => () => void (previa && URL.revokeObjectURL(previa)), [previa])

  if (editando && (!original || !carregado)) return <Carregando />

  async function escolherCapa(f: File | undefined) {
    if (!f) return
    try {
      const blob = await comprimirImagem(f)
      setArquivo(blob)
      setPrevia(URL.createObjectURL(blob))
      setRemoverCapa(false)
    } catch {
      mostrar('Não foi possível ler essa imagem. Tente outra.', { comNav: true })
    }
  }

  async function salvar(ev: FormEvent) {
    ev.preventDefault()
    setErro(null)
    const total = Number(paginas)
    if (!titulo.trim()) return setErro('Informe o título.')
    if (!Number.isInteger(total) || total < 1 || total > 20000) return setErro('Informe o total de páginas (1 a 20.000).')
    if (original && total < original.pagina_atual) {
      return setErro(`Você já está na página ${original.pagina_atual}. O total não pode ser menor que isso.`)
    }
    const capsValidos = caps.filter((c) => c.nome.trim())
    for (const c of capsValidos) {
      const p = Number(c.pagina)
      if (!Number.isInteger(p) || p < 1 || p > total) return setErro(`A página inicial de "${c.nome}" precisa estar entre 1 e ${total}.`)
    }

    setSalvando(true)
    const { data: usuario } = await supabase.auth.getUser()
    const uid = usuario.user?.id
    let livroId = original?.id
    const campos = { titulo: titulo.trim(), autor: autor.trim() || null, total_paginas: total, estado }

    if (livroId) {
      const { error } = await supabase.from('leit_livros').update(campos).eq('id', livroId)
      if (error) return falhar(error)
    } else {
      const { data, error } = await supabase.from('leit_livros').insert(campos).select('id').single()
      if (error) return falhar(error)
      livroId = data.id
    }

    // Capa: só no bucket privado, na pasta do próprio usuário.
    if (arquivo && uid && livroId) {
      const caminho = `${uid}/${livroId}.jpg`
      const up = await supabase.storage.from('leit-capas').upload(caminho, arquivo, { upsert: true, contentType: 'image/jpeg' })
      if (up.error) return falhar(up.error)
      esquecerCapa(caminho)
      await supabase.from('leit_livros').update({ capa_path: caminho }).eq('id', livroId)
    } else if (removerCapa && original?.capa_path) {
      await supabase.storage.from('leit-capas').remove([original.capa_path])
      esquecerCapa(original.capa_path)
      await supabase.from('leit_livros').update({ capa_path: null }).eq('id', livroId)
    }

    // Capítulos: atualiza os que ficaram, cria os novos e apaga os removidos.
    const ficaram = new Set(capsValidos.filter((c) => c.id).map((c) => c.id))
    const apagar = capsOriginais.filter((c) => !ficaram.has(c.id)).map((c) => c.id)
    if (apagar.length) {
      const { error } = await supabase.from('leit_capitulos').delete().in('id', apagar)
      if (error) return falhar(error)
    }
    for (const [i, c] of capsValidos.entries()) {
      const linha = { ordem: i + 1, nome: c.nome.trim(), pagina_inicial: Number(c.pagina) }
      const { error } = c.id
        ? await supabase.from('leit_capitulos').update(linha).eq('id', c.id)
        : await supabase.from('leit_capitulos').insert({ ...linha, livro_id: livroId })
      if (error) return falhar(error)
    }

    setSalvando(false)
    await recarregar()
    mostrar(editando ? 'Livro atualizado.' : 'Livro adicionado à estante.', { comNav: true })
    navegar(`/leitura/livro/${livroId}`, { replace: true })
  }

  function falhar(e: { message?: string }) {
    setSalvando(false)
    setErro(mensagemDeErroBanco(e))
  }

  return (
    <form className="le-form" onSubmit={salvar}>
      <h2>{editando ? 'Editar livro' : 'Adicionar livro'}</h2>

      <div className="le-form-capa">
        <Capa titulo={titulo || 'Título'} autor={autor} path={removerCapa ? null : original?.capa_path ?? null} previaLocal={previa} tamanho="media" />
        <div className="le-form-capa-acoes">
          <label className="btn btn-secundario">
            <ImagePlus aria-hidden />
            {previa || (original?.capa_path && !removerCapa) ? 'Trocar capa' : 'Enviar capa'}
            <input type="file" accept="image/*" className="so-leitor" onChange={(e) => void escolherCapa(e.target.files?.[0])} />
          </label>
          {(previa || (original?.capa_path && !removerCapa)) && (
            <button
              type="button"
              className="btn btn-fantasma"
              onClick={() => {
                setArquivo(null)
                setPrevia(null)
                setRemoverCapa(true)
              }}
            >
              <X aria-hidden />
              Usar capa tipográfica
            </button>
          )}
          <small>Sem imagem, criamos uma capa tipográfica com o título.</small>
        </div>
      </div>

      <label className="campo">
        <span>Título</span>
        <input className="entrada" value={titulo} maxLength={200} onChange={(e) => setTitulo(e.target.value)} required />
      </label>
      <label className="campo">
        <span>Autor</span>
        <input className="entrada" value={autor} maxLength={120} onChange={(e) => setAutor(e.target.value)} />
      </label>
      <label className="campo">
        <span>Total de páginas</span>
        <input
          className="entrada"
          inputMode="numeric"
          value={paginas}
          onChange={(e) => setPaginas(e.target.value.replace(/\D/g, '').slice(0, 5))}
          required
        />
      </label>
      <div className="campo">
        <span>Estado</span>
        <div className="le-filtros" role="radiogroup" aria-label="Estado do livro">
          {(['lendo', 'quero_ler', 'pausado'] as EstadoLivro[]).map((e) => (
            <button type="button" key={e} role="radio" aria-checked={estado === e} onClick={() => setEstado(e)}>
              {ROTULO_ESTADO[e]}
            </button>
          ))}
          {original?.estado === 'concluido' && (
            <button type="button" role="radio" aria-checked={estado === 'concluido'} onClick={() => setEstado('concluido')}>
              {ROTULO_ESTADO.concluido}
            </button>
          )}
        </div>
      </div>

      <fieldset className="le-caps">
        <legend>
          Capítulos <small>opcional</small>
        </legend>
        <p className="le-caps-apoio">Sem capítulos, a trilha divide o livro em partes de 10%.</p>
        {caps.map((c, i) => (
          <div className="le-cap-linha" key={c.id ?? `novo-${i}`}>
            <input
              className="entrada"
              aria-label={`Nome do capítulo ${i + 1}`}
              placeholder={`Capítulo ${i + 1}`}
              value={c.nome}
              maxLength={120}
              onChange={(e) => setCaps((l) => l.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))}
            />
            <input
              className="entrada le-cap-pag"
              aria-label={`Página inicial do capítulo ${i + 1}`}
              placeholder="pág."
              inputMode="numeric"
              value={c.pagina}
              onChange={(e) =>
                setCaps((l) => l.map((x, j) => (j === i ? { ...x, pagina: e.target.value.replace(/\D/g, '').slice(0, 5) } : x)))
              }
            />
            <button
              type="button"
              className="fluxo-icone"
              aria-label={`Remover capítulo ${i + 1}`}
              onClick={() => setCaps((l) => l.filter((_, j) => j !== i))}
            >
              <Trash2 aria-hidden />
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-fantasma" onClick={() => setCaps((l) => [...l, { nome: '', pagina: '' }])}>
          <Plus aria-hidden />
          Adicionar capítulo
        </button>
      </fieldset>

      {erro && (
        <div className="aviso aviso-erro" role="alert">
          {erro}
        </div>
      )}
      <button className="btn btn-primario btn-grande" disabled={salvando}>
        {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Adicionar à estante'}
      </button>
      <button type="button" className="btn btn-fantasma" onClick={() => navegar(-1)}>
        Cancelar
      </button>
    </form>
  )
}
