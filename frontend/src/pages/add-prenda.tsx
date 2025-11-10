import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Header from "components/Header";
import colors from "../constants/colors";
import { useLoader } from "../context/LoaderContext";
import { apiFetch } from "../utils/apiClient";

export default function AddPrenda() {
  const [form, setForm] = useState({
    nombre: "",
    tipo: "",
    color: "",
    ocasion: "",
    estacion: "",
    imagen: "",
  });
  const { showLoader, hideLoader } = useLoader();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const seleccionarImagen = async (origen: "camera" | "gallery") => {
    try {
      const permiso =
        origen === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert("Permiso denegado", "No se puede acceder a la cámara o galería.");
        return;
      }

      const result =
        origen === "camera"
          ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri;
        setForm((prev) => ({ ...prev, imagen: uri }));
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo abrir la cámara o galería.");
    }
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.tipo || !form.color || !form.imagen) {
      Alert.alert("Campos incompletos", "Por favor, completa los campos requeridos.");
      return;
    }

    showLoader("Guardando prenda...");

    try {
      const data = new FormData();
      data.append("nombre", form.nombre);
      data.append("tipo", form.tipo);
      data.append("color", form.color);
      data.append("ocasion", form.ocasion);
      data.append("estacion", form.estacion);

      if (form.imagen) {
        const filename = form.imagen.split("/").pop() || "imagen.jpg";
        const ext = filename.split(".").pop() || "jpg";
        const type = `image/${ext}`;

        data.append("imagen", {
          uri: form.imagen,
          name: filename,
          type,
        } as any);
      }

      const response = await apiFetch("/api/prendas", {
        method: "POST",
        body: data as any,
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar la prenda");
      }

      Alert.alert("Éxito", "Prenda guardada correctamente");
      router.push("/mi-armario");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo guardar la prenda");
    } finally {
      hideLoader();
    }
  };

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Header title="Agregar Prenda" />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 📱 Responsive wrapper */}
        <View
          style={[
            styles.formContainer,
            isWeb && { maxWidth: 500, alignSelf: "center", width: "90%" },
          ]}
        >
          {/* Botones de cámara y galería */}
          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: colors.primary }]}
              onPress={() => seleccionarImagen("camera")}
            >
              <Ionicons name="camera-outline" size={20} color="#FFF" />
              <Text style={styles.imageButtonText}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: "#FFF", borderColor: colors.primary, borderWidth: 1 }]}
              onPress={() => seleccionarImagen("gallery")}
            >
              <Ionicons name="image-outline" size={20} color={colors.primary} />
              <Text style={[styles.imageButtonText, { color: colors.primary }]}>Galería</Text>
            </TouchableOpacity>
          </View>

          {/* Imagen seleccionada */}
          {form.imagen ? (
            <Image source={{ uri: form.imagen }} style={styles.imagePreview} />
          ) : null}

          {/* Inputs */}
          <TextInput
            placeholder="Nombre de la prenda"
            style={styles.input}
            value={form.nombre}
            onChangeText={(v) => setForm({ ...form, nombre: v })}
          />

          <TextInput
            placeholder="Tipo (camiseta, pantalón...)"
            style={styles.input}
            value={form.tipo}
            onChangeText={(v) => setForm({ ...form, tipo: v })}
          />

          <TextInput
            placeholder="Color"
            style={styles.input}
            value={form.color}
            onChangeText={(v) => setForm({ ...form, color: v })}
          />

          <TextInput
            placeholder="Categoría / ocasión (casual, trabajo, fiesta...)"
            style={styles.input}
            value={form.ocasion}
            onChangeText={(v) => setForm({ ...form, ocasion: v })}
          />

          <TextInput
            placeholder="Estación (verano, invierno, todas...)"
            style={styles.input}
            value={form.estacion}
            onChangeText={(v) => setForm({ ...form, estacion: v })}
          />

          <TouchableOpacity
            style={[
              styles.saveButton,
              isWeb && { alignSelf: "center", width: "60%", maxWidth: 400 },
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.saveButtonText}>Guardar Prenda</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: "center", paddingBottom: 40 },
  formContainer: { paddingHorizontal: 16, paddingVertical: 20 },
  imageButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  imageButtonText: {
    fontWeight: "600",
    color: "#FFF",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: "cover",
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
