import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import Header from "components/Header";
import colors from "../constants/colors";
import { useLoader } from "../context/LoaderContext";
import { apiFetch } from "../utils/apiClient";

export default function AddPrenda() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [form, setForm] = useState({
    nombre: "",
    tipo: "",
    color: "",
    ocasion: "",
    estacion: "",
    imagen: "",
  });

  const [clasificando, setClasificando] = useState(false);
  const { showLoader, hideLoader } = useLoader();
  const isWeb = Platform.OS === "web";

  // ===============================================================
  //         Cargar prenda existente (modo editar)
  // ===============================================================
  useEffect(() => {
    if (!isEditing) return;

    const loadPrenda = async () => {
      try {
        showLoader("Cargando prenda...");
        const response = await apiFetch(`/api/prendas/${id}`);
        if (!response.ok) throw new Error("No se pudo cargar la prenda");

        const data = await response.json();
        const prenda = data.prenda || data;

        setForm({
          nombre: prenda.nombre || "",
          tipo: prenda.tipo || "",
          color: prenda.color || "",
          ocasion: prenda.ocasion || "",
          estacion: prenda.estacion || "",
          imagen: prenda.imagen || "",
        });
      } catch {
        Alert.alert("Error", "No se pudo cargar la prenda.");
      } finally {
        hideLoader();
      }
    };

    loadPrenda();
  }, [id]);

  // ===============================================================
  //            CLASIFICACIÓN EN WEB (usa File real)
  // ===============================================================
  async function clasificarImagenWeb(file: File) {
    setClasificando(true);
    try {
      const data = new FormData();
      data.append("archivo", file);

      const response = await apiFetch("/api/prendas/upload", {
        method: "POST",
        body: data as any,
      });

      if (!response.ok) throw new Error("Error al clasificar imagen");

      const result = await response.json();
      const prenda = result.prenda || result;

      setForm((prev) => ({
        ...prev,
        nombre: prenda.nombre ?? prev.nombre,
        tipo: prenda.tipo ?? prev.tipo,
        color: prenda.color ?? prev.color,
        ocasion: prenda.ocasion ?? prev.ocasion,
        estacion: prenda.estacion ?? prev.estacion,
        imagen: prenda.imagen,
      }));
    } catch (e) {
      Alert.alert("Error", "No se pudo clasificar la imagen.");
    } finally {
      setClasificando(false);
    }
  }

  // ===============================================================
  //        CLASIFICACIÓN ANDROID/IOS (usa URI)
  // ===============================================================
  async function clasificarImagenMovil(uri: string) {
    setClasificando(true);
    try {
      const data = new FormData();

      const filename = uri.split("/").pop() || "imagen.jpg";
      const ext = filename.split(".").pop() || "jpg";
      const type = `image/${ext}`;

      data.append("archivo", {
        uri,
        name: filename,
        type,
      } as any);

      const response = await apiFetch("/api/prendas/upload", {
        method: "POST",
        body: data as any,
      });

      if (!response.ok) throw new Error("Error al clasificar imagen");

      const result = await response.json();
      const prenda = result.prenda || result;

      setForm((prev) => ({
        ...prev,
        nombre: prenda.nombre ?? prev.nombre,
        tipo: prenda.tipo ?? prev.tipo,
        color: prenda.color ?? prev.color,
        ocasion: prenda.ocasion ?? prev.ocasion,
        estacion: prenda.estacion ?? prev.estacion,
        imagen: prenda.imagen,
      }));
    } catch {
      Alert.alert("Error", "No se pudo clasificar la imagen.");
    } finally {
      setClasificando(false);
    }
  }

  // ===============================================================
  //        Seleccionar imagen (web + móvil)
  // ===============================================================
  const seleccionarImagen = async (origen: "camera" | "gallery") => {
    if (isWeb) {
      (document as any).getElementById("fileInput")?.click();
      return;
    }

    const permiso =
      origen === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permiso.granted) {
      Alert.alert("Permiso denegado");
      return;
    }

    const result =
      origen === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });

    if (!result.canceled && result.assets?.length) {
      const pickedUri = result.assets[0].uri;
      setForm((prev) => ({ ...prev, imagen: pickedUri }));
      clasificarImagenMovil(pickedUri);
    }
  };

  // ===============================================================
  //             GUARDAR (crear / editar)
  // ===============================================================
  const handleSubmit = async () => {
    if (!form.imagen) {
      Alert.alert("Imagen requerida");
      return;
    }

    showLoader(isEditing ? "Actualizando..." : "Guardando...");

    try {
      // -------- EDITAR --------
      if (isEditing) {
        const body = JSON.stringify({
          nombre: form.nombre,
          tipo: form.tipo,
          color: form.color,
          ocasion: form.ocasion,
          estacion: form.estacion,
          imagen: form.imagen,
        });

        const response = await apiFetch(`/api/prendas/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (!response.ok) throw new Error("Error al actualizar");

        Alert.alert("Éxito", "Prenda actualizada");
        router.push("/mi-armario");
        return;
      }

      // -------- CREAR --------
      const data = new FormData();

      if (isWeb) {
        const res = await fetch(form.imagen);
        const blob = await res.blob();
        const file = new File([blob], "imagen.jpg", { type: blob.type });
        data.append("archivo", file);
      } else {
        const filename = form.imagen.split("/").pop() || "imagen.jpg";
        const ext = filename.split(".").pop() || "jpg";
        const type = `image/${ext}`;

        data.append("archivo", {
          uri: form.imagen,
          name: filename,
          type,
        } as any);
      }

      const response = await apiFetch("/api/prendas/upload", {
        method: "POST",
        body: data as any,
      });

      if (!response.ok) throw new Error("Error creando prenda");

      Alert.alert("Éxito", "Prenda creada");
      router.push("/mi-armario");
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      hideLoader();
    }
  };

  // ===============================================================
  //                          UI
  // ===============================================================
  return (
    <LinearGradient colors={colors.gradient as any} style={{ flex: 1 }}>
      <Header title={isEditing ? "Editar Prenda" : "Agregar Prenda"} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          {/* IMAGEN */}
          {form.imagen ? (
            <Image source={{ uri: form.imagen }} style={styles.image} />
          ) : (
            <View style={styles.placeholder} />
          )}

          {/* BOTONES */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.btnCamara}
              onPress={() => seleccionarImagen("camera")}
            >
              <Ionicons name="camera-outline" size={20} color="#FFF" />
              <Text style={styles.btnTextWhite}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnGaleria}
              onPress={() => seleccionarImagen("gallery")}
            >
              <Ionicons name="image-outline" size={20} color={colors.primary} />
              <Text style={styles.btnTextPrimary}>Galería</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnReclasificar}
              onPress={() => {
                if (!form.imagen) return;

                if (isWeb) {
                  fetch(form.imagen)
                    .then((r) => r.blob())
                    .then((blob) => {
                      const file = new File([blob], "imagen.jpg", {
                        type: blob.type,
                      });
                      clasificarImagenWeb(file);
                    });
                } else {
                  clasificarImagenMovil(form.imagen);
                }
              }}
            >
              <Ionicons name="refresh-outline" size={20} color="#f39100" />
              <Text style={styles.btnTextReclasificar}>Reclasificar</Text>
            </TouchableOpacity>
          </View>

          {/* FORMULARIO */}
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={form.nombre}
            onChangeText={(t) => setForm({ ...form, nombre: t })}
          />

          <TextInput
            style={styles.input}
            placeholder="Tipo"
            value={form.tipo}
            onChangeText={(t) => setForm({ ...form, tipo: t })}
          />

          <TextInput
            style={styles.input}
            placeholder="Color"
            value={form.color}
            onChangeText={(t) => setForm({ ...form, color: t })}
          />

          <TextInput
            style={styles.input}
            placeholder="Ocasión"
            value={form.ocasion}
            onChangeText={(t) => setForm({ ...form, ocasion: t })}
          />

          <TextInput
            style={styles.input}
            placeholder="Estación"
            value={form.estacion}
            onChangeText={(t) => setForm({ ...form, estacion: t })}
          />

          <TouchableOpacity style={styles.btnGuardar} onPress={handleSubmit}>
            <Text style={styles.btnGuardarText}>
              {isEditing ? "Actualizar" : "Guardar"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* INPUT FILE (WEB) */}
      {isWeb && (
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = (e.target as HTMLInputElement & { files: FileList | null }).files?.[0];
            if (!file) return;

            const localUri = URL.createObjectURL(file);

            setForm((prev) => ({ ...prev, imagen: localUri }));
            clasificarImagenWeb(file);
          }}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",   // ← RESTAURADO (Android se veía perfecto)
    paddingBottom: 40,          // ← RESTAURADO
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    resizeMode: "contain",
    backgroundColor: "#FFF",
    marginBottom: 20,
  },
  placeholder: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    backgroundColor: "#EEE",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 20,
  },
  btnCamara: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  btnGaleria: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnReclasificar: {
    flex: 1,
    backgroundColor: "#FFF8E7",
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f39100",
  },
  btnTextWhite: {
    color: "#FFF",
    fontWeight: "600",
  },
  btnTextPrimary: {
    color: colors.primary,
    fontWeight: "600",
  },
  btnTextReclasificar: {
    color: "#f39100",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  btnGuardar: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  btnGuardarText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
