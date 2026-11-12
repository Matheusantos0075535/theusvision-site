import { BookMarked, ChartNoAxesColumn, House, Library, Settings2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Carregando, ErroCarregar, ShellModulo } from '../../components/compartilhado/ShellModulo'
import { FolhaAjustes } from './Ajustes'
import { LeituraProvider, useLeitura } from './dados'
import './leitura.css'
import { SessaoLeitura } from './SessaoLeitura'
import { Biblioteca } from './telas/Biblioteca'
import { Caderno } from './telas/Caderno'
import { Hoje } from './telas/Hoje'
import { LivroDetalhe } from './telas/LivroDetalhe'
import { LivroForm } from './telas/LivroForm'
import { Progresso } from './telas/Progresso'

const ABAS = [
  { para: '/leitura', rotulo: 'Hoje', icone: House, fim: true },
  { para: '/leitura/biblioteca', rotulo: 'Biblioteca', icone: Library },
  { para: '/leitura/caderno', rotulo: 'Caderno', icone: BookMarked },
  { para: '/leitura/progresso', rotulo: 'Progresso', icone: ChartNoAxesColumn },
]

function Conteudo() {
  const { estado, livros, erro, recarregar } = useLeitura()
  const [sessao, setSessao] = useState<{ livro?: string } | null>(null)
  const [ajustes, setAjustes] = useState(false)
  const registrar = useCallback((livro?: string) => setSessao({ livro }), [])

  return (
    <ShellModulo
      titulo="Leitura"
      abas={ABAS}
      direita={
        <button className="btn-icone le-engrenagem" onClick={() => setAjustes(true)} aria-label="Ajustes da leitura">
          <Settings2 aria-hidden />
        </button>
      }
    >
      {erro ? (
        <ErroCarregar mensagem={erro} tentar={recarregar} />
      ) : !estado || !livros ? (
        <Carregando />
      ) : (
        <Routes>
          <Route index element={<Hoje aoRegistrar={registrar} />} />
          <Route path="biblioteca" element={<Biblioteca />} />
          <Route path="novo" element={<LivroForm />} />
          <Route path="livro/:id" element={<LivroDetalhe aoRegistrar={registrar} />} />
          <Route path="livro/:id/editar" element={<LivroForm />} />
          <Route path="caderno" element={<Caderno />} />
          <Route path="progresso" element={<Progresso />} />
          <Route path="*" element={<Hoje aoRegistrar={registrar} />} />
        </Routes>
      )}
      {sessao && <SessaoLeitura livroInicial={sessao.livro} aoFechar={() => setSessao(null)} />}
      {ajustes && <FolhaAjustes aoFechar={() => setAjustes(false)} />}
    </ShellModulo>
  )
}

export default function LeituraApp() {
  return (
    <LeituraProvider>
      <Conteudo />
    </LeituraProvider>
  )
}
