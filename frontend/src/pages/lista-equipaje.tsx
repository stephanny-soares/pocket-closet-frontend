// ============================================================
// LISTA DE EQUIPAJE — Versión final (B1) alineada al backend real
// Ruta: /lista-equipaje?id=viajeId
// ============================================================

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
  categoria: string; // casual / formal / deporte / elegante
  tipo: "outfit_completo" | "prendas_sueltas";
  cantidad: number;
  empacado: boolean;
  notas?: string;
  prendas: Prenda[];
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
// MAIN COMPONENT
// ============================================================

export default function ListaEquipaje() {
  const { id: viajeId } = useLocalSearchParams();

  // Estado
  const [items, setItems] = useState<ItemMaleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Clima
  const [weather, setWeather] = useState<{
    temperature: number | null;
    condition: string;
    icon: string;
  } | null>(null);

  // Modal edición
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<ItemMaleta | null>(null);
  const [notasTemp, setNotasTemp] = useState("");

  // ============================================================
  // Cargar clima desde frontend
  // ============================================================

  const cargarClima = async (destino: string) => {
    try {
      const encoded = encodeURIComponent(destino);
      const geo = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}`
      ).then((r) => r.json());

      if (!geo?.results?.length) return;

      const { latitude, longitude } = geo.results[0];

      const data = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
      ).then((r) => r.json());

      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;
      const info = weatherMap[code] ?? {
        condition: "Desconocido",
        icon: "weather-cloudy",
      };

      setWeather({
        temperature: temp,
        condition: info.condition,
        icon: info.icon,
      });
    } catch (e) {}
  };

  // ============================================================
  // Cargar maleta del backend
  // ============================================================

  const cargarMaleta = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<ItemMaleta[]>(
        `/api/viajes/${viajeId}/maleta`,
        { method: "GET" }
      );
      setItems(data);
    } catch (err) {
      console.log("Error cargando maleta:", err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Generar maleta con IA
  // ============================================================

  const generarMaleta = async () => {
    try {
      setGenerating(true);
      await apiRequest(`/api/viajes/${viajeId}/maleta/generar`, {
        method: "POST",
      });
      await cargarMaleta();
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo generar la maleta");
    } finally {
      setGenerating(false);
    }
  };

  // ============================================================
  // Actualizar item (empacado, cantidad, notas)
  // ============================================================

  const actualizarItem = async (
    idItem: string,
    cambios: Partial<ItemMaleta>
  ) => {
    try {
      await apiRequest(`/api/viajes/${viajeId}/maleta/${idItem}`, {
        method: "PUT",
        body: JSON.stringify(cambios),
      });
      await cargarMaleta();
    } catch (err) {
      console.log("Error actualizando item:", err);
    }
  };

  // ============================================================
  // Eliminar item
  // ============================================================

  const eliminarItem = async (idItem: string) => {
    try {
      await apiRequest(`/api/viajes/${viajeId}/maleta/${idItem}`, {
        method: "DELETE",
      });
      await cargarMaleta();
    } catch (err) {
      console.log("Error eliminando item:", err);
    }
  };

  // ============================================================
  // Al montar: cargar maleta y clima
  // ============================================================

  useEffect(() => {
    if (!viajeId) return;
    cargarMaleta();

    // OJO: aquí no tenemos el destino del viaje.
    // Si quieres clima correcto, pásalo desde Mis-Viajes por query param.
    cargarClima("Destino");
  }, [viajeId]);

  // ============================================================
  // Separar por tipo (B1)
  // ============================================================

  const outfits = items.filter((i) => i.tipo === "outfit_completo");
  const sueltas = items.filter((i) => i.tipo === "prendas_sueltas");

  // ============================================================
  // Render
  // ============================================================

  return (
    <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>

        {/* HEADER TIPO MIS-VIAJES */}
        <View style={styles.headerArea}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons
                name="chevron-back-outline"
                size={26}
                color={colors.iconActive}
              />
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

          <View style={styles.titleBlock}>
            <TitleSerif style={styles.title}>Equipaje</TitleSerif>
            <SubtitleSerif>Tu maleta generada</SubtitleSerif>

            {weather && (
              <View style={styles.weatherRow}>
                <MaterialCommunityIcons
                  name={weather.icon as any}
                  size={20}
                  color={colors.iconActive}
                />
                <Text style={styles.weatherText}>
                  {weather.condition}
                  {weather.temperature ? ` · ${weather.temperature}°` : ""}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* CONTENIDO */}
        <ScrollView contentContainerStyle={styles.content}>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : items.length === 0 ? (
            <View style={{ marginTop: 40 }}>
              <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>
                Aún no se ha generado ninguna maleta.
              </Text>

              <TouchableOpacity
                style={styles.btnGenerar}
                onPress={generarMaleta}
                disabled={generating}
              >
                <Text style={styles.btnGenerarText}>
                  {generating ? "Generando..." : "Generar maleta con IA"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Outfits completos */}
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
                        <View key={p.id} style={styles.prendaBadge}>
                          <Text style={styles.prendaText}>{p.nombre}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Empacado */}
                    <TouchableOpacity
                      style={styles.empacadoRow}
                      onPress={() =>
                        actualizarItem(item.id, { empacado: !item.empacado })
                      }
                    >
                      <Ionicons
                        name={
                          item.empacado
                            ? "checkbox-outline"
                            : "square-outline"
                        }
                        size={22}
                        color={colors.primary}
                      />
                      <Text style={styles.empacadoText}>Empacado</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                </Card>
              ))}

              {/* Prendas sueltas */}
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
                    <Text style={styles.itemSub}>Cantidad: {item.cantidad}</Text>

                    <TouchableOpacity
                      style={styles.empacadoRow}
                      onPress={() =>
                        actualizarItem(item.id, { empacado: !item.empacado })
                      }
                    >
                      <Ionicons
                        name={
                          item.empacado
                            ? "checkbox-outline"
                            : "square-outline"
                        }
                        size={22}
                        color={colors.primary}
                      />
                      <Text style={styles.empacadoText}>Empacado</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Card>
              ))}
            </>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* MODAL DETALLE */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {selected && (
                <>
                  <Text style={styles.modalTitle}>{selected.nombre}</Text>

                  {/* Notas */}
                  <Text style={styles.modalLabel}>Notas</Text>
                  <TextInput
                    value={notasTemp}
                    onChangeText={setNotasTemp}
                    placeholder="Escribe notas..."
                    style={styles.modalInput}
                    multiline
                  />

                  {/* Cantidad */}
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

                  {/* Guardar */}
                  <TouchableOpacity
                    style={styles.modalBtn}
                    onPress={() => {
                      actualizarItem(selected.id, { notas: notasTemp });
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalBtnText}>Guardar</Text>
                  </TouchableOpacity>

                  {/* Eliminar */}
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

                  {/* Cerrar */}
                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={20} color="#333" />
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
// STYLES
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
  backButton: {
    backgroundColor: colors.card,
    padding: 8,
    borderRadius: 12,
  },
  profileButton: { padding: 4 },

  titleBlock: { marginBottom: 16 },
  title: { fontSize: 32, color: colors.textPrimary },

  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  weatherText: { color: colors.textSecondary },

  content: { paddingHorizontal: 20 },

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
  prendaBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  prendaText: { fontSize: 12, color: colors.primaryDark },

  empacadoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  empacadoText: { fontSize: 14 },

  btnGenerar: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },
  btnGenerarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: "#EEE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  modalBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnText: { color: "white", fontWeight: "600" },

  modalDelete: {
    backgroundColor: colors.danger,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  modalDeleteText: { color: "white", fontWeight: "600" },

  modalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FFF",
    padding: 6,
    borderRadius: 999,
  },
});
