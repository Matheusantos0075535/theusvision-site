import { Lightbulb, LogOut } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { resumoDoDia } from '../../modulos/dia/resumo'
import { resumoDoTreino } from '../../modulos/treino/resumo'
import { BotaoSom } from '../../components/ui/BotaoSom'
import { supabase } from '../../lib/supabase'
import { dataBrasiliaPorExtenso, horaBrasilia, primeiroNome, saudacao } from '../../lib/tempo'
import { useAuth } from '../auth'
import { Marca } from '../LayoutAcesso'
import { useModo } from '../modo'
import { GRUPOS, MODULOS, ROTULO_MODO, type Modo } from '../modulos'
import type { DestaqueCard } from './CardModulo'
import { GradeModulos } from './GradeModulos'
import './inicio.css'

function useAgora() {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    let intervalo: number | undefined
    // Alinha a atualização à virada do minuto.
    const espera = window.setTimeout(() => {
      setAgora(new Date())
      intervalo = window.setInterval(() => setAgora(new Date()), 60_000)
    }, 60_000 - (Date.now() % 60_000) + 50)
    return () => {
      window.clearTimeout(espera)
      window.clearInterval(intervalo)
    }
  }, [])
  return agora
}

function useDestaques() {
  const [destaques, setDestaques] = useState<Record<string, DestaqueCard | null>>({
    dia: { numero: null, linha: 'Carregando…', de: 0 },
    treino: { numero: null, linha: 'Carregando…', de: 0 },
    ideias: { numero: null, linha: 'Carregando…' },
    dnsmk: { numero: null, linha: 'Carregando…' },
    leitura: { numero: null, linha: 'Carregando…' },
  })
  useEffect(() => {
    let vivo = true
    Promise.allSettled([supabase.rpc('dnsmk_estado'), supabase.rpc('leit_estado'), resumoDoDia(), resumoDoTreino(), supabase.from('ideias').select('status, executar_em')]).then(([d, l, md, tr, id]) => {
      if (!vivo) return
      const novo: Record<string, DestaqueCard | null> = {}
      novo.dia =
        md.status === 'fulfilled'
          ? { numero: md.value.feitos, de: md.value.total, linha: md.value.total ? 'tarefas feitas hoje' : 'Monte seu dia' }
          : { numero: null, linha: 'Prioridades e rotina de hoje' }
      const ids = id.status === 'fulfilled' && !id.value.error ? (id.value.data as { status: string; executar_em: string | null }[]) : null
      const vivas = ids?.filter((x) => x.status !== 'feita' && x.status !== 'arquivada') ?? []
      novo.ideias = ids
        ? { numero: vivas.length, icone: Lightbulb, linha: vivas.length ? `${vivas.filter((x) => x.executar_em).length} com data marcada` : 'Guarde a primeira ideia' }
        : { numero: null, linha: 'Banco de ideias' }
      novo.treino =
        tr.status === 'fulfilled'
          ? { numero: tr.value.feitos, de: tr.value.meta, linha: tr.value.linha }
          : { numero: null, linha: 'Treinos da semana' }
      const dn = d.status === 'fulfilled' && !d.value.error ? d.value.data : null
      novo.dnsmk = dn
        ? dn.tem_jornada
          ? { numero: dn.sequencia_atual, linha: `próxima meta: ${dn.proxima_meta}` }
          : { numero: 0, linha: 'Comece sua jornada' }
        : { numero: null, linha: 'Dias sem fumar' }
      const le = l.status === 'fulfilled' && !l.value.error ? l.value.data : null
      novo.leitura = le
        ? {
            numero: le.ofensiva,
            linha: le.livro_atual ? `${le.livro_atual.titulo} · ${le.livro_atual.pct}%` : 'Adicione um livro',
          }
        : { numero: null, linha: 'Ofensiva de leitura' }
      setDestaques(novo)
    })
    return () => {
      vivo = false
    }
  }, [])
  return destaques
}

export function Inicio() {
  const { acesso, sair } = useAuth()
  const agora = useAgora()
  const destaques = useDestaques()
  const nome = acesso ? primeiroNome(acesso.nome) : ''
  const { modo, trocar } = useModo()
  const grupos = GRUPOS[modo]
  const modulos = useMemo(() => GRUPOS[modo].flatMap((g) => MODULOS.filter((m) => m.grupo === g.id)), [modo])

  return (
    <div className="inicio" data-modo={modo}>
      <div className="fita" />
      <header className="inicio-topo">
        <Marca />
        <span className="inicio-topo-acoes">
          <BotaoSom />
        <button className="btn btn-fantasma" onClick={() => void sair()} aria-label="Sair">
          <LogOut aria-hidden />
          <span className="sair-texto">Sair</span>
        </button>
        </span>
      </header>
      <main className="inicio-miolo">
        <section className="saudacao">
          <span className="olho">{modo === 'work' ? 'Modo work' : 'Seu painel'}</span>
          <h1>
            {saudacao(agora)}, <span>{nome}</span>
          </h1>
          <p>
            <time dateTime={agora.toISOString()}>{dataBrasiliaPorExtenso(agora)}</time>
            <span aria-hidden> · </span>
            <span>
              {horaBrasilia(agora)} <small>Brasília</small>
            </span>
          </p>
          <div className="modo-troca" role="group" aria-label="Modo do painel">
            {(['pessoal', 'work'] as Modo[]).map((m) => (
              <button key={m} className="modo-opcao" aria-pressed={modo === m} onClick={() => trocar(m)}>
                {ROTULO_MODO[m]}
              </button>
            ))}
          </div>
        </section>
        <section aria-labelledby="titulo-modulos">
          <div className="secao-cabeca">
            <h2 id="titulo-modulos">Módulos</h2>
            <span className="rotulo">
              {modulos.filter((m) => m.status === 'disponivel').length} de {modulos.length} disponíveis
            </span>
          </div>
          <GradeModulos modulos={modulos} grupos={grupos} destaques={destaques} />
        </section>
      </main>
    </div>
  )
}
