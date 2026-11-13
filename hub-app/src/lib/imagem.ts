/** Reduz a imagem para no máximo `lado` px e converte para JPEG, para caber no limite do bucket. */
export async function comprimirImagem(arquivo: File, lado = 720, qualidade = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo)
  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * escala)
  const h = Math.round(bitmap.height * escala)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Sem suporte a imagem')
  // Fundo branco: PNG transparente (print) não fica preto ao virar JPEG.
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return new Promise((resolver, rejeitar) =>
    canvas.toBlob((b) => (b ? resolver(b) : rejeitar(new Error('Falha ao converter imagem'))), 'image/jpeg', qualidade),
  )
}
