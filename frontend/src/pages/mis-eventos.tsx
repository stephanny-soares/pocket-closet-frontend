import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  ScrollView,
  Image,
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
  fecha: string; // YYYY-MM-DD
  descripcion?: string;
}

interface OutfitEvento {
  id: string;
  nombre: string;
  imagen: string;
  eventoId?: string;
}

type OutfitsPorEventoMap = Record<string, OutfitEvento[]>;

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

  const [outfitsPorEvento, setOutfitsPorEvento] =
    useState<OutfitsPorEventoMap>({});

  // ---------- INIT: eventos + outfits ----------
  useEffect(() => {
    inicializarPantalla();
  }, []);

  const inicializarPantalla = async () => {
    try {
      showLoader("Cargando eventos...");

      const [dataEventos, dataOutfits] = await Promise.all([
        apiRequest("/api/eventos", { method: "GET" }),
        apiRequest("/api/outfits", { method: "GET" }),
      ]);

      setEventos(dataEventos.eventos || []);

      const map: OutfitsPorEventoMap = {};
      (dataOutfits.outfits || []).forEach((o: any) => {
        const eventoId = o.eventoId;
        if (!eventoId) return;
        const entry: OutfitEvento = {
          id: o.id,
          nombre: o.nombre,
          imagen: o.imagen,
          eventoId,
        };
        if (!map[eventoId]) map[eventoId] = [];
        map[eventoId].push(entry);
      });

      setOutfitsPorEvento(map);
    } catch (e: any) {
      console.log("Error cargando eventos/outfits", e);
      Alert.alert("Error", "No se pudieron cargar los eventos.");
    } finally {
      hideLoader();
    }
  };

  // ---------- Crear evento (API + opcional calendario nativo) ----------
  const crearEvento = async () => {
    if (!nuevoNombre.trim()) return;

    showLoader("Creando evento...");
    try {
      // 1) Crear en tu API
      await apiRequest("/api/eventos", {
        method: "POST",
        body: JSON.stringify({
          nombre: nuevoNombre.trim(),
          fecha: selectedDate,
          descripcion: nuevaDescripcion.trim() || undefined,
        }),
      });

      // 2) Opcional: crear también en calendario del móvil
      if (guardarEnCalendario) {
        await crearEventoNativo(
          nuevoNombre.trim(),
          nuevaDescripcion.trim(),
          selectedDate
        );
      }

      setModalCrear(false);
      setNuevoNombre("");
      setNuevaDescripcion("");

      // Recargar eventos
      await inicializarPantalla();
    } catch (e: any) {
      Alert.alert("Error", "No se pudo crear el evento.");
    } finally {
      hideLoader();
    }
  };

  // ---------- Permisos / creación en calendario nativo ----------
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

  // ---------- Eventos del día ----------
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

      {/* Scroll general: calendario + eventos + botón final */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Calendario en tarjeta blanca */}
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
                {} as any
              ),
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
            style={styles.calendar}
          />
        </View>

        {/* Eventos del día */}
        <Text style={styles.sectionTitle}>
          Eventos del {selectedDate}
        </Text>

        {eventosDelDia.length === 0 ? (
          <Text style={styles.emptyText}>No hay eventos este día</Text>
        ) : (
          eventosDelDia.map((item) => {
            const outfitsDeEsteEvento =
              outfitsPorEvento[item.id] || [];

            return (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.nombre}</Text>
                {item.descripcion ? (
                  <Text style={styles.cardDesc}>{item.descripcion}</Text>
                ) : null}

                {/* Si hay outfit(s) asociado(s) al evento, se muestran aquí */}
                {outfitsDeEsteEvento.length > 0 && (
                  <View style={styles.outfitPreview}>
                    <Text style={styles.outfitPreviewTitle}>
                      Outfits para este evento
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {outfitsDeEsteEvento.map((o) => (
                        <TouchableOpacity
                          key={o.id}
                          style={styles.outfitItem}
                          onPress={() =>
                            router.push({
                              pathname: "/mis-outfits",
                              params: { id: o.id },
                            })
                          }
                        >
                          <Image
                            source={{ uri: o.imagen }}
                            style={styles.outfitThumb}
                          />
                          <Text
                            style={styles.outfitName}
                            numberOfLines={1}
                          >
                            {o.nombre}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Botones de acción para el evento */}
                <View style={styles.row}>
                  {/* IMPORTANTE:
                      Este botón navega a /crear-outfit?eventoId=...
                      y esa pantalla llama internamente a /api/outfits/por-evento
                      tal como querías. */}
                  <TouchableOpacity
                    style={styles.optionBtn}
                    onPress={() =>
                      router.push(`/crear-outfit?eventoId=${item.id}&eventoNombre=${encodeURIComponent(item.nombre)}`)
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
            );
          })
        )}

        {/* Botón Crear Evento SIEMPRE al final del contenido */}
        <TouchableOpacity
          style={styles.btnCrear}
          onPress={() => setModalCrear(true)}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFF" />
          <Text style={styles.btnCrearText}>Crear Evento</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para crear evento */}
      <Modal visible={modalCrear} transparent animationType="fade">
        <View className="modalOverlay" style={styles.modalOverlay}>
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

            <View style={styles.modalRow}>
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 10,
  },

  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  calendar: {
    borderRadius: 16,
  },

  sectionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    color: "#EEE",
    marginBottom: 16,
    fontSize: 13,
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
    marginBottom: 4,
    color: "#222",
  },
  cardDesc: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },

  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 6,
  },

  optionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  optionText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },

  /* Outfits dentro de la card del evento */
  outfitPreview: {
    marginTop: 8,
    marginBottom: 4,
  },
  outfitPreviewTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    marginBottom: 4,
  },
  outfitItem: {
    width: 90,
    marginRight: 8,
    alignItems: "center",
  },
  outfitThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: "#F3F3F3",
  },
  outfitName: {
    fontSize: 11,
    color: "#333",
    textAlign: "center",
  },

  btnCrear: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 14,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    gap: 8,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
});
