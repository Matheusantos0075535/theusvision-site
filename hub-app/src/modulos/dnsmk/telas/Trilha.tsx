import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Carregando, ErroCarregar } from '../../../components/compartilhado/ShellModulo'
import { TrilhaVertical, type SecaoTrilha } from '../../../components/compartilhado/TrilhaVertical'
import { useToast } from '../../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../../lib/erros'
import { supabase } from '../../../lib/supabase'
import { AVISO_EDUCATIVO, UNIDADES } from '../conteudo/textosSaude'
import { useDnsmk } from '../dados'

export function useLicoes() {
  const [dados, setDados] = useState<{ dias: Record<string, number>; feitas: Set<string> } | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const carregar = useCallback(async () => {
    setErro(null)
    const [cat, feitas] = await Promise.all([
      supabase.from('dnsmk_licoes_catalogo').select('id, dia'),
      supabase.from('dnsmk_licoes').select('licao_id'),
    ])
    if (cat.error || feitas.error) return setErro(mensagemDeErroBanco(cat.error ?? feitas.error))
    setDados({
      dias: Object.fromEntries((cat.data ?? []).map((c) => [c.id, c.dia])),
      feitas: new Set((feitas.data ?? []).map((f) => f.licao_id)),
    })
  }, [])
  useEffect(() => {
    void carregar()
  }, [carregar])
  return { dados, erro, carregar }
}

export function Trilha() {
  const { estado } = useDnsmk()
  const { dados, erro, carregar } = useLicoes()
  const navegar = useNavigate()
  const { mostrar } = useToast()

  if (erro) return <ErroCarregar mensagem={erro} tentar={carregar} />
  if (!dados || !estado) return <Carregando />
  if (!estado.tem_jornada) {
    return <p className="vazio">Comece sua jornada na aba Hoje para liberar a trilha.</p>
  }

  const diaJornada = estado.dia_da_jornada ?? 1
  const unidadeAtual = estado.proxima_licao?.unidade ?? UNIDADES.length

  const secoes: SecaoTrilha[] = UNIDADES.map((u) => {
    const itens = u.licoes.map((l) => {
      const dia = dados.dias[l.id] ?? 9999
      const feita = dados.feitas.has(l.id)
      return {
        id: l.id,
        rotulo: l.titulo,
        estado: feita ? ('feita' as const) : dia <= diaJornada ? ('disponivel' as const) : ('bloqueada' as const),
        dica: `libera no dia ${dia}`,
      }
    })
    const todas = itens.every((i) => i.estado === 'feita')
    return {
      id: `u${u.numero}`,
      titulo: u.titulo,
      subtitulo: `Unidade ${u.numero} · ${u.dias}`,
      resumo: u.resumo,
      estado: todas ? 'concluida' : u.numero === unidadeAtual ? 'atual' : u.numero < unidadeAtual ? 'concluida' : 'futura',
      itens,
    }
  })

  return (
    <div className="dn-trilha">
      <p className="dn-trilha-intro">
        Você está no <b>dia {diaJornada}</b> da jornada. As lições liberam pelo calendário, uma de cada vez.
      </p>
      <TrilhaVertical
        secoes={secoes}
        destaqueId={estado.proxima_licao?.liberada ? estado.proxima_licao.id : undefined}
        aoEscolher={(item) => {
          if (item.estado === 'bloqueada') mostrar(`Essa lição ${item.dica}.`, { comNav: true })
          else navegar(`/dnsmk/licao/${item.id}`)
        }}
      />
      <p className="aviso-educativo">{AVISO_EDUCATIVO}</p>
    </div>
  )
}
