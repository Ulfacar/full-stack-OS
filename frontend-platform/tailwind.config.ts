import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        background: '#0A0A0A',
        foreground: '#FAFAFA',
        border: '#262626',
        input: '#262626',
        ring: '#3B82F6',
        card: {
          DEFAULT: '#141414',
          foreground: '#FAFAFA',
        },
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#1A1A1A',
          foreground: '#FAFAFA',
        },
        muted: {
          DEFAULT: '#1A1A1A',
          foreground: '#737373',
        },
        accent: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: '#141414',
          foreground: '#FAFAFA',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'soft': '0 4px 16px rgba(0, 0, 0, 0.3)',
        'soft-lg': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'card': '0 1px 0 rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.25)',
        'elevated': '0 4px 16px rgba(0,0,0,0.5)',
        'glow': '0 0 15px rgba(59, 130, 246, 0.3)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
