// constants/colors.ts

const colors = {
  /** Colores base */
  primary: "#C8B6A6",        // Beige topo principal (botones, acentos)
  primaryDark: "#B89F8D",    // Versión más oscura para pressed / hover
  primarySoft: "#EDE6E1",    // Fondos suaves, tags, chips activos suaves

  /** Fondo y superficies */
  background: "#F9F9F7",     // Fondo general de la app (pantallas)
  backgroundAlt: "#F9F9F7",  // Alternativa para secciones destacadas
  card: "#FFFFFF",           // Tarjetas, modales, contenedores

  /** Texto */
  textPrimary: "#2A2A2A",    // Texto principal (títulos, contenido)
  textSecondary: "#6F6F6F",  // Texto secundario, descripciones
  textMuted: "#9A9A9A",      // Placeholders, labels suaves
  textOnPrimary: "#00000",  // Texto sobre botones primary

  /** Bordes y separadores */
  border:  "#E7E3DF",
  divider: "#E7DFD4",

  /** Estados */
  danger: "#E53935",
  success: "#4CAF50",
  warning: "#F5A623",

  /** Iconos */
  icon: "#5B5B5B",
  iconActive: "#2F2F2F",

  /** Filtros / chips */
  chipBackground: "#FFFFFF",
  chipBackgroundActive: "#2F2F2F", // estilo pill negro como en tu referencia
  chipText: "#5A5A5A",
  chipTextActive: "#FFFFFF",

  // Sombra suave estilo iOS
  shadow: "rgba(0,0,0,0.08)",
  shadowColor: "rgba(0,0,0,0.1)",
  shadowOpacity: 0.12,
  shadowOffset: { width: 0, height: 6 },
  shadowRadius: 16,
  elevation: 5,

  /** Gradiente muy suave para no tocar todavía el layout */
  gradient: ["#F9F9F7", "#F9F9F7"] as const,
};

export default colors;
