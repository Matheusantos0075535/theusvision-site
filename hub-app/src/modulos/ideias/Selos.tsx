import { CalendarClock, Globe, Music2 } from 'lucide-react'
import { diferencaDias, formatarDataCurta, hojeBrasiliaIso } from '../../lib/tempo'
import { ROTULO_LINK, tipoDoLink } from './link'

/** Ícones simples desenhados aqui (sem logos oficiais). */
function Camera() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
function Play() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconeLink({ url }: { url: string }) {
  const t = tipoDoLink(url)
  return (
    <span className="id-link-selo" data-tipo={t}>
      {t === 'instagram' ? <Camera /> : t === 'youtube' ? <Play /> : t === 'tiktok' ? <Music2 aria-hidden /> : <Globe aria-hidden />}
      {ROTULO_LINK[t]}
    </span>
  )
}

export function rotuloData(dia: string) {
  const d = diferencaDias(dia, hojeBrasiliaIso())
  if (d === 0) return 'Hoje'
  if (d === 1) return 'Amanhã'
  if (d === -1) return 'Ontem'
  if (d < 0) return `Atrasada · ${formatarDataCurta(dia)}`
  if (d < 7) return `Em ${d} dias`
  return formatarDataCurta(dia)
}

export function SeloData({ dia, feita }: { dia: string; feita?: boolean }) {
  const atrasada = !feita && dia < hojeBrasiliaIso()
  return (
    <span className="id-data" data-atrasada={atrasada || undefined}>
      <CalendarClock aria-hidden />
      {rotuloData(dia)}
    </span>
  )
}
