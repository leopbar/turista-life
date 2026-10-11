import { Global, css } from '@emotion/react'
import tw, { GlobalStyles as BaseStyles } from 'twin.macro'

const custom = css`
  html { scroll-behavior: smooth; scroll-padding-top: 88px; }
  body {
    ${tw`bg-cream font-sans text-ink antialiased`}
  }
  :focus-visible { ${tw`outline-none ring-2 ring-sun-500 ring-offset-2`} }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
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
