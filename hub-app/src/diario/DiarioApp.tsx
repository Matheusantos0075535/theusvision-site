import { CalendarDays, ListTree, PenLine } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'
import { ShellModulo } from '../components/compartilhado/ShellModulo'
import '../modulos/dia/dia.css'
import '../modulos/ideias/ideias.css'
import '../modulos/prototipo/prototipo.css'
import './diario.css'
import { EditorTela } from './Editor'
import { Calendario, Entradas, Hoje } from './Telas'

const ABAS = [
  { para: '/diario', rotulo: 'Escrever', icone: PenLine, fim: true },
  { para: '/diario/calendario', rotulo: 'Calendário', icone: CalendarDays },
  { para: '/diario/entradas', rotulo: 'Entradas', icone: ListTree },
]

function ComMenu() {
  return (
    <ShellModulo titulo="Diário" abas={ABAS}>
      <Routes>
        <Route index element={<Hoje />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="entradas" element={<Entradas />} />
        <Route path="*" element={<Hoje />} />
      </Routes>
    </ShellModulo>
  )
}

/** O diário não é um módulo: é uma função do Hub, com tela própria para escrever. */
export default function DiarioApp() {
  return (
    <Routes>
      <Route path="escrever" element={<EditorTela />} />
      <Route path="e/:id" element={<EditorTela />} />
      <Route path="*" element={<ComMenu />} />
    </Routes>
  )
}
