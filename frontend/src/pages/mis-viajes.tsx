import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Header from "../components/Header";
import colors from "../constants/colors";
import { Calendar, DateData } from "react-native-calendars";

// Listas cerradas
const TRANSPORTES = ["Avión", "Tren", "Coche", "Bus", "Barco"];
const ACTIVIDADES = ["Playa", "Montaña", "Trabajo", "Ciudad", "Deporte", "Compras"];

export default function MisViajes() {
  // 📌 Campos del viaje
  const [destino, setDestino] = useState("");
  const [desde, setDesde] = useState<Date | null>(null);
  const [hasta, setHasta] = useState<Date | null>(null);
  const [transporte, setTransporte] = useState("");
  const [actividades, setActividades] = useState<string[]>([]);

  // 📌 Modales
  const [modalDestino, setModalDestino] = useState(false);
  const [modalTransporte, setModalTransporte] = useState(false);
  const [modalActividades, setModalActividades] = useState(false);

  // 📌 Modal calendario reutilizando Mis Eventos
  const [modalCalendario, setModalCalendario] = useState<null | "desde" | "hasta">(null);

  // 📌 Filtros
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroDestino, setFiltroDestino] = useState("todos");
  const [filtroTransporte, setFiltroTransporte] = useState("todos");
  const [filtroActividad, setFiltroActividad] = useState("todos");

  // 📌 Placeholder de maletas hasta integrar backend
  const maletas: any[] = [];

  const formatDate = (date: Date | null) =>
    date ? date.toISOString().split("T")[0] : "";

  const handleHacerMaleta = () => {
    router.push("/lista-equipaje");
  };

  const filteredMaletas = maletas.filter(() => true);

  const renderChip = (label: string, onPress: () => void) => (
    <TouchableOpacity style={styles.chip} onPress={onPress}>
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={colors.gradient}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Header />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Nuevo Viaje</Text>

        {/* Chips de formulario */}
        <View style={styles.chipContainer}>
          {renderChip(destino || "Destino", () => setModalDestino(true))}
          {renderChip(desde ? formatDate(desde) : "Desde", () =>
            setModalCalendario("desde")
          )}
          {renderChip(hasta ? formatDate(hasta) : "Hasta", () =>
            setModalCalendario("hasta")
          )}
          {renderChip(transporte || "Método de transporte", () =>
            setModalTransporte(true)
          )}
          {renderChip(
            actividades.length ? actividades.join(", ") : "Actividades",
            () => setModalActividades(true)
          )}
        </View>

        {/* Botón hacer maleta */}
        <TouchableOpacity style={styles.btnHacerMaleta} onPress={handleHacerMaleta}>
          <Text style={styles.btnHacerMaletaText}>Hacer Maleta</Text>
        </TouchableOpacity>

        {/* --------------------------------------------- */}
        {/* FILTROS */}
        {/* --------------------------------------------- */}
        <View style={styles.filtrosHeader}>
          <Text style={styles.sectionTitle}>Mis Maletas</Text>
          <TouchableOpacity
            style={styles.btnFiltros}
            onPress={() => setMostrarFiltros((v) => !v)}
          >
            <Ionicons name="options-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {mostrarFiltros && (
          <View style={styles.filtrosContainer}>
            <View style={styles.filtrosRowHeader}>
              <Text style={styles.filtrosTitulo}>Filtros</Text>
              <TouchableOpacity
                onPress={() => {
                  setFiltroDestino("todos");
                  setFiltroTransporte("todos");
                  setFiltroActividad("todos");
                }}
              >
                <Text style={styles.limpiarFiltros}>Limpiar</Text>
              </TouchableOpacity>
            </View>

            {/* Destino */}
            <Text style={styles.filtroLabel}>Destino</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {["todos", destino].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.filtroChip,
                    filtroDestino === d && styles.filtroChipActive,
                  ]}
                  onPress={() => setFiltroDestino(d)}
                >
                  <Text
                    style={[
                      styles.filtroChipText,
                      filtroDestino === d && styles.filtroChipTextActive,
                    ]}
                  >
                    {d === "todos" ? "Todos" : d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Transporte */}
            <Text style={styles.filtroLabel}>Transporte</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {["todos", ...TRANSPORTES].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.filtroChip,
                    filtroTransporte === t && styles.filtroChipActive,
                  ]}
                  onPress={() => setFiltroTransporte(t)}
                >
                  <Text
                    style={[
                      styles.filtroChipText,
                      filtroTransporte === t && styles.filtroChipTextActive,
                    ]}
                  >
                    {t === "todos" ? "Todos" : t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Actividades */}
            <Text style={styles.filtroLabel}>Actividades</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {["todos", ...ACTIVIDADES].map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[
                    styles.filtroChip,
                    filtroActividad === a && styles.filtroChipActive,
                  ]}
                  onPress={() => setFiltroActividad(a)}
                >
                  <Text
                    style={[
                      styles.filtroChipText,
                      filtroActividad === a && styles.filtroChipTextActive,
                    ]}
                  >
                    {a === "todos" ? "Todos" : a}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* --------------------------------------------- */}
        {/* LISTA DE MALETAS */}
        {/* --------------------------------------------- */}
        {filteredMaletas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="briefcase-outline" size={40} color={colors.primary} />
            <Text style={styles.emptyText}>Aún no tienes maletas creadas</Text>
          </View>
        ) : (
          filteredMaletas.map((m) => (
            <View key={m.id} style={styles.maletaCard}>
              <Text style={styles.maletaTitle}>{m.destino}</Text>
              <Text style={styles.maletaSubtitle}>
                {m.desde} → {m.hasta}
              </Text>
              <Text style={styles.maletaSubtitle}>{m.transporte}</Text>
            </View>
          ))
        )}
      </ScrollView>

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
                  style={[styles.optionItemMulti, active && styles.optionActive]}
                  onPress={() => {
                    setActividades((prev) =>
                      active ? prev.filter((x) => x !== a) : [...prev, a]
                    );
                  }}
                >
                  <Text
                    style={[styles.optionText, active && styles.optionTextActive]}
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
      <Modal visible={modalCalendario !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <Text style={styles.modalTitle}>
              {modalCalendario === "desde"
                ? "Seleccionar fecha de inicio"
                : "Seleccionar fecha de fin"}
            </Text>

            <Calendar
              onDayPress={(day: DateData) => {
                if (modalCalendario === "desde") setDesde(new Date(day.dateString));
                if (modalCalendario === "hasta") setHasta(new Date(day.dateString));
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
    </LinearGradient>
  );
}

/* ------------------------------------------------------------- */
/* ESTILOS                                                        */
/* ------------------------------------------------------------- */

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: 16, paddingBottom: 80 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 10,
  },

  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: "#FFFFFFAA",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  chipText: {
    color: "#333",
    fontWeight: "500",
  },

  btnHacerMaleta: {
    backgroundColor: "#FFF",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },
  btnHacerMaletaText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },

  filtrosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
  },
  btnFiltros: {
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 10,
  },

  filtrosContainer: {
    backgroundColor: "#FFFFFFAA",
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    marginBottom: 12,
  },
  filtrosRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  filtrosTitulo: { fontSize: 16, fontWeight: "600", color: "#1E1E1E" },
  limpiarFiltros: { color: colors.primary, fontWeight: "500" },

  filtroLabel: {
    fontSize: 13,
    color: "#444",
    marginBottom: 4,
  },
  filtroChip: {
    backgroundColor: "#FFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
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

  emptyBox: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: "#FFF",
    marginTop: 8,
  },

  maletaCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
  },
  maletaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  maletaSubtitle: {
    fontSize: 13,
    color: "#666",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
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
