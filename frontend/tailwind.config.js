/** @type {import('tailwindcss').Config} */
export default {
  // Habilitar dark mode vía atributo data-theme en el elemento raíz
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  'hsl(222, 100%, 97%)',
          100: 'hsl(222, 96%, 92%)',
          200: 'hsl(222, 91%, 84%)',
          300: 'hsl(222, 84%, 73%)',
          400: 'hsl(222, 78%, 62%)',
          500: 'hsl(222, 72%, 50%)',  // Color principal
          600: 'hsl(222, 72%, 42%)',
          700: 'hsl(222, 72%, 34%)',
          800: 'hsl(222, 72%, 26%)',
          900: 'hsl(222, 72%, 18%)',
        },
        surface: {
          0:   'hsl(0, 0%, 100%)',
          50:  'hsl(220, 20%, 98%)',
          100: 'hsl(220, 17%, 95%)',
          200: 'hsl(220, 14%, 90%)',
          800: 'hsl(222, 20%, 14%)',
          900: 'hsl(222, 22%, 10%)',
          950: 'hsl(222, 25%, 7%)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/forms'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          'primary': 'hsl(222, 72%, 50%)',
          'primary-content': '#ffffff',
          'secondary': 'hsl(262, 72%, 55%)',
          'secondary-content': '#ffffff',
          'accent': 'hsl(33, 100%, 55%)',
          'accent-content': '#ffffff',
          'neutral': 'hsl(222, 14%, 90%)',
          'base-100': 'hsl(0, 0%, 100%)',
          'base-200': 'hsl(220, 20%, 98%)',
          'base-300': 'hsl(220, 17%, 95%)',
          'base-content': 'hsl(222, 22%, 10%)',
          'info': 'hsl(200, 90%, 50%)',
          'success': 'hsl(145, 65%, 40%)',
          'warning': 'hsl(38, 95%, 50%)',
          'error': 'hsl(355, 80%, 52%)',
        },
        dark: {
          'primary': 'hsl(222, 72%, 60%)',
          'primary-content': '#ffffff',
          'secondary': 'hsl(262, 72%, 65%)',
          'secondary-content': '#ffffff',
          'accent': 'hsl(33, 100%, 60%)',
          'accent-content': 'hsl(222, 22%, 10%)',
          'neutral': 'hsl(222, 20%, 20%)',
          'base-100': 'hsl(222, 22%, 10%)',
          'base-200': 'hsl(222, 20%, 14%)',
          'base-300': 'hsl(222, 18%, 18%)',
          'base-content': 'hsl(220, 17%, 95%)',
          'info': 'hsl(200, 80%, 60%)',
          'success': 'hsl(145, 60%, 50%)',
          'warning': 'hsl(38, 90%, 55%)',
          'error': 'hsl(355, 75%, 60%)',
        },
      },
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
}
