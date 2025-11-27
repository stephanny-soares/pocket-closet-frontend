import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, Stack, router } from "expo-router";
import colors from "../constants/colors";
import { apiRequest } from "../utils/apiClient";
import { useLoader } from "../context/LoaderContext";

export default function EditarOutfit() {
  const { id } = useLocalSearchParams();
  const { showLoader, hideLoader } = useLoader();

  const [outfit, setOutfit] = useState<any>(null);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estacion, setEstacion] = useState("");
  const [imagen, setImagen] = useState("");
  const [prendasIds, setPrendasIds] = useState<string[]>([]);

  /** Cargar outfit */
  useEffect(() => {
    cargarOutfit();
  }, [id]);

  const cargarOutfit = async () => {
    showLoader("Cargando outfit...");
    try {
      const data = await apiRequest(`/api/outfits/${id}`, { method: "GET" });

      if (!data || !data.outfit) throw new Error("Outfit no encontrado");

      setOutfit(data.outfit);
      setNombre(data.outfit.nombre || "");
      setCategoria(data.outfit.categoria || "");
      setEstacion(data.outfit.estacion || "");
      setImagen(data.outfit.imagen || "");
      setPrendasIds(data.outfit.prendas?.map((p: any) => p.id) || []);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      hideLoader();
    }
  };

  /** Guardar cambios */
  const actualizarOutfit = async () => {
    showLoader("Actualizando outfit...");

    const payload = {
      nombre,
      categoria,
      estacion,
      imagen,
      prendasIds,
    };

    try {
      await apiRequest(`/api/outfits/${id}`, {
        method: "PUT",
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
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{
            textAlign: "center",
            color: "#FFF",
            fontWeight: "700",
            fontSize: 20,
            marginBottom: 20
          }}>
            Editar Outfit
          </Text>

          {imagen ? (
            <Image source={{ uri: imagen }} style={{
              width: "100%",
              height: 220,
              borderRadius: 16,
              marginBottom: 16,
              resizeMode: "cover"
            }} />
          ) : null}

          <Text style={{ fontWeight: "600" }}>Nombre</Text>
          <TextInput style={input} value={nombre} onChangeText={setNombre} />

          <Text style={{ fontWeight: "600" }}>Categoría</Text>
          <TextInput style={input} value={categoria} onChangeText={setCategoria} />

          <Text style={{ fontWeight: "600" }}>Estación</Text>
          <TextInput style={input} value={estacion} onChangeText={setEstacion} />

          <Text style={{ fontWeight: "600" }}>URL Imagen</Text>
          <TextInput style={input} value={imagen} onChangeText={setImagen} />

          <Text style={{ fontWeight: "700", marginTop: 12 }}>Prendas del outfit</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {outfit?.prendas?.map((p: any) => (
              <Image
                key={p.id}
                source={{ uri: p.imagen }}
                style={{ width: 70, height: 70, borderRadius: 12, marginRight: 10 }}
              />
            ))}
          </ScrollView>

          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              borderRadius: 16,
              marginTop: 20,
              alignItems: "center",
            }}
            onPress={actualizarOutfit}
          >
            <Text style={{ color: "#FFF", fontWeight: "700" }}>Guardar cambios</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const input = {
  backgroundColor: "#FFF",
  padding: 12,
  borderRadius: 10,
  marginBottom: 10,
};
