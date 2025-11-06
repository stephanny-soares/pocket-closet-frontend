// src/services/BackendConnection.ts

// ✅ Mock básico para que Jest y el frontend lo reconozcan correctamente
export const obtenerPrendas = async () => {
  return [];
};

export const eliminarPrenda = async (id: number) => {
  console.log(`Mock eliminarPrenda: eliminando prenda ${id}`);
  return { ok: true };
};
