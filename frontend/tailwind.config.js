/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        statusGreen: "#06A87D",
        statusYellow: "#FFA500",
        statusRed: "#E63946",
        navy: "#2B2118",
        light: "#FBF6EE",
        primary: "#4C9A2A",
        secondary: "#3FB6C4",
        accent: "#F5A623",
        comb: "#E5342A",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
}
