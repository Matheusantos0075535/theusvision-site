import { BookOpenText, CalendarDays, ChartNoAxesColumn, Dumbbell, ListChecks, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ShellModulo } from '../../components/compartilhado/ShellModulo'
import '../dia/dia.css'
import '../ideias/ideias.css'
import { TreinoProvider } from './dados'
import { FolhaPerfil } from './Perfil'
import { Calendario } from './telas/Calendario'
import { Evolucao } from './telas/Evolucao'
import { Exercicios } from './telas/Exercicios'
import { Fichas } from './telas/Fichas'
import { Hoje } from './telas/Hoje'
import { SessaoTela } from './telas/Sessao'
import './treino.css'

const ABAS = [
  { para: '/treino', rotulo: 'Hoje', icone: Dumbbell, fim: true },
  { para: '/treino/calendario', rotulo: 'Calendário', icone: CalendarDays },
  { para: '/treino/fichas', rotulo: 'Fichas', icone: ListChecks },
  { para: '/treino/evolucao', rotulo: 'Evolução', icone: ChartNoAxesColumn },
  { para: '/treino/exercicios', rotulo: 'Exercícios', icone: BookOpenText },
]

export default function TreinoApp() {
  const [perfil, setPerfil] = useState(false)
  return (
    <ShellModulo
      titulo="Treino"
      abas={ABAS}
      direita={
        <button className="btn-icone" onClick={() => setPerfil(true)} aria-label="Perfil de treino">
          <Settings2 aria-hidden />
        </button>
      }
    >
      <TreinoProvider>
        <Routes>
          <Route index element={<Hoje />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="fichas" element={<Fichas />} />
          <Route path="evolucao" element={<Evolucao />} />
          <Route path="exercicios" element={<Exercicios />} />
          <Route path="sessao/:id" element={<SessaoTela />} />
          <Route path="*" element={<Hoje />} />
        </Routes>
        {perfil && <FolhaPerfil aoFechar={() => setPerfil(false)} />}
      </TreinoProvider>
    </ShellModulo>
  )
}
