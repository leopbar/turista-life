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
    case 'conteudo_publicado':
      return { text: `${who} publicou ${t}`, tone: 'ok' }
    case 'conteudo_restaurado':
      return { text: `${who} voltou uma versão de ${t}`, tone: 'info' }
    case 'conteudo_criado':
      return { text: `${who} criou ${t}`, tone: 'ok' }
    case 'conteudo_marcado_para_sair':
      return { text: `${who} marcou ${t} para sair do site`, tone: 'info' }
    case 'rascunho_descartado':
      return { text: `${who} descartou o rascunho de ${t}`, tone: 'info' }
    case 'ordem_alterada':
      return { text: `${who} mudou a ordem de ${t}`, tone: 'info' }
    case 'publicacao_agendada':
      return { text: `${who} agendou a publicação de ${t}`, tone: 'info' }
    case 'agendamento_cancelado':
      return { text: `${who} cancelou o agendamento de ${t}`, tone: 'info' }
    case 'agendamento_falhou':
      return { text: `A publicação agendada de ${t} não aconteceu: ${String(a.details.motivo ?? '')}`, tone: 'warn' }
    case 'foto_enviada':
      return { text: `${who} enviou a foto ${t}`, tone: 'ok' }
    case 'foto_alterada':
      return { text: `${who} ajustou a foto ${t}`, tone: 'info' }
    case 'foto_na_lixeira':
      return { text: `${who} mandou a foto ${t} para a lixeira`, tone: 'info' }
    case 'foto_restaurada':
      return { text: `${who} recuperou a foto ${t}`, tone: 'info' }
    case 'backup_criado':
    case 'backup_baixado':
      return { text: `${who} baixou um backup do site`, tone: 'ok' }
    case 'backup_falhou':
      return { text: 'O backup diário falhou', tone: 'warn' }
    case 'conta_bloqueada':
      return { text: `Muitas senhas erradas na conta ${t}: ela ficou em espera`, tone: 'warn' }
    case 'ip_bloqueado':
      return { text: `O endereço ${t} errou senhas demais e foi bloqueado por um tempo`, tone: 'warn' }
    case 'admin_criado':
      return { text: `${who} criou o administrador ${t}`, tone: 'warn' }
    case 'admin_promovido':
      return { text: `${who} tornou ${t} administrador(a)`, tone: 'warn' }
    case 'registro_adulterado':
      return { text: 'A conferência diária encontrou alteração no registro de atividades', tone: 'warn' }
    case 'recuperacao_de_emergencia':
      return { text: `Recuperação de emergência pelo servidor para ${t}`, tone: 'warn' }
    default:
      return { text: `${who}: ${a.action}`, tone: 'info' }
  }
}
