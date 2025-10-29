// Paleta centralizada para mantener coherencia visual
// Tipado para que el objeto de colores sea fuertemente tipado
const colors = {
  primary: '#4B0082',
  gradient: ['#97d8ec', '#c3b8fc', '#e7adef', '#fdbfc5', '#f9f7f9'] as string[],
  inputBg: 'rgba(255,255,255,0.92)',
  textDark: '#222',
  textMuted: '#666',
  error: '#E53935',
  success: '#2e7d32',
  border: '#e5e5e5',
};

export default colors;
export type Colors = typeof colors;
