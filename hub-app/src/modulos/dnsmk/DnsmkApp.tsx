import { ChartNoAxesColumn, House, Route as IconeTrilha, UserRound } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Carregando, ErroCarregar, ShellModulo } from '../../components/compartilhado/ShellModulo'
import { BotaoAjudaTopo, FolhaAjuda } from './Ajuda'
import { DnsmkProvider, useDnsmk } from './dados'
import './dnsmk.css'
import { Hoje } from './telas/Hoje'
import { Licao } from './telas/Licao'
import { Perfil } from './telas/Perfil'
import { Progresso } from './telas/Progresso'
import { Trilha } from './telas/Trilha'

const ABAS = [
  { para: '/dnsmk', rotulo: 'Hoje', icone: House, fim: true },
  { para: '/dnsmk/trilha', rotulo: 'Trilha', icone: IconeTrilha },
  { para: '/dnsmk/progresso', rotulo: 'Progresso', icone: ChartNoAxesColumn },
  { para: '/dnsmk/perfil', rotulo: 'Perfil', icone: UserRound },
]

function Conteudo() {
  const { estado, erro, recarregar } = useDnsmk()
  const [ajuda, setAjuda] = useState(false)
  const abrirAjuda = useCallback(() => setAjuda(true), [])
  const fecharAjuda = useCallback(() => setAjuda(false), [])

  return (
    <ShellModulo titulo="DuoNoSmkg" abas={ABAS} direita={<BotaoAjudaTopo aoAbrir={abrirAjuda} />}>
      {erro ? (
        <ErroCarregar mensagem={erro} tentar={recarregar} />
      ) : !estado ? (
        <Carregando />
      ) : (
        <Routes>
          <Route index element={<Hoje aoPedirAjuda={abrirAjuda} />} />
          <Route path="trilha" element={<Trilha />} />
          <Route path="licao/:id" element={<Licao />} />
          <Route path="progresso" element={<Progresso />} />
          <Route path="perfil" element={<Perfil aoPedirAjuda={abrirAjuda} />} />
          <Route path="*" element={<Hoje aoPedirAjuda={abrirAjuda} />} />
        </Routes>
      )}
      {ajuda && <FolhaAjuda aoFechar={fecharAjuda} />}
    </ShellModulo>
  )
}

export default function DnsmkApp() {
  return (
    <DnsmkProvider>
      <Conteudo />
    </DnsmkProvider>
  )
}
