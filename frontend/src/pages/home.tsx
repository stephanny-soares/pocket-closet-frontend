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
import Card from "../components/ui/Card"; // <-- CORRECTO
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
}

interface Weather {
  temperature: number | null;
  condition: string;
  icon: string;
  city: string;
}

/* ============================================================
   Home
============================================================ */

export default function Home() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [outfits, setOutfits] = useState<OutfitSugerido[]>([]);
  const [loadingOutfits, setLoadingOutfits] = useState(false);

  const { showLoader, hideLoader } = useLoader();
  const { auth } = useAuth();

  /* ------------------- Saludo dinámico ------------------- */
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  const username = auth?.userName || "Usuario";

  const greeting = `${getGreeting()}, ${username}.`;

  /* ============================================================
     Cargar clima real
  ============================================================ */

  useEffect(() => {
    cargarClima();
  }, []);

  const cargarClima = async () => {
    showLoader("Cargando clima…");

    let lat: number | null = null;
    let lon: number | null = null;

    /* ---------------- WEB ---------------- */
    if (Platform.OS === "web") {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            resolve();
          },
          () => resolve(),
          { timeout: 5000 }
        );
      });
    }

    /* ---------------- ANDROID / IOS ---------------- */
    if (!lat || !lon) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        }
      } catch (_) {}
    }

    /* ---------------- Ciudad de preferencias ---------------- */
    let prefsCity: string | null = null;
    try {
      const raw = await AsyncStorage.getItem("user_preferences");
      const prefs = raw ? JSON.parse(raw) : null;
      prefsCity = prefs?.ciudad ?? null;
    } catch (_) {}

    /* ---------------- Ciudad detectada del backend ---------------- */
    let cityName: string | null = null;

    if (lat && lon) {
      try {
        const res = await apiRequest<any>(
          "/api/utils/reverse-geocode",
          {
            method: "POST",
            body: JSON.stringify({ latitude: lat, longitude: lon }),
          }
        );

        // 💥 ESTA ES LA CLAVE: tu backend devuelve { ok: true, ciudad: "Alicante" }
        cityName = res?.ciudad ?? null;

      } catch (error) {
        console.log("Error reverse-geocode:", error);
      }
    }

    if (!cityName && prefsCity) cityName = prefsCity;
    if (!cityName) cityName = "Tu ubicación";

    /* ---------------- Si NO hay coordenadas → mostrar ciudad sin clima ---------------- */
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

  /* ============================================================
     OUTFITS
  ============================================================ */

  useEffect(() => {
    cargarOutfits();
  }, []);

  const cargarOutfits = async () => {
    try {
      setLoadingOutfits(true);

      const result = await apiRequest<{ outfits: OutfitSugerido[] }>(
        "/api/outfits/sugerir",
        { method: "POST" }
      );

      setOutfits(result?.outfits ?? []);
    } catch (err) {
      console.log("Error outfits:", err);
    } finally {
      setLoadingOutfits(false);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Saludo */}
        <TitleSerif style={styles.greeting}>{greeting}</TitleSerif>

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

            <BodyText style={styles.weatherDesc}>
              {weather.condition}
              {weather.temperature !== null ? ` · ${weather.temperature}°` : ""}
            </BodyText>
          </Card>
        )}

        {/* ----- OUTFITS DEL DÍA ----- */}
        <TitleSerif style={styles.sectionTitle}>Outfits del día</TitleSerif>

        {loadingOutfits && (
          <ActivityIndicator size="large" color={colors.primary} />
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {outfits.slice(0, 3).map((o) => (
            <Card key={o.id} style={styles.outfitCard}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/mis-outfits?id=${o.id}`)}
              >
                <Image
                  source={{
                    uri:
                      o.prendas?.[0]?.imagen ||
                      "https://via.placeholder.com/200",
                  }}
                  style={styles.outfitImage}
                />
                <Text style={styles.outfitName}>{o.nombre}</Text>
                <Text style={styles.outfitCat}>{o.categoria}</Text>
              </TouchableOpacity>
            </Card>
          ))}
        </ScrollView>

        {/* ----- ACCIONES RÁPIDAS ----- */}
        <TitleSerif style={styles.sectionTitle}>Acciones rápidas</TitleSerif>

        <View style={styles.actionsGrid}>
          <QuickAction label="Try-on" icon="camera-outline" route="/add-prenda" />
          <QuickAction label="Crear outfit" icon="plus-circle-outline" route="/crear-outfit" />
          <QuickAction label="Estilista IA" icon="wand" route="/mis-outfits" />
          <QuickAction label="Moodboard" icon="image-multiple-outline" route="/mi-armario" />
        </View>

        {/* ----- SELECCIÓN PARA HOY ----- */}
        <TitleSerif style={styles.sectionTitle}>Selección para hoy</TitleSerif>

        {outfits.slice(1).map((o) => (
          <Card key={o.id} style={styles.editCard}>
            <TouchableOpacity
              style={styles.editRow}
              activeOpacity={0.8}
              onPress={() => router.push(`/mis-outfits?id=${o.id}`)}
            >
              <Image
                source={{ uri: o.prendas?.[0]?.imagen }}
                style={styles.editThumb}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.editName}>{o.nombre}</Text>
                <Text style={styles.editCat}>{o.categoria}</Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </Card>
        ))}

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
    paddingTop: 16,
  },

  greeting: {
    fontSize: 32,
    marginBottom: 20,
  },

  weatherCard: {
    marginBottom: 28,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weatherCity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  weatherDesc: {
    fontSize: 16,
    marginTop: 6,
  },

  sectionTitle: {
    fontSize: 24,
    marginBottom: 12,
  },

  outfitCard: {
    width: 180,
    marginRight: 14,
  },
  outfitImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginBottom: 10,
  },
  outfitName: {
    fontSize: 15,
    fontWeight: "600",
  },
  outfitCat: {
    fontSize: 13,
    color: colors.textSecondary,
  },

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

  editCard: {
    marginBottom: 14,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  editThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  editName: {
    fontSize: 15,
    fontWeight: "600",
  },
  editCat: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
