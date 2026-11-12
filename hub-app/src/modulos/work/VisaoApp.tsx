import { Gauge } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Numeros } from '../../components/compartilhado/Graficos'
import { Secao, ShellModulo } from '../../components/compartilhado/ShellModulo'
import { diferencaDias, formatarDataCurta, hojeBrasiliaIso } from '../../lib/tempo'
import '../dia/dia.css'
import { AvisoPrototipo } from '../prototipo/Aviso'
import { real } from '../prototipo/estado'
import '../prototipo/prototipo.css'
import { ETAPAS, mesAtual, useWork } from './dados'
import { PROCESSO } from './processos'

function Painel() {
  const { w } = useWork()
  const hoje = hojeBrasiliaIso()
  const abertas = w.clientes.flatMap((c) => c.entregas.filter((e) => e.status !== 'entregue').map((e) => ({ c, e })))
  const semana = abertas.filter((x) => x.e.prazo && diferencaDias(x.e.prazo, hoje) >= 0 && diferencaDias(x.e.prazo, hoje) <= 7)
  const atrasadas = abertas.filter((x) => x.e.prazo && x.e.prazo < hoje)
  const pendencias = w.clientes.flatMap((c) => c.pendencias.filter((p) => !p.feita).map((p) => ({ c, p })))
  const mes = mesAtual()
  const prev = w.fontes.reduce((t, f) => t + (w.caixa[mes]?.[f.id]?.previsto ?? 0), 0)
  const rec = w.fontes.reduce((t, f) => t + (w.caixa[mes]?.[f.id]?.recebido ?? 0), 0)
  const emAndamento = w.execucoes.filter((e) => !e.fim)
  const abertosP = w.prospects.filter((p) => p.etapa !== 'fechado' && p.etapa !== 'perdido')
  const travado = [
    ...atrasadas.map((x) => ({ k: x.e.id, t: x.e.titulo, s: `${x.c.nome} · entrega atrasada ${Math.abs(diferencaDias(x.e.prazo!, hoje))}d` })),
    ...pendencias.map((x) => ({ k: x.p.id, t: x.p.texto, s: `${x.c.nome} · pendência${x.p.acao ? ` · comece por: ${x.p.acao}` : ''}` })),
  ]
  return (
    <div className="pt-tela">
      <section className="dia-hero pt-hero">
        <span className="dia-hero-tipo">Modo work</span>
        <h2 className="dia-hero-data">
          <span>{semana.length}</span>
          {semana.length === 1 ? 'entrega nesta semana' : 'entregas nesta semana'}
        </h2>
        <div className="pt-hero-mini">
          <div>
            <small>Atrasadas</small>
            <b>{atrasadas.length}</b>
          </div>
          <div>
            <small>Recebido</small>
            <b>{real(rec)}</b>
          </div>
          <div>
            <small>Prospects</small>
            <b>{abertosP.length}</b>
          </div>
        </div>
      </section>

      <Secao titulo="Receita do mês">
        <div className="pt-card">
          <div className="pt-card-topo">
            <b>{real(rec)}</b>
            <span className="pt-tag" data-cor={prev && rec >= prev ? 'verde' : 'laranja'}>
              {prev ? `${Math.round((rec / prev) * 100)}% de ${real(prev)}` : 'defina o previsto'}
            </span>
          </div>
          <span className="pt-barra">
            <i style={{ width: `${prev ? Math.min(100, (rec / prev) * 100) : 0}%` }} />
          </span>
          <Link className="btn-link" to="/receita">
            Abrir fluxo de caixa
          </Link>
        </div>
      </Secao>

      <Secao titulo="Próximas entregas">
        <div className="pt-card">
          {semana.length === 0 ? (
            <small>Nada para os próximos 7 dias.</small>
          ) : (
            <ul className="pt-linhas">
              {semana
                .sort((a, b) => a.e.prazo!.localeCompare(b.e.prazo!))
                .map(({ c, e }) => (
                  <li key={e.id} className="pt-linha">
                    <span>
                      <b>{e.titulo}</b>
                      <small>
                        {c.nome} · {formatarDataCurta(e.prazo!)}
                      </small>
                    </span>
                  </li>
                ))}
            </ul>
          )}
          <Link className="btn-link" to="/clientes/entregas">
            Ver todas as entregas
          </Link>
        </div>
      </Secao>

      <Secao titulo="O que está travado">
        <div className="pt-card">
          {travado.length === 0 ? (
            <small>Nada travado. Bom sinal.</small>
          ) : (
            <ul className="pt-linhas">
              {travado.slice(0, 8).map((x) => (
                <li key={x.k} className="pt-linha">
                  <span>
                    <b>{x.t}</b>
                    <small>{x.s}</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Secao>

      <Secao titulo="Processos rodando">
        <div className="pt-card">
          {emAndamento.length === 0 ? (
            <small>Nenhum processo em andamento.</small>
          ) : (
            <ul className="pt-linhas">
              {emAndamento.map((e) => (
                <li key={e.id} className="pt-linha">
                  <span>
                    <b>{e.titulo}</b>
                    <small>
                      Nº {PROCESSO[e.processo].numero} · {e.feitos.length}/{PROCESSO[e.processo].passos.length} passos
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link className="btn-link" to="/construcao">
            Abrir caixa de ferramentas
          </Link>
        </div>
      </Secao>

      <Numeros itens={ETAPAS.filter((e) => e.id !== 'perdido').map((e) => ({ rotulo: e.rotulo, valor: w.prospects.filter((p) => p.etapa === e.id).length }))} />
    </div>
  )
}

export default function VisaoApp() {
  const { recomecar } = useWork()
  return (
    <ShellModulo titulo="Visão do trabalho" abas={[{ para: '/visao', rotulo: 'Painel', icone: Gauge, fim: true }]}>
      <AvisoPrototipo aoRecomecar={recomecar} />
      <div style={{ height: 12 }} />
      <Painel />
    </ShellModulo>
  )
}
