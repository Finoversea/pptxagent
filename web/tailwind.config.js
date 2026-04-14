/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PwC brand colors
        pwc: {
          orange: '#FD5108',
          orange400: '#FE7C39',
          orange300: '#FFAA72',
          orange200: '#FFCDA8',
          orange100: '#FFE8D4',
          gray500: '#A1A8B3',
          gray300: '#CBD1D6',
          gray200: '#DFE3E6',
          gray100: '#EEEFF1',
        },
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica Neue', 'sans-serif'],
        serif: ['Georgia', 'ITC Charter', 'serif'],
      },
    },
  },
  plugins: [],
}