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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router, Stack } from "expo-router";
import Header from "../components/Header";
import colors from "../constants/colors";
import { apiRequest } from "../utils/apiClient";
import { useLoader } from "../context/LoaderContext";

export default function CrearOutfit() {
  const { prendaId, eventoId, eventoNombre } = useLocalSearchParams();

  const { showLoader, hideLoader } = useLoader();

  const [outfit, setOutfit] = useState<any>(null);

  // Campos editables
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estacion, setEstacion] = useState("");
  const [imagen, setImagen] = useState("");

  /** AUTO-GENERACIÓN al volver desde otra pantalla */
  useEffect(() => {
    if (prendaId) generarOutfitPorPrenda(prendaId as string);
    if (eventoId && eventoNombre) {
      generarOutfitPorEvento(eventoId as string, eventoNombre as string);
    }
  }, [prendaId, eventoId]);

  /** ----------- GENERAR OUTFIT POR PRENDA ------------ */
  const generarOutfitPorPrenda = async (id: string) => {
    showLoader("Generando outfit por prenda…");
    try {
      const data = await apiRequest("/api/outfits/por-prenda", {
        method: "POST",
        body: JSON.stringify({ prendaId: id }),
      });

      if (!data || !data.outfit) {
        throw new Error(data?.message || "No se pudo generar el outfit");
      }

      cargarOutfitEnFormulario(data.outfit);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Error generando outfit");
    } finally {
      hideLoader();
    }
  };

  /** ----------- GENERAR OUTFIT POR EVENTO ------------ */
  const generarOutfitPorEvento = async (id: string, nombreEvento: string) => {
    showLoader("Generando outfit por evento…");
    try {
      const data = await apiRequest("/api/outfits/por-evento", {
        method: "POST",
        body: JSON.stringify({
          evento: nombreEvento,   // <-- BACKEND LO EXIGE
        }),
      });

      if (!data || !data.outfit) {
        throw new Error(data?.message || "No se pudo generar el outfit");
      }

      cargarOutfitEnFormulario(data.outfit);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Error generando outfit");
    } finally {
      hideLoader();
    }
  };


  /** ----------- GENERAR OUTFIT POR CLIMA ------------ */
  const generarOutfitPorClima = async () => {
    showLoader("Generando outfit por clima…");
    try {
      const data = await apiRequest("/api/outfits/sugerir", {
        method: "POST",
      });

      if (!data || !data.outfits || data.outfits.length === 0) {
        throw new Error(data?.message || "No se pudo generar el outfit");
      }

      cargarOutfitEnFormulario(data.outfits[0]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Error generando outfit");
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

    const prendasIds = outfit.prendas?.map((p: any) => p.id) ?? [];

    const payload = {
      nombre,
      categoria,
      estacion,
      imagen,
      prendasIds,
    };

    try {
      showLoader("Guardando outfit…");

      await apiRequest("/api/outfits", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      hideLoader();
      router.replace("/mis-outfits");
    } catch (err: any) {
      hideLoader();
      Alert.alert("Error", err.message || "No se pudo guardar el outfit");
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
              alert("Selecciona una prenda");
              router.push("/mi-armario?selectMode=prenda");
            }}
          >
            <Ionicons name="shirt-outline" size={24} color="#FFF" />
            <Text style={styles.optionText}>Por prenda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionBtn}
            onPress={() => router.push("/mis-eventos")}
          >
            <Ionicons name="calendar-outline" size={24} color="#FFF" />
            <Text style={styles.optionText}>Por evento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionBtn}
            onPress={generarOutfitPorClima}
          >
            <Ionicons name="cloud-outline" size={24} color="#FFF" />
            <Text style={styles.optionText}>Por clima</Text>
          </TouchableOpacity>

          {/* -------- TARJETA DEL OUTFIT -------- */}
          {outfit && (
            <View style={styles.card}>
              {imagen ? (
                <Image source={{ uri: imagen }} style={styles.cardImage} />
              ) : null}

              <Text style={styles.label}>Nombre del outfit</Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre del outfit"
              />

              <Text style={styles.label}>Categoría</Text>
              <TextInput
                style={styles.input}
                value={categoria}
                onChangeText={setCategoria}
                placeholder="casual, formal…"
              />

              <Text style={styles.label}>Estación</Text>
              <TextInput
                style={styles.input}
                value={estacion}
                onChangeText={setEstacion}
                placeholder="verano, invierno…"
              />

              <Text style={styles.label}>URL de la imagen</Text>
              <TextInput
                style={styles.input}
                value={imagen}
                onChangeText={setImagen}
                placeholder="https://…"
              />

              <Text style={styles.sectionLabel}>Prendas incluidas</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {outfit.prendas?.map((p: any) => (
                  <Image
                    key={p.id}
                    source={{ uri: p.imagen }}
                    style={styles.prendaThumb}
                  />
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.btnGuardar} onPress={guardarOutfit}>
                <Text style={styles.btnGuardarText}>Guardar outfit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setOutfit(null)}
              >
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
    shadowRadius: 8,
    elevation: 3,
  },

  cardImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
    resizeMode: "cover",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },

  prendaThumb: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 8,
  },

  btnGuardar: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },

  btnGuardarText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },

  btnCancelar: {
    backgroundColor: "#EEE",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },

  btnCancelarText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 14,
  },
});
