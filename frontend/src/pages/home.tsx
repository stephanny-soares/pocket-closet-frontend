import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Header from "../components/Header";
import colors from "../constants/colors";
import { useLoader } from "../context/LoaderContext";
import { useAuth } from "../hooks/useAuth";

interface Weather {
  temperature: number;
  condition: string;
  icon: string;
}

const Home: React.FC = () => {
  const [weather, setWeather] = useState<Weather | null>(null);
  const { width } = useWindowDimensions();
  const { showLoader, hideLoader } = useLoader();
  const { auth } = useAuth();

  const isWeb = width > 768; // breakpoint responsive

  useEffect(() => {
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

    fetchWeather();
  }, []);

  const handleNavigate = (route: string) => {
    router.push(route as any);
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
          <Text style={styles.sectionTitle}>
            Tus outfits para hoy <Text style={{ fontSize: 18 }}>👕</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.outfitScroll}
          >
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.outfitCard}>
                <View style={styles.outfitImage} />
                <Text style={styles.outfitLabel}>Outfit {i}</Text>
              </View>
            ))}
          </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E1E1E",
    marginBottom: 16,
  },
  outfitScroll: { flexDirection: "row" },
  outfitCard: { marginRight: 16, alignItems: "center" },
  outfitImage: {
    width: 90,
    height: 110,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  outfitLabel: { fontSize: 12, color: "#1E1E1E", fontWeight: "500" },
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
