// ===============================
// ADD-PRENDA – ESTILO MAISON v2
// Ajustado: texto negro, card tipo Mi-Armario,
// layout web centrado y limpio
// ===============================

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  useWindowDimensions,
  Platform,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { apiRequest } from "../utils/apiClient";
import colors from "../constants/colors";
import Header from "components/Header";
import PrimaryButton from "components/ui/PrimaryButton";
import { useLoader } from "../context/LoaderContext";
import TitleSerif from "components/ui/TitleSerif";


interface UploadResponse {
  ok: boolean;
  urlImagen: string;
  clasificacion: {
    nombre: string;
    tipo: string;
    color: string;
    estacion: string;
    ocasion: string;
    seccion: string;
  };
}

type SourceType = "camera" | "gallery" | null;

export default function AddPrenda() {
  const { showLoader, hideLoader } = useLoader();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [imagen, setImagen] = useState<string>("");
  const [clasificacion, setClasificacion] = useState<any>(null);
  const [sourceType, setSourceType] = useState<SourceType>(null);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [color, setColor] = useState("");
  const [estacion, setEstacion] = useState("");
  const [ocasion, setOcasion] = useState("");
  const [marca, setMarca] = useState("");
  const [seccion, setSeccion] = useState("");

  /* -------------------- Cámara -------------------- */

  const abrirCamara = async () => {
    try {
      setSourceType("camera");

      if (Platform.OS !== "web") {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) {
          Alert.alert("Permiso requerido", "Activa el acceso a la cámara.");
          return;
        }
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!res.canceled) await procesarImagen(res.assets[0].uri);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  /* -------------------- Galería -------------------- */

  const abrirGaleria = async () => {
    try {
      setSourceType("gallery");

      if (Platform.OS !== "web") {
        const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permiso.granted) {
          Alert.alert("Permiso requerido", "Activa el acceso a tus fotos.");
          return;
        }
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!res.canceled) await procesarImagen(res.assets[0].uri);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  /* -------------------- Procesar imagen con IA -------------------- */

  const procesarImagen = async (uri: string) => {
    try {
      showLoader("Analizando prenda...");

      const form = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], "prenda.jpg", { type: blob.type });
        form.append("archivo", file);
      } else {
        form.append("archivo", {
          uri,
          name: "prenda.jpg",
          type: "image/jpeg",
        } as any);
      }

      const data = await apiRequest<UploadResponse>("/api/prendas/upload", {
        method: "POST",
        body: form,
      });

      setImagen(data.urlImagen);
      setClasificacion(data.clasificacion);

      // Autorrellenados
      setNombre(data.clasificacion.nombre || "");
      setTipo(data.clasificacion.tipo || "");
      setColor(data.clasificacion.color || "");
      setEstacion(data.clasificacion.estacion || "");
      setOcasion(data.clasificacion.ocasion || "");
      setSeccion(data.clasificacion.seccion || "");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      hideLoader();
    }
  };

  /* -------------------- Guardar prenda -------------------- */

  const guardarPrenda = async () => {
    if (!imagen) {
      Alert.alert("Falta la imagen", "Sube o haz una foto de la prenda.");
      return;
    }

    try {
      showLoader("Guardando prenda...");

      await apiRequest("/api/prendas", {
        method: "POST",
        body: JSON.stringify({
          imagen,
          nombre,
          tipo,
          color,
          estacion,
          ocasion,
          marca,
          seccion,
        }),
      });

      hideLoader();
      router.replace("/mi-armario");
    } catch (err: any) {
      hideLoader();
      Alert.alert("Error", err.message);
    }
  };

  /* -------------------- Campos del formulario -------------------- */

  const fields = [
    { label: "Nombre de la prenda", value: nombre, setter: setNombre, placeholder: "Ej: Camiseta blanca" },
    { label: "Tipo", value: tipo, setter: setTipo, placeholder: "camiseta, pantalón..." },
    { label: "Color", value: color, setter: setColor, placeholder: "beige, negro..." },
    { label: "Categoría / ocasión", value: ocasion, setter: setOcasion, placeholder: "casual, fiesta..." },
    { label: "Estación", value: estacion, setter: setEstacion, placeholder: "verano, invierno..." },
    { label: "Sección", value: seccion, setter: setSeccion, placeholder: "superior, inferior..." },
    { label: "Marca (opcional)", value: marca, setter: setMarca, placeholder: "marca..." },
  ];

  const cameraActive = sourceType === "camera";
  const galleryActive = sourceType === "gallery";

  /* ============================================================
   *   RENDER UI MAISON
   * ============================================================ */

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
        
        <Header />
        <View style={[styles.titleBlock, isWeb && { width: 650, alignSelf: "center" }]}>
          <TitleSerif style={{ textAlign: "left" }}>Agregar prenda</TitleSerif>
        </View>

        {/* ========= CONTENIDO ========= */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.mainCard, isWeb && { width: 650, alignSelf: "center" }]}>

            {/* Banner IA (texto negro) */}
            <View style={styles.infoBanner}>
              <Ionicons name="sparkles-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.infoBannerText}>
                La IA analizará y completará tus datos automáticamente.
              </Text>
            </View>

            {/* Botones cámara / galería */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.uploadBtn, cameraActive && styles.uploadBtnActive]}
                onPress={abrirCamara}
              >
                <Ionicons
                  name="camera-outline"
                  size={20}
                  color={cameraActive ? "#FFF" : colors.primary}
                />
                <Text
                  style={[
                    styles.uploadBtnText,
                    cameraActive && styles.uploadBtnTextActive,
                  ]}
                >
                  Cámara
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadBtn, galleryActive && styles.uploadBtnActive]}
                onPress={abrirGaleria}
              >
                <Ionicons
                  name="image-outline"
                  size={20}
                  color={galleryActive ? "#FFF" : colors.primary}
                />
                <Text
                  style={[
                    styles.uploadBtnText,
                    galleryActive && styles.uploadBtnTextActive,
                  ]}
                >
                  Galería
                </Text>
              </TouchableOpacity>
            </View>

            {/* Imagen */}
            {imagen && (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: imagen }} style={styles.previewImage} resizeMode="contain" />
              </View>
            )}

            {/* FORM */}
            {fields.map((f, i) => (
              <View key={i} style={styles.fieldBlock}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.value}
                  onChangeText={f.setter}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ))}

            {/* BOTONES FINALES */}
            <View style={styles.bottomButtonsRow}>
              {/* BOTÓN AGREGAR */}
              <PrimaryButton
                text="Agregar prenda"
                onPress={guardarPrenda}
                style={styles.btnLeft}
              />

              {/* BOTÓN CANCELAR */}
              <PrimaryButton
                text="Cancelar"
                onPress={() => router.back()}
                variant="secondary"
                style={styles.btnRight}
              />
            </View>

          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </LinearGradient>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    paddingTop: 10,
  },

  /* CONTENEDOR HEADER EN WEB PARA CENTRAR */
  headerWrapper: {
    width: "100%",
    alignItems: "center",
  },

  headerTopRow: {
    width: "100%",
    maxWidth: 650,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 26,
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  backButton: {
    backgroundColor: colors.card,
    padding: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  profileButton: {
    padding: 4,
  },

  titleBlock: {
    width: "100%",
    maxWidth: 650,
    paddingHorizontal: 20,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  /* CARD → estilo Mi-Armario */
  mainCard: {
    backgroundColor: colors.card,
    borderRadius: 26,
    padding: 22,
    shadowColor: colors.shadowColor,
    shadowOffset: colors.shadowOffset,
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: colors.shadowRadius,
    elevation: colors.elevation,
  },

  /* Banner IA negro */
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 18,
  },

  infoBannerText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  /* Buttons */
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },

  uploadBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 18,
    borderColor: colors.primary,
    paddingVertical: 12,
    backgroundColor: colors.card,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  uploadBtnActive: {
    backgroundColor: colors.primary,
  },

  uploadBtnText: {
    color: colors.primary,
    fontWeight: "700",
  },

  uploadBtnTextActive: {
    color: "#FFF",
  },

  /* Imagen */
  imageWrapper: {
    width: "100%",
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
  },

  previewImage: {
    width: "100%",
    height: 260,
    borderRadius: 14,
  },

  /* Form */
  fieldBlock: {
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 5,
  },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
  },

  /* Save */
  saveBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },

  saveBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  bottomButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
  },

  btnLeft: {
    flex: 1,
  },

  btnRight: {
    flex: 1,
  },

});
