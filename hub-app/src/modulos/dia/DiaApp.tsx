import { CalendarCheck, ListChecks, NotebookPen } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'
import { ShellModulo } from '../../components/compartilhado/ShellModulo'
import { DiaProvider } from './dados'
import './dia.css'
import { Despejo } from './telas/Despejo'
import { Hoje } from './telas/Hoje'
import { Rotinas } from './telas/Rotinas'

const ABAS = [
  { para: '/dia', rotulo: 'Hoje', icone: CalendarCheck, fim: true },
  { para: '/dia/despejo', rotulo: 'Despejo', icone: NotebookPen },
  { para: '/dia/rotinas', rotulo: 'Rotinas', icone: ListChecks },
]

export default function DiaApp() {
  return (
    <ShellModulo titulo="Meu dia" abas={ABAS}>
      <DiaProvider>
        <Routes>
          <Route index element={<Hoje />} />
          <Route path="despejo" element={<Despejo />} />
          <Route path="rotinas" element={<Rotinas />} />
          <Route path="*" element={<Hoje />} />
        </Routes>
      </DiaProvider>
    </ShellModulo>
  )
}
