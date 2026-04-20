/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        irontic: {
          purple:  '#8B5CF6',   // violet-500 — primary accent
          indigo:  '#4338CA',   // indigo-700 — deep accent
          cyan:    '#22D3EE',   // cyan-400   — highlight
          sky:     '#38BDF8',   // sky-400    — secondary text
          green:   '#10C784',   // teal-green — success / CTA hover
          bg:      '#050b14',   // near-black — page background
        },
      },
      backgroundImage: {
        'irontic-glow': `
          radial-gradient(1100px 750px at 50% 14%, rgba(109,91,255,.45), transparent 58%),
          radial-gradient(1000px 700px at 45% 32%, rgba(79,140,255,.35), transparent 62%),
          radial-gradient(900px 650px at 55% 48%, rgba(34,211,238,.28), transparent 65%)
        `,
      },
      boxShadow: {
        'glow-purple': '0 0 28px rgba(139,92,246,0.5)',
        'glow-cyan':   '0 0 28px rgba(34,211,238,0.4)',
        'glow-sm':     '0 0 12px rgba(139,92,246,0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};
