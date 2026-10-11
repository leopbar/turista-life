import { Global, css } from '@emotion/react'
import tw, { GlobalStyles as BaseStyles } from 'twin.macro'

const custom = css`
  html { scroll-behavior: smooth; scroll-padding-top: 88px; }
  body {
    ${tw`bg-cream font-sans text-ink antialiased`}
  }
  :focus-visible { ${tw`outline-none ring-2 ring-sun-500 ring-offset-2`} }
  /* Luz verde de "online": só a opacidade de um brilho já desenhado sobe e desce, devagar. */
  @keyframes live-glow {
    0%, 100% { opacity: .25; }
    50% { opacity: 1; }
  }
  .live-glow {
    animation: live-glow 2.6s ease-in-out infinite;
    will-change: opacity;
  }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    /* Animações rodam uma vez só. Sem o iteration-count, uma animação infinita com 0,01ms pisca sem parar. */
    *, *::before, *::after {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .01ms !important;
    }
    /* A luz de "online" não se move nem muda de tamanho: só esmaece. Por isso continua pulsando. */
    .live-glow {
      animation-duration: 2.6s !important;
      animation-iteration-count: infinite !important;
    }
  }
`

export default function GlobalStyles() {
  return (
    <>
      <BaseStyles />
      <Global styles={custom} />
    </>
  )
}
