import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import Header from '../components/Header';
import colors from '../constants/colors';
import { storage } from '../utils/storage';
import { useAuth } from '../hooks/useAuth';

interface Weather {
  temperature: number;
  condition: string;
  icon: string;
}

export default function Home() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [userName, setUserName] = useState('Usuario');
  const { logout } = useAuth(); // ✅ Importar logout del hook

  useEffect(() => {
    fetchWeather();
    const loadUser = async () => {
      let storedName = await storage.getItem('userName');

      // 🧠 Si no lo encuentra (web), intentar leer desde localStorage o sessionStorage
      if (!storedName && Platform.OS === 'web') {
        try {
          storedName =
            localStorage.getItem('userName') ||
            sessionStorage.getItem('userName') ||
            'Usuario';
        } catch (err) {
          console.warn('No se pudo acceder al almacenamiento web:', err);
        }
      }

      setUserName(storedName || 'Usuario');
    };

    loadUser();
  }, []);

  const fetchWeather = async () => {
    try {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=38.3452&longitude=-0.4810&current=temperature_2m,weather_code&timezone=Europe/Madrid'
      );
      const data: any = await response.json();
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;

      const weatherMap: { [key: number]: { condition: string; icon: string } } = {
        0: { condition: 'Despejado', icon: 'sunny' },
        1: { condition: 'Mayormente despejado', icon: 'partly-sunny' },
        2: { condition: 'Parcialmente nublado', icon: 'cloud' },
        3: { condition: 'Nublado', icon: 'cloud' },
        45: { condition: 'Niebla', icon: 'cloud' },
        51: { condition: 'Lluvia ligera', icon: 'rainy' },
        61: { condition: 'Lluvia', icon: 'rainy' },
        80: { condition: 'Lluvia fuerte', icon: 'rainy' },
        95: { condition: 'Tormenta', icon: 'thunderstorm' },
      };

      const weather = weatherMap[code] || { condition: 'Desconocido', icon: 'cloud' };
      setWeather({ temperature: temp, ...weather });
    } catch {
      setWeather({ temperature: 22, condition: 'No disponible', icon: 'cloud' });
    }
  };

  // ✅ Logout centralizado usando useAuth()
  const handleLogout = async () => {
    Toast.show({
      type: 'success',
      text1: '👋 Sesión cerrada',
      text2: 'Has cerrado sesión correctamente.',
      position: 'bottom',
      visibilityTime: 1500,
      bottomOffset: 60,
    });

    setTimeout(() => {
      logout(); // llama al logout global del hook
    }, 800);
  };

  const handleNavigate = (route: string) => router.push(route as any);

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {/* 🔹 Botón de logout arriba a la izquierda */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={26} color="#4B0082" />
      </TouchableOpacity>

      <ScrollView style={styles.scroll}>
        <Header title="PocketCloset" transparent />
        <View style={styles.container}>
          <Text style={styles.greeting}>¡Hola {userName}! 👋</Text>

          <View style={styles.weatherCard}>
            <View style={styles.weatherContent}>
              <View>
                <Text style={styles.weatherCity}>Alicante</Text>
                <Text style={styles.weatherCondition}>
                  {weather?.condition || 'Cargando...'}
                </Text>
              </View>
              <View style={styles.weatherTemp}>
                <Text style={styles.temperature}>{weather?.temperature}°</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tus outfits para hoy 👕</Text>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acceso rápido</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleNavigate('/mi-armario')}
              >
                <Ionicons name="shirt" size={32} color="#4B0082" />
                <Text style={styles.optionText}>Mi Armario</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleNavigate('/mis-outfits')}
              >
                <Ionicons name="images" size={32} color="#4B0082" />
                <Text style={styles.optionText}>Mis Outfits</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleNavigate('/agregar')}
              >
                <Ionicons name="add-circle" size={32} color="#4B0082" />
                <Text style={styles.optionText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 16, paddingBottom: 40 },
  logoutButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: '#FFFFFFCC',
    borderRadius: 50,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginTop: 70,
    marginBottom: 20,
    textAlign: 'center',
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherCity: { fontSize: 18, fontWeight: '600', color: '#1E1E1E', marginBottom: 4 },
  weatherCondition: { fontSize: 14, color: '#666666' },
  weatherTemp: { alignItems: 'flex-end' },
  temperature: { fontSize: 36, fontWeight: 'bold', color: '#4B0082' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E1E1E', marginBottom: 16 },
  outfitScroll: { flexDirection: 'row' },
  outfitCard: { marginRight: 16, alignItems: 'center' },
  outfitImage: {
    width: 90,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  outfitLabel: { fontSize: 12, color: '#1E1E1E', fontWeight: '500' },
  optionsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 120,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 13,
    color: '#1E1E1E',
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
