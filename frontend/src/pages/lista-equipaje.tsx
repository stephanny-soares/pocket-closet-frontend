// ============================================================
// LISTA DE EQUIPAJE — UI COMPLETA (versión frontend-first)
// ============================================================

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";

import TitleSerif from "../components/ui/TitleSerif";
import SubtitleSerif from "../components/ui/SubtitleSerif";
import Card from "../components/ui/Card";
import FloatingActionButton from "../components/ui/FloatingActionButton";
import colors from "../constants/colors";

// ============================================================
// Tipos internos frontend (Opción B)
// ============================================================

export interface EquipajeItem {
  id?: string;
  nombre: string;
  cantidad?: number;
  tipo?: string;
  meta?: any;
}

export interface EquipajeCategoria {
  categoria: string;
  items: EquipajeItem[];
}

// ============================================================
// Helpers
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
// Componente principal
// ============================================================

export default function ListaEquipaje() {
  const params = useLocalSearchParams();

  const destino = params.destino || "Destino";
  const desde = params.desde ? new Date(params.desde as string) : null;
  const hasta = params.hasta ? new Date(params.hasta as string) : null;

  const actividades = params.actividades
    ? JSON.parse(params.actividades as string)
    : [];

  // ============================================================
  // Estado local
  // ============================================================

  const [equipaje, setEquipaje] = useState<EquipajeCategoria[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loadingIA, setLoadingIA] = useState(true);

  // Clima
  const [weather, setWeather] = useState<{
    temperature: number | null;
    condition: string;
    icon: string;
  } | null>(null);

  // Edición / eliminar
  const [modalVisible, setModalVisible] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<{
    categoria: string;
    item: EquipajeItem;
  } | null>(null);

  // ============================================================
  // Load clima
  // ============================================================

  const cargarClima = async () => {
    try {
      // 1. Obtener coordenadas por nombre de ciudad
      const encoded = encodeURIComponent(destino as string);
      const geo = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}`
      ).then((r) => r.json());

      if (!geo?.results?.length) {
        setWeather({
          temperature: null,
          condition: "Desconocido",
          icon: "weather-cloudy",
        });
        return;
      }

      const { latitude, longitude } = geo.results[0];

      // 2. Obtener clima actual
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
    } catch (e) {
      setWeather({
        temperature: null,
        condition: "Desconocido",
        icon: "weather-cloudy",
      });
    }
  };

  // ============================================================
  // Stub IA (dummy data hasta backend real)
  // ============================================================

  const cargarEquipajeIA = async () => {
    setLoadingIA(true);

    // Aquí luego enchufamos tu endpoint real:
    // const result = await apiRequest("/api/equipaje/generar", ...)

    // Dummy temporal (estructura Opción B)
    const dummy: EquipajeCategoria[] = [
      {
        categoria: "Ropa",
        items: [
          { nombre: "Camisa blanca", cantidad: 2, tipo: "parte arriba" },
          { nombre: "Pantalón vaquero", cantidad: 1, tipo: "parte abajo" },
          { nombre: "Zapatillas cómodas", cantidad: 1, tipo: "calzado" },
        ],
      },
      {
        categoria: "Baño",
        items: [
          { nombre: "Cepillo de dientes", cantidad: 1 },
          { nombre: "Gel de baño", cantidad: 1 },
        ],
      },
      {
        categoria: "Seguridad y Salud",
        items: [{ nombre: "Ibuprofeno", cantidad: 1 }],
      },
      {
        categoria: "Gadgets y Accesorios",
        items: [
          { nombre: "Cargador móvil", cantidad: 1 },
          { nombre: "Adaptador universal", cantidad: 1 },
        ],
      },
      {
        categoria: "Maletas",
        items: [{ nombre: "Maleta de mano", cantidad: 1 }],
      },
    ];

    setEquipaje(dummy);

    // Expandir todo al inicio
    const expandedMap: any = {};
    dummy.forEach((c) => (expandedMap[c.categoria] = true));
    setExpanded(expandedMap);

    setLoadingIA(false);
  };

  // ============================================================
  // Effect inicial
  // ============================================================

  useEffect(() => {
    cargarClima();
    cargarEquipajeIA();
  }, []);

  // ============================================================
  // Helpers UI
  // ============================================================

  const toggleCategoria = (cat: string) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const abrirItem = (categoria: string, item: EquipajeItem) => {
    setItemSeleccionado({ categoria, item });
    setModalVisible(true);
  };

  const eliminarItem = () => {
    if (!itemSeleccionado) return;

    setEquipaje((prev) =>
      prev.map((cat) =>
        cat.categoria === itemSeleccionado.categoria
          ? {
              ...cat,
              items: cat.items.filter(
                (i) => i.nombre !== itemSeleccionado.item.nombre
              ),
            }
          : cat
      )
    );

    setModalVisible(false);
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Header Maison */}
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

        {/* Título y clima */}
        <View style={styles.titleBlock}>
          <TitleSerif style={styles.title}>Lista de equipaje</TitleSerif>

          <SubtitleSerif>
            {destino} {desde && hasta ? `· ${desde.toLocaleDateString()} - ${hasta.toLocaleDateString()}` : ""}
          </SubtitleSerif>

          {weather && (
            <View style={styles.weatherRow}>
              <MaterialCommunityIcons
                name={weather.icon as any}
                size={22}
                color={colors.iconActive}
              />
              <Text style={styles.weatherText}>
                {weather.condition}
                {weather.temperature !== null ? ` · ${weather.temperature}°` : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Contenido */}
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {loadingIA ? (
            <Text style={{ color: "#555" }}>Generando equipaje…</Text>
          ) : (
            equipaje.map((cat) => (
              <View key={cat.categoria} style={styles.categoriaBlock}>
                {/* Header de categoría */}
                <TouchableOpacity
                  style={styles.categoriaHeader}
                  onPress={() => toggleCategoria(cat.categoria)}
                >
                  <Text style={styles.categoriaTitle}>{cat.categoria}</Text>

                  <Ionicons
                    name={
                      expanded[cat.categoria]
                        ? "chevron-up-outline"
                        : "chevron-down-outline"
                    }
                    size={20}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>

                {/* Items */}
                {expanded[cat.categoria] && (
                  <View style={styles.itemsBlock}>
                    {cat.items.map((i) => (
                      <TouchableOpacity
                        key={i.nombre}
                        style={styles.itemRow}
                        onPress={() => abrirItem(cat.categoria, i)}
                      >
                        <Text style={styles.itemText}>
                          {i.nombre}
                          {i.cantidad ? ` ×${i.cantidad}` : ""}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}

          {/* Botón cerrar maleta */}
          <TouchableOpacity style={styles.btnCerrar}>
            <Text style={styles.btnCerrarText}>Cerrar maleta</Text>
          </TouchableOpacity>

          {/* Botones PDF / compartir */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.actionIcon}>
              <MaterialCommunityIcons name="file-pdf-box" size={42} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionIcon}>
              <Ionicons name="share-social-outline" size={38} color="#333" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* MODAL ITEM */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {itemSeleccionado && (
                <>
                  <Text style={styles.modalTitle}>
                    {itemSeleccionado.item.nombre}
                  </Text>

                  <Text style={styles.modalText}>
                    Cantidad: {itemSeleccionado.item.cantidad ?? 1}
                  </Text>

                  {itemSeleccionado.item.tipo && (
                    <Text style={styles.modalText}>
                      Tipo: {itemSeleccionado.item.tipo}
                    </Text>
                  )}

                  {/* Acciones */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalBtnDanger}
                      onPress={eliminarItem}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FFF" />
                      <Text style={styles.modalBtnDangerText}>Eliminar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalBtnClose}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.modalBtnCloseText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
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
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },

  backButton: {
    backgroundColor: colors.card,
    padding: 8,
    borderRadius: 12,
  },

  profileButton: {
    padding: 4,
  },

  titleBlock: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  title: {
    fontSize: 32,
    marginBottom: 4,
    color: colors.textPrimary,
  },

  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },

  weatherText: {
    color: colors.textSecondary,
    fontSize: 15,
  },

  categoriaBlock: {
    marginBottom: 18,
  },

  categoriaHeader: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  categoriaTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  itemsBlock: {
    paddingLeft: 10,
    marginTop: 6,
  },

  itemRow: {
    paddingVertical: 6,
  },

  itemText: {
    color: colors.textPrimary,
    fontSize: 15,
  },

  btnCerrar: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 20,
    alignItems: "center",
  },

  btnCerrarText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "700",
  },

  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 26,
    paddingHorizontal: 40,
    marginBottom: 50,
  },

  actionIcon: {
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },

  modalText: {
    fontSize: 15,
    marginBottom: 4,
  },

  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  modalBtnDanger: {
    backgroundColor: colors.danger,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },

  modalBtnDangerText: {
    color: "#FFF",
    fontWeight: "600",
  },

  modalBtnClose: {
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },

  modalBtnCloseText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
