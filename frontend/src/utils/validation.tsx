// 🧠 validation.tsx
// Funciones de validación reutilizables para formularios

// Validar formato de email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar contraseña: mínimo 8 caracteres, al menos un número y un símbolo (cualquier símbolo)
export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
  return passwordRegex.test(password);
};

// Validar coincidencia de contraseñas
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};

// Validar campos vacíos
export const validateRequiredFields = (fields: Record<string, string>): boolean => {
  return Object.values(fields).every((value) => value.trim() !== "");
};
