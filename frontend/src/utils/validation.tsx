// Reglas de validación reutilizables

// Email válido básico
export const isValidEmail = (email: string = ''): boolean => /\S+@\S+\.\S+/.test(email);

// Contraseña: 8+, 1 mayúscula, 1 número, 1 símbolo (símbolos ampliados, incluye '.')
export const isValidPassword = (password: string = ''): boolean =>
  /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*()_+.,;:?\-=])[A-Za-z0-9!@#$%^&*()_+.,;:?\-=]{8,}$/.test(
    password
  );

// Fecha opcional, si viene debe cumplir AAAA/MM/DD
export const isValidDate = (date: string = ''): boolean => {
  if (!date.trim()) return true; // opcional
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(date)) return false;
  // Validación rápida de rangos (opcional)
  const [y, m, d] = date.split('/').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  return true;
};
