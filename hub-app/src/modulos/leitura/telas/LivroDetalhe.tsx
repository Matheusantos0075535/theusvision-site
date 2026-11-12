import { ArrowLeft, Pencil, Star, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BarraProgresso } from '../../../components/compartilhado/BarraProgresso'
import { Carregando } from '../../../components/compartilhado/ShellModulo'
import { TrilhaVertical } from '../../../components/compartilhado/TrilhaVertical'
import { useToast } from '../../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { diferencaDias, formatarDataLonga, somarDias } from '../../../lib/tempo'
import { Capa, esquecerCapa } from '../Capa'
import { divisoes, pct, ROTULO_ESTADO, useLeitura, type Capitulo, type EstadoLivro } from '../dados'

type SessaoResumo = { dia: string; paginas: number }

export function LivroDetalhe({ aoRegistrar }: { aoRegistrar: (livroId: string) => void }) {
  const { id = '' } = useParams()
  const { livros, estado, recarregar } = useLeitura()
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const livro = livros?.find((l) => l.id === id)
  const [caps, setCaps] = useState<Capitulo[] | null>(null)
  const [sessoes, setSessoes] = useState<SessaoResumo[]>([])
  const [fixadas, setFixadas] = useState<Set<string>>(new Set())

  const carregar = useCallback(async () => {
    const [c, s, f] = await Promise.all([
      supabase.from('leit_capitulos').select('*').eq('livro_id', id).order('ordem'),
      supabase.from('leit_sessoes').select('dia, paginas').eq('livro_id', id).order('dia'),
      supabase.from('leit_fixacao').select('capitulo_id, parte').eq('livro_id', id),
    ])
    setCaps((c.data ?? []) as Capitulo[])
    setSessoes((s.data ?? []) as SessaoResumo[])
    setFixadas(new Set((f.data ?? []).map((x) => x.capitulo_id ?? `parte-${x.parte}`)))
  }, [id])

  useEffect(() => {
    void carregar()
  }, [carregar, livro?.pagina_atual])

  if (!livros) return <Carregando />
  if (!livro) {
    return (
      <p className="vazio">
        Livro não encontrado. <Link to="/leitura/biblioteca">Voltar para a estante</Link>
      </p>
    )
  }
  if (!caps) return <Carregando />

  // Ritmo real: páginas nos últimos 21 dias com leitura deste livro.
  const hoje = estado?.hoje ?? ''
  const recentes = sessoes.filter((s) => s.dia >= somarDias(hoje, -20))
  const paginasRecentes = recentes.reduce((a, s) => a + s.paginas, 0)
  const diasJanela = recentes.length ? Math.max(1, diferencaDias(hoje, recentes[0].dia) + 1) : 0
  const ritmo = diasJanela ? paginasRecentes / diasJanela : 0
  const restantes = livro.total_paginas - livro.pagina_atual
  const previsao = ritmo > 0 && restantes > 0 ? somarDias(hoje, Math.ceil(restantes / ritmo)) : null

  const partes = divisoes(livro, caps)
  const itens = partes.map((p) => ({
    id: p.id,
    rotulo: p.rotulo,
    estado:
      p.fim <= livro.pagina_atual
        ? ('feita' as const)
        : p.inicio <= Math.max(1, livro.pagina_atual + 1)
          ? ('disponivel' as const)
          : ('bloqueada' as const),
    dica: `começa na pág. ${p.inicio}`,
  }))
  const atualId = itens.find((i) => i.estado === 'disponivel')?.id

  async function mudarEstado(e: EstadoLivro) {
    const { error } = await supabase.from('leit_livros').update({ estado: e }).eq('id', livro!.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    void recarregar()
  }

  async function excluir() {
    if (sessoes.length) {
      mostrar('Este livro tem sessões registradas. Para tirar da frente, pause o livro.', { comNav: true })
      return
    }
    if (!window.confirm(`Excluir "${livro!.titulo}" da estante?`)) return
    const { error } = await supabase.from('leit_livros').delete().eq('id', livro!.id)
    if (error) return mostrar(mensagemDeErroBanco(error), { comNav: true })
    if (livro!.capa_path) {
      await supabase.storage.from('leit-capas').remove([livro!.capa_path])
      esquecerCapa(livro!.capa_path)
    }
    await recarregar()
    navegar('/leitura/biblioteca', { replace: true })
  }

  return (
    <div className="le-livro">
      <Link to="/leitura/biblioteca" className="link-voltar">
        <ArrowLeft aria-hidden />
        Estante
      </Link>
      <div className="le-livro-topo">
        <Capa titulo={livro.titulo} autor={livro.autor} path={livro.capa_path} tamanho="grande" />
        <div className="le-livro-info">
          <span className="olho">{ROTULO_ESTADO[livro.estado]}</span>
          <h2>{livro.titulo}</h2>
          {livro.autor && <p className="le-livro-autor">{livro.autor}</p>}
          <BarraProgresso fracao={livro.pagina_atual / livro.total_paginas} rotulo="Progresso do livro" />
          <p className="le-livro-pag">
            pág. {livro.pagina_atual} de {livro.total_paginas} · <b>{pct(livro)}%</b>
          </p>
          {livro.estado !== 'concluido' && (
            <p className="le-livro-prev">
              {previsao
                ? `No seu ritmo (${ritmo.toFixed(ritmo < 10 ? 1 : 0)} pág./dia), termina por volta de ${formatarDataLonga(previsao)}.`
                : 'A previsão de término aparece depois das primeiras sessões.'}
            </p>
          )}
        </div>
      </div>

      {livro.estado === 'concluido' ? (
        <div className="le-final">
          <div className="le-final-nota" aria-label={`Nota ${livro.nota_final ?? 0} de 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} aria-hidden data-ativo={livro.nota_final && n <= livro.nota_final ? true : undefined} />
            ))}
          </div>
          {livro.resumo_final && <p>“{livro.resumo_final}”</p>}
          {livro.concluido_em && <small>Concluído em {formatarDataLonga(livro.concluido_em)}</small>}
        </div>
      ) : (
        <div className="le-livro-acoes">
          <button className="btn btn-verde btn-grande" onClick={() => aoRegistrar(livro.id)}>
            Registrar leitura
          </button>
          <div className="le-filtros" role="radiogroup" aria-label="Estado do livro">
            {(['lendo', 'pausado', 'quero_ler'] as EstadoLivro[]).map((e) => (
              <button key={e} role="radio" aria-checked={livro.estado === e} onClick={() => void mudarEstado(e)}>
                {ROTULO_ESTADO[e]}
              </button>
            ))}
          </div>
        </div>
      )}

      <section className="le-livro-trilha">
        <h3>Trilha do livro</h3>
        <TrilhaVertical
          secoes={[
            {
              id: livro.id,
              titulo: caps.length ? `${caps.length} capítulos` : 'Partes de 10%',
              subtitulo: `${itens.filter((i) => i.estado === 'feita').length} de ${itens.length} concluídos`,
              estado: livro.estado === 'concluido' ? 'concluida' : 'atual',
              itens: itens.map((i) => ({ ...i, rotulo: fixadas.has(i.id) ? `${i.rotulo} ✎` : i.rotulo })),
            },
          ]}
          destaqueId={atualId}
          rolarParaAtual={false}
          aoEscolher={(item) =>
            mostrar(
              item.estado === 'feita'
                ? fixadas.has(item.id)
                  ? 'Concluído. Sua resposta está em Meu caderno.'
                  : 'Concluído.'
                : item.estado === 'disponivel'
                  ? 'Você está aqui. Registre a leitura para avançar.'
                  : `Esse trecho ${item.dica}.`,
              { comNav: true },
            )
          }
        />
      </section>

      <div className="le-livro-rodape">
        <Link to={`/leitura/livro/${livro.id}/editar`} className="btn btn-secundario">
          <Pencil aria-hidden />
          Editar
        </Link>
        <button className="btn btn-fantasma" onClick={() => void excluir()}>
          <Trash2 aria-hidden />
          Excluir
        </button>
      </div>
    </div>
  )
}
