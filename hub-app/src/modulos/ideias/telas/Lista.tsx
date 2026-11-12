import { ListChecks, Plus, Search, Sparkles, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { STATUS, AREAS, useIdeias, type Ideia, type Status } from '../dados'
import { ImagemIdeia } from '../imagem'
import { IconeLink, SeloData } from '../Selos'

type Filtro = 'ativas' | Status | 'favoritas'

export function CartaoIdeia({ i }: { i: Ideia }) {
  const { atualizar } = useIdeias()
  const feitas = i.etapas.filter((e) => e.feita).length
  return (
    <li className="id-cartao" data-status={i.status}>
      <Link to={`/ideias/ideia/${i.id}`} className="id-cartao-alvo" data-com-imagem={!!i.imagem_path || undefined}>
        {i.imagem_path && <ImagemIdeia path={i.imagem_path} titulo={i.titulo} />}
        <span className="id-cartao-topo">
          <span className="id-status" data-status={i.status}>
            {STATUS.find((s) => s.id === i.status)?.rotulo}
          </span>
          {i.area && <span className="id-area">{AREAS.find((a) => a.id === i.area)?.rotulo}</span>}
        </span>
        <b className="id-cartao-titulo">{i.titulo}</b>
        {i.proposito && <span className="id-cartao-prop">{i.proposito}</span>}
        <span className="id-cartao-base">
          {i.link && <IconeLink url={i.link} />}
          {i.executar_em && <SeloData dia={i.executar_em} feita={i.status === 'feita'} />}
          {i.etapas.length > 0 && (
            <span className="id-etapas-mini">
              <ListChecks aria-hidden /> {feitas}/{i.etapas.length}
            </span>
          )}
        </span>
        {i.etapas.length > 0 && (
          <span className="id-barra" aria-hidden>
            <i style={{ width: `${(feitas / i.etapas.length) * 100}%` }} />
          </span>
        )}
      </Link>
      <button className="id-estrela" aria-pressed={i.favorita} aria-label={i.favorita ? 'Tirar dos favoritos' : 'Favoritar'} onClick={() => void atualizar(i.id, { favorita: !i.favorita })}>
        <Star aria-hidden />
      </button>
    </li>
  )
}

export function Lista({ aoNova }: { aoNova: () => void }) {
  const { ideias } = useIdeias()
  const [filtro, setFiltro] = useState<Filtro>('ativas')
  const [busca, setBusca] = useState('')

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return ideias
      .filter((i) =>
        filtro === 'ativas' ? !['feita', 'arquivada'].includes(i.status) : filtro === 'favoritas' ? i.favorita : i.status === filtro,
      )
      .filter((i) => !q || [i.titulo, i.proposito, i.notas, i.link].some((t) => t?.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.favorita) - Number(a.favorita) || b.atualizado_em.localeCompare(a.atualizado_em))
  }, [ideias, filtro, busca])

  const conta = (s: Status) => ideias.filter((i) => i.status === s).length
  const ativas = ideias.filter((i) => !['feita', 'arquivada'].includes(i.status)).length

  return (
    <div className="id-lista">
      <section className="dia-hero id-hero">
        <span className="dia-hero-tipo">TheusVision Ideias</span>
        <h2 className="dia-hero-data">
          <span>{ativas}</span>
          {ativas === 1 ? 'ideia viva' : 'ideias vivas'}
        </h2>
        <div className="id-funil" aria-label="Ideias por etapa">
          {STATUS.slice(0, 4).map((s) => (
            <button key={s.id} className="id-funil-passo" data-status={s.id} aria-pressed={filtro === s.id} onClick={() => setFiltro(filtro === s.id ? 'ativas' : s.id)}>
              <b>{conta(s.id)}</b>
              <small>{s.rotulo}</small>
            </button>
          ))}
        </div>
        <button className="btn btn-verde btn-grande" onClick={aoNova}>
          <Plus aria-hidden /> Nova ideia
        </button>
      </section>

      <label className="id-busca">
        <Search aria-hidden />
        <input className="entrada" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nas ideias" aria-label="Buscar" />
      </label>
      <div className="tr-chips" role="group" aria-label="Filtro">
        {(
          [
            ['ativas', 'Vivas'],
            ['favoritas', '★ Favoritas'],
            ['feita', 'Feitas'],
            ['arquivada', 'Arquivadas'],
          ] as [Filtro, string][]
        ).map(([id, rot]) => (
          <button key={id} className="dia-chip" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
            {rot}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="id-vazio">
          <Sparkles aria-hidden />
          <p>{ideias.length === 0 ? 'Seu banco de ideias está esperando a primeira. Viu um reel bom? Cola o link aqui.' : 'Nada por aqui com esse filtro.'}</p>
          {ideias.length === 0 && (
            <button className="btn btn-primario" onClick={aoNova}>
              Guardar a primeira ideia
            </button>
          )}
        </div>
      ) : (
        <ul className="id-grade">
          {lista.map((i) => (
            <CartaoIdeia key={i.id} i={i} />
          ))}
        </ul>
      )}
    </div>
  )
}
