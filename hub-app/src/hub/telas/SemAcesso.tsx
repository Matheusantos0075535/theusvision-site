import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../auth'
import { LayoutAcesso } from '../LayoutAcesso'

export function SemAcesso() {
  const { sessao, sair, falhaAoVerificar, recarregarAcesso } = useAuth()
  return (
    <LayoutAcesso
      titulo={falhaAoVerificar ? 'Não deu para verificar seu acesso' : 'Acesso não liberado'}
      apoio={
        falhaAoVerificar
          ? 'Houve uma falha de conexão ao checar sua permissão. Tente de novo.'
          : `A conta ${sessao?.user.email ?? ''} não está na lista de acesso do TheusVision Hub. Se isso for um engano, fale com quem administra o sistema.`
      }
    >
      <div className="envelope" aria-hidden style={{ marginTop: 22 }}>
        <ShieldAlert />
      </div>
      <div className="acesso-acoes">
        {falhaAoVerificar && (
          <button className="btn btn-primario btn-grande" onClick={() => void recarregarAcesso()}>
            Tentar de novo
          </button>
        )}
        <button className="btn btn-secundario btn-grande" onClick={() => void sair()}>
          Sair
        </button>
      </div>
    </LayoutAcesso>
  )
}
