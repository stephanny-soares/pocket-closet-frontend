// constants/colors.ts

const colors = {
  /** Colores base */
  primary: "#C9B39C",        // Beige topo principal (botones, acentos)
  primaryDark: "#A88F74",    // Versión más oscura para pressed / hover
  primarySoft: "#E6DBCF",    // Fondos suaves, tags, chips activos suaves

  /** Fondo y superficies */
  background: "#F7F3EC",     // Fondo general de la app (pantallas)
  backgroundAlt: "#F2EAE0",  // Alternativa para secciones destacadas
  card: "#FFFFFF",           // Tarjetas, modales, contenedores

  /** Texto */
  textPrimary: "#262626",    // Texto principal (títulos, contenido)
  textSecondary: "#7A7A7A",  // Texto secundario, descripciones
  textMuted: "#A5A5A5",      // Placeholders, labels suaves
  textOnPrimary: "#FFFFFF",  // Texto sobre botones primary

  /** Bordes y separadores */
  border: "#E4D9CC",
  divider: "#E7DFD4",

  /** Estados */
  danger: "#E53935",
  success: "#4CAF50",
  warning: "#F5A623",

  /** Iconos */
  icon: "#7B7B7B",
  iconActive: "#2F2F2F",

  /** Filtros / chips */
  chipBackground: "#FFFFFF",
  chipBackgroundActive: "#2F2F2F", // estilo pill negro como en tu referencia
  chipText: "#5A5A5A",
  chipTextActive: "#FFFFFF",

  /** Gradiente muy suave para no tocar todavía el layout */
  gradient: ["#F9F5EE", "#F4EEE5"] as const,
};

export default colors;
