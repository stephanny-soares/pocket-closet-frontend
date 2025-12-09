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
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";

import TitleSerif from "../components/ui/TitleSerif";
import SubtitleSerif from "../components/ui/SubtitleSerif";
import Card from "../components/ui/Card";
import FloatingActionButton from "../components/ui/FloatingActionButton";

import colors from "../constants/colors";
import { useLoader } from "../context/LoaderContext";
import { apiRequest } from "../utils/apiClient";

/* -------------------------------------------- */
/* ------------------ INTERFACES -------------- */
/* -------------------------------------------- */

interface Outfit {
  id: string;
  nombre: string;
  imagen: string;
  prendas: { id: string; imagen: string }[];
  categoria?: string;
  estacion?: string;
  evento?: string;
  clima?: string;
  createdAt?: string;
}

interface FiltrosOutfit {
  categoria: string;
  estacion: string;
  evento: string;
  clima: string;
  prenda: string;
}

const VALOR_TODOS = "todos";
const QUICK_ALL = "Todas";

/* -------------------------------------------- */
/* ------------------ COMPONENT ---------------- */
/* -------------------------------------------- */

export default function MisOutfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [outfitSeleccionado, setOutfitSeleccionado] = useState<Outfit | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [orden, setOrden] = useState<"fecha" | "nombre" | "categoria">("fecha");

  const [filtros, setFiltros] = useState<FiltrosOutfit>({
    categoria: VALOR_TODOS,
    estacion: VALOR_TODOS,
    evento: VALOR_TODOS,
    clima: VALOR_TODOS,
    prenda: VALOR_TODOS,
  });

  const [filtroCategoriaRapida, setFiltroCategoriaRapida] =
    useState<string>(QUICK_ALL);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [outfitAEliminar, setOutfitAEliminar] = useState<Outfit | null>(null);

  const { showLoader, hideLoader } = useLoader();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const params = useLocalSearchParams<{ id?: string }>();

  /* -------------------------------------------- */
  /* ------------ Cargar outfits ---------------- */
  /* -------------------------------------------- */

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
      Alert.alert("Error", err.message);
    } finally {
      hideLoader();
    }
  };

  /* -------------------------------------------- */
  /* --- Abrir outfit directo desde ?id=... ----- */
  /* -------------------------------------------- */

  useEffect(() => {
    if (!params.id || outfits.length === 0) return;
    const outfit = outfits.find((o) => o.id === params.id);
    if (outfit) {
      setOutfitSeleccionado(outfit);
      setModalVisible(true);
    }
  }, [params.id, outfits]);

  /* -------------------------------------------- */
  /* ----------- Filtros dinámicos ------------- */
  /* -------------------------------------------- */

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
      o.prendas?.forEach((p) => p.id && setPrendas.add(p.id));
    });

    const toArray = (set: Set<string>) => [VALOR_TODOS, ...Array.from(set)];

    return {
      categoria: toArray(setCategorias),
      estacion: toArray(setEstaciones),
      evento: toArray(setEventos),
      clima: toArray(setClimas),
      prenda: toArray(setPrendas),
    };
  }, [outfits]);

  /* -------------------------------------------- */
  /* -------- Chips rápidas categoría ----------- */
  /* -------------------------------------------- */

  const categoriasRapidas = useMemo(() => {
    const setCategorias = new Set<string>();
    outfits.forEach((o) => o.categoria && setCategorias.add(o.categoria));
    return [QUICK_ALL, ...Array.from(setCategorias)];
  }, [outfits]);

  /* -------------------------------------------- */
  /* ------------- Ordenar outfits -------------- */
  /* -------------------------------------------- */

  const ordenar = (lista: Outfit[]) => {
    switch (orden) {
      case "nombre":
        return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre));
      case "categoria":
        return [...lista].sort(
          (a, b) => (a.categoria || "").localeCompare(b.categoria || "")
        );
      case "fecha":
      default:
        return [...lista].sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
        );
    }
  };

  /* -------------------------------------------- */
  /* ------ Filtro final con chips rápidas ------ */
  /* -------------------------------------------- */

  const outfitsFiltrados = useMemo(() => {
    const filtrados = outfits.filter((o) => {
      const matchCategoria =
        filtros.categoria === VALOR_TODOS || o.categoria === filtros.categoria;

      const matchEstacion =
        filtros.estacion === VALOR_TODOS || o.estacion === filtros.estacion;

      const matchEvento =
        filtros.evento === VALOR_TODOS || o.evento === filtros.evento;

      const matchClima =
        filtros.clima === VALOR_TODOS || o.clima === filtros.clima;

      const matchPrenda =
        filtros.prenda === VALOR_TODOS ||
        o.prendas.some((p) => p.id === filtros.prenda);

      const matchQuick =
        filtroCategoriaRapida === QUICK_ALL ||
        o.categoria === filtroCategoriaRapida;

      return (
        matchCategoria &&
        matchEstacion &&
        matchEvento &&
        matchClima &&
        matchPrenda &&
        matchQuick
      );
    });

    return ordenar(filtrados);
  }, [outfits, filtros, filtroCategoriaRapida, orden]);

  const columnas = isWeb ? 3 : 2;

  /* -------------------------------------------- */
  /* ---------------- Render Item --------------- */
  /* -------------------------------------------- */

  const renderOutfit = ({ item }: { item: Outfit }) => (
    <Card style={styles.outfitCard}>
      <TouchableOpacity
        style={styles.outfitTouchable}
        onPress={() => {
          setOutfitSeleccionado(item);
          setModalVisible(true);
        }}
      >
        <Image
          source={{ uri: item.imagen }}
          style={[
            styles.outfitImagen,
            isWeb && styles.outfitImagenWeb,
          ]}
          resizeMode="contain"
        />

        <View style={styles.outfitInfo}>
          <Text style={styles.outfitNombre}>{item.nombre}</Text>
          {item.categoria && (
            <Text style={styles.outfitCategoria}>
              {item.categoria.charAt(0).toUpperCase() +
                item.categoria.slice(1)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );

  /* -------------------------------------------- */
  /* ---------------- Limpia filtros ------------ */
  /* -------------------------------------------- */

  const limpiarFiltros = () => {
    setFiltros({
      categoria: VALOR_TODOS,
      estacion: VALOR_TODOS,
      evento: VALOR_TODOS,
      clima: VALOR_TODOS,
      prenda: VALOR_TODOS,
    });
    setFiltroCategoriaRapida(QUICK_ALL);
  };

  /* -------------------------------------------- */
  /* -------------------- RENDER ---------------- */
  /* -------------------------------------------- */

  return (
    <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
      <View style={styles.headerArea}>
        {/* ---------- TOP ROW ----------- */}
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

        {/* ---------- TITLE + SUBTITLE ----------- */}
        <View style={styles.titleBlock}>
          <TitleSerif style={styles.title}>Tus outfits</TitleSerif>
          <SubtitleSerif>
            {outfits.length} outfits creados con IA para ti
          </SubtitleSerif>
        </View>

        {/* ---------- CHIPS RÁPIDAS ----------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {categoriasRapidas.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                filtroCategoriaRapida === cat && styles.categoryChipActive,
              ]}
              onPress={() => {
                setFiltroCategoriaRapida(cat);
                setFiltros((prev) => ({
                  ...prev,
                  categoria: cat === QUICK_ALL ? VALOR_TODOS : cat,
                }));
              }}
            >
              <Text
                style={[
                  styles.categoryText,
                  filtroCategoriaRapida === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ---------- ACTION BUTTONS (TU ORDEN) ----------- */}
        <View style={styles.topActions}>
          {/* CREAR OUTFIT */}
          <TouchableOpacity
            style={styles.btnAgregar}
            onPress={() => router.push("/crear-outfit")}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={colors.textOnPrimary}
            />
            <Text style={styles.btnAgregarText}>Crear outfit</Text>
          </TouchableOpacity>

          {/* ORDENAR */}
          <TouchableOpacity
            style={styles.btnOrdenar}
            onPress={() => {
              const next: any = {
                fecha: "nombre",
                nombre: "categoria",
                categoria: "fecha",
              };
              setOrden(next[orden]);
            }}
          >
            <Ionicons
              name="swap-vertical-outline"
              size={20}
              color={colors.iconActive}
            />
            <Text style={styles.ordenarText}>
              {orden === "fecha"
                ? "Fecha"
                : orden === "nombre"
                ? "Nombre"
                : "Categoría"}
            </Text>
          </TouchableOpacity>

          {/* FILTROS */}
          <TouchableOpacity
            style={styles.btnFiltros}
            onPress={() => setMostrarFiltros((prev) => !prev)}
          >
            <Ionicons name="options-outline" size={20} color={colors.iconActive} />
          </TouchableOpacity>
        </View>

        {/* ---------- PANEL DE FILTROS ----------- */}
        {mostrarFiltros && (
          <View style={styles.filtrosContainer}>
            <View style={styles.filtrosHeader}>
              <Text style={styles.filtrosTitulo}>Filtros</Text>
              <TouchableOpacity onPress={limpiarFiltros}>
                <Text style={styles.limpiarFiltros}>Limpiar</Text>
              </TouchableOpacity>
            </View>

            {Object.entries(opcionesFiltros).map(([campo, lista]) => (
              <View key={campo} style={styles.filtroGroup}>
                <Text style={styles.filtroLabel}>
                  {campo.charAt(0).toUpperCase() + campo.slice(1)}
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {lista.map((v) => (
                    <TouchableOpacity
                      key={`${campo}-${v}`}
                      style={[
                        styles.filtroChip,
                        filtros[campo as keyof FiltrosOutfit] === v &&
                          styles.filtroChipActive,
                      ]}
                      onPress={() =>
                        setFiltros((prev) => ({ ...prev, [campo]: v }))
                      }
                    >
                      <Text
                        style={[
                          styles.filtroChipText,
                          filtros[campo as keyof FiltrosOutfit] === v &&
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

      {/* ---------- GRID ----------- */}
      <View style={{ flex: 1, minHeight: 0 }}>
        <FlatList
          data={outfitsFiltrados}
          renderItem={renderOutfit}
          keyExtractor={(i) => i.id}
          numColumns={columnas}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <FloatingActionButton onPress={() => router.push("/crear-outfit")} />

      {/* ---------- MODAL DETALLE ----------- */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {outfitSeleccionado && (
              <>
                <View style={styles.modalImageWrapper}>
                  <Image
                    source={{ uri: outfitSeleccionado.imagen }}
                    style={styles.modalImage}
                  />
                </View>

                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    {outfitSeleccionado.nombre}
                  </Text>

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

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {outfitSeleccionado.prendas.map((p) => (
                      <Image
                        key={p.id}
                        source={{ uri: p.imagen }}
                        style={styles.miniPrenda}
                      />
                    ))}
                  </ScrollView>

                  <View style={styles.modalActions}>
                    {/* EDITAR */}
                    <TouchableOpacity
                      style={styles.modalBtnSecondary}
                      onPress={() => {
                        setModalVisible(false);
                        router.push({
                          pathname: "/editar-outfit",
                          params: { id: outfitSeleccionado.id },
                        });
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.textPrimary}
                      />
                      <Text style={styles.modalBtnSecondaryText}>Editar</Text>
                    </TouchableOpacity>

                    {/* ELIMINAR */}
                    <TouchableOpacity
                      style={styles.modalBtnDanger}
                      onPress={() => {
                        setOutfitAEliminar(outfitSeleccionado);
                        setModalVisible(false);
                        setTimeout(() => setConfirmVisible(true), 80);
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
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ---------- MODAL CONFIRMACIÓN ----------- */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>
              ¿Seguro que quieres eliminar este outfit?
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
                onPress={async () => {
                  if (!outfitAEliminar) return;
                  showLoader("Eliminando...");
                  try {
                    await apiRequest(`/api/outfits/${outfitAEliminar.id}`, {
                      method: "DELETE",
                    });
                    setOutfits((prev) =>
                      prev.filter((o) => o.id !== outfitAEliminar.id)
                    );
                  } finally {
                    hideLoader();
                    setConfirmVisible(false);
                  }
                }}
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

/* -------------------------------------------- */
/* -------------------- STYLES ---------------- */
/* -------------------------------------------- */

const styles = StyleSheet.create({
  headerArea: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 10,
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
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  profileButton: {
    padding: 4,
  },

  titleBlock: {
    marginBottom: 16,
  },

  title: {
    fontSize: 32,
    color: colors.textPrimary,
  },

  /* Chips rápidas */
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

  /* Botones de acciones */
  topActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12,
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

  /* Panel filtros */
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

  /* GRID */
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  outfitCard: {
    flex: 1,
    margin: 8,
    borderRadius: 22,
    overflow: "hidden",
  },

  outfitTouchable: {
    backgroundColor: colors.card,
  },

  outfitImagen: {
    width: "100%",
    height: 200,
  },

  outfitImagenWeb: {
    height: 240,
    ...(Platform.OS === "web" && { objectFit: "contain" }),
  },

  outfitInfo: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  outfitNombre: {
    fontSize: 15,
    fontWeight: "600",
  },

  outfitCategoria: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  /* Empty */
  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 50,
  },
  emptyText: {
    marginTop: 6,
    color: colors.textSecondary,
  },

  /* MODAL DETALLE */
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
    padding: 18,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  modalTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
  },

  modalTag: {
    backgroundColor: "#F3F3F3",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 12,
    color: colors.textSecondary,
  },

  miniPrenda: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 6,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  modalBtnSecondary: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  modalBtnSecondaryText: {
    fontWeight: "600",
    color: colors.textPrimary,
  },

  modalBtnDanger: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: 999,
    paddingVertical: 10,
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
    padding: 6,
    backgroundColor: "#FFFFFFEE",
    borderRadius: 999,
  },

  /* Confirm delete */
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
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
  },

  confirmActions: {
    flexDirection: "row",
    gap: 10,
  },

  confirmBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
});
