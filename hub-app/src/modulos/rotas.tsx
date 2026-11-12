import { lazy, Suspense, type ReactNode } from 'react'

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
  { caminho: '/dnsmk/*', elemento: <Lento><DnsmkApp /></Lento> },
  { caminho: '/leitura/*', elemento: <Lento><LeituraApp /></Lento> },
]
