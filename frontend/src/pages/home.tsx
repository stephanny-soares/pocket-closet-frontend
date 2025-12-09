import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import TitleSerif from "../components/ui/TitleSerif";
import BodyText from "../components/ui/BodyText";
import Card from "../components/ui/Card";
import colors from "../constants/colors";

import { apiRequest } from "../utils/apiClient";
import { useLoader } from "../context/LoaderContext";
import { useAuth } from "../hooks/useAuth";


/* ============================================================
   Tipos
============================================================ */
interface Prenda {
  id: string;
  nombre: string;
  imagen: string;
  color: string;
}

interface OutfitSugerido {
  id: string;
  nombre: string;
  categoria: string;
  prendas: Prenda[];
  imagen?: string; // posible imagen completa del outfit
}

interface Weather {
  temperature: number | null;
  condition: string;
  icon: string;
  city: string;
}

interface FavoriteOutfit {
  id: string;
  nombre: string;
  imagen: string;
  categoria?: string;
}
interface Evento {
  id: string;
  nombre: string;
  fecha: string; // YYYY-MM-DD
}
interface EventoOutfit {
  id: string;
  nombre: string;
  imagen: string;
  eventoId: string;
}
interface OutfitEventoApi {
  id: string;
  nombre: string;
  imagen: string;
  eventoId?: string;
}



/* Día actual como índice 0-6 (Lun–Dom) */
const WEEK_DAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const getTodayIndex = () => {
  const js = new Date().getDay(); // 0 = Dom, 1 = Lun...
  return (js + 6) % 7; // 0 = Lun
};

/* ============================================================
   Home
============================================================ */

