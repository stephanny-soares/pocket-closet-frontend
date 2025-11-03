import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Header from '../components/Header';
import colors from '../constants/colors';

interface Weather {
  temperature: number;
  condition: string;
  icon: string;
}

export default function Home() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [userName, setUserName] = useState('Usuario');

  useEffect(() => {
    fetchWeather();
    const storedName = typeof localStorage !== 'undefined' ? localStorage.getItem('userName') : null;
    setUserName(storedName || 'Usuario');
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
        48: { condition: 'Niebla', icon: 'cloud' },
        51: { condition: 'Lluvia ligera', icon: 'rainy' },
        61: { condition: 'Lluvia', icon: 'rainy' },
        80: { condition: 'Lluvia fuerte', icon: 'rainy' },
        95: { condition: 'Tormenta', icon: 'thunderstorm' },
      };

      const weather = weatherMap[code] || { condition: 'Desconocido', icon: 'cloud' };
      setWeather({ temperature: temp, ...weather });
    } catch (error) {
      setWeather({ temperature: 22, condition: 'No disponible', icon: 'cloud' });
    }
  };

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient as any}
    >
      <ScrollView style={styles.scroll as any}>
        <Header title="PocketCloset" transparent={true} />
        <View style={styles.container as any}>
          <Text style={styles.greeting as any}>¡Hola {userName}! 👋</Text>

          <View style={styles.weatherCard as any}>
            <View style={styles.weatherContent as any}>
              <View>
                <Text style={styles.weatherCity as any}>Alicante</Text>
                <Text style={styles.weatherCondition as any}>{weather?.condition || 'Cargando...'}</Text>
              </View>
              <View style={styles.weatherTemp as any}>
                <Text style={styles.temperature as any}>{weather?.temperature}°</Text>
              </View>
            </View>
          </View>

          <View style={styles.section as any}>
            <Text style={styles.sectionTitle as any}>Tus outfits para hoy 👕</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.outfitScroll as any}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.outfitCard as any}>
                  <View style={styles.outfitImage as any} />
                  <Text style={styles.outfitLabel as any}>Outfit {i}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section as any}>
            <Text style={styles.sectionTitle as any}>Acceso rápido</Text>
            <View style={styles.optionsContainer as any}>
              <TouchableOpacity 
                style={styles.optionButton as any}
                onPress={() => handleNavigate('/mi-armario')}
              >
                <Ionicons name="shirt" size={32} color="#4B0082" />
                <Text style={styles.optionText as any}>Mi Armario</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.optionButton as any}
                onPress={() => handleNavigate('/mis-outfits')}
              >
                <Ionicons name="images" size={32} color="#4B0082" />
                <Text style={styles.optionText as any}>Mis Outfits</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.optionButton as any}
                onPress={() => handleNavigate('/agregar')}
              >
                <Ionicons name="add-circle" size={32} color="#4B0082" />
                <Text style={styles.optionText as any}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  } as any,
  scroll: {
    flex: 1,
  } as any,
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  } as any,
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginTop: 24,
    marginBottom: 20,
    textAlign: 'center' as any,
  } as any,
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
  } as any,
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as any,
  weatherCity: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 4,
  } as any,
  weatherCondition: {
    fontSize: 14,
    color: '#666666',
  } as any,
  weatherTemp: {
    alignItems: 'flex-end',
  } as any,
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4B0082',
  } as any,
  section: {
    marginBottom: 24,
  } as any,
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 16,
  } as any,
  outfitScroll: {
    flexDirection: 'row',
  } as any,
  outfitCard: {
    marginRight: 16,
    alignItems: 'center',
  } as any,
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
  } as any,
  outfitLabel: {
    fontSize: 12,
    color: '#1E1E1E',
    fontWeight: '500',
  } as any,
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  } as any,
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
  } as any,
  optionText: {
    fontSize: 13,
    color: '#1E1E1E',
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center' as any,
  } as any,
});
