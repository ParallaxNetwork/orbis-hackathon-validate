/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: false,
    fontFamily: {
      title: ['MuseoModerno', 'cursive'],
      body: ['Supreme', 'sans-serif']
    },
    fontSize: {
      small: '12px',
      base: '16px',
      medium: '18px',
      large: '20px',
      xlarge: '24px',
      '2xlarge': '32px'
    },
    colors: {
      white: '#FFFFFF',
      black: '#000000',
      grey: {
        dark: '#3A3A3A',
        medium: '#414141',
        light: '#787878',
        lighter: '#929292'
      },
      transparent: 'transparent',
      current: 'currentColor',
      primary: '#04FFB8',
      secondary: '#B4B4B4',
      muted: '#414141',
      blue: {
        lightest: '#E1FFF7',
        light: '#1D449A',
        medium: '#2E67E7',
        dark: '#000B19',
        input: '#00122C',
        search: '#0D204A'
      },
      red: '#E72E66'
    },
    extend: {
      animation: {
        fadeIn: 'fadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        fadeOut: 'fadeOut 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        fadeInSlideUp: 'fadeInSlideUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        fadeOutSlideDown: 'fadeOutSlideDown 300ms cubic-bezier(0.16, 1, 0.3, 1)'
      },
      keyframes: {
        fadeIn: {
          '0%': {
            opacity: 0
          },
          '100%': {
            opacity: 1
          }
        },
        fadeOut: {
          '0%': {
            opacity: 1
          },
          '100%': {
            opacity: 0
          }
        },
        fadeInSlideUp: {
          '0%': {
            opacity: 0,
            transform: 'translateY(20px)'
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)'
          }
        },
        fadeOutSlideDown: {
          '0%': {
            opacity: 1,
            transform: 'translateY(0)'
          },
          '100%': {
            opacity: 0,
            transform: 'translateY(20px)'
          }
        }
      }
    }
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        '.container': {
          maxWidth: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          '@screen xl': {
            maxWidth: '1440px'
          }
        }
      })
    },
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@tailwindcss/forms')({
      strategy: 'base'
    })
  ]
}
