import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Image, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Header from "../components/Header";
import colors from "../constants/colors";
import { useLoader } from "../context/LoaderContext";
import { useAuth } from "../hooks/useAuth";

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

  // 🔹 ESPERAR a que auth esté cargado
  useEffect(() => {
    if (!loading && auth?.token) {
      console.log('✅ Token cargado, obteniendo outfits...');
      fetchOutfitsSugeridos();
    } else if (!loading && !auth?.token) {
      console.log('⚠️ No hay token disponible');
    }
  }, [loading, auth?.token]);

  const fetchWeather = async () => {
    showLoader("Cargando clima...");
    try {
      const response = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=38.3452&longitude=-0.4810&current=temperature_2m,weather_code&timezone=Europe/Madrid"
      );
      const data: any = await response.json();
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;

      const weatherMap: { [key: number]: { condition: string; icon: string } } = {
        0: { condition: "Despejado", icon: "sunny" },
        1: { condition: "Mayormente despejado", icon: "partly-sunny" },
        2: { condition: "Parcialmente nublado", icon: "cloud" },
        3: { condition: "Nublado", icon: "cloud" },
        45: { condition: "Niebla", icon: "cloud" },
        51: { condition: "Lluvia ligera", icon: "rainy" },
        61: { condition: "Lluvia", icon: "rainy" },
        80: { condition: "Lluvia fuerte", icon: "rainy" },
        95: { condition: "Tormenta", icon: "thunderstorm" },
      };

      const weather = weatherMap[code] || { condition: "Desconocido", icon: "cloud" };
      setWeather({ temperature: temp, ...weather });
    } catch {
      setWeather({ temperature: 22, condition: "No disponible", icon: "cloud" });
    } finally {
      hideLoader();
    }
  };

  const fetchOutfitsSugeridos = async () => {
    setLoadingOutfits(true);
    try {
      const response = await fetch("http://localhost:5000/api/outfits/sugerir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOutfits(data.outfits || []);
      } else {
        console.error("Error al obtener outfits sugeridos");
      }
    } catch (error) {
      console.error("Error en fetchOutfitsSugeridos:", error);
    } finally {
      setLoadingOutfits(false);
    }
  };

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const handleOutfitPress = (outfitId: string) => {
    router.push(`/outfit-detalle/${outfitId}` as any);
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
        <View style={styles.weatherCard}>
          <View style={styles.weatherContent}>
            <View>
              <Text style={styles.weatherCity}>Alicante</Text>
              <Text style={styles.weatherCondition}>
                {weather?.condition || "Cargando..."}
              </Text>
            </View>
            <Text style={styles.temperature}>{weather?.temperature ?? "--"}°</Text>
          </View>
        </View>

        {/* Tus outfits para hoy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Tus outfits para hoy <Text style={{ fontSize: 18 }}>👕</Text>
            </Text>
            <TouchableOpacity onPress={fetchOutfitsSugeridos} disabled={loadingOutfits}>
              <Ionicons
                name="refresh"
                size={20}
                color={colors.primary}
                style={{ opacity: loadingOutfits ? 0.5 : 1 }}
              />
            </TouchableOpacity>
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
                      <View style={[
                        styles.prendasGrid,
                        outfit.prendas.length === 1 && styles.prendasGridSingle,
                        outfit.prendas.length === 2 && styles.prendasGridDouble,
                      ]}>
                        {outfit.prendas.map((prenda, i) => (
                          <Image
                            key={prenda.id || i}
                            source={{ uri: prenda.imagen }}
                            style={[
                              styles.prendaImage,
                              outfit.prendas.length === 1 && styles.prendaImageFull,
                              outfit.prendas.length === 2 && styles.prendaImageHalf,
                            ]}
                            onError={() => console.log(`Error cargando imagen: ${prenda.imagen}`)}
                          />
                        ))}
                      </View>
                    ) : (
                      <View style={[styles.outfitImage, { backgroundColor: "#E8E8E8" }]} />
                    )}
                  </View>
                  <Text style={styles.outfitLabel}>{outfit.nombre}</Text>
                  <Text style={styles.outfitCategory}>{outfit.categoria}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={40} color="#CCC" />
              <Text style={styles.emptyText}>No hay suficientes prendas para generar outfits</Text>
              <Text style={styles.emptySubtext}>Agrega al menos 2 prendas a tu armario</Text>
            </View>
          )}
        </View>

        {/* Secciones principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tus secciones principales</Text>

          <View
            style={[
              styles.gridContainer,
              isWeb && { justifyContent: "center", gap: 24, paddingHorizontal: 80 },
            ]}
          >
            <TouchableOpacity
              style={[styles.gridItem, isWeb && { width: "20%", minWidth: 200, aspectRatio: 1 }]}
              onPress={() => handleNavigate("/mi-armario")}
              activeOpacity={0.8}
            >
              <Ionicons name="shirt-outline" size={isWeb ? 50 : 40} color={colors.primary} />
              <Text style={styles.gridText}>Mi Armario</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridItem, isWeb && { width: "20%", minWidth: 200, aspectRatio: 1 }]}
              onPress={() => handleNavigate("/mis-outfits")}
              activeOpacity={0.8}
            >
              <Ionicons name="images-outline" size={isWeb ? 50 : 40} color={colors.primary} />
              <Text style={styles.gridText}>Mis Outfits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridItem, isWeb && { width: "20%", minWidth: 200, aspectRatio: 1 }]}
              onPress={() => handleNavigate("/mis-eventos")}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={isWeb ? 50 : 40} color={colors.primary} />
              <Text style={styles.gridText}>Mis Eventos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridItem, isWeb && { width: "20%", minWidth: 200, aspectRatio: 1 }]}
              onPress={() => handleNavigate("/mis-viajes")}
              activeOpacity={0.8}
            >
              <Ionicons name="airplane-outline" size={isWeb ? 50 : 40} color={colors.primary} />
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
    color: "#999",
    fontSize: 14,
    marginBottom: 16,
  },
  emptySubtext: {
    color: "#CCC",
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
