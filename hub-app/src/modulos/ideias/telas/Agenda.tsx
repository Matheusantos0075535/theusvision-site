import { useMemo } from 'react'
import { Secao } from '../../../components/compartilhado/ShellModulo'
import { diferencaDias, hojeBrasiliaIso } from '../../../lib/tempo'
import { useIdeias, type Ideia } from '../dados'
import { CartaoIdeia } from './Lista'

export function Agenda() {
  const { ideias } = useIdeias()
  const grupos = useMemo(() => {
    const hoje = hojeBrasiliaIso()
    const vivas = ideias.filter((i) => !['feita', 'arquivada'].includes(i.status))
    const g: Record<string, Ideia[]> = { 'Atrasadas': [], 'Hoje': [], 'Próximos 7 dias': [], 'Mais pra frente': [], 'Sem data ainda': [] }
    vivas.forEach((i) => {
      if (!i.executar_em) return g['Sem data ainda'].push(i)
      const d = diferencaDias(i.executar_em, hoje)
      if (d < 0) g['Atrasadas'].push(i)
      else if (d === 0) g['Hoje'].push(i)
      else if (d <= 7) g['Próximos 7 dias'].push(i)
      else g['Mais pra frente'].push(i)
    })
    Object.values(g).forEach((l) => l.sort((a, b) => (a.executar_em ?? '9').localeCompare(b.executar_em ?? '9')))
    return g
  }, [ideias])

  return (
    <div className="id-lista">
      <p className="dia-apoio">Suas ideias pelo dia em que você quer executar. Abra uma ideia para escolher a data.</p>
      {Object.entries(grupos).map(([titulo, l]) =>
        l.length ? (
          <Secao key={titulo} titulo={`${titulo} · ${l.length}`}>
            <ul className="id-grade">
              {l.map((i) => (
                <CartaoIdeia key={i.id} i={i} />
              ))}
            </ul>
          </Secao>
        ) : null,
      )}
      {ideias.every((i) => ['feita', 'arquivada'].includes(i.status)) && <p className="vazio">Nenhuma ideia viva para agendar.</p>}
    </div>
  )
}
