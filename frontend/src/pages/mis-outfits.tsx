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
import { apiRequest } from "../utils/apiClient";

interface Outfit {
  id: string;
  nombre: string;
  imagen: string;
  prendas: { id: string; imagen: string }[];
  categoria?: string; // casual, formal, etc.
  estacion?: string; // verano, invierno, etc.
  evento?: string; // boda, oficina, cena, ...
  clima?: string; // lluvia, frío, calor, ...
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

  // nuevo: confirmación de borrado
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [outfitAEliminar, setOutfitAEliminar] = useState<Outfit | null>(null);

  const { showLoader, hideLoader } = useLoader();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  // soporte para abrir directamente un outfit desde Home
  const params = useLocalSearchParams<{ id?: string }>();

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
      Alert.alert("Error", err.message || "No se pudieron cargar los outfits");
    } finally {
      hideLoader();
    }
  };

  // abrir modal automáticamente si venimos de Home con ?id=...
  useEffect(() => {
    if (!params.id || outfits.length === 0) return;

    const outfit = outfits.find((o) => o.id === params.id);
    if (outfit) {
      setOutfitSeleccionado(outfit);
      setModalVisible(true);
    }
  }, [params.id, outfits]);

  // filtros dinámicos
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

  // eliminación real (se llama desde el modal de confirmación)
  const eliminarOutfitAhora = async () => {
    if (!outfitAEliminar) return;

    showLoader("Eliminando outfit...");

    try {
      await apiRequest(`/api/outfits/${outfitAEliminar.id}`, {
        method: "DELETE",
      });

      setOutfits((prev) => prev.filter((o) => o.id !== outfitAEliminar.id));
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo eliminar el outfit");
    } finally {
      hideLoader();
      setConfirmVisible(false);
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
                    style={[styles.modalBtn, { backgroundColor: "#E53935" }]}
                    onPress={() => {
                      setOutfitAEliminar(outfitSeleccionado);
                      setModalVisible(false);
                      setTimeout(() => setConfirmVisible(true), 60);
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
                  <Ionicons name="close" size={20} color="#000" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal confirmación eliminación */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>
              ¿Seguro que quieres eliminar este outfit?
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: "#CCC" }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: "#E53935" }]}
                onPress={eliminarOutfitAhora}
              >
                <Text style={{ color: "#FFF" }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: 8,
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
  modalClose: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 4,
  },

  /* Modal confirmación */
  confirmOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  confirmBox: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    width: "90%",
    maxWidth: 320,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
});
