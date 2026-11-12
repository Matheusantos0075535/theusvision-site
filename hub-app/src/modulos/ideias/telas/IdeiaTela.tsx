import { ArrowDown, ArrowUp, Archive, Check, ExternalLink, Eye, EyeOff, Plus, Star, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type TextareaHTMLAttributes } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Confete } from '../../../components/compartilhado/Confete'
import { useToast } from '../../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { formatarDataLonga } from '../../../lib/tempo'
import { useMovimentoReduzido } from '../../../lib/useMidia'
import { AREAS, STATUS, useIdeias, type Etapa } from '../dados'
import { dominio, embedDoLink, normalizarLink } from '../link'
import { ImagemIdeia, apagarImagem, enviarImagem } from '../imagem'
import { IconeLink, SeloData } from '../Selos'
import { tocar } from '../../../lib/som'

function Campo({ valor, aoSalvar, ...props }: { valor: string; aoSalvar: (v: string) => void } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [v, setV] = useState(valor)
  useEffect(() => setV(valor), [valor])
  return <textarea {...props} className="entrada" value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== valor && aoSalvar(v)} />
}

export function IdeiaTela() {
  const { id = '' } = useParams()
  const { ideias, atualizar, recarregar } = useIdeias()
  const { mostrar } = useToast()
  const navegar = useNavigate()
  const reduzido = useMovimentoReduzido()
  const i = ideias.find((x) => x.id === id)
  const [titulo, setTitulo] = useState(i?.titulo ?? '')
  const [link, setLink] = useState(i?.link ?? '')
  const [previa, setPrevia] = useState(false)
  const [nova, setNova] = useState('')
  const [festa, setFesta] = useState(false)
  const novaRef = useRef<HTMLInputElement>(null)
  const arquivoRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    setTitulo(i?.titulo ?? '')
    setLink(i?.link ?? '')
  }, [i?.titulo, i?.link])

  if (!i) {
    return (
      <div className="bloco-erro">
        <p>Essa ideia não foi encontrada.</p>
        <Link className="btn btn-secundario" to="/ideias">
          Voltar
        </Link>
      </div>
    )
  }

  const salvar = async (campos: Parameters<typeof atualizar>[1]) => {
    const e = await atualizar(i.id, campos)
    if (e) mostrar(e, { comNav: true })
  }

  async function trocarImagem(f: File | undefined) {
    if (!f) return
    if (!f.type.startsWith('image/')) return mostrar('Escolha um arquivo de imagem.', { comNav: true })
    setEnviando(true)
    try {
      const antigo = i!.imagem_path
      const caminho = await enviarImagem(i!.id, f)
      const e = await atualizar(i!.id, { imagem_path: caminho })
      if (e) {
        await apagarImagem(caminho)
        mostrar(e, { comNav: true })
      } else await apagarImagem(antigo)
    } catch (err) {
      mostrar(mensagemDeErroBanco(err as Parameters<typeof mensagemDeErroBanco>[0]), { comNav: true })
    }
    setEnviando(false)
  }

  async function tirarImagem() {
    const antigo = i!.imagem_path
    const e = await atualizar(i!.id, { imagem_path: null })
    if (e) return mostrar(e, { comNav: true })
    await apagarImagem(antigo)
  }

  async function addEtapa() {
    const t = nova.trim()
    if (!t) return
    setNova('')
    const ordem = Math.max(0, ...i!.etapas.map((x) => x.ordem)) + 1
    const { error } = await supabase.from('ideias_etapas').insert({ ideia_id: i!.id, texto: t, ordem })
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    if (i!.status === 'ideia') await atualizar(i!.id, { status: 'planejando' })
    await recarregar()
    novaRef.current?.focus()
  }

  async function marcar(e: Etapa) {
    const { error } = await supabase.from('ideias_etapas').update({ feita: !e.feita }).eq('id', e.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    const resto = i!.etapas.filter((x) => x.id !== e.id && !x.feita).length
    if (!e.feita && resto === 0 && i!.etapas.length > 1) {
      await atualizar(i!.id, { status: 'feita' })
      tocar('conquista')
      if (!reduzido) setFesta(true)
      mostrar('Todas as etapas feitas. Ideia executada!', { comNav: true })
      window.setTimeout(() => setFesta(false), 2600)
    } else if (!e.feita && i!.status !== 'executando' && i!.status !== 'feita') {
      await atualizar(i!.id, { status: 'executando' })
    }
    await recarregar()
  }

  async function mover(idx: number, d: -1 | 1) {
    const a = i!.etapas[idx]
    const b = i!.etapas[idx + d]
    if (!a || !b) return
    await supabase.from('ideias_etapas').update({ ordem: b.ordem === a.ordem ? a.ordem + d : b.ordem }).eq('id', a.id)
    await supabase.from('ideias_etapas').update({ ordem: a.ordem }).eq('id', b.id)
    await recarregar()
  }

  async function apagarEtapa(e: Etapa) {
    const { error } = await supabase.from('ideias_etapas').delete().eq('id', e.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await recarregar()
  }

  async function apagar() {
    if (!window.confirm('Apagar esta ideia de vez? (Arquivar guarda ela fora da lista.)')) return
    const { error } = await supabase.from('ideias').delete().eq('id', i!.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    await apagarImagem(i!.imagem_path)
    await recarregar()
    navegar('/ideias')
  }

  const feitas = i.etapas.filter((e) => e.feita).length
  const embed = i.link ? embedDoLink(i.link) : null

  return (
    <div className="id-ideia">
      <section className="id-ideia-topo">
        <div className="id-ideia-linha">
          <Link to="/ideias" className="btn-link">
            ‹ Ideias
          </Link>
          <button className="id-estrela id-estrela-grande" aria-pressed={i.favorita} aria-label={i.favorita ? 'Tirar dos favoritos' : 'Favoritar'} onClick={() => void salvar({ favorita: !i.favorita })}>
            <Star aria-hidden />
          </button>
        </div>
        <textarea
          className="id-titulo"
          rows={2}
          value={titulo}
          maxLength={140}
          aria-label="Nome da ideia"
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={() => titulo.trim() && titulo !== i.titulo && void salvar({ titulo: titulo.trim() })}
        />
        <small className="id-criada">Guardada em {formatarDataLonga(i.criado_em.slice(0, 10))}</small>
        <div className="id-passos" role="group" aria-label="Etapa da ideia">
          {STATUS.slice(0, 4).map((s, k) => {
            const atual = STATUS.findIndex((x) => x.id === i.status)
            return (
              <button key={s.id} className="id-passo" data-feito={k < atual || undefined} aria-pressed={i.status === s.id} onClick={() => void salvar({ status: s.id })}>
                <i aria-hidden>{k < atual ? <Check /> : k + 1}</i>
                <span>{s.rotulo}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="id-bloco">
        <h3>Imagem</h3>
        <input ref={arquivoRef} type="file" accept="image/*" hidden onChange={(e) => {
          void trocarImagem(e.target.files?.[0])
          e.target.value = ''
        }} />
        {i.imagem_path ? (
          <>
            <ImagemIdeia path={i.imagem_path} titulo={i.titulo} />
            <div className="dia-prio-botoes" style={{ justifyContent: 'flex-start' }}>
              <button className="btn btn-secundario" onClick={() => arquivoRef.current?.click()} disabled={enviando}>
                {enviando ? 'Enviando…' : 'Trocar imagem'}
              </button>
              <button className="btn btn-fantasma" onClick={() => void tirarImagem()} disabled={enviando}>
                Tirar
              </button>
            </div>
          </>
        ) : (
          <ImagemIdeia path={null} titulo={i.titulo} aoClicar={() => !enviando && arquivoRef.current?.click()} />
        )}
      </section>

      <section className="id-bloco">
        <h3>Referência</h3>
        {i.link ? (
          <div className="id-ref">
            <a className="id-ref-link" href={i.link} target="_blank" rel="noopener noreferrer">
              <IconeLink url={i.link} />
              <span>{dominio(i.link)}</span>
              <ExternalLink aria-hidden />
            </a>
            {embed && (
              <button className="btn btn-secundario" onClick={() => setPrevia((p) => !p)}>
                {previa ? <EyeOff aria-hidden /> : <Eye aria-hidden />} {previa ? 'Esconder prévia' : 'Ver prévia aqui'}
              </button>
            )}
            {previa && embed && (
              <div className="id-embed" data-tipo={embed.includes('instagram') ? 'instagram' : 'video'}>
                <iframe src={embed} title="Prévia do link" loading="lazy" allow="encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" />
              </div>
            )}
          </div>
        ) : (
          <p className="dia-apoio">Sem link ainda. Cole abaixo um reel, vídeo ou site que inspirou a ideia.</p>
        )}
        <input
          className="entrada"
          inputMode="url"
          value={link}
          placeholder="Colar link (Instagram, YouTube, site)"
          aria-label="Link de referência"
          onChange={(e) => setLink(e.target.value)}
          onBlur={() => {
            const l = normalizarLink(link)
            if (l !== (i.link ?? '')) void salvar({ link: l || null })
          }}
        />
      </section>

      <section className="id-bloco">
        <h3>Propósito</h3>
        <Campo rows={3} maxLength={1000} valor={i.proposito ?? ''} placeholder="Por que essa ideia importa? O que ela vai gerar?" aoSalvar={(v) => void salvar({ proposito: v.trim() || null })} />
        <div className="id-duas">
          <label className="campo">
            <span>Quero executar em</span>
            <input className="entrada" type="date" value={i.executar_em ?? ''} onChange={(e) => void salvar({ executar_em: e.target.value || null })} />
          </label>
          <label className="campo">
            <span>Área</span>
            <select className="entrada" value={i.area ?? ''} onChange={(e) => void salvar({ area: (e.target.value || null) as typeof i.area })}>
              <option value="">Sem área</option>
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.rotulo}
                </option>
              ))}
            </select>
          </label>
        </div>
        {i.executar_em && <SeloData dia={i.executar_em} feita={i.status === 'feita'} />}
      </section>

      <section className="id-bloco">
        <h3>
          Plano de ação {i.etapas.length > 0 && <small>{feitas} de {i.etapas.length}</small>}
        </h3>
        {i.etapas.length > 0 && (
          <span className="id-barra id-barra-grande" aria-hidden>
            <i style={{ width: `${(feitas / i.etapas.length) * 100}%` }} />
          </span>
        )}
        <ol className="id-etapas">
          {i.etapas.map((e, k) => (
            <li key={e.id} data-feita={e.feita || undefined}>
              <button className="dia-prio-marca" aria-pressed={e.feita} aria-label={e.feita ? `Desmarcar ${e.texto}` : `Concluir ${e.texto}`} onClick={() => void marcar(e)}>
                <span className="dia-caixa" aria-hidden>
                  <Check />
                </span>
              </button>
              <span className="id-etapa-texto">{e.texto}</span>
              <span className="id-etapa-acoes">
                <button className="btn-icone" disabled={k === 0} onClick={() => void mover(k, -1)} aria-label="Subir etapa">
                  <ArrowUp aria-hidden />
                </button>
                <button className="btn-icone" disabled={k === i.etapas.length - 1} onClick={() => void mover(k, 1)} aria-label="Descer etapa">
                  <ArrowDown aria-hidden />
                </button>
                <button className="btn-icone" onClick={() => void apagarEtapa(e)} aria-label="Apagar etapa">
                  <X aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ol>
        <form
          className="dep-novo"
          onSubmit={(ev) => {
            ev.preventDefault()
            void addEtapa()
          }}
        >
          <input ref={novaRef} className="entrada" maxLength={200} value={nova} onChange={(e) => setNova(e.target.value)} placeholder={i.etapas.length ? 'Próxima etapa' : 'Primeira etapa (ex.: escrever o roteiro)'} aria-label="Nova etapa" />
          <button className="btn btn-secundario" disabled={!nova.trim()}>
            <Plus aria-hidden />
          </button>
        </form>
      </section>

      <section className="id-bloco">
        <h3>Anotações</h3>
        <Campo rows={4} maxLength={4000} valor={i.notas ?? ''} placeholder="Rascunhos, referências, o que vier na cabeça." aoSalvar={(v) => void salvar({ notas: v.trim() || null })} />
      </section>

      <div className="dia-prio-botoes id-rodape">
        <button className="btn btn-fantasma" onClick={() => void salvar({ status: i.status === 'arquivada' ? 'ideia' : 'arquivada' })}>
          <Archive aria-hidden /> {i.status === 'arquivada' ? 'Desarquivar' : 'Arquivar'}
        </button>
        <button className="btn btn-fantasma id-apagar" onClick={() => void apagar()}>
          <Trash2 aria-hidden /> Apagar
        </button>
      </div>
      {festa && <Confete />}
    </div>
  )
}
