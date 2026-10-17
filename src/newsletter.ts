import { useState, type FormEvent } from 'react'

/** Formulário incorporado "Card newsletter site" no MailerLite da Laura (grupo Newsletter site). */
const MAILERLITE_ENDPOINT = 'https://assets.mailerlite.com/jsonp/2510968/forms/201560921696372690/subscribe'

/** Nome do campo-armadilha: invisível para pessoas, robôs costumam preencher. */
export const HONEYPOT_NAME = 'website'

export type NewsletterStatus = 'idle' | 'sending' | 'done' | 'invalid' | 'error'

type MailerLiteResponse = { success?: boolean; errors?: { fields?: { email?: string[] } } }

async function subscribe(email: string): Promise<NewsletterStatus> {
  const body = new URLSearchParams({ 'fields[email]': email, 'ml-submit': '1', anticsrf: 'true', ajax: '1' })
  try {
    const res = await fetch(MAILERLITE_ENDPOINT, { method: 'POST', body })
    const data = (await res.json()) as MailerLiteResponse
    if (data.success) return 'done'
    return data.errors?.fields?.email ? 'invalid' : 'error'
  } catch {
    return 'error'
  }
}

/** Estado e envio compartilhados pelo card da home e pelo campo do rodapé. */
export function useNewsletter() {
  const [status, setStatus] = useState<NewsletterStatus>('idle')

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return
    const form = new FormData(e.currentTarget)
    // Robô caiu na armadilha: finge sucesso e não envia nada.
    if (String(form.get(HONEYPOT_NAME) ?? '')) return setStatus('done')
    setStatus('sending')
    setStatus(await subscribe(String(form.get('email') ?? '').trim()))
  }

  return { status, submit }
}
