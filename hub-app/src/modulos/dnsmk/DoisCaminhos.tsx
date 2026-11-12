import { Brain, ChevronDown, HeartPulse, House, Target, TrendingDown, TrendingUp, Trophy, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { AVISO_EDUCATIVO, DOIS_CAMINHOS as T } from './conteudo/textosSaude'

const ICONES: Record<string, LucideIcon> = { sensacao: Brain, foco: Target, casa: House, burnout: HeartPulse }
const CHAVE = 'dnsmk_dois_caminhos_aberto'

function lerPreferencia() {
  try {
    const v = localStorage.getItem(CHAVE)
    if (v !== null) return v === '1'
  } catch {
    /* sem armazenamento: usa o padrão */
  }
  return window.matchMedia('(min-width: 900px)').matches
}

/** Lembrete fixo: o que estou evitando e para onde quero ir. O resumo dos dois lados fica sempre visível. */
export function DoisCaminhos() {
  const [aberto, setAberto] = useState(lerPreferencia)
  const idDetalhe = useId()

  function alternar() {
    setAberto((a) => {
      try {
        localStorage.setItem(CHAVE, a ? '0' : '1')
      } catch {
        /* ignora */
      }
      return !a
    })
  }

  return (
    <section className="caminhos" aria-labelledby="caminhos-titulo">
      <header className="caminhos-topo">
        <span className="olho">{T.olho}</span>
        <h2 id="caminhos-titulo">{T.titulo}</h2>
        <p>{T.apoio}</p>
      </header>

      <div className="caminhos-resumo">
        <article className="caminho caminho-evitando">
          <span className="caminho-rotulo">
            <TriangleAlert aria-hidden />
            {T.evitando.rotulo}
          </span>
          <h3>{T.evitando.titulo}</h3>
          <p>{T.evitando.resultado}</p>
          <ul className="caminho-tend" aria-label={T.evitando.tendenciaRotulo}>
            <li className="caminho-tend-rotulo">
              <TrendingDown aria-hidden />
              {T.evitando.tendenciaRotulo}
            </li>
            {T.evitando.tendencias.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </article>

        <span className="caminhos-meio" aria-hidden>
          <i />
          <b>vs</b>
          <i />
        </span>

        <article className="caminho caminho-querendo">
          <span className="caminho-rotulo">
            <Trophy aria-hidden />
            {T.querendo.rotulo}
          </span>
          <h3>{T.querendo.titulo}</h3>
          <p>{T.querendo.resultado}</p>
          <ul className="caminho-tend" aria-label={T.querendo.tendenciaRotulo}>
            <li className="caminho-tend-rotulo">
              <TrendingUp aria-hidden />
              {T.querendo.tendenciaRotulo}
            </li>
            {T.querendo.tendencias.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </article>
      </div>

      <button className="caminhos-alternar" onClick={alternar} aria-expanded={aberto} aria-controls={idDetalhe}>
        {aberto ? T.esconder : T.verTudo}
        <ChevronDown aria-hidden />
      </button>

      {aberto && (
        <div id={idDetalhe} className="caminhos-detalhe">
          {T.areas.map((a) => {
            const Icone = ICONES[a.id]
            return (
              <div className="caminhos-area" key={a.id}>
                <h4>
                  <Icone aria-hidden />
                  {a.nome}
                </h4>
                <p className="caminhos-celula caminhos-celula-evitando">
                  <span>Evitando</span>
                  {a.evitando}
                </p>
                <p className="caminhos-celula caminhos-celula-querendo">
                  <span>Quero ir</span>
                  {a.querendo}
                </p>
              </div>
            )
          })}
          <div className="caminhos-frases">
            <p className="caminhos-frase-e">{T.evitando.frase}</p>
            <p className="caminhos-frase-q">{T.querendo.frase}</p>
          </div>
        </div>
      )}

      <footer className="caminhos-pe">
        <b>{T.fecho}</b>
        <small>{T.semCulpa}</small>
        <small>{AVISO_EDUCATIVO}</small>
      </footer>
    </section>
  )
}
