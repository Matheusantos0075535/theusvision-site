import { Award, HeartHandshake, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Secao } from '../../../components/compartilhado/ShellModulo'
import { useToast } from '../../../components/ui/Toast'
import { supabase } from '../../../lib/supabase'
import { formatarDataLonga } from '../../../lib/tempo'
import { AJUDA, AVISO_EDUCATIVO } from '../conteudo/textosSaude'
import { marcosAte, useDnsmk } from '../dados'

function Chave({ ligado, aoMudar, rotulo, sub }: { ligado: boolean; aoMudar: (v: boolean) => void; rotulo: string; sub?: string }) {
  return (
    <div className="interruptor">
      <span>
        {rotulo}
        {sub && <small>{sub}</small>}
      </span>
      <button className="chave" role="switch" aria-checked={ligado} aria-label={rotulo} onClick={() => aoMudar(!ligado)} />
    </div>
  )
}

export function Perfil({ aoPedirAjuda }: { aoPedirAjuda: () => void }) {
  const { config, salvarConfig, estado } = useDnsmk()
  const { mostrar } = useToast()
  const [gasto, setGasto] = useState(config.gasto_semanal?.toString() ?? '')
  const [conquistas, setConquistas] = useState<{ marco: number; conquistado_em: string }[]>([])

  useEffect(() => setGasto(config.gasto_semanal?.toString() ?? ''), [config.gasto_semanal])

  useEffect(() => {
    supabase
      .from('dnsmk_conquistas')
      .select('marco, conquistado_em')
      .order('marco')
      .then(({ data }) => setConquistas(data ?? []))
  }, [])

  async function salvar(parcial: Parameters<typeof salvarConfig>[0]) {
    const erro = await salvarConfig(parcial)
    if (erro) mostrar(erro, { comNav: true })
  }

  async function salvarGasto() {
    const limpo = gasto.replace(',', '.').trim()
    const valor = limpo === '' ? null : Number(limpo)
    if (valor !== null && (Number.isNaN(valor) || valor < 0)) return mostrar('Informe um valor válido.', { comNav: true })
    await salvar({ gasto_semanal: valor })
    mostrar('Salvo.', { comNav: true })
  }

  const ganhas = new Map(conquistas.map((c) => [c.marco, c.conquistado_em]))
  const vitrine = marcosAte(estado?.melhor ?? 0).filter((m) => m <= 365 || ganhas.has(m))

  return (
    <div className="dn-perfil">
      <button className="btn btn-secundario btn-grande dn-ajuda-grande" onClick={aoPedirAjuda}>
        <HeartHandshake aria-hidden />
        {AJUDA.botao}
      </button>

      <Secao titulo="Coleção de selos">
        <ul className="selos">
          {vitrine.map((m) => {
            const data = ganhas.get(m)
            return (
              <li key={m} className="selo-item" data-ganho={data ? true : undefined}>
                <span className="selo-medalha">
                  <Award aria-hidden />
                  <b>{m}</b>
                </span>
                <span className="selo-legenda">{data ? formatarDataLonga(data) : 'a conquistar'}</span>
              </li>
            )
          })}
        </ul>
      </Secao>

      <Secao titulo="Preferências">
        <div className="cartao-bloco">
          <Chave
            rotulo="Som na celebração"
            sub="Desligado por padrão."
            ligado={config.som}
            aoMudar={(v) => void salvar({ som: v })}
          />
          <Chave rotulo="Vibração" sub="Vibração curta, se o aparelho permitir." ligado={config.vibracao} aoMudar={(v) => void salvar({ vibracao: v })} />
          <label className="campo dn-gasto">
            <span>Quanto você gastava por semana (R$)</span>
            <div className="dn-gasto-linha">
              <input
                className="entrada"
                inputMode="decimal"
                placeholder="Ex.: 80"
                value={gasto}
                onChange={(e) => setGasto(e.target.value)}
              />
              <button className="btn btn-secundario" onClick={salvarGasto}>
                Salvar
              </button>
            </div>
            <small>Opcional. Usado só para estimar a economia.</small>
          </label>
        </div>
      </Secao>

      <div className="dn-privacidade">
        <ShieldCheck aria-hidden />
        <p>Seus dados neste módulo são privados: só você vê. Nem administradores do Hub têm acesso.</p>
      </div>
      <p className="aviso-educativo">{AVISO_EDUCATIVO}</p>
    </div>
  )
}
