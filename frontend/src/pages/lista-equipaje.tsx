import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";

import TitleSerif from "../components/ui/TitleSerif";
import SubtitleSerif from "../components/ui/SubtitleSerif";
import Card from "../components/ui/Card";
import colors from "../constants/colors";
import { apiRequest } from "../utils/apiClient";

// ============================================================
// Tipos reales del backend
// ============================================================

interface Prenda {
  id: string;
  nombre: string;
  tipo: string;
  color?: string;
  imagen?: string;
}

interface ItemMaleta {
  id: string;
  nombre: string;
  categoria: string;
  tipo: "outfit_completo" | "prendas_sueltas";
  cantidad: number;
  empacado: boolean;
  notas?: string;
  prendas: Prenda[];
}

interface Viaje {
  id: string;
  destino: string;
  ciudad?: string;
  fechaInicio: string;
  fechaFin: string;
  tipoMaletaCalculado?: string; // 🔹 NUEVO: lo manda el backend
}

// ============================================================
// Weather helpers
// ============================================================

const weatherMap: Record<number, { condition: string; icon: string }> = {
  0: { condition: "Despejado", icon: "weather-sunny" },
  1: { condition: "Mayormente despejado", icon: "weather-partly-cloudy" },
  2: { condition: "Parcialmente nublado", icon: "weather-partly-cloudy" },
  3: { condition: "Nublado", icon: "weather-cloudy" },
  45: { condition: "Niebla", icon: "weather-fog" },
  51: { condition: "Lluvia ligera", icon: "weather-rainy" },
  61: { condition: "Lluvia", icon: "weather-rainy" },
  80: { condition: "Lluvia fuerte", icon: "weather-pouring" },
  95: { condition: "Tormenta", icon: "weather-lightning" },
};

// ============================================================
// FUNCIÓN PREVISIÓN REAL (≤ 13 días)
// ============================================================

async function cargarClimaViaje(destino: string, inicio: string, fin: string) {
  try {
    const encoded = encodeURIComponent(destino);
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}`
    ).then((r) => r.json());

    if (!geo?.results?.length) return null;

    const { latitude, longitude } = geo.results[0];

    const data = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&start_date=${inicio}&end_date=${fin}&timezone=auto`
    ).then((r) => r.json());

    const codes: number[] = data?.daily?.weathercode ?? [];
    const maxs: number[] = data?.daily?.temperature_2m_max ?? [];
    const mins: number[] = data?.daily?.temperature_2m_min ?? [];

    if (!codes.length) return null;

    const firstCode = codes[0];
    const info = weatherMap[firstCode] ?? {
      condition: "Desconocido",
      icon: "weather-cloudy",
    };

    return {
      condition: info.condition,
      icon: info.icon,
      min: Math.min(...mins),
      max: Math.max(...maxs),
    };
  } catch (e) {
    console.log("Error clima futuro:", e);
    return null;
  }
}

// ============================================================
// CLIMA HISTÓRICO (> 13 días)
// ============================================================

