import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { useTreino } from './dados'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')))

export function FolhaPerfil({ aoFechar }: { aoFechar: () => void }) {
  const { perfil, recarregar } = useTreino()
  const { mostrar } = useToast()
  const [peso, setPeso] = useState(perfil.peso_kg?.toString().replace('.', ',') ?? '')
  const [altura, setAltura] = useState(perfil.altura_cm?.toString() ?? '')
  const [dias, setDias] = useState(perfil.dias_semana)
  const [folgas, setFolgas] = useState<number[]>(perfil.folgas)
  const [descanso, setDescanso] = useState(perfil.descanso_seg)
  const [duracao, setDuracao] = useState(perfil.duracao_max_min)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aoFechar])

  async function salvar() {
    const p = num(peso)
    const a = num(altura)
    if (p !== null && (isNaN(p) || p < 30 || p > 300)) return setErro('Peso entre 30 e 300 kg.')
    if (a !== null && (isNaN(a) || a < 120 || a > 230)) return setErro('Altura em centímetros, entre 120 e 230.')
    setSalvando(true)
    const { error } = await supabase
      .from('treino_perfil')
      .update({ peso_kg: p, altura_cm: a, dias_semana: dias, folgas, descanso_seg: descanso, duracao_max_min: duracao, atualizado_em: new Date().toISOString() })
      .not('dias_semana', 'is', null)
    setSalvando(false)
    if (error) return setErro(mensagemDeErroBanco(error))
    await recarregar()
    mostrar('Perfil salvo. O plano da semana foi refeito.', { comNav: true })
    aoFechar()
  }

  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha" role="dialog" aria-modal="true" aria-labelledby="tr-perfil" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <div className="tr-folha-topo">
          <h2 id="tr-perfil">Seu perfil de treino</h2>
          <button className="btn-icone" onClick={aoFechar} aria-label="Fechar">
            <X aria-hidden />
          </button>
        </div>
        <div className="tr-duas">
          <label className="campo">
            <span>Peso (kg)</span>
            <input className="entrada" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value.replace(/[^\d,.]/g, ''))} />
          </label>
          <label className="campo">
            <span>Altura (cm)</span>
            <input className="entrada" inputMode="numeric" value={altura} onChange={(e) => setAltura(e.target.value.replace(/\D/g, ''))} />
          </label>
        </div>
        <div className="campo">
          <span>Dias de treino por semana: {dias}</span>
          <input type="range" min={1} max={7} value={dias} onChange={(e) => setDias(Number(e.target.value))} />
        </div>
        <div className="campo">
          <span>Dias de descanso fixos</span>
          <div className="tr-chips" role="group" aria-label="Dias de descanso">
            {DIAS.map((d, i) => (
              <button key={d} className="dia-chip" aria-pressed={folgas.includes(i)} onClick={() => setFolgas((f) => (f.includes(i) ? f.filter((x) => x !== i) : [...f, i].sort()))}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="tr-duas">
          <label className="campo">
            <span>Descanso entre séries</span>
            <select className="entrada" value={descanso} onChange={(e) => setDescanso(Number(e.target.value))}>
              {[45, 60, 75, 90, 120, 150, 180].map((s) => (
                <option key={s} value={s}>
                  {s < 60 ? `${s} s` : `${Math.floor(s / 60)}min${s % 60 ? ` ${s % 60}s` : ''}`}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Treino de no máximo</span>
            <select className="entrada" value={duracao} onChange={(e) => setDuracao(Number(e.target.value))}>
              {[45, 60, 75, 90, 105, 120].map((m) => (
                <option key={m} value={m}>
                  {m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`}
                </option>
              ))}
            </select>
          </label>
        </div>
        {erro && (
          <div className="aviso aviso-erro" role="alert">
            {erro}
          </div>
        )}
        <button className="btn btn-verde btn-grande" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
