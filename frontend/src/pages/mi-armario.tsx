import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  UIManager,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Header from "components/Header";
import colors from "../constants/colors";
import { apiRequest } from "../utils/apiClient";
import { useLoader } from "../context/LoaderContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Prenda {
  id: string;
  nombre: string;
  tipo: string;
  color: string;
  imagen: string;
  ocasion?: string;
  estacion?: string;
  marca?: string;
  createdAt?: string;
}

type FiltroValor = string;

interface FiltrosState {
  tipo: FiltroValor;
  color: FiltroValor;
  categoria: FiltroValor;
  estacion: FiltroValor;
}

const VALOR_TODOS = "todos";

export default function MiArmario() {
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [filtros, setFiltros] = useState<FiltrosState>({
    tipo: VALOR_TODOS,
    color: VALOR_TODOS,
    categoria: VALOR_TODOS,
    estacion: VALOR_TODOS,
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [orden, setOrden] = useState<"fecha" | "tipo" | "color">("fecha");
  const [prendaSeleccionada, setPrendaSeleccionada] =
    useState<Prenda | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 👇 NUEVO: modal de confirmación
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [prendaAEliminar, setPrendaAEliminar] = useState<Prenda | null>(null);

  const { showLoader, hideLoader } = useLoader();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  useEffect(() => {
    cargarPrendas();
  }, []);

  const cargarPrendas = async () => {
    showLoader("Cargando prendas...");
    try {
      const data = await apiRequest<{ prendas: Prenda[] }>("/api/prendas", {
        method: "GET",
      });
      setPrendas(Array.isArray(data) ? data : data.prendas || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudieron cargar las prendas");
    } finally {
      hideLoader();
    }
  };

  // 👇 Actualizado: elimina la prenda directamente SIN Alert.alert()
  const eliminarAhora = async () => {
    if (!prendaAEliminar) return;

    showLoader("Eliminando prenda...");

    try {
      await apiRequest(`/api/prendas/${prendaAEliminar.id}`, {
        method: "DELETE",
      });

      setPrendas((prev) =>
        prev.filter((p) => p.id !== prendaAEliminar.id)
      );
    } catch (error: any) {
      console.error("❌ Error eliminando:", error);
      Alert.alert("Error", error.message || "No se pudo eliminar la prenda");
    } finally {
      hideLoader();
      setConfirmVisible(false);
    }
  };

  const toggleFiltros = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMostrarFiltros(!mostrarFiltros);
  };

  const ordenarPrendas = (lista: Prenda[]) => {
    switch (orden) {
      case "tipo":
        return [...lista].sort((a, b) => a.tipo.localeCompare(b.tipo));
      case "color":
        return [...lista].sort((a, b) => a.color.localeCompare(b.color));
      case "fecha":
      default:
        return [...lista].sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
        );
    }
  };

  const prendasOrdenadas = useMemo(
    () => ordenarPrendas(prendas),
    [prendas, orden]
  );

  const opcionesFiltros = useMemo(() => {
    const setTipos = new Set<string>();
    const setColores = new Set<string>();
    const setCategorias = new Set<string>();
    const setEstaciones = new Set<string>();

    prendas.forEach((p) => {
      if (p.tipo) setTipos.add(p.tipo);
      if (p.color) setColores.add(p.color);
      if (p.ocasion) setCategorias.add(p.ocasion);
      if (p.estacion) setEstaciones.add(p.estacion);
    });

    const toArray = (set: Set<string>) => [VALOR_TODOS, ...Array.from(set)];

    return {
      tipo: toArray(setTipos),
      color: toArray(setColores),
      categoria: toArray(setCategorias),
      estacion: toArray(setEstaciones),
    };
  }, [prendas]);

  const prendasFiltradas = useMemo(() => {
    return prendasOrdenadas.filter((p) => {
      const coincideTipo = filtros.tipo === VALOR_TODOS || p.tipo === filtros.tipo;
      const coincideColor = filtros.color === VALOR_TODOS || p.color === filtros.color;
      const coincideCategoria =
        filtros.categoria === VALOR_TODOS || p.ocasion === filtros.categoria;
      const coincideEstacion =
        filtros.estacion === VALOR_TODOS || p.estacion === filtros.estacion;
      return coincideTipo && coincideColor && coincideCategoria && coincideEstacion;
    });
  }, [prendasOrdenadas, filtros]);

  const columnas = isWeb ? Math.min(Math.floor(width / 220), 5) : 4;

  const abrirDetalle = (prenda: Prenda) => {
    setPrendaSeleccionada(prenda);
    setModalVisible(true);
  };

  const actualizarFiltro = (campo: keyof FiltrosState, valor: FiltroValor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipo: VALOR_TODOS,
      color: VALOR_TODOS,
      categoria: VALOR_TODOS,
      estacion: VALOR_TODOS,
    });
  };

  const renderPrenda = ({ item }: { item: Prenda }) => (
    <TouchableOpacity
      style={styles.prendaContainer}
      onPress={() => abrirDetalle(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.imagen }} style={styles.prendaImagen} />
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Header title="Mi Armario" />

      {/* 🔝 Acciones */}
      <View style={styles.topActions}>
        <TouchableOpacity
          style={styles.btnAgregar}
          onPress={() => router.push("/add-prenda")}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={styles.btnAgregarText}>Agregar</Text>
        </TouchableOpacity>

        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.btnOrdenar}
            onPress={() => {
              const ordenes: any = { fecha: "tipo", tipo: "color", color: "fecha" };
              setOrden(ordenes[orden]);
            }}
          >
            <Ionicons name="swap-vertical-outline" size={22} color={colors.primary} />
            <Text style={styles.ordenarText}>{orden}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnFiltros} onPress={toggleFiltros}>
            <Ionicons name="options-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔽 Panel filtros */}
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
                      filtros[campo as keyof FiltrosState] === v &&
                        styles.filtroChipActive,
                    ]}
                    onPress={() => actualizarFiltro(campo as keyof FiltrosState, v)}
                  >
                    <Text
                      style={[
                        styles.filtroChipText,
                        filtros[campo as keyof FiltrosState] === v &&
                          styles.filtroChipTextActive,
                      ]}
                    >
                      {v === VALOR_TODOS ? "Todos" : v.charAt(0).toUpperCase() + v.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
        </View>
      )}

      {/* 🧩 Lista */}
      {prendasFiltradas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👕</Text>
          <Text style={styles.emptyText}>
            {prendas.length === 0
              ? "No tienes prendas aún"
              : "No hay prendas que coincidan con los filtros"}
          </Text>
          <TouchableOpacity
            style={styles.btnAgregarEmpty}
            onPress={() => router.push("/add-prenda")}
          >
            <Text style={styles.btnAgregarEmptyText}>Agregar prenda</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={prendasFiltradas}
          renderItem={renderPrenda}
          keyExtractor={(item) => item.id}
          numColumns={columnas}
          contentContainerStyle={styles.gridContainer}
        />
      )}

      {/* 🪟 Modal detalle prenda */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {prendaSeleccionada && (
              <>
                <Image
                  source={{ uri: prendaSeleccionada.imagen }}
                  style={styles.modalImage}
                />
                <ScrollView style={{ maxHeight: 220 }}>
                  <Text style={styles.modalTitle}>
                    {prendaSeleccionada.nombre}
                  </Text>
                  <Text style={styles.modalDetail}>{prendaSeleccionada.tipo}</Text>
                  <Text style={styles.modalDetail}>{prendaSeleccionada.color}</Text>
                  {prendaSeleccionada.ocasion && (
                    <Text style={styles.modalDetail}>
                      {prendaSeleccionada.ocasion}
                    </Text>
                  )}
                  {prendaSeleccionada.estacion && (
                    <Text style={styles.modalDetail}>
                      {prendaSeleccionada.estacion}
                    </Text>
                  )}
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalBtn}
                    onPress={() => {
                      setModalVisible(false);
                      router.push({
                        pathname: "/add-prenda",
                        params: { id: prendaSeleccionada.id },
                      });
                    }}
                  >
                    <Ionicons name="create-outline" size={20} color="#FFF" />
                    <Text style={styles.modalBtnText}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#E53935" }]}
                    onPress={() => {
                      setPrendaAEliminar(prendaSeleccionada);
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
                  <Ionicons name="close-circle" size={26} color="#FFF" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 🟥 Modal de confirmación */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>
              ¿Seguro que quieres eliminar esta prenda?
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: "#CCC" }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: "#E53935" },
                ]}
                onPress={eliminarAhora}
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
  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnAgregar: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnAgregarText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
  rightActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  btnOrdenar: {
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  ordenarText: {
    color: colors.primary,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  btnFiltros: {
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 10,
  },
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
  filtrosTitulo: { fontSize: 16, fontWeight: "600", color: "#1E1E1E" },
  limpiarFiltros: { color: colors.primary, fontSize: 13, fontWeight: "500" },
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
  filtroChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroChipText: { color: "#666", fontSize: 13 },
  filtroChipTextActive: { color: "#FFF" },
  gridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 40,
    justifyContent: "center",
  },
  prendaContainer: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFF",
    elevation: 3,
    maxWidth: 250,
    alignSelf: "center",
  },
  prendaImagen: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    objectFit: "cover",
  },
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
  },
  modalImage: { width: "100%", height: 220, resizeMode: "cover" },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  modalDetail: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
    textAlign: "center",
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
  },

  /* 🟥 estilos del modal de confirmación */

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

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 40,
  },
  emptyIcon: { fontSize: 50, marginBottom: 10 },
  emptyText: { fontSize: 15, color: "#666", marginBottom: 12 },
  btnAgregarEmpty: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  btnAgregarEmptyText: { color: "#FFF", fontWeight: "600" },
});
