import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import colors from "../constants/colors";
import { apiRequest } from "../utils/apiClient";
import { useLoader } from "../context/LoaderContext";
import * as DeviceCalendar from "expo-calendar";
import { router } from "expo-router";

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  descripcion?: string;
}

export default function MisEventos() {
  const { showLoader, hideLoader } = useLoader();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [modalCrear, setModalCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [guardarEnCalendario, setGuardarEnCalendario] = useState(false);
  const [calendarPermission, setCalendarPermission] = useState(false);

  // ---------- Cargar eventos API ----------
  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      showLoader("Cargando eventos...");
      const data = await apiRequest("/api/eventos", { method: "GET" });
      setEventos(data.eventos || []);
    } catch (e: any) {
      Alert.alert("Error", "No se pudieron cargar los eventos.");
    } finally {
      hideLoader();
    }
  };

  // ---------- Crear evento ----------
  const crearEvento = async () => {
    if (!nuevoNombre.trim()) return;

    showLoader("Creando evento...");
    try {
      await apiRequest("/api/eventos", {
        method: "POST",
        body: JSON.stringify({
          nombre: nuevoNombre.trim(),
          fecha: selectedDate,
          descripcion: nuevaDescripcion.trim() || undefined,
        }),
      });

      if (guardarEnCalendario) {
        crearEventoNativo(
          nuevoNombre.trim(),
          nuevaDescripcion.trim(),
          selectedDate
        );
      }

      setModalCrear(false);
      setNuevoNombre("");
      setNuevaDescripcion("");

      cargarEventos();
    } catch (e: any) {
      Alert.alert("Error", "No se pudo crear el evento.");
    } finally {
      hideLoader();
    }
  };

  // ---------- Calendario nativo ----------
  const pedirPermisoCalendario = async (): Promise<boolean> => {
    const { status } =
      await DeviceCalendar.requestCalendarPermissionsAsync();

    if (status === "granted") {
      setCalendarPermission(true);
      return true;
    }

    Alert.alert(
      "Permiso requerido",
      "La app necesita permiso para guardar eventos en tu calendario."
    );
    return false;
  };


  const crearEventoNativo = async (
    titulo: string,
    descripcion: string,
    fecha: string
  ) => {
    if (!calendarPermission) {
      const ok = await pedirPermisoCalendario();
      if (!ok) return;
    }

    const calendars = await DeviceCalendar.getCalendarsAsync(
      DeviceCalendar.EntityTypes.EVENT
    );
    const editable = calendars.find((c) => c.allowsModifications);

    if (!editable) return;

    await DeviceCalendar.createEventAsync(editable.id, {
      title: titulo,
      notes: descripcion || "",
      startDate: new Date(fecha + "T10:00:00"),
      endDate: new Date(fecha + "T11:00:00"),
    });
  };

  // ---------- Filtrar eventos del día ----------
  const eventosDelDia = useMemo(
    () => eventos.filter((e) => e.fecha === selectedDate),
    [eventos, selectedDate]
  );

  // ---------- UI ----------
  return (
    <LinearGradient
      colors={colors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Header title="Mis Eventos" />

      <View style={styles.container}>
        {/* CALENDARIO SIEMPRE VISIBLE */}
        <View style={styles.calendarCard}>
          <Calendar
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: colors.primary,
              },
              ...eventos.reduce(
                (acc, e) => ({
                  ...acc,
                  [e.fecha]: { marked: true, dotColor: colors.primary },
                }),
                {}
              ),
            }}
            theme={{
              calendarBackground: "#FFF",
              textSectionTitleColor: "#666", // Sun, Mon...
              dayTextColor: "#333",
              monthTextColor: colors.primary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: "#FFF",
              todayTextColor: colors.primary,
              arrowColor: colors.primary,
            }}
            style={styles.calendar}
          />
        </View>


        {/* EVENTOS DEL DÍA */}
        <Text style={styles.sectionTitle}>
          Eventos del {selectedDate}
        </Text>

        {eventosDelDia.length === 0 ? (
          <Text style={styles.emptyText}>No hay eventos este día</Text>
        ) : (
          <FlatList
            data={eventosDelDia}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.nombre}</Text>
                {item.descripcion ? (
                  <Text style={styles.cardDesc}>{item.descripcion}</Text>
                ) : null}

                {/* BOTONES DE OPCIÓN */}
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.optionBtn}
                    onPress={() =>
                      router.push(`/crear-outfit?eventoId=${item.id}`)
                    }
                  >
                    <Ionicons
                      name="sparkles-outline"
                      size={20}
                      color="#FFF"
                    />
                    <Text style={styles.optionText}>Outfit IA</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionBtn}
                    onPress={() =>
                      router.push("/mi-armario?selectMode=prenda")
                    }
                  >
                    <Ionicons
                      name="shirt-outline"
                      size={20}
                      color="#FFF"
                    />
                    <Text style={styles.optionText}>Por prenda</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {/* BOTÓN CREAR EVENTO */}
        <TouchableOpacity
          style={styles.btnCrear}
          onPress={() => setModalCrear(true)}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFF" />
          <Text style={styles.btnCrearText}>Crear Evento</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL CREAR */}
      <Modal visible={modalCrear} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nuevo evento</Text>

            <TextInput
              placeholder="Nombre del evento"
              style={styles.input}
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
            />

            <TextInput
              placeholder="Descripción (opcional)"
              style={[styles.input, { height: 80 }]}
              value={nuevaDescripcion}
              onChangeText={setNuevaDescripcion}
              multiline
            />

            <View style={styles.switchRow}>
              <Text style={{ flex: 1 }}>
                Guardar también en tu calendario
              </Text>
              <Switch
                value={guardarEnCalendario}
                onValueChange={setGuardarEnCalendario}
              />
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#CCC" }]}
                onPress={() => setModalCrear(false)}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={crearEvento}
              >
                <Text style={{ color: "#FFF" }}>Crear</Text>
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
  container: { padding: 16, flex: 1 },

  calendar: {
    marginBottom: 20,
    borderRadius: 16,
  },

  sectionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },

  emptyText: {
    color: "#EEE",
    marginVertical: 10,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  cardDesc: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },

  optionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  optionText: {
    color: "#FFF",
    fontWeight: "600",
  },

  btnCrear: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },

  btnCrearText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    padding: 20,
  },

  modalBox: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#EEE",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },

  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  calendarCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 12,
  marginBottom: 20,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
},

});
