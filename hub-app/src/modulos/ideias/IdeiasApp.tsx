import { CalendarClock, Lightbulb, Plus } from 'lucide-react'
import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ShellModulo } from '../../components/compartilhado/ShellModulo'
import '../dia/dia.css'
import '../treino/treino.css'
import { IdeiasProvider } from './dados'
import './ideias.css'
import { NovaIdeia } from './NovaIdeia'
import { Agenda } from './telas/Agenda'
import { IdeiaTela } from './telas/IdeiaTela'
import { Lista } from './telas/Lista'

const ABAS = [
  { para: '/ideias', rotulo: 'Ideias', icone: Lightbulb, fim: true },
  { para: '/ideias/agenda', rotulo: 'Agenda', icone: CalendarClock },
]

export default function IdeiasApp() {
  const [nova, setNova] = useState(false)
  return (
    <ShellModulo
      titulo="TheusVision Ideias"
      abas={ABAS}
      direita={
        <button className="btn-icone" onClick={() => setNova(true)} aria-label="Nova ideia">
          <Plus aria-hidden />
        </button>
      }
    >
      <IdeiasProvider>
        <Routes>
          <Route index element={<Lista aoNova={() => setNova(true)} />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="ideia/:id" element={<IdeiaTela />} />
          <Route path="*" element={<Lista aoNova={() => setNova(true)} />} />
        </Routes>
        {nova && <NovaIdeia aoFechar={() => setNova(false)} />}
      </IdeiasProvider>
    </ShellModulo>
  )
}
