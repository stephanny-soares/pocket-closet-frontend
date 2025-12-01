// constants/typography.ts

const typography = {
  // Titulares editoriales (Cormorant Garamond)
  titleSerif: {
    fontFamily: "CormorantGaramond-SemiBold", // nombre que registrarás al cargar la fuente
    fontSize: 32,
    lineHeight: 36,
  },
  titleSerifLarge: {
    fontFamily: "CormorantGaramond-SemiBold",
    fontSize: 36,
    lineHeight: 40,
  },

  // Subtítulos serif
  subtitleSerif: {
    fontFamily: "CormorantGaramond-Medium",
    fontSize: 20,
    lineHeight: 24,
  },

  // Texto normal (sans-serif)
  body: {
    fontFamily: "System", // luego puedes sustituir por Inter / SF Pro si quieres
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: "System",
    fontWeight: "600" as const,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: "System",
    fontSize: 12,
    lineHeight: 16,
  },
};

export default typography;
