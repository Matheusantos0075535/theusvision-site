import { Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../lib/erros'
import { tocar } from '../../lib/som'
import { supabase } from '../../lib/supabase'
import { criarItem, novoId, type Item, type Ligacao } from '../studio/dados'
import type { Ideia } from './dados'

/** Monta o quadro inicial a partir da ideia: título, imagem, propósito, link, etapas encadeadas e 3 cenas. */
function quadroDaIdeia(i: Ideia) {
  const itens: Item[] = []
  const ligacoes: Ligacao[] = []
  let z = 1
  itens.push(criarItem('titulo', 520, -80, { texto: i.titulo }, z++))
  let x = 150
  if (i.imagem_path) {
    itens.push(criarItem('imagem', x, 140, { path: i.imagem_path, bucket: 'ideias-imagens', w: 260, h: 200 }, z++))
    x += 300
  }
  itens.push(criarItem('nota', x, 140, { texto: i.proposito ? `Propósito: ${i.proposito}` : 'Propósito: por que essa ideia importa?', cor: 'laranja', w: 240, h: 200 }, z++))
  x += 290
  if (i.link) itens.push(criarItem('link', x + 20, 140, { url: i.link }, z++))
  const etapas = [...i.etapas].sort((a, b) => a.ordem - b.ordem).slice(0, 12)
  let anterior: string | null = null
  etapas.forEach((e, k) => {
    const it = criarItem('nota', 110 + k * 240, 420, { texto: e.texto, cor: e.feita ? 'verde' : 'amarelo', w: 200, h: 130 }, z++)
    itens.push(it)
    if (anterior) ligacoes.push({ id: novoId(), de: anterior, para: it.id })
    anterior = it.id
  })
  for (let k = 0; k < 3; k++) itens.push(criarItem('cena', 160 + k * 330, 720, { n: k + 1, prompt: '', camera: '' }, z++))
  return { itens, ligacoes }
}

export function BlocoStudio({ ideia }: { ideia: Ideia }) {
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const [projeto, setProjeto] = useState<string | null | undefined>(undefined)
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    let vivo = true
    supabase
      .from('studio_projetos')
      .select('id')
      .eq('ideia_id', ideia.id)
      .order('atualizado_em', { ascending: false })
      .limit(1)
      .then(({ data, error }) => vivo && setProjeto(error ? null : ((data as { id: string }[])[0]?.id ?? null)))
    return () => {
      vivo = false
    }
  }, [ideia.id])

  async function criar() {
    setCriando(true)
    const r = await supabase
      .from('studio_projetos')
      .insert({ titulo: ideia.titulo.slice(0, 120), descricao: ideia.proposito?.slice(0, 500) ?? null, ideia_id: ideia.id, quadro: quadroDaIdeia(ideia) })
      .select('id')
      .single()
    setCriando(false)
    if (r.error) return mostrar(mensagemDeErroBanco(r.error), { comNav: true })
    tocar('sucesso')
    navegar(`/studio/${(r.data as { id: string }).id}`)
  }

  return (
    <section className="id-bloco id-studio">
      <div>
        <h3>Creative Studio</h3>
        <p className="dia-apoio">{projeto ? 'Esta ideia já tem um quadro.' : 'Leve a ideia para um quadro: referências, mapa das etapas e storyboard das cenas.'}</p>
      </div>
      {projeto ? (
        <button className="btn btn-verde" onClick={() => navegar(`/studio/${projeto}`)}>
          <Palette aria-hidden /> Abrir no Creative Studio
        </button>
      ) : (
        <button className="btn btn-verde" onClick={() => void criar()} disabled={criando || projeto === undefined}>
          <Palette aria-hidden /> {criando ? 'Criando…' : 'Criar no Creative Studio'}
        </button>
      )}
    </section>
  )
}
