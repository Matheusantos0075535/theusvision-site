import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { MODULOS } from '../hub/modulos'
import { supabase } from './supabase'

/** Sem mexer por 3 minutos = parou de usar (tela aberta esquecida não conta). */
const OCIOSO_MS = 3 * 60_000
const ENVIO_MS = 30_000

/** Descobre o módulo pela rota (/dia/despejo → dia). */
export function moduloDaRota(pathname: string) {
  const base = '/' + (pathname.split('/').filter(Boolean)[0] ?? '')
  return MODULOS.find((m) => m.rota === base)?.id ?? null
}

/**
 * Conta o tempo em que você está de fato dentro de um módulo: aba visível e com alguma interação
 * nos últimos minutos. A tela inicial do Hub não conta. Envia em pacotes pequenos ao banco.
 */
export function useRegistrarUso() {
  const { pathname } = useLocation()
  const modulo = moduloDaRota(pathname)

  useEffect(() => {
    if (!modulo) return
    let ultimoToque = Date.now()
    let marca = Date.now()
    let acumulado = 0

    const contar = () => {
      const agora = Date.now()
      if (!document.hidden && agora - ultimoToque < OCIOSO_MS) acumulado += agora - marca
      marca = agora
    }
    const enviar = () => {
      contar()
      const s = Math.floor(acumulado / 1000)
      if (s < 1) return
      acumulado -= s * 1000
      void supabase.rpc('hub_registrar_uso', { p_modulo: modulo, p_segundos: Math.min(600, s) }).then(({ error }) => {
        // Sem a migração ainda, só deixa de registrar.
        if (error && import.meta.env.DEV) console.debug('uso não registrado', error.message)
      })
    }
    const tocou = () => {
      contar()
      ultimoToque = Date.now()
    }
    const visibilidade = () => (document.hidden ? enviar() : ((marca = Date.now()), (ultimoToque = Date.now())))
    const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const
    eventos.forEach((e) => window.addEventListener(e, tocou, { passive: true, capture: true }))
    document.addEventListener('visibilitychange', visibilidade)
    window.addEventListener('pagehide', enviar)
    const t = window.setInterval(enviar, ENVIO_MS)
    return () => {
      enviar()
      window.clearInterval(t)
      eventos.forEach((e) => window.removeEventListener(e, tocou, { capture: true }))
      document.removeEventListener('visibilitychange', visibilidade)
      window.removeEventListener('pagehide', enviar)
    }
  }, [modulo])
}
