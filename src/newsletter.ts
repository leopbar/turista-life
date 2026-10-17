import { useState, type FormEvent } from 'react'
import { newsletter } from './content'
import { isMailerliteForm } from './cms/mailerlite'

/** Nome do campo-armadilha: invisível para pessoas, robôs costumam preencher. */
export const HONEYPOT_NAME = 'website'

export type NewsletterStatus = 'idle' | 'sending' | 'done' | 'invalid' | 'error'

type MailerLiteResponse = { success?: boolean; errors?: { fields?: { email?: string[] } } }

async function subscribe(endpoint: string, email: string): Promise<NewsletterStatus> {
  if (!isMailerliteForm(endpoint)) return 'error'
  const body = new URLSearchParams({ 'fields[email]': email, 'ml-submit': '1', anticsrf: 'true', ajax: '1' })
  try {
    const res = await fetch(endpoint, { method: 'POST', body })
    const data = (await res.json()) as MailerLiteResponse
    if (data.success) return 'done'
    return data.errors?.fields?.email ? 'invalid' : 'error'
  } catch {
    return 'error'
  }
}

/**
 * Estado e envio para um formulário do MailerLite (configurado no painel).
 * Sem endereço, usa o da newsletter: card da home e campo do rodapé.
 */
export function useNewsletter(endpoint: string = newsletter.form) {
  const [status, setStatus] = useState<NewsletterStatus>('idle')

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return
    const form = new FormData(e.currentTarget)
    // Robô caiu na armadilha: finge sucesso e não envia nada.
    if (String(form.get(HONEYPOT_NAME) ?? '')) return setStatus('done')
    setStatus('sending')
    setStatus(await subscribe(endpoint, String(form.get('email') ?? '').trim()))
  }

  return { status, submit }
}
