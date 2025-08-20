/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        forest: '#214F3F',
        coral: '#E2725B',
        drift: '#F5F1EC',
        slate: '#506870',
        mint: '#C4E3C3',
        pine: '#101B17',
        ambient: '#F8EFE0',
        'forest-light': 'hsla(158, 19%, 64%, 0.25)',
        'forest-medium': '#678E7B',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        'inter-regular': ['Inter-Regular'],
        'inter-bold': ['Inter-Bold'],
      },
    },
  },
  plugins: [],
};
