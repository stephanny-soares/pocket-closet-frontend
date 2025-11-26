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
import { useLoader } from "../context/LoaderContext";

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

  /** =============== CÁMARA Y GALERÍA ================= */

  const abrirCamara = async () => {
    try {
      setSourceType("camera");

      if (Platform.OS !== "web") {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) {
          Alert.alert(
            "Permiso requerido",
            "Activa el acceso a la cámara para hacer fotos."
          );
          return;
        }
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!res.canceled) {
        await procesarImagen(res.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo abrir la cámara");
    }
  };

  const abrirGaleria = async () => {
    try {
      setSourceType("gallery");

      if (Platform.OS !== "web") {
        const permiso =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permiso.granted) {
          Alert.alert(
            "Permiso requerido",
            "Activa el acceso a tus fotos para seleccionar una imagen."
          );
          return;
        }
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!res.canceled) {
        await procesarImagen(res.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo abrir la galería");
    }
  };

  /** =============== PROCESAR IMAGEN CON IA ================= */

  const procesarImagen = async (uri: string) => {
    try {
      showLoader("Analizando prenda...");

      const form = new FormData();

      if (Platform.OS === "web") {
        // ----- WEB FIX -----
        const response = await fetch(uri);
        const blob = await response.blob();

        const file = new File([blob], "prenda.jpg", { type: blob.type });
        form.append("archivo", file);
      } else {
        // ----- ANDROID / iOS -----
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

      const { urlImagen, clasificacion } = data;

      setImagen(urlImagen);
      setClasificacion(clasificacion);

      setNombre(clasificacion.nombre || "");
      setTipo(clasificacion.tipo || "");
      setColor(clasificacion.color || "");
      setEstacion(clasificacion.estacion || "");
      setOcasion(clasificacion.ocasion || "");
      setSeccion(clasificacion.seccion || "");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      hideLoader();
    }
  };


  /** =============== GUARDAR PRENDA ================= */

  const guardarPrenda = async () => {
    if (!imagen) {
      Alert.alert("Falta la imagen", "Primero sube o haz una foto de la prenda.");
      return;
    }

    try {
      showLoader("Guardando prenda...");

      await apiRequest("/api/prendas", {
        method: "POST",
        body: {
          imagen,
          nombre,
          tipo,
          color,
          estacion,
          ocasion,
          marca,
          seccion,
        } as any,
      });

      hideLoader();
      router.replace("/mi-armario");
    } catch (err: any) {
      hideLoader();
      Alert.alert("Error", err.message || "No se pudo guardar la prenda");
    }
  };

  /** =============== CAMPOS PARA EL FORM ================= */

  const fields: {
    label: string;
    placeholder: string;
    value: string;
    setter: React.Dispatch<React.SetStateAction<string>>;
  }[] = [
    {
      label: "Nombre de la prenda",
      placeholder: "Ej: Camiseta básica blanca",
      value: nombre,
      setter: setNombre,
    },
    {
      label: "Tipo",
      placeholder: "Tipo (camiseta, pantalón...)",
      value: tipo,
      setter: setTipo,
    },
    {
      label: "Color",
      placeholder: "Color",
      value: color,
      setter: setColor,
    },
    {
      label: "Categoría / ocasión",
      placeholder: "casual, trabajo, fiesta...",
      value: ocasion,
      setter: setOcasion,
    },
    {
      label: "Estación",
      placeholder: "verano, invierno, todas...",
      value: estacion,
      setter: setEstacion,
    },
    {
      label: "Sección",
      placeholder: "superior, inferior, calzado...",
      value: seccion,
      setter: setSeccion,
    },
    {
      label: "Marca (opcional)",
      placeholder: "marca, si quieres guardarla",
      value: marca,
      setter: setMarca,
    },
  ];

  const cameraActive = sourceType === "camera";
  const galleryActive = sourceType === "gallery";

  /** =================== RENDER =================== */

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={colors.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <Header title="Agregar Prenda" />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && { alignItems: "center" },
          ]}
        >
          <View style={[styles.mainCard, isWeb && { width: 650 }]}>
            {/* Banner IA */}
            <View style={styles.infoBanner}>
              <Ionicons
                name="sparkles-outline"
                size={18}
                color="#17803E"
              />
              <Text style={styles.infoBannerText}>
                La IA clasificará tu prenda automáticamente
              </Text>
            </View>

            {/* Botones cámara / galería */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  cameraActive && styles.uploadBtnActive,
                ]}
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
                style={[
                  styles.uploadBtn,
                  galleryActive && styles.uploadBtnActive,
                ]}
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

            {/* Vista previa de la imagen */}
            {imagen ? (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: imagen }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}


            {/* Formulario */}
            {fields.map((f, i) => (
              <View key={i} style={styles.fieldBlock}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor="#B0B0B0"
                  value={f.value}
                  onChangeText={f.setter}
                />
              </View>
            ))}

            {/* Botón guardar */}
            <TouchableOpacity style={styles.saveBtn} onPress={guardarPrenda}>
              <Text style={styles.saveBtnText}>Guardar Prenda</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  mainCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E4F7E8",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  infoBannerText: {
    marginLeft: 8,
    color: "#17803E",
    fontWeight: "600",
    fontSize: 13,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  uploadBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: "#FFF",
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  uploadBtnActive: {
    backgroundColor: colors.primary,
  },
  uploadBtnText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  uploadBtnTextActive: {
    color: "#FFF",
  },
  imageWrapper: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    overflow: "hidden",
  },

  previewImage: {
    width: "100%",
    height: 260,        // Ajusta según lo que prefieras: 220 / 260 / 300
    borderRadius: 12,
  },

  fieldBlock: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    fontSize: 14,
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
