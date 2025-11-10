import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Alert,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import Header from "components/Header";
import colors from "../constants/colors";
import { useLoader } from "../context/LoaderContext";
import { apiRequest, apiFetch } from "../utils/apiClient";

interface Outfit {
  id: string;
  nombre: string;
  imagen: string;
  prendas: { id: string; imagen: string }[];
  categoria?: string;
  estacion?: string;
  createdAt?: string;
}

interface Prenda {
  id: string;
  nombre: string;
  imagen: string;
  tipo?: string;
  color?: string;
}

export default function MisOutfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [outfitSeleccionado, setOutfitSeleccionado] = useState<Outfit | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState({ categoria: "todos", estacion: "todos" });
  const { showLoader, hideLoader } = useLoader();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const { sugerida } = useLocalSearchParams<{ sugerida?: string }>();

  useEffect(() => {
    cargarOutfits();
  }, []);

  const cargarOutfits = async () => {
    showLoader("Cargando outfits...");
    try {
      const data = await apiRequest<{ outfits: Outfit[] }>("/api/outfits", { method: "GET" });
      setOutfits(data.outfits || []);
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudieron cargar los outfits");
    } finally {
      hideLoader();
    }
  };

  // 🔹 Filtros dinámicos
  const opcionesFiltros = useMemo(() => {
    const setCategorias = new Set<string>();
    const setEstaciones = new Set<string>();

    outfits.forEach((o) => {
      if (o.categoria) setCategorias.add(o.categoria);
      if (o.estacion) setEstaciones.add(o.estacion);
    });

    const toArray = (set: Set<string>) => ["todos", ...Array.from(set)];
    return { categoria: toArray(setCategorias), estacion: toArray(setEstaciones) };
  }, [outfits]);

  const outfitsFiltrados = useMemo(() => {
    return outfits.filter((o) => {
      const cat = filtros.categoria === "todos" || o.categoria === filtros.categoria;
      const est = filtros.estacion === "todos" || o.estacion === filtros.estacion;
      return cat && est;
    });
  }, [outfits, filtros]);

  const columnas = isWeb ? Math.min(Math.floor(width / 220), 5) : 3;

  const abrirDetalle = (o: Outfit) => {
    setOutfitSeleccionado(o);
    setModalVisible(true);
  };

  const handleEliminarOutfit = (id: string, nombre: string) => {
    Alert.alert("Eliminar outfit", `¿Eliminar "${nombre}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          showLoader("Eliminando outfit...");
          try {
            const res = await apiFetch(`/api/outfits/${id}`, { method: "DELETE" });
            if (res.ok) {
              setOutfits((prev) => prev.filter((o) => o.id !== id));
            }
          } catch {
            Alert.alert("Error", "No se pudo eliminar el outfit.");
          } finally {
            hideLoader();
          }
        },
      },
    ]);
  };

  // 🧠 Crear outfit sugerido (simulado)
  const crearOutfitDesdePrenda = async (prendaId: string) => {
    showLoader("Generando outfit sugerido...");
    try {
      // Simulación: aquí se llamará a la IA de backend
      await new Promise((res) => setTimeout(res, 1500));
      Alert.alert("✨ Sugerencia IA", "Se ha generado un outfit con esa prenda (demo).");
      router.push("/mis-outfits");
    } catch {
      Alert.alert("Error", "No se pudo generar el outfit.");
    } finally {
      hideLoader();
    }
  };

  const renderOutfit = ({ item }: { item: Outfit }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => abrirDetalle(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.imagen }} style={styles.cardImage} />
      <Text style={styles.cardName}>{item.nombre}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Header title="Mis Outfits" />

      {/* 🪄 Sugerencia desde prenda */}
      {sugerida && (
        <View style={styles.sugeridaBox}>
          <Text style={styles.sugeridaText}>
            Prenda seleccionada para generar un outfit ✨
          </Text>
          <TouchableOpacity
            style={styles.btnSugerir}
            onPress={() => crearOutfitDesdePrenda(sugerida)}
          >
            <Ionicons name="sparkles-outline" size={20} color="#FFF" />
            <Text style={styles.btnSugerirText}>Sugerir outfit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 🔽 Filtros dinámicos */}
      {mostrarFiltros && (
        <View style={styles.filtrosContainer}>
          {Object.entries(opcionesFiltros).map(([campo, valores]) => (
            <View key={campo} style={styles.filtroGroup}>
              <Text style={styles.filtroLabel}>
                {campo.charAt(0).toUpperCase() + campo.slice(1)}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {valores.map((v) => (
                  <TouchableOpacity
                    key={`${campo}-${v}`}
                    style={[
                      styles.filtroChip,
                      filtros[campo as keyof typeof filtros] === v && styles.filtroChipActive,
                    ]}
                    onPress={() => setFiltros((prev) => ({ ...prev, [campo]: v }))}
                  >
                    <Text
                      style={[
                        styles.filtroChipText,
                        filtros[campo as keyof typeof filtros] === v &&
                          styles.filtroChipTextActive,
                      ]}
                    >
                      {v === "todos" ? "Todos" : v.charAt(0).toUpperCase() + v.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
        </View>
      )}

      {/* 📋 Lista */}
      {outfitsFiltrados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👚</Text>
          <Text style={styles.emptyText}>No tienes outfits aún</Text>
        </View>
      ) : (
        <FlatList
          data={outfitsFiltrados}
          renderItem={renderOutfit}
          keyExtractor={(i) => i.id}
          numColumns={columnas}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* 🔍 Modal detalle outfit */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {outfitSeleccionado && (
              <>
                <Image source={{ uri: outfitSeleccionado.imagen }} style={styles.modalImage} />
                <Text style={styles.modalTitle}>{outfitSeleccionado.nombre}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {outfitSeleccionado.prendas.map((p) => (
                    <Image key={p.id} source={{ uri: p.imagen }} style={styles.miniPrenda} />
                  ))}
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalBtn}
                    onPress={() => {
                      setModalVisible(false);
                      router.push({
                        pathname: "/editar-outfit/[id]" as any,
                        params: { id: outfitSeleccionado.id },
                      });
                    }}
                  >
                    <Ionicons name="create-outline" size={20} color="#FFF" />
                    <Text style={styles.modalBtnText}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#E53935" }]}
                    onPress={() => {
                      setModalVisible(false);
                      handleEliminarOutfit(outfitSeleccionado.id, outfitSeleccionado.nombre);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FFF" />
                    <Text style={styles.modalBtnText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close-circle" size={28} color="#FFF" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  sugeridaBox: {
    backgroundColor: "#FFFFFFAA",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 14,
  },
  sugeridaText: { color: "#222", fontWeight: "600", marginBottom: 8 },
  btnSugerir: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnSugerirText: { color: "#FFF", fontWeight: "600" },
  filtrosContainer: {
    backgroundColor: "#FFFFFFAA",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
  },
  filtroGroup: { marginBottom: 10 },
  filtroLabel: { fontSize: 13, fontWeight: "500", color: "#444", marginBottom: 4 },
  filtroChip: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    marginRight: 6,
  },
  filtroChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filtroChipText: { color: "#666", fontSize: 13 },
  filtroChipTextActive: { color: "#FFF" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    margin: 6,
    flex: 1,
    aspectRatio: 0.8,
    overflow: "hidden",
    elevation: 3,
  },
  cardImage: { width: "100%", height: "80%", resizeMode: "cover" },
  cardName: {
    textAlign: "center",
    color: "#222",
    fontWeight: "600",
    fontSize: 13,
    paddingVertical: 4,
  },
  listContent: { paddingHorizontal: 12, paddingBottom: 60 },
  emptyContainer: { flex: 1, alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 50 },
  emptyText: { color: "#555", marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000AA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    position: "relative",
    paddingBottom: 10,
  },
  modalImage: { width: "100%", height: 220 },
  modalTitle: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    marginVertical: 10,
  },
  miniPrenda: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginHorizontal: 4,
    resizeMode: "cover",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalBtnText: { color: "#FFF", fontWeight: "600" },
  modalClose: { position: "absolute", top: 10, right: 10 },
});
