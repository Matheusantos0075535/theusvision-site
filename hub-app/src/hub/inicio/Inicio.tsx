import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { resumoDoDia } from '../../modulos/dia/resumo'
import { resumoDoTreino } from '../../modulos/treino/resumo'
import { supabase } from '../../lib/supabase'
import { dataBrasiliaPorExtenso, horaBrasilia, primeiroNome, saudacao } from '../../lib/tempo'
import { useAuth } from '../auth'
import { Marca } from '../LayoutAcesso'
import { useModo } from '../modo'
import { MODULOS, ROTULO_MODO, type Modo } from '../modulos'
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
    dnsmk: { numero: null, linha: 'Carregando…' },
    leitura: { numero: null, linha: 'Carregando…' },
  })
  useEffect(() => {
    let vivo = true
    Promise.allSettled([supabase.rpc('dnsmk_estado'), supabase.rpc('leit_estado'), resumoDoDia(), resumoDoTreino()]).then(([d, l, md, tr]) => {
      if (!vivo) return
      const novo: Record<string, DestaqueCard | null> = {}
      novo.dia =
        md.status === 'fulfilled'
          ? { numero: md.value.feitos, de: md.value.total, linha: md.value.total ? 'tarefas feitas hoje' : 'Monte seu dia' }
          : { numero: null, linha: 'Prioridades e rotina de hoje' }
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
  const modulos = MODULOS.filter((m) => m.modo === modo)

  return (
    <div className="inicio" data-modo={modo}>
      <div className="fita" />
      <header className="inicio-topo">
        <Marca />
        <button className="btn btn-fantasma" onClick={() => void sair()}>
          <LogOut aria-hidden />
          Sair
        </button>
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
          <GradeModulos modulos={modulos} destaques={destaques} />
        </section>
      </main>
    </div>
  )
}
