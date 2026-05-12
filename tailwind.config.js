/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}", // السطر ده هو اللي هيشغل الستايل في كل صفحاتك
    "./components/**/*.{js,jsx,ts,tsx}" // ضفته احتياطي لو هتعملي فولدر للكومبوننتس بره
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}