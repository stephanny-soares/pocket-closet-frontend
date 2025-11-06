import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Header from 'components/Header';
import colors from '../constants/colors';
import { storage } from '../utils/storage';
import { logEvent } from "../logger/logEvent";


const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

interface Prenda {
  id: string;
  nombre: string;
  tipo: string;
  color: string;
  imagen: string;
  ocasion?: string;
  estacion?: string;
  marca?: string;
  createdAt: string;
}

export default function MiArmario() {
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('todas');

  useEffect(() => {
    cargarPrendas();
  }, []);

  const cargarPrendas = async () => {
    try {
      setLoading(true);
      const token = await storage.getItem('authToken');

      if (!token) {
        Alert.alert('Error', 'Token no encontrado. Por favor, inicia sesión.');
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/api/prendas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data: any = await response.json();

      if (response.ok && data.prendas) {
        setPrendas(data.prendas);
      } else {
        Alert.alert('Error', data.error || 'No se pudieron cargar las prendas');
      }
    } catch (error) {
      console.error('Error al cargar prendas:', error);
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarPrenda = (id: string, nombre: string) => {
    Alert.alert('Eliminar prenda', `¿Estás seguro de que quieres eliminar "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        onPress: async () => {
          try {
            const token = await storage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${API_BASE}/api/prendas/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
             setPrendas(prendas.filter((p) => p.id !== id));
             Alert.alert('Éxito', 'Prenda eliminada correctamente');

              await logEvent({
                event: "ItemDeleted",
                message: `Prenda eliminada: ${nombre}`,
                 level: "info",
                 extra: { prendaId: id, nombre },
              });

             cargarPrendas();
            }
            else {
            await logEvent({
              event: "ItemDeleteFailed",
              message: "No se pudo eliminar la prenda",
              level: "warn",
              extra: { prendaId: id },
            });
              Alert.alert('Error', 'No se pudo eliminar la prenda');
            }
          } catch (error: any) {
            await logEvent({
              event: "ItemDeleteFailed",
              message: error?.message || "Error al eliminar prenda",
              level: "warn",
              extra: { prendaId: id },
            });
            Alert.alert('Error', 'Error al eliminar la prenda');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const prendasFiltradas =
    filtro === 'todas'
      ? prendas
      : prendas.filter((p) => p.tipo.toLowerCase() === filtro.toLowerCase());

  const renderPrenda = ({ item }: { item: Prenda }) => (
    <View style={styles.prendaCard}>
      <Image source={{ uri: item.imagen }} style={styles.prendaImagen} />
      <View style={styles.prendaInfo}>
        <Text style={styles.prendaNombre}>{item.nombre}</Text>
        <View style={styles.prendaDetalles}>
          <Text style={styles.detalle}>📌 {item.tipo}</Text>
          {item.ocasion && <Text style={styles.detalle}>📅 {item.ocasion}</Text>}
        </View>
      </View>
      <View style={styles.prendaAcciones}>
        <TouchableOpacity
          style={styles.btnAccion}
          onPress={() =>
            router.push({
              pathname: '/editar-prenda/[id]' as any,
              params: { id: item.id },
            })
          }
          activeOpacity={0.6}
        >
          <Text style={styles.btnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="delete-button"
          style={[styles.btnAccion, { backgroundColor: '#FFE5E5' }]}
          onPress={() => handleEliminarPrenda(item.id, item.nombre)}
          activeOpacity={0.6}
        >
          <Text style={styles.btnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ScrollView style={styles.scroll} scrollEnabled={false}>
        <Header title="Mi Armario" />

        {/* Botón Agregar Prenda */}
        <View style={styles.headerAccion}>
          <TouchableOpacity
            style={styles.btnAgregar}
            onPress={() => router.push('/agregar-prenda')}
          >
            <Text style={styles.btnAgregarEmoji}>➕</Text>
            <Text style={styles.btnAgregarText}>Agregar Prenda</Text>
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll}>
          {['todas', 'camiseta', 'pantalón', 'falda', 'vestido', 'chaqueta', 'zapatos'].map((tipo) => (
            <TouchableOpacity
              key={tipo}
              style={[
                styles.filtroBtn,
                filtro === tipo && styles.filtroBtnActive,
              ]}
              onPress={() => setFiltro(tipo)}
            >
              <Text
                style={[
                  styles.filtroBtnText,
                  filtro === tipo && styles.filtroBtnTextActive,
                ]}
              >
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de Prendas */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4B0082" />
            <Text style={styles.loadingText}>Cargando prendas...</Text>
          </View>
        ) : prendasFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTextLarge}>👕</Text>
            <Text style={styles.emptyText}>No tienes prendas aún</Text>
            <TouchableOpacity
              style={styles.btnAgregarEmpty}
              onPress={() => router.push('/agregar-prenda')}
            >
              <Text style={styles.btnAgregarEmptyText}>Agregar primera prenda</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={prendasFiltradas}
            renderItem={renderPrenda}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  headerAccion: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  btnAgregar: {
    backgroundColor: '#4B0082',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    gap: 8,
  },
  btnAgregarEmoji: { fontSize: 20 },
  btnAgregarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  filtrosScroll: { paddingHorizontal: 16, paddingVertical: 12 },
  filtroBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  filtroBtnActive: { backgroundColor: '#4B0082', borderColor: '#4B0082' },
  filtroBtnText: { color: '#666666', fontSize: 13, fontWeight: '500' },
  filtroBtnTextActive: { color: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 },
  loadingText: { marginTop: 12, color: '#666666', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 },
  emptyTextLarge: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#999999', marginBottom: 20 },
  btnAgregarEmpty: {
    backgroundColor: '#4B0082',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnAgregarEmptyText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  prendaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  prendaImagen: { width: 100, height: 100, backgroundColor: '#F0F0F0' },
  prendaInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  prendaNombre: { fontSize: 15, fontWeight: '600', color: '#1E1E1E', marginBottom: 8 },
  prendaDetalles: { gap: 4 },
  detalle: { fontSize: 12, color: '#666666' },
  prendaAcciones: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flexDirection: 'column',
  },
  btnAccion: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { fontSize: 18 },
});
