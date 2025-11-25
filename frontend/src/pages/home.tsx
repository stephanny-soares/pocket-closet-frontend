import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import Header from "../components/Header";
import colors from "../constants/colors";
import { useLoader } from "../context/LoaderContext";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../utils/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

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
  temperature: number;
  condition: string;
  icon: string;
  city: string;
}

const Home: React.FC = () => {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [outfits, setOutfits] = useState<OutfitSugerido[]>([]);
  const [loadingOutfits, setLoadingOutfits] = useState(false);
  const { width } = useWindowDimensions();
  const { showLoader, hideLoader } = useLoader();
  const { auth, loading } = useAuth();

  const isWeb = width > 768;

  useEffect(() => {
    fetchWeather();
  }, []);
  // 🧹 BORRAR CACHE ANTIGUA (ejecutar una sola vez)
useEffect(() => {
  AsyncStorage.removeItem("outfits_fecha");
  AsyncStorage.removeItem("outfits_data");
}, []);


  // Esperar a que auth esté cargado antes de pedir outfits
  useEffect(() => {
    if (!loading && auth?.token) {
      console.log("✅ Token cargado, obteniendo outfits...");
      inicializarOutfitsDelDia();
    } else if (!loading && !auth?.token) {
      console.log("⚠️ No hay token disponible");
    }
  }, [loading, auth?.token]);

  const fetchWeather = async () => {
  showLoader("Cargando clima...");

  try {
    let latitude: number | null = null;
    let longitude: number | null = null;
    let cityName: string | null = null;

    // Helper timeout para evitar bloqueos largos
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), ms)
      );
      return Promise.race([promise, timeout]);
    };

    // PREFETCH (súper rápido): cargar ciudad del usuario
    let prefsCity: string | null = null;
    try {
      const prefsRaw = await AsyncStorage.getItem("user_preferences");
      const prefs = prefsRaw ? JSON.parse(prefsRaw) : null;
      prefsCity = prefs?.ciudad?.trim() || null;
    } catch (_) {}

    // 1️⃣ Intentar ubicación (máx 2 segundos)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        const loc = await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: 1 }),
          2000 // TIMEOUT GPS: 2s
        );
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
        console.log("📍 Ubicación por GPS:", latitude, longitude);
      } else {
        console.log("⚠️ Permisos de ubicación denegados");
      }
    } catch (e) {
      console.log("⛔ GPS tardó demasiado → usando ciudad del usuario", e);
    }

    // 2️⃣ Si no hay coords → usar ciudad del usuario (instantáneo)
    if (!latitude || !longitude) {
      if (prefsCity) {
        cityName = prefsCity;
        console.log("🏙 Usando ciudad del usuario:", cityName);

        try {
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
              cityName
            )}&count=1`
          );
          const geoData = await geoRes.json();

          if (geoData?.results?.length > 0) {
            latitude = geoData.results[0].latitude;
            longitude = geoData.results[0].longitude;
            console.log("📍 Coords por ciudad:", latitude, longitude);
          }
        } catch (e) {
          console.log("⚠️ Error en geocoding de ciudad:", e);
        }
      }
    }

    // 3️⃣ Si hay coords pero no cityName → reverse geocoding
    if (latitude && longitude && !cityName) {
      try {
        const reverseRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}`
        );
        const reverseData = await reverseRes.json();

        cityName =
          reverseData?.results?.[0]?.name ||
          reverseData?.results?.[0]?.city ||
          "Tu ubicación";

        console.log("🏷 Ciudad por reverse geocoding:", cityName);
      } catch (e) {
        console.log("⚠️ Error en reverse geocoding:", e);
      }
    }

    // 4️⃣ Si seguimos sin coords → no mostramos clima
    if (!latitude || !longitude) {
      console.log("🚫 Sin coordenadas finales, no se muestra clima");
      setWeather(null);
      return;
    }

    // 5️⃣ Obtener el clima
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
    );

    const data: any = await response.json();

    const temp = Math.round(data.current.temperature_2m);
    const code: number = data.current.weather_code;

    const weatherMap: { [key: number]: { condition: string; icon: string } } = {
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

    const weatherInfo =
      weatherMap[code] || ({ condition: "Desconocido", icon: "weather-cloudy" } as const);

    setWeather({
      temperature: temp,
      condition: weatherInfo.condition,
      icon: weatherInfo.icon,
      city: cityName || "Tu ubicación",
    });

    console.log("🌡 Clima establecido:", temp, weatherInfo.condition);

  } catch (e) {
    console.log("❌ Error obteniendo clima general:", e);
    setWeather(null);
  } finally {
    hideLoader();
  }
};


  const inicializarOutfitsDelDia = async () => {
    try {
      setLoadingOutfits(true);

      const hoy = new Date().toISOString().split("T")[0];

      const usuarioId = auth?.userId ?? "unknown";

      const fechaGuardada = await AsyncStorage.getItem(`outfits_fecha_${usuarioId}`);
      const outfitsGuardadosRaw = await AsyncStorage.getItem(`outfits_data_${usuarioId}`);


      // 🟦 Si hay outfits guardados y son del día actual → mostrarlos sin llamar API
      if (fechaGuardada === hoy && outfitsGuardadosRaw) {
        console.log("✔ usando outfits almacenados del día");
        setOutfits(JSON.parse(outfitsGuardadosRaw));
        return;
      }

      // 🟧 Intentar generar nuevos outfits
      console.log("✨ generando outfits nuevos del día…");
      const data = await apiRequest<{ outfits: OutfitSugerido[] }>(
        "/api/outfits/sugerir",
        { method: "POST" }
      );

      // si API responde sin outfits válidos → fallback
      if (!data?.outfits || data.outfits.length === 0) {
        console.log(
          "⚠ API devolvió vacío, usando outfits guardados si existen"
        );
        if (outfitsGuardadosRaw) {
          setOutfits(JSON.parse(outfitsGuardadosRaw));
        }
        return;
      }

      // guardar en estado
      setOutfits(data.outfits);

      // guardar outfits y fecha en storage
      await AsyncStorage.setItem(`outfits_fecha_${usuarioId}`, hoy);
      await AsyncStorage.setItem(`outfits_data_${usuarioId}`, JSON.stringify(data.outfits));

      console.log("💾 outfits del día guardados");
    } catch (error) {
      console.log("❌ Error generando outfits del día:", error);

      // 🟥 fallback final: tratar de cargar los guardados
      const outfitsGuardadosRaw = await AsyncStorage.getItem("outfits_data");
      if (outfitsGuardadosRaw) {
        console.log("↩ usando outfits guardados por error en API");
        setOutfits(JSON.parse(outfitsGuardadosRaw));
      }
    } finally {
      setLoadingOutfits(false);
    }
  };

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const handleOutfitPress = (outfitId: string) => {
    router.push({
      pathname: "/mis-outfits",
      params: { id: outfitId },
    });
  };

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Header />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Clima */}
        {weather && (
          <View style={styles.weatherCard}>
            <View style={styles.weatherContent}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <MaterialCommunityIcons
                  name={(weather.icon || "weather-cloudy") as any}
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.weatherCity}>
                  {weather.city || "Tu ubicación"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.weatherCondition}>{weather.condition}</Text>
                <Text style={styles.temperature}>{weather.temperature}°</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tus outfits para hoy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Tus outfits para hoy <Text style={{ fontSize: 18 }}>👕</Text>
            </Text>
          </View>

          {loadingOutfits ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Generando outfits...</Text>
            </View>
          ) : outfits.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.outfitScroll}
            >
              {outfits.map((outfit, index) => (
                <TouchableOpacity
                  key={outfit.id || index}
                  style={styles.outfitCard}
                  onPress={() => handleOutfitPress(outfit.id)}
                  activeOpacity={0.8}
                >
                  {/* Mostrar las prendas de forma flexible */}
                  <View style={styles.outfitImageContainer}>
                    {outfit.prendas && outfit.prendas.length > 0 ? (
                      <View
                        style={[
                          styles.prendasGrid,
                          outfit.prendas.length === 1 &&
                            styles.prendasGridSingle,
                          outfit.prendas.length === 2 &&
                            styles.prendasGridDouble,
                        ]}
                      >
                        {outfit.prendas.map((prenda, i) => (
                          <Image
                            key={prenda.id || i}
                            source={{ uri: prenda.imagen }}
                            style={[
                              styles.prendaImage,
                              outfit.prendas.length === 1 &&
                                styles.prendaImageFull,
                              outfit.prendas.length === 2 &&
                                styles.prendaImageHalf,
                            ]}
                            onError={() =>
                              console.log(
                                `Error cargando imagen: ${prenda.imagen}`
                              )
                            }
                          />
                        ))}
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.outfitImage,
                          { backgroundColor: "#E8E8E8" },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={styles.outfitLabel}>{outfit.nombre}</Text>
                  <Text style={styles.outfitCategory}>{outfit.categoria}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={40} color={colors.primary} />
              <Text style={styles.emptyText}>
                No hay suficientes prendas para generar outfits
              </Text>
              <Text style={styles.emptySubtext}>
                Agrega al menos 2 prendas a tu armario
              </Text>
            </View>
          )}
        </View>

        {/* Secciones principales */}
        <View style={styles.section}>
          <View
            style={[
              styles.gridContainer,
              isWeb && {
                justifyContent: "center",
                gap: 24,
                paddingHorizontal: 80,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.gridItem,
                isWeb && { width: "20%", minWidth: 200, aspectRatio: 1 },
              ]}
              onPress={() => handleNavigate("/mi-armario")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shirt-outline"
                size={isWeb ? 50 : 40}
                color={colors.primary}
              />
              <Text style={styles.gridText}>Mi Armario</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gridItem,
                isWeb && { width: "20%", minWidth: 200, aspectRatio: 1 },
              ]}
              onPress={() => handleNavigate("/mis-outfits")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="images-outline"
                size={isWeb ? 50 : 40}
                color={colors.primary}
              />
              <Text style={styles.gridText}>Mis Outfits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gridItem,
                isWeb && { width: "20%", minWidth: 200, aspectRatio: 1 },
              ]}
              onPress={() => handleNavigate("/mis-eventos")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar-outline"
                size={isWeb ? 50 : 40}
                color={colors.primary}
              />
              <Text style={styles.gridText}>Mis Eventos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.gridItem,
                isWeb && { width: "20%", minWidth: 200, aspectRatio: 1 },
              ]}
              onPress={() => handleNavigate("/mis-viajes")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="airplane-outline"
                size={isWeb ? 50 : 40}
                color={colors.primary}
              />
              <Text style={styles.gridText}>Mis Viajes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  weatherCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  weatherContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weatherCity: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E1E1E",
  },
  weatherCondition: { fontSize: 14, color: "#666" },
  temperature: { fontSize: 36, fontWeight: "bold", color: colors.primary },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E1E1E",
  },
  outfitScroll: { flexDirection: "row" },
  outfitCard: {
    marginRight: 16,
    alignItems: "center",
    width: 110,
  },
  outfitImageContainer: {
    width: 110,
    height: 130,
    marginBottom: 8,
  },
  prendasGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    padding: 2,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  prendasGridSingle: {
    justifyContent: "center",
    alignItems: "center",
  },
  prendasGridDouble: {
    justifyContent: "space-around",
  },
  prendaImage: {
    width: "31%",
    height: "48%",
    borderRadius: 6,
    backgroundColor: "#F0F0F0",
  },
  prendaImageFull: {
    width: "100%",
    height: "100%",
  },
  prendaImageHalf: {
    width: "45%",
    height: "100%",
  },
  outfitImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  outfitLabel: {
    fontSize: 12,
    color: "#1E1E1E",
    fontWeight: "600",
    textAlign: "center",
  },
  outfitCategory: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 10,
    color: colors.primary,
    fontSize: 14,
    marginBottom: 16,
  },
  emptySubtext: {
    color: colors.primary,
    fontSize: 12,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  gridItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "47%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  gridText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E1E1E",
    textAlign: "center",
  },
});

export default Home;
