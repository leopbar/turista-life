import type { SVGProps } from 'react'

/** Ícones de traço do painel (24×24, cor herdada do texto). */
const Icon = ({ children, ...props }: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {children}
  </svg>
)

export const Camera = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Icon>
)
export const Notebook = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M6 3h12v18H6z" /><path d="M9 3v18M12 8h4M12 12h4" /></Icon>
)
export const Pen = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M14 6l3 3" /></Icon>
)
export const Tag = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.3" /></Icon>
)
export const Compass = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></Icon>
)
export const Users = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.6-3.4 3-5 6-5s5.4 1.6 6 5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 15c2.6 0 4.4 1.3 5 4" /></Icon>
)
export const Route = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h6a3 3 0 000-6h-4a3 3 0 010-6h6" strokeDasharray="2 3" /></Icon>
)
export const Search = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></Icon>
)
export const Eye = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>
)
export const EyeOff = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.5 4.5-1.2" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></Icon>
)
export const Copy = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /></Icon>
)
export const Check = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>
)
export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
)
export const Key = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l2 2M15 8l2 2" /></Icon>
)
export const Logout = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" /></Icon>
)
export const Close = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>
)
export const Lock = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></Icon>
)
export const Shield = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></Icon>
)
export const Arrow = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
)
export const Back = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Icon>
)
export const House = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 11l8-7 8 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></Icon>
)
export const User = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-3.8 3.4-5.5 7-5.5s6.3 1.7 7 5.5" /></Icon>
)
export const Book = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4c-3.5 0-6 .5-8 2z" /><path d="M12 6v14" /></Icon>
)
export const Suitcase = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M9 7V5h6v2M9 7v12M15 7v12" /></Icon>
)
export const Megaphone = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M3 10v4h3l9 5V5l-9 5z" /><path d="M18.5 9a3.5 3.5 0 010 6M6 14l1.5 5h2.5l-1-4.5" /></Icon>
)
export const Sparkle = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M18.5 16v4M16.5 18h4" /></Icon>
)
export const Globe = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></Icon>
)
