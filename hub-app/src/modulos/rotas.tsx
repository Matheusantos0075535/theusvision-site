import { lazy, Suspense, type ReactNode } from 'react'

const DiaApp = lazy(() => import('./dia/DiaApp'))
const TreinoApp = lazy(() => import('./treino/TreinoApp'))
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
  { caminho: '/dnsmk/*', elemento: <Lento><DnsmkApp /></Lento> },
  { caminho: '/leitura/*', elemento: <Lento><LeituraApp /></Lento> },
]
