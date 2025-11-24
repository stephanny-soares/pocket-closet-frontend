import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router, Stack } from "expo-router";
import Header from "components/Header";
import colors from "../constants/colors";
import { apiRequest } from "../utils/apiClient";
import { useLoader } from "../context/LoaderContext";

export default function CrearOutfit() {
  const { prendaId, eventoId } = useLocalSearchParams<{
    prendaId?: string;
    eventoId?: string;
  }>();

  const { showLoader, hideLoader } = useLoader();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [outfit, setOutfit] = useState<any>(null);

  // Campos editables
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estacion, setEstacion] = useState("");
  const [imagen, setImagen] = useState("");

  /** AUTO-GENERACIÓN al volver desde otra pantalla */
  useEffect(() => {
    if (prendaId) generarOutfitPorPrenda(prendaId);
    if (eventoId) generarOutfitPorEvento(eventoId);
  }, [prendaId, eventoId]);

  /** ----------- GENERAR OUTFIT POR PRENDA ------------ */
  const generarOutfitPorPrenda = async (id: string) => {
    showLoader("Generando outfit por prenda...");
    try {
      const data = await apiRequest<{ outfit: any }>("/api/outfits/por-prenda", {
        method: "POST",
        body: JSON.stringify({ prendaId: id }),
      });

      cargarOutfitEnFormulario(data.outfit || data);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      hideLoader();
    }
  };

  /** ----------- GENERAR OUTFIT POR EVENTO ------------ */
  const generarOutfitPorEvento = async (id: string) => {
    showLoader("Generando outfit por evento...");
    try {
      const data = await apiRequest<{ outfit: any }>("/api/outfits/por-evento", {
        method: "POST",
        body: JSON.stringify({ eventoId: id }),
      });

      cargarOutfitEnFormulario(data.outfit || data);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      hideLoader();
    }
  };

  /** ----------- GENERAR OUTFIT POR CLIMA ------------ */
  const generarOutfitPorClima = async () => {
    showLoader("Generando outfit por clima...");
    try {
      const data = await apiRequest<{ outfit: any }>("/api/outfits/sugerir", {
        method: "POST",
      });

      cargarOutfitEnFormulario(data.outfit || data.outfit?.[0] || data);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      hideLoader();
    }
  };

  /** Cargar outfit en el formulario editable */
  const cargarOutfitEnFormulario = (o: any) => {
    setOutfit(o);
    setNombre(o.nombre || "");
    setCategoria(o.categoria || "");
    setEstacion(o.estacion || "");
    setImagen(o.imagen || "");
  };

  /** ----------- GUARDAR OUTFIT FINAL ------------ */
  const guardarOutfit = async () => {
    if (!outfit) return;

    showLoader("Guardando outfit...");

    try {
      const payload = {
        ...outfit,
        nombre,
        categoria,
        estacion,
        imagen,
      };

      await apiRequest("/api/outfits", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      hideLoader();
      router.replace("/mis-outfits");
    } catch (err: any) {
      hideLoader();
      Alert.alert("Error", err.message || "No se pudo guardar");
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={colors.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Header title="Crear Outfit" />

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
            paddingTop: 20,
          }}
        >
          <Text style={styles.subtitle}>Elige cómo quieres crear tu outfit</Text>

          {/* -------- BOTONES PRINCIPALES -------- */}
          <TouchableOpacity
            style={styles.optionBtn}
            onPress={() => {
              Alert.alert("Selecciona prenda");
              router.push("/mi-armario");
            }}
          >
            <Ionicons name="shirt-outline" size={24} color="#FFF" />
            <Text style={styles.optionText}>Por prenda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionBtn}
            onPress={() => {
              Alert.alert("Selecciona evento");
              router.push("/mis-eventos");
            }}
          >
            <Ionicons name="calendar-outline" size={24} color="#FFF" />
            <Text style={styles.optionText}>Por evento</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionBtn} onPress={generarOutfitPorClima}>
            <Ionicons name="cloud-outline" size={24} color="#FFF" />
            <Text style={styles.optionText}>Por clima</Text>
          </TouchableOpacity>

          {/* -------- TARJETA CON FORMULARIO EDITABLE -------- */}
          {outfit && (
            <View style={styles.card}>
              <Image source={{ uri: imagen }} style={styles.cardImage} />

              {/* NOMBRE */}
              <Text style={styles.label}>Nombre del outfit</Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre del outfit"
              />

              {/* CATEGORÍA */}
              <Text style={styles.label}>Categoría</Text>
              <TextInput
                style={styles.input}
                value={categoria}
                onChangeText={setCategoria}
                placeholder="casual, formal…"
              />

              {/* ESTACIÓN */}
              <Text style={styles.label}>Estación</Text>
              <TextInput
                style={styles.input}
                value={estacion}
                onChangeText={setEstacion}
                placeholder="verano, invierno…"
              />

              {/* IMAGEN */}
              <Text style={styles.label}>URL de la imagen</Text>
              <TextInput
                style={styles.input}
                value={imagen}
                onChangeText={setImagen}
                placeholder="https://..."
              />

              {/* PRENDAS INCLUIDAS */}
              <Text style={styles.sectionLabel}>Prendas incluidas</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {outfit.prendas?.map((p: any) => (
                  <Image key={p.id} source={{ uri: p.imagen }} style={styles.prendaThumb} />
                ))}
              </ScrollView>

              {/* -------- BOTONES -------- */}
              <TouchableOpacity style={styles.btnGuardar} onPress={guardarOutfit}>
                <Text style={styles.btnGuardarText}>Guardar outfit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnCancelar} onPress={() => setOutfit(null)}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },

  subtitle: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 20,
  },

  optionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  optionText: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginTop: 30,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },

  cardImage: {
    width: "100%",
    height: 250,
    borderRadius: 16,
    marginBottom: 16,
  },

  label: {
    fontWeight: "600",
    fontSize: 14,
    marginTop: 10,
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#EFEFEF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },

  sectionLabel: {
    marginTop: 20,
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 10,
  },

  prendaThumb: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: "#DDD",
  },

  btnGuardar: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  btnGuardarText: {
    textAlign: "center",
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },

  btnCancelar: {
    backgroundColor: "#DDD",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
    marginBottom: 10,
  },
  btnCancelarText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#444",
  },
});
