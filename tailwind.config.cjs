/** Identidade Turista Life: verde-petróleo, laranja de ação, off-white quente. */
module.exports = {
  theme: {
    extend: {
      colors: {
        pine: {
          950: '#082624',
          900: '#0B302E',
          800: '#0F3D3A',
          700: '#155450',
          600: '#1E6A64',
        },
        sun: {
          500: '#F07A2A',
          600: '#DD6719',
        },
        cream: '#F8F6F1',
        mist: '#E8EFEC',
        ink: '#152321',
        muted: '#5B6A67',
        line: '#E2E6E1',
      },
      fontFamily: {
        script: ['"Caveat Brush"', 'cursive'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,48,46,.06), 0 12px 32px -16px rgba(11,48,46,.18)',
        lift: '0 2px 4px rgba(11,48,46,.08), 0 24px 48px -20px rgba(11,48,46,.32)',
      },
      maxWidth: { site: '1200px' },
    },
  },
  plugins: [],
}
