// Só exibição. Toda regra que depende do "dia" é calculada no banco (hub_hoje()).
export const FUSO = 'America/Sao_Paulo'

function partes(data: Date) {
  const p = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data)
  const v = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0)
  return { hora: v('hour'), minuto: v('minute') }
}

export function saudacao(data = new Date()) {
  const { hora } = partes(data)
  if (hora >= 5 && hora < 12) return 'Bom dia'
  if (hora >= 12 && hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function horaBrasilia(data = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' }).format(data)
}

export function dataBrasiliaPorExtenso(data = new Date()) {
  const s = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(data)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Converte 'AAAA-MM-DD' (data do banco) em Date ao meio-dia UTC, para não pular de dia. */
export function dataDoBanco(iso: string) {
  return new Date(`${iso}T12:00:00Z`)
}

export function formatarDataCurta(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short' })
    .format(dataDoBanco(iso))
    .replace('.', '')
}

export function formatarDataLonga(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(
    dataDoBanco(iso),
  )
}

export function diaDaSemana(iso: string) {
  return dataDoBanco(iso).getUTCDay()
}

export function somarDias(iso: string, dias: number) {
  const d = dataDoBanco(iso)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export function diferencaDias(a: string, b: string) {
  return Math.round((dataDoBanco(a).getTime() - dataDoBanco(b).getTime()) / 86_400_000)
}

export function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? nome
}

/** Só para detectar a virada do dia na tela: 'AAAA-MM-DD' em Brasília. A regra de verdade continua no banco. */
export function hojeBrasiliaIso(data = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(data)
}

/** "Quinta-feira, 12 de novembro" para qualquer data do banco. */
export function dataPorExtensoDoBanco(iso: string) {
  const s = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(dataDoBanco(iso))
  return s.charAt(0).toUpperCase() + s.slice(1)
}
