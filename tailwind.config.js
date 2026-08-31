/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        bg:      '#F7F5F1',
        bg2:     '#EFEBE4',
        ink:     '#14130F',
        ink2:    '#55524A',
        ink3:    '#66635B',
        line:    '#DDD8CF',
        accent:  '#D5ACFF',
        accentd: '#6B3FA0',
        dk:      '#0D0D0F',
        dk2:     '#16161A',
        dkline:  '#2A2A31',
        dkink:   '#EDEBE6',
        dkink2:  '#9A968C'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans:    ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      }
    }
  },
  plugins: []
};
