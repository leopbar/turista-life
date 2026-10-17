import 'twin.macro'
import { HONEYPOT_NAME } from '../newsletter'

/** Campo-armadilha contra robôs: fora da tela, fora do Tab e escondido de leitores de tela. */
export function NewsletterHoneypot() {
  return (
    <div aria-hidden="true" tw="absolute -left-[9999px] h-px w-px overflow-hidden">
      <input type="text" name={HONEYPOT_NAME} tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  )
}
