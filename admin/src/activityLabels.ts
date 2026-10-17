import type { ActivityItem } from './api'

/** Cada ação do registro contada como frase, no jeito de falar do painel. */
export function describe(a: ActivityItem): { text: string; tone: 'ok' | 'warn' | 'info' } {
  const who = a.actorEmail ?? 'Alguém'
  const t = a.target ?? ''
  const papel = (v: unknown) => (v === 'admin' ? 'Administrador' : 'Editor')
  switch (a.action) {
    case 'login':
      return { text: `${who} entrou no painel`, tone: 'info' }
    case 'logout':
      return { text: `${who} saiu do painel`, tone: 'info' }
    case 'login_falhou':
      return a.details.motivo === 'senha_provisoria_expirada'
        ? { text: `${who} tentou entrar com uma senha provisória vencida`, tone: 'warn' }
        : { text: `Tentativa de login sem sucesso com ${who}`, tone: 'warn' }
    case 'senha_criada':
      return { text: `${who} criou a própria senha no primeiro acesso`, tone: 'ok' }
    case 'senha_alterada':
      return { text: `${who} trocou a própria senha`, tone: 'ok' }
    case 'troca_senha_falhou':
      return { text: `${who} errou a senha atual ao tentar trocá-la`, tone: 'warn' }
    case 'usuario_criado':
      return { text: `${who} convidou ${t} como ${papel(a.details.papel)}`, tone: 'ok' }
    case 'usuario_alterado': {
      const d = a.details as Record<string, [string, string]>
      if (d.papel) return { text: `${who} mudou o papel de ${t} para ${papel(d.papel[1])}`, tone: 'info' }
      return { text: `${who} mudou o nome de ${t}`, tone: 'info' }
    }
    case 'senha_provisoria_gerada':
      return { text: `${who} gerou uma senha provisória nova para ${t}`, tone: 'info' }
    case 'usuario_desativado':
      return { text: `${who} desativou o acesso de ${t}`, tone: 'warn' }
    case 'usuario_reativado':
      return { text: `${who} reativou o acesso de ${t}`, tone: 'ok' }
    case 'usuario_excluido':
      return { text: `${who} excluiu ${t}`, tone: 'warn' }
    case 'recuperacao_de_emergencia':
      return { text: `Recuperação de emergência pelo servidor para ${t}`, tone: 'warn' }
    default:
      return { text: `${who}: ${a.action}`, tone: 'info' }
  }
}
