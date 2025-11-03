// 🎨 colors.tsx
// Archivo central de colores de PocketCloset

const colors = {
  // Color principal del proyecto (botones, acentos, etc.)
  primary: "#4B0082",

  // Gradiente usado en SplashScreen y fondos principales
  gradient: ["#97d8ec", "#c3b8fc", "#e7adef", "#fdbfc5", "#f9f7f9"] as const,


  // Fondo de inputs y contenedores
  inputBg: "rgba(255,255,255,0.92)",

  // Colores de texto
  textDark: "#222222",
  textMuted: "#666666",

  // Colores de estado
  error: "#E53935",
  success: "#2e7d32",

  // Color de sombra o separación
  border: "#e5e5e5",
};

export default colors;

