// ================================
// MIS EVENTOS — ESTILO MAISON
// ================================

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Switch,
  ScrollView,
  Image,
  Platform,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import HeaderMaison from "../components/Header";
import colors from "../constants/colors";

import { apiRequest } from "../utils/apiClient";
import { useLoader } from "../context/LoaderContext";
import * as DeviceCalendar from "expo-calendar";
import { router } from "expo-router";

import TitleSerif from "../components/ui/TitleSerif";
import SubtitleSerif from "../components/ui/SubtitleSerif";
import Card from "../components/ui/Card";
import InputMaison from "../components/ui/InputMaison";
import PrimaryButton from "../components/ui/PrimaryButton";

interface Evento {
  id: string;
  nombre: string;
  fecha: string; // YYYY-MM-DD
  descripcion?: string;
  tipo?: string;
  ubicacion?: string;
  ciudad?: string;
}

interface OutfitEvento {
  id: string;
  nombre: string;
  imagen: string; // imagen COMPLETA del outfit
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
  const [editandoEvento, setEditandoEvento] = useState<Evento | null>(null);

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [nuevaUbicacion, setNuevaUbicacion] = useState("");
  const [nuevaCiudad, setNuevaCiudad] = useState("");
  const [guardarEnCalendario, setGuardarEnCalendario] = useState(false);
  const [calendarPermission, setCalendarPermission] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [eventoAEliminar, setEventoAEliminar] = useState<Evento | null>(null);

  const [outfitsPorEvento, setOutfitsPorEvento] =
    useState<OutfitsPorEventoMap>({});

