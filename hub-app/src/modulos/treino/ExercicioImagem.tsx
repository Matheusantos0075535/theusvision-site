import { Dumbbell } from 'lucide-react'
import { useState } from 'react'
import { EXERCICIO } from './catalogo'

const base = `${import.meta.env.BASE_URL}treino/`

/** Dois quadros do exercício alternando, como um GIF leve. Com movimento reduzido, fica parado no primeiro. */
export function ExercicioImagem({ id, tamanho = 'medio' }: { id: string; tamanho?: 'mini' | 'medio' | 'grande' }) {
  const [falhou, setFalhou] = useState(false)
  const ex = EXERCICIO[id]
  if (!ex || falhou) {
    return (
      <span className={`ex-img ex-img-${tamanho} ex-img-vazia`} aria-hidden>
        <Dumbbell />
      </span>
    )
  }
  return (
    <span className={`ex-img ex-img-${tamanho}`} role="img" aria-label={`Demonstração: ${ex.nome}`}>
      <img src={`${base}${id}-0.webp`} alt="" loading="lazy" decoding="async" onError={() => setFalhou(true)} />
      <img src={`${base}${id}-1.webp`} alt="" loading="lazy" decoding="async" className="ex-img-2" />
    </span>
  )
}
