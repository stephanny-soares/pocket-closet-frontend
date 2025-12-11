import React, {
  useState,
  useMemo,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  useWindowDimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import TitleSerif from "../components/ui/TitleSerif";
import SubtitleSerif from "../components/ui/SubtitleSerif";
import Card from "../components/ui/Card";
import FloatingActionButton from "../components/ui/FloatingActionButton";

import colors from "../constants/colors";
import { Calendar, DateData } from "react-native-calendars";
import { apiRequest } from "../utils/apiClient"; // ⭐ usamos el mismo helper que en el resto

// Listas cerradas
const TRANSPORTES = ["Avión", "Tren", "Coche", "Bus", "Barco"];
const ACTIVIDADES = [
  "Playa",
  "Montaña",
  "Trabajo",
  "Ciudad",
  "Deporte",
  "Compras",
];

const VALOR_TODOS = "todos";
const QUICK_ALL = "Todos";

interface Viaje {
  id: string;
  destino: string;
  ciudad: string;
  fechaInicio: string; // YYYY-MM-DD o ISO
  fechaFin: string;
  transporte: string;
  actividades?: string[];
  createdAt?: string;
}

export default function MisViajes() {
  // 📌 Viajes reales del backend
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loadingViajes, setLoadingViajes] = useState(false);

  // 📌 Campos del viaje (formulario nuevo viaje)
  const [destino, setDestino] = useState("");
  const [desde, setDesde] = useState<Date | null>(null);
  const [hasta, setHasta] = useState<Date | null>(null);
  const [transporte, setTransporte] = useState("");
  const [actividades, setActividades] = useState<string[]>([]);

  // 📌 Modales
  const [modalDestino, setModalDestino] = useState(false);
  const [modalTransporte, setModalTransporte] = useState(false);
  const [modalActividades, setModalActividades] = useState(false);
  const [modalCalendario, setModalCalendario] = useState<
    null | "desde" | "hasta"
  >(null);

  // 📌 Filtros
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroDestino, setFiltroDestino] = useState<string>(VALOR_TODOS);
  const [filtroTransporte, setFiltroTransporte] =
    useState<string>(VALOR_TODOS);
  const [filtroActividad, setFiltroActividad] =
    useState<string>(VALOR_TODOS);

  const [filtroRapidoTransporte, setFiltroRapidoTransporte] =
    useState<string>(QUICK_ALL);

  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const columnas = isWeb ? 3 : 2;

  const formatDate = (date: Date | null) =>
    date ? date.toISOString().split("T")[0] : "";

  // ============================================================
  // Cargar viajes del backend
  // ============================================================

  const cargarViajes = async () => {
    try {
      setLoadingViajes(true);
      const data = await apiRequest<Viaje[]>("/api/viajes", {
        method: "GET",
      });
      setViajes(data || []);
    } catch (err) {
      console.log("Error cargando viajes:", err);
    } finally {
      setLoadingViajes(false);
    }
  };

  useEffect(() => {
    cargarViajes();
  }, []);

  // ============================================================
  // Crear viaje y navegar a lista de equipaje
  // ============================================================

  const handleHacerMaleta = async () => {
    if (!destino || !desde || !hasta || !transporte) {
      Alert.alert(
        "Faltan datos",
        "Rellena destino, fechas y método de transporte."
      );
      return;
    }

    try {
      const nuevoViaje = await apiRequest<Viaje>("/api/viajes", {
        method: "POST",
        body: JSON.stringify({
          destino,
          ciudad: destino, // puedes cambiarlo si luego hay ciudad separada
          fechaInicio: formatDate(desde),
          fechaFin: formatDate(hasta),
          transporte,
          actividades,
          descripcion: "",
        }),
      });

      // Navegamos a la pantalla de equipaje de ese viaje
      router.push(`/lista-equipaje?id=${nuevoViaje.id}`);
    } catch (err) {
      console.log("Error creando viaje:", err);
      Alert.alert("Error", "No se pudo crear el viaje.");
    }
  };

  /* -------------------- QUICK CHIPS TRANSPORTE -------------------- */

  const categoriasRapidasTransporte = useMemo(
    () => [QUICK_ALL, ...TRANSPORTES],
    []
  );

  /* -------------------- FILTRO FINAL DE VIAJES -------------------- */

  const filteredViajes = useMemo(() => {
    return viajes.filter((m) => {
      const coincideDestino =
        filtroDestino === VALOR_TODOS || m.destino === filtroDestino;

      const coincideTransporte =
        filtroTransporte === VALOR_TODOS ||
        m.transporte === filtroTransporte;

      const coincideActividad =
        filtroActividad === VALOR_TODOS ||
        (m.actividades ?? []).includes(filtroActividad);

      return coincideDestino && coincideTransporte && coincideActividad;
    });
  }, [viajes, filtroDestino, filtroTransporte, filtroActividad]);

  /* -------------------- RENDER CARD VIAJE (GRID) -------------------- */

  const renderViaje = ({ item }: { item: Viaje }) => (
    <TouchableOpacity
      style={{ flex: 1 }}
      onPress={() => router.push(`/lista-equipaje?id=${item.id}`)}
    >
      <Card style={styles.maletaCard}>
        <View style={styles.maletaInner}>
          <View style={styles.maletaHeaderRow}>
            <Ionicons
              name="briefcase-outline"
              size={18}
              color={colors.primaryDark}
            />
            <Text style={styles.maletaTitle}>{item.destino}</Text>
          </View>
          <Text style={styles.maletaSubtitle}>
            {item.fechaInicio} → {item.fechaFin}
          </Text>
          <Text style={styles.maletaSubtitle}>{item.transporte}</Text>
          {item.actividades && item.actividades.length > 0 && (
            <Text style={styles.maletaTags}>
              {item.actividades.join(" · ")}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  /* -------------------- UI AUX -------------------- */

  const limpiarFiltros = () => {
    setFiltroDestino(VALOR_TODOS);
    setFiltroTransporte(VALOR_TODOS);
    setFiltroActividad(VALOR_TODOS);
    setFiltroRapidoTransporte(QUICK_ALL);
  };

  const renderChipFormulario = (label: string, onPress: () => void) => (
    <TouchableOpacity style={styles.formChip} onPress={onPress}>
      <Text style={styles.formChipText}>{label}</Text>
    </TouchableOpacity>
  );

  /* -------------------- RENDER -------------------- */

  return (
    <LinearGradient
      colors={colors.gradient}
      style={{ flex: 1, minHeight: 0 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* ░░ CABECERA TIPO MI ARMARIO ░░ */}
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

          {/* Título */}
          <View style={styles.titleBlock}>
            <TitleSerif style={styles.title}>Mis viajes</TitleSerif>
            <SubtitleSerif>
              {viajes.length === 0
                ? "Aún no tienes viajes creados"
                : `${viajes.length} viaje(s) planificados`}
            </SubtitleSerif>
          </View>

          {/* Chips rápidas (transporte) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
            style={{ overflow: "visible" }}
          >
            {categoriasRapidasTransporte.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  filtroRapidoTransporte === cat &&
                    styles.categoryChipActive,
                ]}
                onPress={() => {
                  setFiltroRapidoTransporte(cat);
                  setFiltroTransporte(
                    cat === QUICK_ALL ? VALOR_TODOS : cat
                  );
                }}
              >
                <Text
                  style={[
                    styles.categoryText,
                    filtroRapidoTransporte === cat &&
                      styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* NUEVO VIAJE */}
          <View style={styles.nuevoViajeBlock}>
            <Text style={styles.sectionTitle}>Nuevo viaje</Text>

            <View style={styles.formChipContainer}>
              {renderChipFormulario(destino || "Destino", () =>
                setModalDestino(true)
              )}
              {renderChipFormulario(
                desde ? formatDate(desde) : "Desde",
                () => setModalCalendario("desde")
              )}
              {renderChipFormulario(
                hasta ? formatDate(hasta) : "Hasta",
                () => setModalCalendario("hasta")
              )}
              {renderChipFormulario(
                transporte || "Método de transporte",
                () => setModalTransporte(true)
              )}
              {renderChipFormulario(
                actividades.length
                  ? actividades.join(", ")
                  : "Actividades",
                () => setModalActividades(true)
              )}
            </View>

            <TouchableOpacity
              style={styles.btnHacerMaleta}
              onPress={handleHacerMaleta}
            >
              <Ionicons
                name="briefcase-outline"
                size={20}
                color={colors.textOnPrimary}
              />
              <Text style={styles.btnHacerMaletaText}>Hacer maleta</Text>
            </TouchableOpacity>
          </View>

          {/* TOP ACTIONS MIS MALETAS */}
          <View style={styles.topActions}>
            <Text style={styles.sectionTitleMisMaletas}>Mis maletas</Text>
            <View style={styles.rightActions}>
              {/* Solo botón filtros por ahora */}
              <TouchableOpacity
                style={styles.btnFiltros}
                onPress={() => setMostrarFiltros((v) => !v)}
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={colors.iconActive}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* FILTROS DETALLADOS */}
          {mostrarFiltros && (
            <View style={styles.filtrosContainer}>
              <View style={styles.filtrosHeaderRow}>
                <Text style={styles.filtrosTitulo}>Filtros</Text>
                <TouchableOpacity onPress={limpiarFiltros}>
                  <Text style={styles.limpiarFiltros}>Limpiar</Text>
                </TouchableOpacity>
              </View>

              {/* Destino */}
              <View style={styles.filtroGroup}>
                <Text style={styles.filtroLabel}>Destino</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {[VALOR_TODOS, destino].map((d) => (
                    <TouchableOpacity
                      key={d || "destino-empty"}
                      style={[
                        styles.filtroChip,
                        filtroDestino === d && styles.filtroChipActive,
                      ]}
                      onPress={() =>
                        setFiltroDestino(d || VALOR_TODOS)
                      }
                    >
                      <Text
                        style={[
                          styles.filtroChipText,
                          filtroDestino === d &&
                            styles.filtroChipTextActive,
                        ]}
                      >
                        {d === VALOR_TODOS || !d ? "Todos" : d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Transporte */}
              <View style={styles.filtroGroup}>
                <Text style={styles.filtroLabel}>Transporte</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {[VALOR_TODOS, ...TRANSPORTES].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.filtroChip,
                        filtroTransporte === t &&
                          styles.filtroChipActive,
                      ]}
                      onPress={() => setFiltroTransporte(t)}
                    >
                      <Text
                        style={[
                          styles.filtroChipText,
                          filtroTransporte === t &&
                            styles.filtroChipTextActive,
                        ]}
                      >
                        {t === VALOR_TODOS ? "Todos" : t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Actividades */}
              <View style={styles.filtroGroup}>
                <Text style={styles.filtroLabel}>Actividades</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {[VALOR_TODOS, ...ACTIVIDADES].map((a) => (
                    <TouchableOpacity
                      key={a}
                      style={[
                        styles.filtroChip,
                        filtroActividad === a &&
                          styles.filtroChipActive,
                      ]}
                      onPress={() => setFiltroActividad(a)}
                    >
                      <Text
                        style={[
                          styles.filtroChipText,
                          filtroActividad === a &&
                            styles.filtroChipTextActive,
                        ]}
                      >
                        {a === VALOR_TODOS ? "Todos" : a}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
        </View>

        {/* ░░ GRID DE VIAJES CON SCROLL ░░ */}
        <View style={{ flex: 1, minHeight: 0 }}>
          {loadingViajes ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Cargando viajes…</Text>
            </View>
          ) : filteredViajes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="briefcase-outline"
                size={40}
                color={colors.primary}
              />
              <Text style={styles.emptyText}>
                Aún no tienes viajes creados
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredViajes}
              renderItem={renderViaje}
              keyExtractor={(item) => item.id}
              numColumns={columnas}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.gridContainer}
            />
          )}
        </View>

        {/* FAB para crear/hacer maleta rápido */}
        <FloatingActionButton onPress={handleHacerMaleta} />

        {/* --------------------------------------------- */}
        {/* MODAL DESTINO */}
        {/* --------------------------------------------- */}
        <Modal visible={modalDestino} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Destino</Text>

              <TextInput
                placeholder="Introduce el destino"
                style={styles.input}
                value={destino}
                onChangeText={setDestino}
              />

              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setModalDestino(false)}
              >
                <Text style={styles.modalBtnText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* --------------------------------------------- */}
        {/* MODAL TRANSPORTE */}
        {/* --------------------------------------------- */}
        <Modal visible={modalTransporte} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Método de transporte</Text>

              {TRANSPORTES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.optionItem}
                  onPress={() => {
                    setTransporte(t);
                    setModalTransporte(false);
                  }}
                >
                  <Text style={styles.optionText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* --------------------------------------------- */}
        {/* MODAL ACTIVIDADES (MULTI SELECT) */}
        {/* --------------------------------------------- */}
        <Modal visible={modalActividades} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Actividades</Text>

              {ACTIVIDADES.map((a) => {
                const active = actividades.includes(a);
                return (
                  <TouchableOpacity
                    key={a}
                    style={[
                      styles.optionItemMulti,
                      active && styles.optionActive,
                    ]}
                    onPress={() => {
                      setActividades((prev) =>
                        active
                          ? prev.filter((x) => x !== a)
                          : [...prev, a]
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        active && styles.optionTextActive,
                      ]}
                    >
                      {a}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.modalBtn, { marginTop: 10 }]}
                onPress={() => setModalActividades(false)}
              >
                <Text style={styles.modalBtnText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* --------------------------------------------- */}
        {/* MODAL CALENDARIO (DESDE / HASTA) */}
        {/* --------------------------------------------- */}
        <Modal
          visible={modalCalendario !== null}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.calendarModal}>
              <Text style={styles.modalTitle}>
                {modalCalendario === "desde"
                  ? "Seleccionar fecha de inicio"
                  : "Seleccionar fecha de fin"}
              </Text>

              <Calendar
                onDayPress={(day: DateData) => {
                  if (modalCalendario === "desde")
                    setDesde(new Date(day.dateString));
                  if (modalCalendario === "hasta")
                    setHasta(new Date(day.dateString));
                  setModalCalendario(null);
                }}
                theme={{
                  calendarBackground: "#FFF",
                  textSectionTitleColor: "#666",
                  dayTextColor: "#333",
                  monthTextColor: colors.primary,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: "#FFF",
                  todayTextColor: colors.primary,
                  arrowColor: colors.primary,
                }}
                style={{ borderRadius: 12 }}
              />

              <TouchableOpacity
                style={[styles.modalBtn, { marginTop: 14 }]}
                onPress={() => setModalCalendario(null)}
              >
                <Text style={styles.modalBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ------------------------------------------------------------- */
/* ESTILOS                                                        */
/* ------------------------------------------------------------- */

const styles = StyleSheet.create({
  headerArea: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
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

  nuevoViajeBlock: {
    marginTop: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 10,
  },

  formChipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },

  formChip: {
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  formChipText: {
    color: colors.textPrimary,
    fontWeight: "500",
  },

  btnHacerMaleta: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  btnHacerMaletaText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 6,
  },

  sectionTitleMisMaletas: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  rightActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
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

  filtrosHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  filtrosTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
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
    fontSize: 13,
  },

  filtroChipTextActive: {
    color: colors.textOnPrimary,
  },

  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 120,
  },

  maletaCard: {
    flex: 1,
    margin: 8,
    borderRadius: 22,
    overflow: "hidden",
  },

  maletaInner: {
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  maletaHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },

  maletaTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  maletaSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  maletaTags: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: colors.textSecondary,
    marginTop: 8,
  },

  /* --- Modales --- */

  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    padding: 20,
  },

  modalBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: colors.textPrimary,
  },

  input: {
    backgroundColor: "#EEE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  modalBtn: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  modalBtnText: {
    color: "#FFF",
    fontWeight: "700",
  },

  optionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  optionText: {
    fontSize: 14,
    color: "#333",
  },

  optionItemMulti: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  optionActive: {
    backgroundColor: "#E8E8FF",
  },

  optionTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },

  calendarModal: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
  },
});
