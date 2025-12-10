// ========= MI-ARMARIO FINAL INTEGRADO =========
// Con scroll fix, botón atrás, icono perfil, título más abajo, responsive web/mobile

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Modal,
  Platform,
  UIManager,
  useWindowDimensions,
  ScrollView,
  StyleSheet,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import TitleSerif from "../components/ui/TitleSerif";
import SubtitleSerif from "../components/ui/SubtitleSerif";
import Card from "../components/ui/Card";
import FloatingActionButton from "../components/ui/FloatingActionButton";

import colors from "../constants/colors";
import { apiRequest } from "../utils/apiClient";
import { useLoader } from "../context/LoaderContext";

/* Android animation */
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
)
  UIManager.setLayoutAnimationEnabledExperimental(true);

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
const QUICK_ALL = "All";

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

  const params = useLocalSearchParams();
  const eventoId = params.eventoId as string | undefined;
  const selectMode = params.selectMode;

  const [prendaSeleccionada, setPrendaSeleccionada] =
    useState<Prenda | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [prendaAEliminar, setPrendaAEliminar] = useState<Prenda | null>(null);

  const [filtroCategoria, setFiltroCategoria] = useState(QUICK_ALL);

  const { showLoader, hideLoader } = useLoader();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  /* -------------------- Load prendas -------------------- */
  useEffect(() => {
    cargarPrendas();
  }, []);

  const cargarPrendas = async () => {
    showLoader("Cargando prendas...");
    try {
      const data = await apiRequest<{ prendas: Prenda[] }>("/api/prendas", {
        method: "GET",
      });
      setPrendas(Array.isArray(data) ? data : data.prendas ?? []);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      hideLoader();
    }
  };

  /* -------------------- Delete -------------------- */
  const eliminarAhora = async () => {
    if (!prendaAEliminar) return;

    showLoader("Eliminando prenda...");

    try {
      await apiRequest(`/api/prendas/${prendaAEliminar.id}`, { method: "DELETE" });
      setPrendas((prev) => prev.filter((p) => p.id !== prendaAEliminar.id));
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      hideLoader();
      setConfirmVisible(false);
    }
  };

  /* -------------------- Orden -------------------- */
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

  /* -------------------- Opciones filtro dinámicas -------------------- */

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

    const toArray = (s: Set<string>) => [VALOR_TODOS, ...Array.from(s)];

    return {
      tipo: toArray(setTipos),
      color: toArray(setColores),
      categoria: toArray(setCategorias),
      estacion: toArray(setEstaciones),
    };
  }, [prendas]);

  /* -------------------- Chips rápidas -------------------- */
  const categoriasRapidas = useMemo(() => {
    const tipos = new Set<string>();
    prendas.forEach((p) => p.tipo && tipos.add(p.tipo));
    return [QUICK_ALL, ...Array.from(tipos)];
  }, [prendas]);

  /* -------------------- Filtros finales -------------------- */
  const prendasFiltradas = useMemo(() => {
    return prendasOrdenadas.filter((p) => {
      const coincideTipo =
        filtros.tipo === VALOR_TODOS || p.tipo === filtros.tipo;
      const coincideColor =
        filtros.color === VALOR_TODOS || p.color === filtros.color;
      const coincideCat =
        filtros.categoria === VALOR_TODOS || p.ocasion === filtros.categoria;
      const coincideEst =
        filtros.estacion === VALOR_TODOS || p.estacion === filtros.estacion;

      const coincideQuick =
        filtroCategoria === QUICK_ALL || p.tipo === filtroCategoria;

      return coincideTipo && coincideColor && coincideCat && coincideEst && coincideQuick;
    });
  }, [prendasOrdenadas, filtros, filtroCategoria]);

  const columnas = isWeb ? 3 : 2;

  /* -------------------- Navigation / Modal -------------------- */
  const abrirDetalle = (prenda: Prenda) => {
    if (selectMode === "prenda") {
      if (eventoId) {
        router.push(`/crear-outfit?prendaId=${prenda.id}&eventoId=${eventoId}`);
      } else {
        router.push(`/crear-outfit?prendaId=${prenda.id}`);
      }
      return;
    }

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

  /* -------------------- Render Item -------------------- */
  const renderPrenda = ({ item }: { item: Prenda }) => (
    <Card style={styles.prendaCard}>
      <TouchableOpacity
        style={styles.prendaTouchable}
        onPress={() => abrirDetalle(item)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.imagen }}
          style={[styles.prendaImagen, isWeb && styles.prendaImagenWeb]}
          resizeMode={isWeb ? "contain" : "cover"}
        />
        <View style={styles.prendaInfo}>
          <Text style={styles.prendaNombre}>{item.nombre}</Text>
          <Text style={styles.prendaTipo}>{item.tipo}</Text>
        </View>
      </TouchableOpacity>
    </Card>
  );

  /* -------------------- RENDER -------------------- */
  return (
    <LinearGradient colors={colors.gradient} style={{ flex: 1, minHeight: 0 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* ░░░ CABECERA FIJA SIN SCROLL ░░░ */}
        <View style={styles.headerArea}>

          {/* Top row: botón atrás + perfil */}
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

          {/* Título “Tu armario” más abajo */}
          <View style={styles.titleBlock}>
            <TitleSerif style={styles.title}>Tu armario</TitleSerif>
            <SubtitleSerif>{prendas.length} prendas organizadas</SubtitleSerif>
          </View>

          {/* Chips rápidas */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
            style={{ overflow: "visible" }}
          >
            {categoriasRapidas.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  filtroCategoria === cat && styles.categoryChipActive,
                ]}
                onPress={() => {
                  setFiltroCategoria(cat);
                  setFiltros((prev) => ({
                    ...prev,
                    tipo: cat === QUICK_ALL ? VALOR_TODOS : cat,
                  }));
                }}
              >
                <Text
                  style={[
                    styles.categoryText,
                    filtroCategoria === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Top buttons */}
          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.btnAgregar}
              onPress={() => router.push("/add-prenda")}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={colors.textOnPrimary}
              />
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
                <Ionicons name="swap-vertical-outline" size={20} color={colors.iconActive} />
                <Text style={styles.ordenarText}>
                  {orden === "fecha" ? "Fecha" : orden}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnFiltros}
                onPress={() => setMostrarFiltros(!mostrarFiltros)}
              >
                <Ionicons name="options-outline" size={20} color={colors.iconActive} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filtros */}
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

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                  >
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
                          {v === VALOR_TODOS ? "Todos" : v}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ))}
            </View>
          )}

        </View>

        {/* ░░░ GRID CON SCROLL ░░░ */}
        <View style={{ flex: 1, minHeight: 0 }}>
          <FlatList
            data={prendasFiltradas}
            renderItem={renderPrenda}
            keyExtractor={(item) => item.id}
            numColumns={columnas}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.gridContainer}
          />
        </View>

        {/* FAB */}
        <FloatingActionButton onPress={() => router.push("/add-prenda")} />

        {/* MODAL DETALLE */}
        <Modal visible={modalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {prendaSeleccionada && (
                <>
                  <View style={styles.modalImageWrapper}>
                    <Image
                      source={{ uri: prendaSeleccionada.imagen }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{prendaSeleccionada.nombre}</Text>

                    <Text style={styles.modalDetailText}>
                      Tipo: {prendaSeleccionada.tipo}
                    </Text>

                    <Text style={styles.modalDetailText}>
                      Color: {prendaSeleccionada.color}
                    </Text>

                    {prendaSeleccionada.ocasion && (
                      <Text style={styles.modalDetailText}>
                        Ocasión: {prendaSeleccionada.ocasion}
                      </Text>
                    )}

                    {prendaSeleccionada.estacion && (
                      <Text style={styles.modalDetailText}>
                        Estación: {prendaSeleccionada.estacion}
                      </Text>
                    )}
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalBtnSecondary}
                      onPress={() => {
                        setModalVisible(false);
                        router.push(`/editar-prenda?id=${prendaSeleccionada.id}`);
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
                      <Text style={styles.modalBtnSecondaryText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalBtnPrimary}
                      onPress={() => {
                        setModalVisible(false);
                        router.push(`/crear-outfit?prendaId=${prendaSeleccionada.id}`);
                      }}
                    >
                      <Ionicons name="sparkles-outline" size={18} color="#FFF" />
                      <Text style={styles.modalBtnPrimaryText}>Crear outfit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalBtnDanger}
                      onPress={() => {
                        setPrendaAEliminar(prendaSeleccionada);
                        setModalVisible(false);
                        setTimeout(() => setConfirmVisible(true), 60);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FFF" />
                      <Text style={styles.modalBtnPrimaryText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* CONFIRM DELETE */}
        <Modal visible={confirmVisible} transparent animationType="fade">
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>
                ¿Seguro que quieres eliminar esta prenda?
              </Text>

              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: colors.primarySoft }]}
                  onPress={() => setConfirmVisible(false)}
                >
                  <Text style={{ color: colors.textPrimary }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: colors.danger }]}
                  onPress={eliminarAhora}
                >
                  <Text style={{ color: "#FFF" }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({

  headerArea: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 10,       // título más abajo → estilo Home
    paddingBottom: 30,
  },

  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  backButton: {
    backgroundColor: colors.card,
    padding: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  profileButton: {
    padding: 4,
  },

  titleBlock: {
    marginBottom: 16,
  },

  title: {
    fontSize: 32,
    marginBottom: 6,
    color: colors.textPrimary,
  },

  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.chipBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
  },

  categoryChipActive: {
    backgroundColor: colors.chipBackgroundActive,
    borderColor: colors.chipBackgroundActive,
  },

  categoryText: {
    color: colors.chipText,
    fontSize: 14,
  },

  categoryTextActive: {
    color: colors.chipTextActive,
  },

  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 6,
  },

  btnAgregar: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  btnAgregarText: {
    color: colors.textOnPrimary,
    fontWeight: "600",
  },

  rightActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  btnOrdenar: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  ordenarText: {
    color: colors.textSecondary,
  },

  btnFiltros: {
    backgroundColor: colors.card,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filtrosContainer: {
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    padding: 12,
    marginTop: 10,
  },

  filtrosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  filtrosTitulo: {
    fontSize: 16,
    fontWeight: "600",
  },

  limpiarFiltros: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "500",
  },

  filtroGroup: {
    marginBottom: 10,
  },

  filtroLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },

  filtroChip: {
    backgroundColor: colors.chipBackground,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },

  filtroChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filtroChipText: {
    color: colors.textSecondary,
  },

  filtroChipTextActive: {
    color: colors.textOnPrimary,
  },

  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 120,
  },

  prendaCard: {
    flex: 1,
    margin: 8,
    borderRadius: 22,
    overflow: "hidden",
  },

  prendaTouchable: {
    backgroundColor: colors.card,
  },

  prendaImagen: {
    width: "100%",
    height: 180,
  },

  prendaImagenWeb: {
    height: 220,
    ...(Platform.OS === "web" && {
      objectFit: "contain",
    }),
  },

  prendaInfo: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  prendaNombre: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  prendaTipo: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  /* -------------------- Modal -------------------- */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 26,
    overflow: "hidden",
    position: "relative",
  },

  modalImageWrapper: {
    backgroundColor: colors.background,
    paddingVertical: 16,
  },

  modalImage: {
    width: "100%",
    height: 250,
  },

  modalContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    color: colors.textPrimary,
  },

  modalDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },

  modalBtnSecondary: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  modalBtnSecondaryText: {
    color: colors.textPrimary,
    fontWeight: "500",
  },

  modalBtnPrimary: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  modalBtnDanger: {
    flex: 0.9,
    borderRadius: 999,
    backgroundColor: colors.danger,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  modalBtnPrimaryText: {
    color: "#FFF",
    fontWeight: "600",
  },

  modalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FFFFFFEE",
    padding: 6,
    borderRadius: 999,
  },

  /* -------------------- Confirm delete -------------------- */
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  confirmBox: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    width: "90%",
    maxWidth: 320,
  },

  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 20,
  },

  confirmActions: {
    flexDirection: "row",
    gap: 10,
  },

  confirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
});
