import { FlaskConical } from 'lucide-react'

export function AvisoPrototipo({ aoRecomecar }: { aoRecomecar: () => void }) {
  return (
    <aside className="pt-aviso">
      <FlaskConical aria-hidden />
      <p>
        <b>Protótipo.</b> Já dá para usar, mas os dados ficam só neste aparelho. Me diga o que mudar e eu ligo no banco.
      </p>
      <button
        className="btn-link"
        onClick={() => window.confirm('Apagar o que você testou e voltar aos exemplos?') && aoRecomecar()}
      >
        Recomeçar
      </button>
    </aside>
  )
}
