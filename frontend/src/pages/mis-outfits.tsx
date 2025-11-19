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
  categoria?: string;   // casual, formal, etc.
  estacion?: string;    // verano, invierno, etc.
  evento?: string;      // boda, oficina, cena, ...
  clima?: string;       // lluvia, frío, calor, ...
  createdAt?: string;
}

interface FiltrosOutfit {
  categoria: string;
  estacion: string;
  evento: string;
  clima: string;
  prenda: string;
}

export default function MisOutfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [outfitSeleccionado, setOutfitSeleccionado] = useState<Outfit | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosOutfit>({
    categoria: "todos",
    estacion: "todos",
    evento: "todos",
    clima: "todos",
    prenda: "todos",
  });

  const { showLoader, hideLoader } = useLoader();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  // soporte tanto para "sugerida" antiguo como para "prendaBase"
  const params = useLocalSearchParams<{ sugerida?: string; prendaBase?: string }>();
  const prendaBase = params.prendaBase || params.sugerida;

  useEffect(() => {
    cargarOutfits();
  }, []);

  const cargarOutfits = async () => {
    showLoader("Cargando outfits...");
    try {
      const data = await apiRequest<{ outfits: Outfit[] }>("/api/outfits", {
        method: "GET",
      });
      setOutfits(data.outfits || []);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "No se pudieron cargar los outfits"
      );
    } finally {
      hideLoader();
    }
  };

  // 🔹 Filtros dinámicos: categoría, estación, evento, clima, prenda
  const opcionesFiltros = useMemo(() => {
    const setCategorias = new Set<string>();
    const setEstaciones = new Set<string>();
    const setEventos = new Set<string>();
    const setClimas = new Set<string>();
    const setPrendas = new Set<string>();

    outfits.forEach((o) => {
      if (o.categoria) setCategorias.add(o.categoria);
      if (o.estacion) setEstaciones.add(o.estacion);
      if (o.evento) setEventos.add(o.evento);
      if (o.clima) setClimas.add(o.clima);
      o.prendas?.forEach((p) => {
        if (p.id) setPrendas.add(p.id);
      });
    });

    const toArray = (set: Set<string>) => ["todos", ...Array.from(set)];

    return {
      categoria: toArray(setCategorias),
      estacion: toArray(setEstaciones),
      evento: toArray(setEventos),
      clima: toArray(setClimas),
      prenda: toArray(setPrendas),
    };
  }, [outfits]);

  const outfitsFiltrados = useMemo(() => {
    return outfits.filter((o) => {
      const matchCategoria =
        filtros.categoria === "todos" || o.categoria === filtros.categoria;
      const matchEstacion =
        filtros.estacion === "todos" || o.estacion === filtros.estacion;
      const matchEvento =
        filtros.evento === "todos" || o.evento === filtros.evento;
      const matchClima = filtros.clima === "todos" || o.clima === filtros.clima;
      const matchPrenda =
        filtros.prenda === "todos" ||
        !!o.prendas?.some((p) => p.id === filtros.prenda);

      return (
        matchCategoria &&
        matchEstacion &&
        matchEvento &&
        matchClima &&
        matchPrenda
      );
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
            const res = await apiFetch(`/api/outfits/${id}`, {
              method: "DELETE",
            });
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

  const limpiarFiltros = () => {
    setFiltros({
      categoria: "todos",
      estacion: "todos",
      evento: "todos",
      clima: "todos",
      prenda: "todos",
    });
  };

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Header title="Mis Outfits" />

      {/* 🔝 Acciones: crear outfit + filtros */}
      <View style={styles.topActions}>
        <TouchableOpacity
          style={styles.btnCrear}
          onPress={() => router.push("/crear-outfit" as any)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={styles.btnCrearText}>Crear outfit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnFiltros}
          onPress={() => setMostrarFiltros((prev) => !prev)}
        >
          <Ionicons name="options-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 🪄 Prenda base para sugerencia (cuando llegamos desde mi-armario) */}
      {prendaBase && (
        <View style={styles.sugeridaBox}>
          <Text style={styles.sugeridaText}>
            Tienes una prenda seleccionada para crear un outfit ✨
          </Text>
          <TouchableOpacity
            style={styles.btnSugerir}
            onPress={() =>
              router.push({
                pathname: "/crear-outfit",
                params: { prendaBase: prendaBase as string },
              } as any)
            }
          >
            <Ionicons name="sparkles-outline" size={20} color="#FFF" />
            <Text style={styles.btnSugerirText}>Crear outfit con IA</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 🧠 Atajos para sugerencias por evento / clima / prenda */}
      <View style={styles.aiBox}>
        <Text style={styles.aiTitle}>¿No sabes qué ponerte?</Text>
        <View style={styles.aiButtonsRow}>
          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() =>
              router.push({
                pathname: "/crear-outfit",
                params: { modo: "evento" },
              } as any)
            }
          >
            <Ionicons name="calendar-outline" size={18} color="#FFF" />
            <Text style={styles.aiBtnText}>Por evento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() =>
              router.push({
                pathname: "/crear-outfit",
                params: { modo: "clima" },
              } as any)
            }
          >
            <Ionicons name="cloud-outline" size={18} color="#FFF" />
            <Text style={styles.aiBtnText}>Por clima</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() =>
              router.push({
                pathname: "/crear-outfit",
                params: { modo: "prenda" },
              } as any)
            }
          >
            <Ionicons name="shirt-outline" size={18} color="#FFF" />
            <Text style={styles.aiBtnText}>Por prenda</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔽 Filtros dinámicos */}
      {mostrarFiltros && (
        <View style={styles.filtrosContainer}>
          <View style={styles.filtrosHeader}>
            <Text style={styles.filtrosTitulo}>Filtros</Text>
            <TouchableOpacity onPress={limpiarFiltros}>
              <Text style={styles.limpiarFiltros}>Limpiar</Text>
            </TouchableOpacity>
          </View>

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
                      filtros[campo as keyof FiltrosOutfit] === v &&
                        styles.filtroChipActive,
                    ]}
                    onPress={() =>
                      setFiltros((prev) => ({
                        ...prev,
                        [campo]: v,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.filtroChipText,
                        filtros[campo as keyof FiltrosOutfit] === v &&
                          styles.filtroChipTextActive,
                      ]}
                    >
                      {v === "todos"
                        ? "Todos"
                        : v.charAt(0).toUpperCase() + v.slice(1)}
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
                <Image
                  source={{ uri: outfitSeleccionado.imagen }}
                  style={styles.modalImage}
                />
                <Text style={styles.modalTitle}>
                  {outfitSeleccionado.nombre}
                </Text>

                {/* info rápida de filtros */}
                <View style={styles.modalTagsRow}>
                  {outfitSeleccionado.categoria && (
                    <Text style={styles.modalTag}>
                      {outfitSeleccionado.categoria}
                    </Text>
                  )}
                  {outfitSeleccionado.estacion && (
                    <Text style={styles.modalTag}>
                      {outfitSeleccionado.estacion}
                    </Text>
                  )}
                  {outfitSeleccionado.evento && (
                    <Text style={styles.modalTag}>
                      {outfitSeleccionado.evento}
                    </Text>
                  )}
                  {outfitSeleccionado.clima && (
                    <Text style={styles.modalTag}>
                      {outfitSeleccionado.clima}
                    </Text>
                  )}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ paddingHorizontal: 8 }}
                >
                  {outfitSeleccionado.prendas.map((p) => (
                    <Image
                      key={p.id}
                      source={{ uri: p.imagen }}
                      style={styles.miniPrenda}
                    />
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
                    style={[
                      styles.modalBtn,
                      { backgroundColor: "#E53935" },
                    ]}
                    onPress={() => {
                      setModalVisible(false);
                      handleEliminarOutfit(
                        outfitSeleccionado.id,
                        outfitSeleccionado.nombre
                      );
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

  /* Top actions */
  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnCrear: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  btnCrearText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  btnFiltros: {
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 10,
  },

  /* Caja prenda sugerida */
  sugeridaBox: {
    backgroundColor: "#FFFFFFAA",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
  },
  sugeridaText: {
    color: "#222",
    fontWeight: "600",
    marginBottom: 8,
  },
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

  /* Caja IA: por evento / clima / prenda */
  aiBox: {
    backgroundColor: "#FFFFFFAA",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  aiTitle: {
    color: "#222",
    fontWeight: "600",
    marginBottom: 6,
  },
  aiButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  aiBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  aiBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },

  /* Filtros */
  filtrosContainer: {
    backgroundColor: "#FFFFFFAA",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
  },
  filtrosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  filtrosTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E1E1E",
  },
  limpiarFiltros: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "500",
  },
  filtroGroup: { marginBottom: 10 },
  filtroLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#444",
    marginBottom: 4,
  },
  filtroChip: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    marginRight: 6,
  },
  filtroChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroChipText: { color: "#666", fontSize: 13 },
  filtroChipTextActive: { color: "#FFF" },

  /* Tarjetas de outfit */
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

  /* Empty */
  emptyContainer: { flex: 1, alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 50 },
  emptyText: { color: "#555", marginTop: 6 },

  /* Modal detalle */
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
  modalTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  modalTag: {
    fontSize: 11,
    color: "#555",
    backgroundColor: "#F3F3F3",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
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
