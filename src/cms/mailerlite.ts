/**
 * Formulário incorporado do MailerLite: o site envia o e-mail para o endereço de envio dele.
 * O mesmo padrão é conferido pelo servidor do painel (server/painel/cms_schema.py).
 */
const ENDPOINT = /https:\/\/assets\.mailerlite\.com\/jsonp\/\d+\/forms\/\d+\/subscribe/

export const isMailerliteForm = (v: string) => new RegExp(`^${ENDPOINT.source}$`).test(v)

/** Aceita o código HTML inteiro do formulário ou só o endereço, e devolve só o endereço de envio. */
export const mailerliteEndpoint = (raw: string) => raw.match(ENDPOINT)?.[0] ?? raw.trim()
