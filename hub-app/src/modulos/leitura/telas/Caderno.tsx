import { Download, Lightbulb, MessageCircleQuestion, Quote, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Carregando, ErroCarregar } from '../../../components/compartilhado/ShellModulo'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { formatarDataCurta } from '../../../lib/tempo'
import { useLeitura } from '../dados'

type Nota = { tipo: 'frase' | 'trecho' | 'fixacao'; livro_id: string; texto: string; detalhe: string; quando: string }

const ICONE = { frase: Lightbulb, trecho: Quote, fixacao: MessageCircleQuestion }
const ROTULO = { frase: 'Frase marcante', trecho: 'Trecho favorito', fixacao: 'Fixação' }

function normalizar(t: string) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function Caderno() {
  const { livros } = useLeitura()
  const [notas, setNotas] = useState<Nota[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const carregar = useCallback(async () => {
    setErro(null)
    const [s, t, f] = await Promise.all([
      supabase.from('leit_sessoes').select('livro_id, aprendizado, dia, pagina_fim').not('aprendizado', 'is', null),
      supabase.from('leit_trechos').select('livro_id, citacao, pagina, criado_em'),
      supabase.from('leit_fixacao').select('livro_id, rotulo, resposta, criado_em'),
    ])
    if (s.error || t.error || f.error) return setErro(mensagemDeErroBanco(s.error ?? t.error ?? f.error))
    setNotas([
      ...(s.data ?? []).map((x) => ({
        tipo: 'frase' as const,
        livro_id: x.livro_id,
        texto: x.aprendizado as string,
        detalhe: x.pagina_fim ? `até a pág. ${x.pagina_fim}` : '',
        quando: x.dia,
      })),
      ...(t.data ?? []).map((x) => ({
        tipo: 'trecho' as const,
        livro_id: x.livro_id,
        texto: x.citacao,
        detalhe: x.pagina ? `pág. ${x.pagina}` : '',
        quando: x.criado_em.slice(0, 10),
      })),
      ...(f.data ?? []).map((x) => ({
        tipo: 'fixacao' as const,
        livro_id: x.livro_id,
        texto: x.resposta,
        detalhe: x.rotulo,
        quando: x.criado_em.slice(0, 10),
      })),
    ])
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const grupos = useMemo(() => {
    if (!notas || !livros) return []
    const q = normalizar(busca.trim())
    const titulo = (id: string) => livros.find((l) => l.id === id)?.titulo ?? 'Livro'
    const filtradas = notas.filter(
      (n) => !q || normalizar(`${n.texto} ${n.detalhe} ${titulo(n.livro_id)}`).includes(q),
    )
    const mapa = new Map<string, Nota[]>()
    filtradas
      .sort((a, b) => b.quando.localeCompare(a.quando))
      .forEach((n) => mapa.set(n.livro_id, [...(mapa.get(n.livro_id) ?? []), n]))
    return [...mapa.entries()].map(([id, itens]) => ({ id, titulo: titulo(id), autor: livros.find((l) => l.id === id)?.autor, itens }))
  }, [notas, livros, busca])

  function exportar() {
    const linhas: string[] = ['MEU CADERNO DE LEITURA', '']
    grupos.forEach((g) => {
      linhas.push(`${g.titulo}${g.autor ? ` — ${g.autor}` : ''}`, '-'.repeat(40))
      g.itens.forEach((n) => linhas.push(`[${ROTULO[n.tipo]}${n.detalhe ? ` · ${n.detalhe}` : ''}] ${n.texto}`))
      linhas.push('')
    })
    const blob = new Blob([linhas.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'meu-caderno-de-leitura.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (erro) return <ErroCarregar mensagem={erro} tentar={carregar} />
  if (!notas) return <Carregando />

  return (
    <div className="le-caderno">
      <div className="le-busca">
        <Search aria-hidden />
        <input
          className="entrada"
          type="search"
          placeholder="Buscar no caderno"
          aria-label="Buscar no caderno"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      {notas.length > 0 && (
        <button className="btn btn-fantasma le-exportar" onClick={exportar} disabled={!grupos.length}>
          <Download aria-hidden />
          Exportar em texto
        </button>
      )}
      {grupos.length === 0 ? (
        <p className="vazio">
          {notas.length
            ? 'Nada encontrado com essa busca.'
            : 'Seu caderno ainda está vazio. Frases, trechos e respostas de fixação das suas sessões aparecem aqui.'}
        </p>
      ) : (
        grupos.map((g) => (
          <section key={g.id} className="le-caderno-livro">
            <h3>{g.titulo}</h3>
            {g.autor && <small>{g.autor}</small>}
            <ul>
              {g.itens.map((n, i) => {
                const Icone = ICONE[n.tipo]
                return (
                  <li key={i} data-tipo={n.tipo}>
                    <span className="le-nota-tipo">
                      <Icone aria-hidden />
                      {ROTULO[n.tipo]}
                      {n.detalhe && <em> · {n.detalhe}</em>}
                    </span>
                    <p>{n.tipo === 'trecho' ? `“${n.texto}”` : n.texto}</p>
                    <small>{formatarDataCurta(n.quando)}</small>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
