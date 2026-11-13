import { CalendarClock, HandCoins, Hourglass, PiggyBank, Wallet } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'
import { ShellModulo } from '../../components/compartilhado/ShellModulo'
import '../dia/dia.css'
import '../prototipo/prototipo.css'
import { FinProvider } from './dados'
import './financas.css'
import { Dividas } from './telas/Dividas'
import { Fixas } from './telas/Fixas'
import { Freio } from './telas/Freio'
import { Futuro } from './telas/Futuro'
import { Mes } from './telas/Mes'

const ABAS = [
  { para: '/financas', rotulo: 'Mês', icone: Wallet, fim: true },
  { para: '/financas/fixas', rotulo: 'Fixas', icone: CalendarClock },
  { para: '/financas/freio', rotulo: 'Freio', icone: Hourglass },
  { para: '/financas/dividas', rotulo: 'Dívidas', icone: HandCoins },
  { para: '/financas/metas', rotulo: 'Futuro', icone: PiggyBank },
]

// O protótipo antigo guardava dados de exemplo neste aparelho; agora tudo vem do banco.
try {
  localStorage.removeItem('tv-proto-financas')
} catch {
  /* sem armazenamento */
}

export default function FinancasApp() {
  return (
    <ShellModulo titulo="Finanças" abas={ABAS}>
      <FinProvider>
        <Routes>
          <Route index element={<Mes />} />
          <Route path="fixas" element={<Fixas />} />
          <Route path="freio" element={<Freio />} />
          <Route path="dividas" element={<Dividas />} />
          <Route path="metas" element={<Futuro />} />
          <Route path="*" element={<Mes />} />
        </Routes>
      </FinProvider>
    </ShellModulo>
  )
}
