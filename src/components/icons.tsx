import type { SVGProps } from 'react'

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p,
})

export const Arrow = (p: SVGProps<SVGSVGElement>) => <svg {...base({ width: 16, height: 16, ...p })}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
export const Play = (p: SVGProps<SVGSVGElement>) => <svg {...base({ ...p, fill: 'currentColor', stroke: 'none' })}><path d="M8 5.5v13l10.5-6.5z" /></svg>
export const Search = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
export const Menu = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
export const Close = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>
export const Pin = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
export const Mountain = (p: SVGProps<SVGSVGElement>) => <svg {...base({ width: 40, height: 40, strokeWidth: 1.4, ...p })}><path d="M2 20l7-12 4 6 3-4 6 10z" /><path d="M7 11.5l2 1.5 2-2" /><path d="M14.5 12.5l1.5 1 1-1.5" /></svg>
export const Copy = (p: SVGProps<SVGSVGElement>) => <svg {...base({ width: 16, height: 16, ...p })}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></svg>
export const Check = (p: SVGProps<SVGSVGElement>) => <svg {...base({ width: 16, height: 16, ...p })}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
export const Lock = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
export const Crown = (p: SVGProps<SVGSVGElement>) => <svg {...base({ width: 18, height: 18, ...p })}><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" /></svg>
export const Mail = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
export const Users = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6" /></svg>

export const Instagram = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></svg>
export const YouTube = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9l5 3-5 3z" fill="currentColor" /></svg>
export const TikTok = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M14 3v11.5a4 4 0 11-4-4" /><path d="M14 3c.6 3 2.6 5 6 5" /></svg>

/* recomendações */
export const RecIcon = {
  card: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19M6 15h4" /></svg>,
  ticket: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4z" /><path d="M14 6v12" strokeDasharray="2 2" /></svg>,
  plane: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M10.5 13.5L3 11l1.5-1.5 8 .5 4.5-4.5a2 2 0 013 3L15.5 13l.5 8L14.5 22.5 12 15z" /></svg>,
  bed: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 00-3-3h-7v6" /><circle cx="7" cy="11" r="2" /></svg>,
  laptop: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 19h20" /></svg>,
  sim: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M7 2.5h7l4.5 4.5v13a1.5 1.5 0 01-1.5 1.5H7A1.5 1.5 0 015.5 20V4A1.5 1.5 0 017 2.5z" /><rect x="8.5" y="11" width="7" height="7" rx="1" /><path d="M12 11v7M8.5 14.5h7" /></svg>,
  shield: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M12 2.5l7.5 3v6c0 4.6-3.2 8.4-7.5 10-4.3-1.6-7.5-5.4-7.5-10v-6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>,
  car: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M3.5 16.5v-4l2-5.5A2 2 0 017.4 5.5h9.2a2 2 0 011.9 1.5l2 5.5v4" /><path d="M2.5 12.5h19v4a1 1 0 01-1 1h-17a1 1 0 01-1-1z" /><path d="M5.5 17.5V20M18.5 17.5V20" /><circle cx="7" cy="15" r=".8" fill="currentColor" /><circle cx="17" cy="15" r=".8" fill="currentColor" /></svg>,
  passport: (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="5" y="2.5" width="14" height="19" rx="2" /><circle cx="12" cy="10" r="3.5" /><path d="M9 17h6" /></svg>,
}
