// ============================================================
// EDITAR OUTFIT – ESTILO MAISON v2 (igual que Add-Prenda)
// ============================================================

import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import colors from "../constants/colors";
import HeaderMaison from "../components/Header";
import TitleSerif from "../components/ui/TitleSerif";
import InputMaison from "../components/ui/InputMaison";
import PrimaryButton from "../components/ui/PrimaryButton";
import Card from "../components/ui/Card";
import { apiRequest } from "../utils/apiClient";
import { useLoader } from "../context/LoaderContext";
import ModalKeyboardWrapper from "../components/ui/ModalKeyboardWrapper";

export default function EditarOutfit() {
  const { id } = useLocalSearchParams();
  const { showLoader, hideLoader } = useLoader();

  const [outfit, setOutfit] = useState<any>(null);

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estacion, setEstacion] = useState("");
  const [imagen, setImagen] = useState("");

  // Cargar outfit existente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      showLoader("Cargando outfit…");

      const data = await apiRequest(`/api/outfits/${id}`);
      const o = data.outfit;

      setOutfit(o);
      setNombre(o.nombre);
      setCategoria(o.categoria);
      setEstacion(o.estacion);
      setImagen(o.imagen);

    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      hideLoader();
    }
  };

  const guardarCambios = async () => {
    try {
      showLoader("Guardando cambios…");

      await apiRequest(`/api/outfits/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          nombre,
          categoria,
          estacion,
          imagen,
        }),
      });

      hideLoader();
      router.back();
    } catch (err: any) {
      hideLoader();
      Alert.alert("Error", err.message);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        
          {/* HEADER */}
          <HeaderMaison />

          {/* TÍTULO */}
          <View style={styles.titleBlock}>
            <TitleSerif>Editar outfit</TitleSerif>
          </View>

          <ModalKeyboardWrapper>
            
            <Card style={styles.card}>

              {/* Imagen principal o de la prenda 1 (fallback tipo Home) */}
              {imagen || outfit?.prendas?.[0]?.imagen ? (
                <Image
                  source={{ uri: imagen || outfit.prendas[0].imagen }}
                  style={styles.img}
                  resizeMode="contain"
                />
              ) : null}

              <InputMaison label="Nombre del outfit" value={nombre} onChangeText={setNombre} />
              <InputMaison label="Categoría" value={categoria} onChangeText={setCategoria} />
              <InputMaison label="Estación" value={estacion} onChangeText={setEstacion} />
              <InputMaison label="URL imagen" value={imagen} onChangeText={setImagen} />

              <PrimaryButton
                text="Guardar cambios"
                onPress={guardarCambios}
                style={{ marginTop: 20 }}
              />
            </Card>

          </ModalKeyboardWrapper>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  titleBlock: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 6,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  card: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    marginTop: 20,
  },

  img: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: "#F3F3F3",
    ...(Platform.OS === "web" && { objectFit: "contain" }),
  },

});
