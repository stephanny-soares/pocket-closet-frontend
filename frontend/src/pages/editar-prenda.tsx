// ============================================================
// EDITAR PRENDA – ESTILO MAISON
// ============================================================

import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  Alert,
  StyleSheet,
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

export default function EditarPrenda() {
  const { id } = useLocalSearchParams();
  const { showLoader, hideLoader } = useLoader();

  const [imagen, setImagen] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [color, setColor] = useState("");
  const [estacion, setEstacion] = useState("");
  const [ocasion, setOcasion] = useState("");
  const [marca, setMarca] = useState("");
  const [seccion, setSeccion] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      showLoader("Cargando prenda…");

      const data = await apiRequest(`/api/prendas/${id}`);
      const p = data.prenda;

      setImagen(p.imagen || "");
      setNombre(p.nombre || "");
      setTipo(p.tipo || "");
      setColor(p.color || "");
      setEstacion(p.estacion || "");
      setOcasion(p.ocasion || "");
      setMarca(p.marca || "");
      setSeccion(p.seccion || "");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      hideLoader();
    }
  };

  const guardarCambios = async () => {
    try {
      showLoader("Guardando cambios…");

      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("tipo", tipo);
      formData.append("color", color);
      formData.append("estacion", estacion);
      formData.append("ocasion", ocasion);
      formData.append("marca", marca);
      formData.append("seccion", seccion);

      await apiRequest(`/api/prendas/${id}`, {
        method: "PUT",
        body: formData,
        isFormData: true,
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
          <HeaderMaison />

          <View style={styles.titleBlock}>
            <TitleSerif>Editar prenda</TitleSerif>
          </View>

          <ModalKeyboardWrapper>
            <Card style={styles.card}>
              {imagen ? (
                <Image
                  source={{ uri: imagen }}
                  style={styles.img}
                  resizeMode="contain"
                />
              ) : null}

              <InputMaison label="Nombre" value={nombre} onChangeText={setNombre} />
              <InputMaison label="Tipo" value={tipo} onChangeText={setTipo} />
              <InputMaison label="Color" value={color} onChangeText={setColor} />
              <InputMaison label="Categoría / ocasión" value={ocasion} onChangeText={setOcasion} />
              <InputMaison label="Estación" value={estacion} onChangeText={setEstacion} />
              <InputMaison label="Sección" value={seccion} onChangeText={setSeccion} />
              <InputMaison label="Marca (opcional)" value={marca} onChangeText={setMarca} />

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