  // ---------- INIT ----------
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
        if (!o.eventoId) return;
        if (!map[o.eventoId]) map[o.eventoId] = [];
        map[o.eventoId].push({
          id: o.id,
          nombre: o.nombre,
          imagen: o.imagen, // imagen completa del outfit
          eventoId: o.eventoId,
        });
      });

      setOutfitsPorEvento(map);
      console.log("🔥 MAP OUTFITS POR EVENTO:", map);
      console.log(
        "🧵 OUTFITS COMPLETOS DEVUELTOS POR EL BACKEND:",
        dataOutfits.outfits
      );
    } catch (e: any) {
      Alert.alert("Error", "No se pudieron cargar los eventos.");
    } finally {
      hideLoader();
    }
  };

  // ---------- Crear / actualizar evento ----------
  const crearEvento = async () => {
    if (!nuevoNombre.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }

    const payload = {
      nombre: nuevoNombre.trim(),
      fecha: selectedDate, // ← SI SE ESTÁ EDITANDO, selectedDate debe ser la fecha del evento
      descripcion: nuevaDescripcion.trim() || undefined,
      tipo: nuevoTipo.trim() || undefined,
      ubicacion: nuevaUbicacion.trim() || undefined,
      ciudad: nuevaCiudad.trim() || undefined,
    };

    const creando = !editandoEvento;

    showLoader(creando ? "Creando evento..." : "Actualizando evento...");

    try {
      if (editandoEvento) {
        // 🔥 EDITAR EVENTO (PUT)
        await apiRequest(`/api/eventos/${editandoEvento.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        // 🆕 CREAR EVENTO (POST)
        await apiRequest("/api/eventos", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        // Guardar en calendario nativo solo al crear
        if (guardarEnCalendario) {
          await crearEventoNativo(
            payload.nombre,
            payload.descripcion || "",
            payload.fecha
          );
        }
      }

      // Reset UI
      setModalCrear(false);
      setEditandoEvento(null);
      setNuevoNombre("");
      setNuevaDescripcion("");
      setNuevoTipo("");
      setNuevaUbicacion("");
      setNuevaCiudad("");
      setGuardarEnCalendario(false);

      await inicializarPantalla();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.message || "No se pudo crear/actualizar el evento."
      );
    } finally {
      hideLoader();
    }
  };


  // ---------- Abrir modal en modo edición ----------
  const abrirModalEditar = (evento: Evento) => {
    setEditandoEvento(evento);

    setNuevoNombre(evento.nombre);
    setNuevaDescripcion(evento.descripcion || "");
    setNuevoTipo(evento.tipo || "");
    setNuevaUbicacion(evento.ubicacion || "");
    setNuevaCiudad(evento.ciudad || "");
    setSelectedDate(evento.fecha);
    setGuardarEnCalendario(false);

    setModalCrear(true);
  };

  // ---------- Eliminar evento ----------
  const eliminarEvento = (id: string) => {
    Alert.alert("Eliminar evento", "¿Seguro que quieres eliminar este evento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            showLoader("Eliminando evento...");
            console.log("[Eventos] Eliminando evento", id);

            const resp = await apiRequest(`/api/eventos/${id}`, {
              method: "DELETE",
            });

            console.log("[Eventos] Respuesta DELETE /api/eventos", resp);

            // Actualizar estado local para que desaparezca de la lista
            setEventos((prev) => prev.filter((e) => e.id !== id));
            setOutfitsPorEvento((prev) => {
              const copia = { ...prev };
              delete copia[id];
              return copia;
            });

            setModalCrear(false);
            setEditandoEvento(null);
          } catch (err: any) {
            console.error("[Eventos] Error al eliminar evento", err);
            Alert.alert(
              "Error",
              err?.message || "No se pudo eliminar el evento."
            );
          } finally {
            hideLoader();
          }
        },
      },
    ]);
  };


  // ---------- Permisos calendario nativo ----------
  const pedirPermisoCalendario = async () => {
    const { status } =
      await DeviceCalendar.requestCalendarPermissionsAsync();

    if (status === "granted") {
      setCalendarPermission(true);
      return true;
    }
    Alert.alert("Permiso requerido");
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

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <HeaderMaison />

        {/* TITLE */}
        <View style={styles.titleBlock}>
          <TitleSerif>Mis eventos</TitleSerif>
          <SubtitleSerif>
            Organiza tus planes y crea tu outfit ideal
          </SubtitleSerif>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ---------- CALENDARIO EN CARD MAISON ---------- */}
          <Card style={styles.calendarCard}>
            <Calendar
              onDayPress={(d: DateData) => setSelectedDate(d.dateString)}
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
                calendarBackground: colors.card,
                textSectionTitleColor: colors.textSecondary,
                dayTextColor: colors.textPrimary,
                monthTextColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: "#FFF",
                todayTextColor: colors.primary,
                arrowColor: colors.primary,
              }}
              style={styles.calendar}
            />
          </Card>

          {/* ---------- EVENTOS DEL DÍA ---------- */}
          <TitleSerif style={styles.sectionTitle}>
            Eventos del {selectedDate}
          </TitleSerif>

          {eventosDelDia.length === 0 ? (
            <Text style={styles.emptyText}>No hay eventos este día</Text>
          ) : (
            eventosDelDia.map((evento) => {
              const outfits = outfitsPorEvento[evento.id] || [];

              return (
                <Card key={evento.id} style={styles.eventCard}>
                  {/* Botón editar (lápiz) */}
                  <TouchableOpacity
                    style={styles.eventEditButton}
                    onPress={() => abrirModalEditar(evento)}
                  >
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>

                  <View style={styles.eventHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventTitle}>{evento.nombre}</Text>
                      {evento.tipo ? (
                        <Text style={styles.eventDesc}>
                          {evento.tipo}
                          {evento.ciudad ? ` · ${evento.ciudad}` : ""}
                        </Text>
                      ) : null}
                      {evento.ubicacion ? (
                        <Text style={styles.eventDesc}>{evento.ubicacion}</Text>
                      ) : null}
                      {evento.descripcion ? (
                        <Text style={styles.eventDesc}>
                          {evento.descripcion}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Lista horizontal de outfits del evento */}
                  {outfits.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <SubtitleSerif>Outfits asignados</SubtitleSerif>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        {outfits.map((o) => (
                          <TouchableOpacity
                            key={o.id}
                            style={styles.outfitItem}
                            onPress={() => router.push(`/mis-outfits?id=${o.id}`)}
                          >
                            {/* Imagen COMPLETA del outfit */}
                            <Image
                              source={{ uri: o.imagen }}
                              style={styles.outfitThumb}
                              resizeMode="contain"
                            />
                            <Text
                              numberOfLines={1}
                              style={styles.outfitName}
                            >
                              {o.nombre}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Botones */}
                  <View style={styles.actionRow}>
                    <PrimaryButton
                      text="Outfit IA"
                      onPress={() =>
                        router.push(
                          `/crear-outfit?eventoId=${evento.id}&eventoNombre=${encodeURIComponent(
                            evento.nombre
                          )}`
                        )
                      }
                      style={{ flex: 1 }}
                    />

                    <PrimaryButton
                      text="Por prenda"
                      variant="secondary"
                      onPress={() =>
                        router.push(`/mi-armario?selectMode=prenda&eventoId=${evento.id}`)
                      }

                      style={{ flex: 1 }}
                    />
                  </View>
                </Card>
              );
            })
          )}

          {/* ---------- BOTÓN CREAR EVENTO ---------- */}
          <Card style={styles.eventCard}>
            <PrimaryButton
              text="Crear evento"
              onPress={() => {
                // limpiar estados y abrir modal en modo "crear"
                setEditandoEvento(null);
                setNuevoNombre("");
                setNuevaDescripcion("");
                setNuevoTipo("");
                setNuevaUbicacion("");
                setNuevaCiudad("");
                setGuardarEnCalendario(false);
                setModalCrear(true);
              }}
              style={{width: "100%" }}
            />
          </Card>
        </ScrollView>

        {/* ---------- MODAL CREAR / EDITAR EVENTO ---------- */}
        <Modal visible={modalCrear} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Card style={styles.modalBox}>
              <TitleSerif>
                {editandoEvento ? "Editar evento" : "Nuevo evento"}
              </TitleSerif>

              <InputMaison
                label="Nombre del evento"
                value={nuevoNombre}
                onChangeText={setNuevoNombre}
                placeholder="Ej: Cena con amigos"
              />

              <InputMaison
                label="Tipo de evento"
                value={nuevoTipo}
                onChangeText={setNuevoTipo}
                placeholder="Ej: boda, cena, cumpleaños..."
              />

              <InputMaison
                label="Lugar"
                value={nuevaUbicacion}
                onChangeText={setNuevaUbicacion}
                placeholder="Ej: Jardín principal, Restaurante X..."
              />

              <InputMaison
                label="Ciudad"
                value={nuevaCiudad}
                onChangeText={setNuevaCiudad}
                placeholder="Ej: Madrid, Alicante..."
              />

              <InputMaison
                label="Descripción"
                value={nuevaDescripcion}
                onChangeText={setNuevaDescripcion}
                placeholder="Detalles del evento..."
                multiline
                style={{ height: 80 }}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  Guardar también en tu calendario
                </Text>
                <Switch
                  value={guardarEnCalendario}
                  onValueChange={setGuardarEnCalendario}
                  disabled={!!editandoEvento} // solo tiene sentido al crear
                />
              </View>

              <View style={styles.modalActions}>
                <PrimaryButton
                  text="Cancelar"
                  variant="secondary"
                  onPress={() => {
                    setModalCrear(false);
                    setEditandoEvento(null);
                  }}
                  style={{ flex: 1 }}
                />

                <PrimaryButton
                  text={editandoEvento ? "Guardar" : "Crear"}
                  onPress={crearEvento}
                  style={{ flex: 1 }}
                />
              </View>

              {editandoEvento && (
                <TouchableOpacity
                  style={styles.deleteEventBtn}
                  onPress={() => {
                    setEventoAEliminar(editandoEvento);
                    setConfirmDeleteVisible(true);
                  }}
                >
                  <Text style={styles.deleteEventText}>Eliminar evento</Text>
                </TouchableOpacity>
              )}
            </Card>
          </View>
        </Modal>
        {/* ---------- MODAL CONFIRMACIÓN ELIMINAR EVENTO ---------- */}
        <Modal visible={confirmDeleteVisible} transparent animationType="fade">
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>
                ¿Seguro que quieres eliminar este evento?
              </Text>

              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: colors.primarySoft }]}
                  onPress={() => setConfirmDeleteVisible(false)}
                >
                  <Text style={{ color: colors.textPrimary }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: colors.danger }]}
                  onPress={async () => {
                    if (!eventoAEliminar) return;

                    showLoader("Eliminando...");

                    try {
                      await apiRequest(`/api/eventos/${eventoAEliminar.id}`, {
                        method: "DELETE",
                      });

                      // 🧽 borrar del estado local
                      setEventos((prev) =>
                        prev.filter((ev) => ev.id !== eventoAEliminar.id)
                      );

                      setModalCrear(false);
                      setEditandoEvento(null);
                    } finally {
                      hideLoader();
                      setConfirmDeleteVisible(false);
                    }
                  }}
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

// ============================================================
// ESTILOS MAISON
// ============================================================

const styles = StyleSheet.create({
  titleBlock: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 6,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },

  // ---- CALENDARIO ----
  calendarCard: {
    maxWidth: 650,
    alignSelf: "center",
    width: "100%",
    marginBottom: 20,
  },

  calendar: {
    borderRadius: 16,
  },

  sectionTitle: {
    marginTop: 4,
    marginBottom: 6,
    maxWidth: 650,
    alignSelf: "center",
  },

  emptyText: {
    textAlign: "left",
    color: colors.textSecondary,
    marginBottom: 16,
    fontSize: 14,
    maxWidth: 650,
    alignSelf: "center",
  },

  // ---- EVENTO ----
  eventCard: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    marginBottom: 16,
    paddingTop: 6,
  },

  eventHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  eventTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  eventEditButton: {
    position: "absolute",
    top: 10,
    right: 12,
    backgroundColor: "#ffffffcc",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },

  eventDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ---- Outfit listado horizontal ----
  outfitItem: {
    width: 150,            // el contenedor ahora es más ancho
    marginRight: 12,
    alignItems: "center",
  },

  outfitThumb: {
    width: "100%",         // ocupa todo el ancho del item
    height: 190,           // altura fija similar a Mis Outfits
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    marginBottom: 6,
    ...(Platform.OS === "web" && { objectFit: "contain" }),
  },
  outfitName: {
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: "center",
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },

  // ---- MODAL ----
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000055",
    justifyContent: "center",
    padding: 22,
  },

  modalBox: {
    maxWidth: 480,
    alignSelf: "center",
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 10,
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    marginRight: 10,
  },

  modalActions: {
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
  },

  deleteEventBtn: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: colors.danger,
    borderRadius: 12,
  },
  deleteEventText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
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
    color: colors.textPrimary,
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