export default function Home() {
  const [weather, setWeather] = useState<Weather | null>(null);

  // Outfits sugeridos (de IA, como antes)
  const [outfits, setOutfits] = useState<OutfitSugerido[]>([]);
  const [loadingOutfits, setLoadingOutfits] = useState(false);

  // Eventos y outfits asociados
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [outfitsPorEvento, setOutfitsPorEvento] = useState<
    Record<string, EventoOutfit[]>
  >({});


  // Outfits favoritos / más usados (por ahora: últimos creados)
  const [favoriteOutfits, setFavoriteOutfits] = useState<FavoriteOutfit[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // Día seleccionado para "Outfits del día" (semana)
  const [selectedDayIndex, setSelectedDayIndex] = useState(getTodayIndex);

  const { showLoader, hideLoader } = useLoader();
  const { auth } = useAuth();

  const userId = auth?.userId || "anon";
  const [perfil, setPerfil] = useState<{ nombre: string }>({ nombre: "" });


  /* ------------------- Saludo dinámico ------------------- */
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  const username = auth?.userName || perfil.nombre || "Usuario";

  const greeting = `${getGreeting()}, ${username}.`;

  /* ============================================================
     Cargar clima real
  ============================================================ */

  useEffect(() => {
    cargarClima();
  }, []);

  const cargarClima = async () => {
    showLoader("Cargando clima…");

    // helper para evitar que Location se quede colgado en el emulador
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), ms)
        ),
      ]);
    };

    let lat: number | null = null;
    let lon: number | null = null;

    /* ---------------- Leer ciudad de preferencias ---------------- */
    let prefsCity: string | null = null;
    try {
      const raw = await AsyncStorage.getItem("user_preferences");
      const prefs = raw ? JSON.parse(raw) : null;
      prefsCity = prefs?.ciudad ?? null;
    } catch (_) {}

    /* ---------------- GEO WEB ---------------- */
    if (Platform.OS === "web") {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            resolve();
          },
          () => resolve(),
          { timeout: 4000 }
        );
      });
    }

    /* ---------------- GEO ANDROID / IOS ---------------- */
    if (!lat || !lon) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await withTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Lowest,
            }),
            2500
          );
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        }
      } catch (e) {
        console.log("Error GPS móvil:", e);
      }
    }

    /* ---------------- Ciudad detectada del backend ---------------- */
    let cityName: string | null = null;

    if (lat && lon) {
      try {
        const res = await apiRequest<any>("/api/utils/reverse-geocode", {
          method: "POST",
          body: JSON.stringify({ latitude: lat, longitude: lon }),
        });

        // backend: { ok: true, ciudad: "Alicante" }
        cityName = res?.ciudad ?? null;
      } catch (error) {
        console.log("Error reverse-geocode:", error);
      }
    }

    /* ---------------- Fallbacks de ciudad y coords ---------------- */

    // si aún no tenemos nombre de ciudad, usar la del perfil
    if (!cityName && prefsCity) cityName = prefsCity;
    if (!cityName) cityName = "Tu ubicación";

    // si no tenemos coords, intentar mapear por ciudad de perfil
    if ((!lat || !lon) && prefsCity) {
      const key = prefsCity.trim().toLowerCase();
      const cityCoords: Record<string, { lat: number; lon: number }> = {
        madrid: { lat: 40.416775, lon: -3.70379 },
        valencia: { lat: 39.46975, lon: -0.37739 },
        "alacant / alicante": { lat: 38.34517, lon: -0.48149 },
        alicante: { lat: 38.34517, lon: -0.48149 },
        barcelona: { lat: 41.3874, lon: 2.1686 },
      };

      const mapped = cityCoords[key];
      if (mapped) {
        lat = mapped.lat;
        lon = mapped.lon;
      }
    }

    // si AÚN no hay coords: mostramos ciudad sin clima
    if (!lat || !lon) {
      setWeather({
        temperature: null,
        condition: "Desconocido",
        icon: "weather-cloudy",
        city: cityName!,
      });
      hideLoader();
      return;
    }

    /* ---------------- Obtener clima real ---------------- */
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
      );

      const data = await res.json();

      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;

      const weatherMap: Record<number, { condition: string; icon: string }> = {
        0: { condition: "Despejado", icon: "weather-sunny" },
        1: { condition: "Mayormente despejado", icon: "weather-partly-cloudy" },
        2: { condition: "Parcialmente nublado", icon: "weather-partly-cloudy" },
        3: { condition: "Nublado", icon: "weather-cloudy" },
        45: { condition: "Niebla", icon: "weather-fog" },
        51: { condition: "Lluvia ligera", icon: "weather-rainy" },
        61: { condition: "Lluvia", icon: "weather-rainy" },
        80: { condition: "Lluvia fuerte", icon: "weather-pouring" },
        95: { condition: "Tormenta", icon: "weather-lightning" },
      };

      const info = weatherMap[code] ?? {
        condition: "Desconocido",
        icon: "weather-cloudy",
      };

      setWeather({
        temperature: temp,
        condition: info.condition,
        icon: info.icon,
        city: cityName!,
      });
    } catch (err) {
      console.log("Error clima:", err);
      setWeather({
        temperature: null,
        condition: "Desconocido",
        icon: "weather-cloudy",
        city: cityName!,
      });
    }

    hideLoader();
  };
  // ==========================================================
  // Cargar perfil real del backend
  // ==========================================================
  const cargarPerfil = async () => {
    try {
      const data = await apiRequest("/api/users/perfil", { method: "GET" });

      if (data.ok && data.usuario) {
        setPerfil({
          nombre: data.usuario.userName,
        });
      }
    } catch (err) {
      console.log("Error cargando perfil en Home:", err);
    }
  };

  // 2. El useEffect debe depender del auth.userId
  useEffect(() => {
    if (auth?.userId) {
      cargarPerfil();
    }
  }, [auth?.userId]);



  /* ============================================================
     OUTFITS sugeridos: solo una vez al día por usuario (como antes)
  ============================================================ */

  useEffect(() => {
    cargarOutfits();
    cargarFavoritos();
  }, []);

  const cargarOutfits = async () => {
    try {
      setLoadingOutfits(true);

      const hoy = new Date().toISOString().slice(0, 10);
      const fechaKey = `outfits_fecha_${userId}`;
      const dataKey = `outfits_data_${userId}`;

      const storedFecha = await AsyncStorage.getItem(fechaKey);
      const storedData = await AsyncStorage.getItem(dataKey);

      // Si ya hay outfits para hoy, los usamos y no llamamos al backend
      if (storedFecha === hoy && storedData) {
        const parsed = JSON.parse(storedData) as OutfitSugerido[];
        setOutfits(parsed);
        setLoadingOutfits(false);
        return;
      }

      // Si no, pedimos nuevos al backend
      const result = await apiRequest<{ outfits: OutfitSugerido[] }>(
        "/api/outfits/sugerir",
        { method: "POST" }
      );

      const nuevos = result?.outfits ?? [];

      if (nuevos.length > 0) {
        setOutfits(nuevos);
        await AsyncStorage.setItem(fechaKey, hoy);
        await AsyncStorage.setItem(dataKey, JSON.stringify(nuevos));
      } else if (storedData) {
        // si el backend no devuelve nada pero había algo guardado, lo usamos
        setOutfits(JSON.parse(storedData));
      }
    } catch (err) {
      console.log("Error outfits:", err);
    } finally {
      setLoadingOutfits(false);
    }
  };

  /* ============================================================
     OUTFITS favoritos (por ahora: últimos por fecha de creación)
  ============================================================ */

  const cargarFavoritos = async () => {
    try {
      setLoadingFavorites(true);

      const data = await apiRequest<{ outfits: any[] }>("/api/outfits", {
        method: "GET",
      });

      const lista = data?.outfits || [];

      // ordenar por createdAt (si existe) de más nuevo a más viejo
      const ordenados = [...lista].sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });

      const favoritos: FavoriteOutfit[] = ordenados
        .slice(0, 10)
        .map((o: any) => ({
          id: o.id,
          nombre: o.nombre,
          imagen: o.imagen,
          categoria: o.categoria,
        }));

      setFavoriteOutfits(favoritos);
    } catch (e) {
      console.log("Error cargando favoritos:", e);
    } finally {
      setLoadingFavorites(false);
    }
  };
  const generarSemana = () => {
    const dias = [];
    const hoy = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() + i);

      dias.push({
        fechaISO: d.toISOString().split("T")[0], // YYYY-MM-DD
        etiqueta: d.toLocaleDateString("es-ES", {
          weekday: "short",
          day: "numeric",
        }), // "lun 27", "mar 28"...
      });
    }
    return dias;
  };

  const semana = generarSemana();
  const [selectedDay, setSelectedDay] = useState(semana[0].fechaISO);


  /* ============================================================
     RENDER
  ============================================================ */

  // outfit correspondiente al día seleccionado (de momento,
  // simplemente usamos la lista sugerida, 1 outfit por día)
  const outfitDiaSeleccionado =
    outfits.length > 0 ? outfits[selectedDayIndex % outfits.length] : null;

  return (
    <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header: saludo + icono perfil */}
        <View style={styles.headerRow}>
          <TitleSerif style={styles.greeting}>{greeting}</TitleSerif>

          <TouchableOpacity
            onPress={() => router.push("/perfil" as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="person-circle-outline"
              size={32}
              color={colors.iconActive}
            />
          </TouchableOpacity>
        </View>

        {/* ----- CLIMA ----- */}
        {weather && (
          <Card style={styles.weatherCard}>
            <View style={styles.weatherRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.weatherCity}>{weather.city}</Text>
            </View>

            <View style={styles.weatherMain}>
              <MaterialCommunityIcons
                name={weather.icon as any}
                size={26}
                color={colors.iconActive}
              />
              <BodyText style={styles.weatherDesc}>
                {weather.condition}
                {weather.temperature !== null
                  ? ` · ${weather.temperature}°`
                  : ""}
              </BodyText>
            </View>
          </Card>
        )}

        {/* ----- OUTFITS DEL DÍA (SEMANA REAL) ----- */}
        <TitleSerif style={styles.sectionTitle}>Outfits del día</TitleSerif>

        {/* Tabs de la semana */}
        <View style={styles.weekTabsRow}>
          {semana.map((d) => (
            <TouchableOpacity
              key={d.fechaISO}
              style={[
                styles.weekTab,
                selectedDay === d.fechaISO && styles.weekTabActive,
              ]}
              onPress={() => setSelectedDay(d.fechaISO)}
            >
              <Text
                style={[
                  styles.weekTabText,
                  selectedDay === d.fechaISO && styles.weekTabTextActive,
                ]}
              >
                {d.etiqueta}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ----- OUTFITS DE EVENTO + IA (SOLO HOY) — CARRUSEL ----- */}
        {(() => {
          const hoyISO = semana[0].fechaISO;
          const evento = eventos.find((e) => {
            const fechaEvento = new Date(e.fecha).toISOString().split("T")[0];
            return fechaEvento === selectedDay;
          });
          const outfitsEvento = evento ? outfitsPorEvento[evento.id] || [] : [];
          const esHoy = selectedDay === hoyISO;

          let outfitsMostrar: any[] = [];

          if (esHoy) {
            outfitsMostrar = [...outfitsEvento, ...outfits]; // evento -> IA
          } else {
            outfitsMostrar = [...outfitsEvento];
          }

          if (outfitsMostrar.length === 0) {
            return (
              <Text style={{ color: "#777", marginBottom: 10 }}>
                No hay outfit asignado para este día
              </Text>
            );
          }

          return (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10 }}
            >
              {outfitsMostrar.map((o) => (
                <Card
                  key={o.id}
                  style={{
                    width: 220,           // tamaño ideal Maison
                    marginRight: 16,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push(`/mis-outfits?id=${o.id}`)}
                  >
                    <Image
                      source={{ uri: o.imagen || o.prendas?.[0]?.imagen }}
                      style={styles.outfitCarouselImage}
                    />

                    <Text style={styles.outfitName}>{o.nombre}</Text>
                    <Text style={styles.outfitCat}>
                      {o.eventoId ? "Evento" : "Sugerido por IA"}
                    </Text>
                  </TouchableOpacity>
                </Card>
              ))}
            </ScrollView>
          );
        })()}


        {/* ----- ACCIONES RÁPIDAS ----- */}
        <TitleSerif style={styles.sectionTitle}>Acciones rápidas</TitleSerif>

        <View style={styles.actionsGrid}>
          <QuickAction label="Try-on" icon="camera-outline" route="/add-prenda" />
          <QuickAction
            label="Crear outfit"
            icon="plus-circle-outline"
            route="/crear-outfit"
          />
          <QuickAction label="Estilista IA" icon="wand" route="/mis-outfits" />
          <QuickAction
            label="Moodboard"
            icon="image-multiple-outline"
            route="/mi-armario"
          />
        </View>

        {/* ----- PRÓXIMO VIAJE ----- */}
        <TitleSerif style={styles.sectionTitle}>Próximo viaje</TitleSerif>
        <Card style={styles.tripCard}>
          <View style={styles.tripRow}>
            <Ionicons
              name="airplane-outline"
              size={20}
              color={colors.iconActive}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.tripTitle}>Aún no tienes viajes guardados</Text>
              <Text style={styles.tripSubtitle}>
                Crea tu próximo viaje para planificar la maleta y los outfits.
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/mis-viajes" as any)}>
              <Text style={styles.tripCTA}>Abrir viajes</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* ----- FAVORITOS ----- */}
        <TitleSerif style={styles.sectionTitle}>Favoritos</TitleSerif>

        {loadingFavorites ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : favoriteOutfits.length === 0 ? (
          <BodyText style={{ marginBottom: 12 }}>
            Aún no tienes outfits favoritos. Crea o reutiliza algunos en Mis
            Outfits.
          </BodyText>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {favoriteOutfits.map((o) => (
              <Card key={o.id} style={styles.favoriteCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push(`/mis-outfits?id=${o.id}`)}
                >
                  <Image
                    source={{ uri: o.imagen }}
                    style={styles.favoriteImage}
                  />
                  <Text style={styles.favoriteName} numberOfLines={1}>
                    {o.nombre}
                  </Text>
                  {o.categoria ? (
                    <Text style={styles.favoriteCat}>{o.categoria}</Text>
                  ) : null}
                </TouchableOpacity>
              </Card>
            ))}
          </ScrollView>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

/* ============================================================
   QuickAction
============================================================ */

function QuickAction({ label, icon, route }: any) {
  return (
    <Card style={styles.quickCard}>
      <TouchableOpacity
        style={styles.quickInner}
        onPress={() => router.push(route)}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={colors.iconActive}
        />
        <Text style={styles.quickLabel}>{label}</Text>
      </TouchableOpacity>
    </Card>
  );
}

/* ============================================================
   Estilos
============================================================ */

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 28, // saludo un poco más abajo
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  greeting: {
    fontSize: 32,
    flex: 1,
    paddingRight: 16,
  },

  weatherCard: {
    marginBottom: 28,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  weatherCity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  weatherMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  weatherDesc: {
    fontSize: 16,
  },

  sectionTitle: {
    fontSize: 24,
    marginBottom: 12,
  },

  /* Outfits del día (semana) */
  weekTabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  weekTab: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
  },
  weekTabActive: {
    backgroundColor: colors.primary,
  },
  weekTabText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  weekTabTextActive: {
    color: "#FFF",
  },

  outfitOfDayCard: {
    marginBottom: 24,
  },
 outfitImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    marginBottom: 10,
    resizeMode: "cover",
  },
  outfitCarouselImage: {
    width: "100%",
    height: 220,       // proporcion estable
    borderRadius: 16,
    resizeMode: "contain",   // ⭐ NO RECORTA NUNCA
    backgroundColor: "#F4F4F4",
  },


  outfitName: {
    fontSize: 15,
    fontWeight: "600",
  },
  outfitCat: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  /* Acciones rápidas */
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 28,
  },
  quickCard: {
    width: "47%",
  },
  quickInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },

  /* Próximo viaje */
  tripCard: {
    marginBottom: 24,
  },
  tripRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tripTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  tripSubtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  tripCTA: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },

  /* Favoritos */
  favoriteCard: {
    width: 150,
    marginRight: 12,
    borderRadius: 18,
    overflow: "hidden",
  },

  favoriteImage: {
    width: "100%",
    height: 180,         // más alto para que visually quede bonito
    borderRadius: 16,
    resizeMode: "contain",   // ⭐ NUNCA RECORTA
    backgroundColor: "#F7F7F7",  // estilo Maison
  },

  favoriteName: {
    fontSize: 13,
    fontWeight: "600",
  },
  favoriteCat: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
