import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { dataBrasiliaPorExtenso, horaBrasilia, primeiroNome, saudacao } from '../../lib/tempo'
import { useAuth } from '../auth'
import { Marca } from '../LayoutAcesso'
import { MODULOS } from '../modulos'
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
    dnsmk: { numero: null, linha: 'Carregando…' },
    leitura: { numero: null, linha: 'Carregando…' },
  })
  useEffect(() => {
    let vivo = true
    Promise.allSettled([supabase.rpc('dnsmk_estado'), supabase.rpc('leit_estado')]).then(([d, l]) => {
      if (!vivo) return
      const novo: Record<string, DestaqueCard | null> = {}
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

  return (
    <div className="inicio">
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
          <span className="olho">Seu painel</span>
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
        </section>
        <section aria-labelledby="titulo-modulos">
          <div className="secao-cabeca">
            <h2 id="titulo-modulos">Módulos</h2>
            <span className="rotulo">
              {MODULOS.filter((m) => m.status === 'disponivel').length} de {MODULOS.length} disponíveis
            </span>
          </div>
          <GradeModulos modulos={MODULOS} destaques={destaques} />
        </section>
      </main>
    </div>
  )
}
