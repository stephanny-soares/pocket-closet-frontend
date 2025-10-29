/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],

  // 🌗 Soporte para modo oscuro
  // Usa “media” si quieres que siga el tema del sistema,
  // o “class” si prefieres controlarlo manualmente desde el código.
  darkMode: "media",

  theme: {
    extend: {
      // 🎨 Paleta de colores personalizada
      colors: {
        primary: "#4B0082", // Morado principal
        secondary: "#9370DB",
        background: "#F9F9F9",
        textDark: "#1E1E1E",
        textMuted: "#666666",
        inputBg: "#FFFFFF",
        error: "#E63946",

        // 🌙 Colores base para modo oscuro
        gray: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
      },

      // 🧱 Tipografía base del sistema
      fontFamily: {
        sans: ["System"],
      },

      // ✨ Sombra suave moderna
      boxShadow: {
        "soft-lg": "0 8px 20px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