async function cargarClimaHistorico(
  destino: string,
  fechaInicio: string,
  fechaFin: string
) {
  try {
    const encoded = encodeURIComponent(destino);
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}`
    ).then((r) => r.json());

    if (!geo?.results?.length) return null;

    const { latitude, longitude } = geo.results[0];

    // Usamos el MISMO rango de fechas pero del año pasado
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
    start.setFullYear(start.getFullYear() - 1);
    end.setFullYear(end.getFullYear() - 1);

    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const data = await fetch(
      `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&start_date=${startStr}&end_date=${endStr}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`
    ).then((r) => r.json());

    const codes = data?.daily?.weathercode ?? [];
    const maxs = data?.daily?.temperature_2m_max ?? [];
    const mins = data?.daily?.temperature_2m_min ?? [];

    if (!codes.length) return null;

    // Moda del weathercode → condición típica
    const freq: Record<number, number> = {};
    for (const c of codes) freq[c] = (freq[c] || 0) + 1;
    const code = Number(
      Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
    );

    const condition = weatherMap[code]?.condition ?? "Clima típico";
    const icon = weatherMap[code]?.icon ?? "weather-partly-cloudy";

    return {
      condition,
      icon,
      min: Math.round(Math.min(...mins)),
      max: Math.round(Math.max(...maxs)),
    };
  } catch (e) {
    console.log("Error clima histórico:", e);
    return null;
  }
}

// ============================================================
// MAIN
// ============================================================

export default function ListaEquipaje() {
  const params = useLocalSearchParams();
  const viajeId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [items, setItems] = useState<ItemMaleta[]>([]);
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [weather, setWeather] = useState<{
    condition: string | null;
    icon: string | null;
    min: number | null;
    max: number | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Modal edición
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<ItemMaleta | null>(null);
  const [notasTemp, setNotasTemp] = useState("");

  // ============================================================
  // Cargar viaje
  // ============================================================

  async function cargarViaje() {
    try {
      const data = await apiRequest<Viaje>(`/api/viajes/${viajeId}`, {
        method: "GET",
      });
      setViaje(data);
      return data;
    } catch (e) {
      console.log("Error viaje:", e);
      return null;
    }
  }

  // ============================================================
  // Cargar maleta
  // ============================================================

  async function cargarMaleta() {
    try {
      const data = await apiRequest<ItemMaleta[]>(
        `/api/viajes/${viajeId}/maleta`,
        { method: "GET" }
      );
      setItems(data);
    } catch (e) {
      console.log("Error maleta:", e);
    }
  }

  // ============================================================
  // Generar maleta IA
  // ============================================================

  async function generarMaleta() {
    try {
      setGenerating(true);
      await apiRequest(`/api/viajes/${viajeId}/maleta/generar`, {
        method: "POST",
      });
      await cargarMaleta();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo generar la maleta");
    } finally {
      setGenerating(false);
    }
  }

  // ============================================================
  // Actualizar / eliminar item
  // ============================================================

  async function actualizarItem(id: string, cambios: Partial<ItemMaleta>) {
    await apiRequest(`/api/viajes/${viajeId}/maleta/${id}`, {
      method: "PUT",
      body: JSON.stringify(cambios),
    });
    cargarMaleta();
  }

  async function eliminarItem(id: string) {
    await apiRequest(`/api/viajes/${viajeId}/maleta/${id}`, {
      method: "DELETE",
    });
    cargarMaleta();
  }

  // ============================================================
  // EFECTO PRINCIPAL
  // ============================================================

  useEffect(() => {
    if (!viajeId) return;

    (async () => {
      setLoading(true);
      const v = await cargarViaje();
      await cargarMaleta();

      if (v) {
        const hoy = new Date();
        const inicio = new Date(v.fechaInicio);
        const diff =
          (inicio.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);

        const destinoClima = v.ciudad || v.destino;

        // ≤ 13 días → previsión real
        if (diff <= 13) {
          const real = await cargarClimaViaje(
            destinoClima,
            v.fechaInicio,
            v.fechaFin
          );
          if (real) setWeather(real);
        } else {
          // > 13 días → clima histórico
          const hist = await cargarClimaHistorico(
            destinoClima,
            v.fechaInicio,
            v.fechaFin
          );
          if (hist) setWeather(hist);
        }
      }

      setLoading(false);
    })();
  }, [viajeId]);

  // ============================================================
  // RENDER UI
  // ============================================================

  const outfits = items.filter((i) => i.tipo === "outfit_completo");
  const sueltas = items.filter((i) => i.tipo === "prendas_sueltas");

  return (
    <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.headerArea}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back-outline" size={24} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/perfil")}
              style={styles.profileButton}
            >
              <Ionicons
                name="person-circle-outline"
                size={32}
                color={colors.iconActive}
              />
            </TouchableOpacity>
          </View>

          <TitleSerif style={styles.title}>Equipaje</TitleSerif>
          <SubtitleSerif>{viaje?.destino}</SubtitleSerif>

          {weather && (
            <View style={styles.weatherRow}>
              <MaterialCommunityIcons
                name={weather.icon as any}
                size={22}
                color={colors.iconActive}
              />
              <Text style={styles.weatherText}>
                {weather.condition}
                {weather.min != null && weather.max != null
                  ? ` · ${weather.min}°–${weather.max}°`
                  : ""}
              </Text>
            </View>
          )}
        </View>

        {/* CONTENIDO */}
        <ScrollView style={{ paddingHorizontal: 20 }}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : items.length === 0 ? (
            <>
              <Text style={{ marginTop: 20, color: colors.textSecondary }}>
                Aún no se ha generado ninguna maleta.
              </Text>

              <TouchableOpacity
                style={styles.btnGenerar}
                onPress={generarMaleta}
                disabled={generating}
              >
                <Text style={styles.btnTxt}>
                  {generating ? "Generando..." : "Generar maleta con IA"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* OUTFITS */}
              <Text style={styles.sectionTitle}>Outfits completos</Text>
              {outfits.map((item) => (
                <Card key={item.id} style={styles.itemCard}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelected(item);
                      setNotasTemp(item.notas || "");
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.itemTitle}>{item.nombre}</Text>
                    <Text style={styles.itemSub}>
                      {item.categoria} · Cantidad: {item.cantidad}
                    </Text>

                    <View style={styles.prendasRow}>
                      {item.prendas.map((p) => (
                        <View key={p.id} style={styles.badge}>
                          <Text style={styles.badgeText}>{p.nombre}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.empacadoRow}
                      onPress={() =>
                        actualizarItem(item.id, {
                          empacado: !item.empacado,
                        })
                      }
                    >
                      <Ionicons
                        name={
                          item.empacado ? "checkbox-outline" : "square-outline"
                        }
                        size={22}
                        color={colors.primary}
                      />
                      <Text>Empacado</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Card>
              ))}

              {/* PRENDAS SUELTAS */}
              <Text style={styles.sectionTitle}>Prendas sueltas</Text>
              {sueltas.map((item) => (
                <Card key={item.id} style={styles.itemCard}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelected(item);
                      setNotasTemp(item.notas || "");
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.itemTitle}>{item.nombre}</Text>
                    <Text style={styles.itemSub}>
                      Cantidad: {item.cantidad}
                    </Text>

                    <TouchableOpacity
                      style={styles.empacadoRow}
                      onPress={() =>
                        actualizarItem(item.id, {
                          empacado: !item.empacado,
                        })
                      }
                    >
                      <Ionicons
                        name={
                          item.empacado ? "checkbox-outline" : "square-outline"
                        }
                        size={22}
                        color={colors.primary}
                      />
                      <Text>Empacado</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Card>
              ))}

              {/* =======================================================
                  NUEVAS SECCIONES (estructura lista, de momento vacías)
                  ======================================================= */}

              <Text style={styles.sectionTitle}>Baño</Text>
              <Card style={styles.itemCard}>
                <Text style={styles.placeholderText}>
                  (Contenido en desarrollo…)
                </Text>
              </Card>

              <Text style={styles.sectionTitle}>Esenciales de viaje</Text>
              <Card style={styles.itemCard}>
                <Text style={styles.placeholderText}>
                  (Contenido en desarrollo…)
                </Text>
              </Card>

              <Text style={styles.sectionTitle}>Seguridad y salud</Text>
              <Card style={styles.itemCard}>
                <Text style={styles.placeholderText}>
                  (Contenido en desarrollo…)
                </Text>
              </Card>

              <Text style={styles.sectionTitle}>Gadgets y Accesorios</Text>
              <Card style={styles.itemCard}>
                <Text style={styles.placeholderText}>
                  (Contenido en desarrollo…)
                </Text>
              </Card>

              {/* MALETAS: único que viene del backend ahora */}
              <Text style={styles.sectionTitle}>Maletas</Text>
              <Card style={styles.itemCard}>
                <Text style={styles.itemTitle}>
                  Tipo de maleta recomendada
                </Text>
                <Text style={styles.itemSub}>
                  {viaje?.tipoMaletaCalculado
                    ? viaje.tipoMaletaCalculado.charAt(0).toUpperCase() +
                      viaje.tipoMaletaCalculado.slice(1)
                    : "No calculado"}
                </Text>
              </Card>
            </>
          )}
        </ScrollView>

        {/* ===== MODAL ===== */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {selected && (
                <>
                  <Text style={styles.modalTitle}>{selected.nombre}</Text>

                  <Text style={styles.modalLabel}>Notas</Text>
                  <TextInput
                    value={notasTemp}
                    onChangeText={setNotasTemp}
                    placeholder="Escribe notas..."
                    style={styles.modalInput}
                    multiline
                  />

                  <Text style={styles.modalLabel}>Cantidad</Text>
                  <TextInput
                    keyboardType="numeric"
                    defaultValue={String(selected.cantidad)}
                    onChangeText={(v) =>
                      actualizarItem(selected.id, {
                        cantidad: Number(v),
                      })
                    }
                    style={styles.modalInput}
                  />

                  <TouchableOpacity
                    style={styles.modalBtn}
                    onPress={() => {
                      actualizarItem(selected.id, { notas: notasTemp });
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalBtnText}>Guardar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalDelete}
                    onPress={() => {
                      eliminarItem(selected.id);
                      setModalVisible(false);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FFF" />
                    <Text style={styles.modalDeleteText}>Eliminar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={20} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ============================================================
// STYLES (idénticos a tu versión + 1 estilo nuevo)
// ============================================================

const styles = StyleSheet.create({
  headerArea: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  backBtn: {
    backgroundColor: colors.card,
    padding: 8,
    borderRadius: 12,
  },
  profileButton: {
    padding: 4,
  },

  title: { fontSize: 32 },

  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  weatherText: { color: colors.textSecondary },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 10,
  },

  itemCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },

  prendasRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, color: colors.primaryDark },

  empacadoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  btnGenerar: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 20,
  },
  btnTxt: { color: "#FFF", fontWeight: "600", fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    position: "relative",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },

  modalLabel: { fontWeight: "600", marginTop: 10 },
  modalInput: {
    backgroundColor: "#EEE",
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
  },

  modalBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },
  modalBtnText: { color: "#FFF", fontWeight: "600" },

  modalDelete: {
    backgroundColor: colors.danger,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  modalDeleteText: { color: "#FFF", fontWeight: "600" },

  modalClose: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 6,
  },

  // 🔹 NUEVO: para el texto "(Contenido en desarrollo…)"
  placeholderText: {
    fontStyle: "italic",
    color: colors.textSecondary,
  },
});
