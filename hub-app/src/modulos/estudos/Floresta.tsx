import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Numeros } from '../../components/compartilhado/Graficos'
import { Secao } from '../../components/compartilhado/ShellModulo'
import { dataPorExtensoDoBanco, hojeBrasiliaIso } from '../../lib/tempo'
import { Arvore, especieDaTrilha, estagioPorMinutos } from './Arvore'
import { fmtMin, minutosDoDia, sequencia, useE, type Sessao } from './dados'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function Mata({ sessoes, tamanho }: { sessoes: Sessao[]; tamanho: number }) {
  const { d } = useE()
  if (!sessoes.length) return <p className="vazio">Nenhuma árvore ainda. Cada foco concluído planta uma.</p>
  return (
    <ul className="es-mata">
      {sessoes.map((s) => {
        const i = d.trilhas.findIndex((t) => t.id === s.trilha)
        return (
          <li key={s.id} title={`${d.trilhas[i]?.nome ?? 'Estudo'} · ${s.min} min`}>
            <Arvore estagio={s.ok === false ? 0.5 : estagioPorMinutos(s.min)} cor={d.trilhas[i]?.cor ?? '#3ddc97'} especie={especieDaTrilha(Math.max(0, i))} murcha={s.ok === false} tamanho={tamanho} />
          </li>
        )
      })}
    </ul>
  )
}

export function ResumoDia({ dia }: { dia: string }) {
  const { d } = useE()
  const doDia = d.sessoes.filter((s) => s.dia === dia)
  const min = minutosDoDia(d.sessoes, dia)
  const porTrilha = d.trilhas.map((t) => ({ t, min: doDia.filter((s) => s.trilha === t.id && s.ok !== false).reduce((a, s) => a + s.min, 0) })).filter((x) => x.min)
  return (
    <>
      <div className="es-chao">
        <Mata sessoes={doDia} tamanho={76} />
      </div>
      <div className="pt-card">
        <div className="pt-card-topo">
          <b>{dataPorExtensoDoBanco(dia)}</b>
          <span className="pt-tag" data-cor={min >= d.metaDia ? 'verde' : undefined}>
            {fmtMin(min)} de {fmtMin(d.metaDia)}
          </span>
        </div>
        <span className="pt-barra">
          <i style={{ width: `${Math.min(100, (min / d.metaDia) * 100)}%` }} />
        </span>
        {porTrilha.map(({ t, min: m }) => (
          <small key={t.id}>
            <i className="pt-trilha-cor" style={{ background: t.cor, display: 'inline-block', marginRight: 6 }} />
            {t.nome}: {fmtMin(m)}
          </small>
        ))}
        {doDia.some((s) => s.ok === false) && <small>🥀 {doDia.filter((s) => s.ok === false).length} abandonada(s): a árvore murchou.</small>}
      </div>
    </>
  )
}

export function Floresta() {
  const { d } = useE()
  const hoje = hojeBrasiliaIso()
  const [modo, setModo] = useState<'dia' | 'mes'>('dia')
  const [mes, setMes] = useState(Number(hoje.slice(5, 7)) - 1)
  const prefixo = `${hoje.slice(0, 4)}-${String(mes + 1).padStart(2, '0')}`
  const doMes = useMemo(() => d.sessoes.filter((s) => s.dia.startsWith(prefixo)).sort((a, b) => a.dia.localeCompare(b.dia)), [d.sessoes, prefixo])
  const boas = doMes.filter((s) => s.ok !== false)
  const minMes = boas.reduce((t, s) => t + s.min, 0)
  const dias = new Set(boas.map((s) => s.dia))
  const porDia = [...dias].map((x) => ({ x, m: minutosDoDia(d.sessoes, x) })).sort((a, b) => b.m - a.m)
  const porTrilha = d.trilhas.map((t) => ({ t, m: boas.filter((s) => s.trilha === t.id).reduce((a, s) => a + s.min, 0) })).filter((x) => x.m).sort((a, b) => b.m - a.m)
  const seq = sequencia(d.sessoes, hoje)

  return (
    <div className="pt-tela">
      <div className="dep-abas" role="group" aria-label="Período">
        <button className="dia-chip" aria-pressed={modo === 'dia'} onClick={() => setModo('dia')}>
          Hoje
        </button>
        <button className="dia-chip" aria-pressed={modo === 'mes'} onClick={() => setModo('mes')}>
          Mês
        </button>
      </div>

      {modo === 'dia' ? (
        <>
          <ResumoDia dia={hoje} />
          <Numeros
            itens={[
              { rotulo: 'Sequência', valor: `${seq} ${seq === 1 ? 'dia' : 'dias'}`, destaque: true },
              { rotulo: 'Árvores hoje', valor: d.sessoes.filter((s) => s.dia === hoje && s.ok !== false).length },
            ]}
          />
        </>
      ) : (
        <>
          <div className="cal-topo">
            <button className="btn-icone" onClick={() => setMes((m) => m - 1)} disabled={mes === 0} aria-label="Mês anterior">
              <ChevronLeft aria-hidden />
            </button>
            <h2>
              {MESES[mes]} <span>{hoje.slice(0, 4)}</span>
            </h2>
            <button className="btn-icone" onClick={() => setMes((m) => m + 1)} disabled={mes === 11} aria-label="Próximo mês">
              <ChevronRight aria-hidden />
            </button>
          </div>
          <div className="es-chao es-chao-grande">
            <Mata sessoes={doMes} tamanho={52} />
          </div>
          <Numeros
            itens={[
              { rotulo: 'Tempo de estudo', valor: fmtMin(minMes), destaque: true },
              { rotulo: 'Árvores plantadas', valor: boas.length },
              { rotulo: 'Dias estudados', valor: dias.size },
              { rotulo: 'Árvores murchas', valor: doMes.length - boas.length },
            ]}
          />
          <Secao titulo="Resumo do mês">
            <div className="pt-card">
              <small>
                {boas.length === 0
                  ? 'Nenhum foco neste mês ainda.'
                  : `Média de ${fmtMin(Math.round(minMes / Math.max(1, dias.size)))} nos dias em que você estudou. Seu melhor dia: ${dataPorExtensoDoBanco(porDia[0].x).split(', ')[1]} com ${fmtMin(porDia[0].m)}.`}
              </small>
              {porTrilha.map(({ t, m }) => (
                <div key={t.id} className="es-linha-trilha">
                  <span>
                    <i className="pt-trilha-cor" style={{ background: t.cor }} /> {t.nome}
                  </span>
                  <span className="pt-barra">
                    <i style={{ width: `${(m / porTrilha[0].m) * 100}%`, background: t.cor }} />
                  </span>
                  <b>{fmtMin(m)}</b>
                </div>
              ))}
            </div>
          </Secao>
        </>
      )}
    </div>
  )
}
