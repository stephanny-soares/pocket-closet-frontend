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
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

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
          imagen: o.imagen,
          eventoId: o.eventoId,
        });
      });

      setOutfitsPorEvento(map);
      console.log("🔥 MAP OUTFITS POR EVENTO:", map);
      console.log("🧵 OUTFITS COMPLETOS DEVUELTOS POR EL BACKEND:", dataOutfits.outfits);

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
        await crearEventoNativo(
          nuevoNombre.trim(),
          nuevaDescripcion.trim(),
          selectedDate
        );
      }

      setModalCrear(false);
      setNuevoNombre("");
      setNuevaDescripcion("");
      await inicializarPantalla();
    } catch (e) {
      Alert.alert("Error", "No se pudo crear el evento.");
    } finally {
      hideLoader();
    }
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

  const crearEventoNativo = async (titulo: string, descripcion: string, fecha: string) => {
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
      <HeaderMaison />

      {/* TITLE */}
      <View style={styles.titleBlock}>
        <TitleSerif>Mis eventos</TitleSerif>
        <SubtitleSerif>Organiza tus planes y crea tu outfit ideal</SubtitleSerif>
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
                <View style={styles.eventHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventTitle}>{evento.nombre}</Text>
                    {evento.descripcion ? (
                      <Text style={styles.eventDesc}>{evento.descripcion}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Lista horizontal de outfits del evento */}
                {outfits.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <SubtitleSerif>Outfits asignados</SubtitleSerif>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {outfits.map((o) => (
                        <TouchableOpacity
                          key={o.id}
                          style={styles.outfitItem}
                          onPress={() =>
                            router.push(`/mis-outfits?id=${o.id}`)
                          }
                        >
                          <Image source={{ uri: o.imagen }} style={styles.outfitThumb} />
                          <Text numberOfLines={1} style={styles.outfitName}>
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
                      router.push("/mi-armario?selectMode=prenda")
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            );
          })
        )}

        {/* ---------- BOTÓN CREAR EVENTO ---------- */}
        <PrimaryButton
          text="Crear evento"
          onPress={() => setModalCrear(true)}
          style={{ marginTop: 20 }}
        />
      </ScrollView>

      {/* ---------- MODAL CREAR EVENTO ---------- */}
      <Modal visible={modalCrear} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalBox}>
            <TitleSerif>Nuevo evento</TitleSerif>

            <InputMaison
              label="Nombre del evento"
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              placeholder="Ej: Cena con amigos"
            />

            <InputMaison
              label="Descripción (opcional)"
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
              />
            </View>

            <View style={styles.modalActions}>
              <PrimaryButton
                text="Cancelar"
                variant="secondary"
                onPress={() => setModalCrear(false)}
                style={{ flex: 1 }}
              />

              <PrimaryButton
                text="Crear"
                onPress={crearEvento}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
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

  eventDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ---- Outfit listado horizontal ----
  outfitItem: {
    width: 90,
    marginRight: 10,
    alignItems: "center",
  },
  outfitThumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#EEE",
    marginBottom: 6,
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
});
