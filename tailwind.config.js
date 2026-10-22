/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#10b981',       // Verde vibrante esmeralda / acento
          greenLight: '#d1fae5',  // Verde suave de fondo para badges
          greenDark: '#047857',   // Verde oscuro para contrastes
          black: '#0a0a0a',       // Negro profundo
          surface: '#ffffff',     // Blanco puro
          muted: '#71717a',       // Gris neutro para textos secundarios
          border: '#e4e4e7',      // Borde sutil
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
