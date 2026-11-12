import { lazy, Suspense, type ReactNode } from 'react'

const DiaApp = lazy(() => import('./dia/DiaApp'))
const TreinoApp = lazy(() => import('./treino/TreinoApp'))
const IdeiasApp = lazy(() => import('./ideias/IdeiasApp'))
const FinancasApp = lazy(() => import('./financas/FinancasApp'))
const CasaApp = lazy(() => import('./casa/CasaApp'))
const EstudosApp = lazy(() => import('./estudos/EstudosApp'))
const ClientesApp = lazy(() => import('./work/ClientesApp'))
const ReceitaApp = lazy(() => import('./work/ReceitaApp'))
const ProcessosApp = lazy(() => import('./work/ProcessosApp'))
const VisaoApp = lazy(() => import('./work/VisaoApp'))
const DnsmkApp = lazy(() => import('./dnsmk/DnsmkApp'))
const LeituraApp = lazy(() => import('./leitura/LeituraApp'))

function Lento({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="carregando" role="status" aria-label="Carregando">
          <span className="giro" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

export const ROTAS_MODULOS: { caminho: string; elemento: ReactNode }[] = [
  { caminho: '/dia/*', elemento: <Lento><DiaApp /></Lento> },
  { caminho: '/treino/*', elemento: <Lento><TreinoApp /></Lento> },
  { caminho: '/ideias/*', elemento: <Lento><IdeiasApp /></Lento> },
  { caminho: '/financas/*', elemento: <Lento><FinancasApp /></Lento> },
  { caminho: '/casa/*', elemento: <Lento><CasaApp /></Lento> },
  { caminho: '/estudos/*', elemento: <Lento><EstudosApp /></Lento> },
  { caminho: '/clientes/*', elemento: <Lento><ClientesApp /></Lento> },
  { caminho: '/receita/*', elemento: <Lento><ReceitaApp /></Lento> },
  { caminho: '/construcao/*', elemento: <Lento><ProcessosApp /></Lento> },
  { caminho: '/visao/*', elemento: <Lento><VisaoApp /></Lento> },
  { caminho: '/dnsmk/*', elemento: <Lento><DnsmkApp /></Lento> },
  { caminho: '/leitura/*', elemento: <Lento><LeituraApp /></Lento> },
]
