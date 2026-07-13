import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#07080B',
          900: '#0D0F14',
          800: '#14171F',
          700: '#1D212B',
        },
        gold: {
          400: '#E8C878',
          500: '#D4AF61',
          600: '#B8924A',
        },
        ink: {
          100: '#F5F5F2',
          300: '#C9CBD1',
          500: '#8A8D98',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
