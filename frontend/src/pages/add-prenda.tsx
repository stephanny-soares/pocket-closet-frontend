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
  useWindowDimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import Header from "components/Header";
import colors from "../constants/colors";
import { useLoader } from "../context/LoaderContext";
import { apiFetch, API_BASE } from "../utils/apiClient";
import { storage } from "../utils/storage";

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
  const [clasificacionPrevia, setClasificacionPrevia] = useState(false);

  const { showLoader, hideLoader } = useLoader();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  // 🧩 Cargar datos si estamos en modo edición
  useEffect(() => {
    if (!isEditing) return;
    const fetchPrenda = async () => {
      try {
        showLoader("Cargando prenda...");
        const response = await apiFetch(`/api/prendas/${id}`);
        if (!response.ok) throw new Error("No se pudo cargar la prenda");
        
        const data: any = await response.json();
        const prenda = data.prenda || data;

        setForm({
         nombre: prenda.nombre || "",
         tipo: prenda.tipo || "",
         color: prenda.color || "",
         ocasion: prenda.ocasion || "",
         estacion: prenda.estacion || "",
         imagen: prenda.imagen || "",
        });

        // Marcar que ya tiene clasificación previa
        setClasificacionPrevia(true);

      } catch (error) {
        Alert.alert("Error", "No se pudo cargar la prenda para editar.");
      } finally {
        hideLoader();
      }
    };
    fetchPrenda();
  }, [id]);

  // 🤖 Clasificar imagen con IA
  const clasificarImagen = async (imageUri: string) => {
    setClasificando(true);
    try {
      console.log("🤖 Enviando imagen a clasificar...");
      
      const data = new FormData();
      const filename = imageUri.split("/").pop() || "imagen.jpg";
      const ext = filename.split(".").pop() || "jpg";
      const type = `image/${ext}`;
      
      data.append("archivo", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await apiFetch("/api/prendas/upload", {
        method: "POST",
        body: data as any,
      });

      if (!response.ok) {
        throw new Error("Error al clasificar la imagen");
      }

      const resultado: any = await response.json();
      console.log("✅ Clasificación recibida:", resultado);

      // Actualizar el formulario con la clasificación
      // 🔹 El backend devuelve la prenda completa
      const prenda = resultado.prenda || resultado;
      
      setForm((prev) => ({
        ...prev,
        nombre: prenda.nombre || prev.nombre,
        tipo: prenda.tipo || prev.tipo,
        color: prenda.color || prev.color,
        ocasion: prenda.ocasion || prev.ocasion,
        estacion: prenda.estacion || prev.estacion,
        imagen: prenda.imagen || prev.imagen, // URL de Cloud Storage
      }));

      console.log("📝 Formulario actualizado:", {
        nombre: prenda.nombre,
        tipo: prenda.tipo,
        color: prenda.color,
      });

      Alert.alert(
        "✨ Clasificación completada",
        `La IA identificó: ${prenda.tipo || "prenda"} ${prenda.color || ""}. Revisa y ajusta si es necesario.`,
        [{ text: "OK" }]
      );

    } catch (error: any) {
      console.error("❌ Error clasificando:", error);
      console.error("❌ Stack trace:", error.stack);
      
      Alert.alert(
        "Error en clasificación",
        `No se pudo clasificar: ${error.message || "Error desconocido"}. Completa los campos manualmente.`
      );
    } finally {
      setClasificando(false);
    }
  };
  // Clasificar imagen web
  async function clasificarImagenWeb(file: File) {
  setClasificando(true);
  try {
    const data = new FormData();
    data.append("archivo", file); // File real como en Swagger

    const response = await apiFetch("/api/prendas/upload", {
      method: "POST",
      body: data,
    });

    if (!response.ok) throw new Error("Error al clasificar la imagen");

    const resultado = await response.json();

    const prenda = resultado.prenda || resultado;

    setForm((prev) => ({
      ...prev,
      nombre: prenda.nombre || prev.nombre,
      tipo: prenda.tipo || prev.tipo,
      color: prenda.color || prev.color,
      ocasion: prenda.ocasion || prev.ocasion,
      estacion: prenda.estacion || prev.estacion,
      imagen: prenda.imagen,
    }));
  } catch (err) {
    console.error(err);
    Alert.alert("Error", "No se pudo clasificar la imagen en Web");
  } finally {
    setClasificando(false);
  }
}


  // 🧩 Elegir imagen o tomar foto
  const seleccionarImagen = async (origen: "camera" | "gallery") => {
    if (Platform.OS === "web") {
      document.getElementById("hiddenFileInput")?.click();
      return;
    }

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
          ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });

      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri;
        setForm((prev) => ({ ...prev, imagen: uri }));
        
        // 🤖 Clasificar automáticamente la nueva imagen
        if (!isEditing && uri) {
          await clasificarImagen(uri);
        }
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo abrir la cámara o galería.");
    }
  };

  // 🔄 Reclasificar desde URL de Cloud Storage
const reclasificarDesdeURL = async (imageUrl: string) => {
  setClasificando(true);
  try {
    console.log("🔄 Descargando imagen para reclasificar...");

    // 1️⃣ Descargar la imagen desde Cloud Storage
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
    const file = new File([blob], "imagen.jpg", { type: "image/jpeg" });

    // 2️⃣ Enviar al endpoint /api/prendas/upload
    const data = new FormData();
    data.append("archivo", file);

    const clasificacionResponse = await apiFetch("/api/prendas/upload", {
      method: "POST",
      body: data,
    });

    if (!clasificacionResponse.ok) {
      throw new Error("Error al reclasificar");
    }

    const resultado = await clasificacionResponse.json();
    const prenda = resultado.prenda || resultado;

    // 3️⃣ Actualizar el formulario
    setForm((prev) => ({
      ...prev,
      nombre: prenda.nombre || prev.nombre,
      tipo: prenda.tipo || prev.tipo,
      color: prenda.color || prev.color,
      ocasion: prenda.ocasion || prev.ocasion,
      estacion: prenda.estacion || prev.estacion,
      imagen: prenda.imagen || prev.imagen,
    }));

    Alert.alert(
      "✨ Reclasificación completada",
      `Ahora es: ${prenda.tipo || "prenda"} ${prenda.color || ""}`,
      [{ text: "OK" }]
    );
  } catch (error: any) {
    console.error("❌ Error reclasificando:", error);
    Alert.alert("Error", error.message || "No se pudo reclasificar la imagen");
  } finally {
    setClasificando(false);
  }
};

  // 🔄 Reclasificar imagen manualmente
  const reclasificar = async () => {
    if (!form.imagen) {
      Alert.alert("Sin imagen", "Primero selecciona una imagen para clasificar.");
      return;
    }

    Alert.alert(
      "Reclasificar prenda",
      "¿Quieres que la IA vuelva a analizar esta imagen? Esto sobrescribirá los campos actuales.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reclasificar",
          onPress: () => clasificarImagen(form.imagen),
        },
      ]
    );
  };

  // 🧩 Guardar o actualizar prenda
  const handleSubmit = async () => {
    if (!form.nombre || !form.tipo || !form.color || !form.imagen) {
      Alert.alert("Campos incompletos", "Por favor, completa los campos requeridos.");
      return;
    }

    showLoader(isEditing ? "Actualizando prenda..." : "Guardando prenda...");

       try {
      // ======================================================
      //                MODO EDITAR → PUT JSON
      // ======================================================
      if (isEditing) {
        if (!form.nombre || !form.tipo || !form.color) {
          Alert.alert("Campos incompletos", "Completa nombre, tipo y color.");
          hideLoader();
          return;
        }

        console.log("📝 Actualizando prenda:", { id, form });

        // ✅ Enviar como JSON (no FormData)
        const body = {
          nombre: form.nombre,
          tipo: form.tipo,
          color: form.color,
          ocasion: form.ocasion || "",
          estacion: form.estacion || "",
          // NO incluir imagen si es una URL de Cloud Storage
        };

        console.log("📤 Body a enviar:", body);

        const response = await apiFetch(`/api/prendas/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        console.log("📡 Respuesta PUT:", {
          status: response.status,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error al actualizar: ${errorText}`);
        }

        Alert.alert("Éxito", "Prenda actualizada correctamente");
        router.push("/mi-armario");
        return;
      }

      // ======================================================
      //       MODO CREAR → Ya está creada, solo redirigir
      // ======================================================
      // Si ya tenemos los datos clasificados y la imagen en Cloud Storage,
      // la prenda YA FUE CREADA durante la clasificación
      if (form.nombre && form.tipo && form.color && form.imagen.includes('storage.googleapis.com')) {
        console.log("ℹ️ Prenda ya fue creada durante la clasificación");
        Alert.alert("Éxito", "Prenda guardada correctamente");
        router.push("/mi-armario");
        return;
      }

      // Si por alguna razón llegamos aquí sin clasificar, mostrar error
      Alert.alert(
        "Error",
        "La prenda debe ser clasificada antes de guardar. Intenta de nuevo."
      );
    } 
    catch (error: any) {
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
      <Header title={isEditing ? "Editar Prenda" : "Agregar Prenda"} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View
          style={[
            styles.formContainer,
            isWeb && { maxWidth: 500, alignSelf: "center", width: "90%" },
          ]}
        >
          {/* Banner de clasificación IA */}
          {!isEditing && !clasificacionPrevia && (
            <View style={styles.aiNotice}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
              <Text style={styles.aiNoticeText}>
                La IA clasificará tu prenda automáticamente
              </Text>
            </View>
          )}

          {/* Imagen seleccionada */}
          {form.imagen ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ 
                  uri: form.imagen,
                  // Añadir headers si es necesario
                  ...(form.imagen.includes('storage.googleapis.com') && {
                    headers: {
                      Accept: 'image/*',
                    }
                  })
                }}
                style={styles.imagePreview}
                resizeMode="contain"
                onError={(error) => {
                  console.error("❌ Error cargando imagen:", error.nativeEvent);
                }}
                onLoad={() => {
                  console.log("✅ Imagen cargada correctamente");
                }}
              />
              {clasificando && (
                <View style={styles.clasificandoOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.clasificandoText}>Analizando con IA...</Text>
                </View>
              )}
            </View>
          ) : null}

          {/* Botones de cámara y galería */}
          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: colors.primary }]}
              onPress={() => seleccionarImagen("camera")}
              disabled={clasificando}
            >
              <Ionicons name="camera-outline" size={20} color="#FFF" />
              <Text style={styles.imageButtonText}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.imageButton,
                { backgroundColor: "#FFF", borderColor: colors.primary, borderWidth: 1 },
              ]}
              onPress={() => seleccionarImagen("gallery")}
              disabled={clasificando}
            >
              <Ionicons name="image-outline" size={20} color={colors.primary} />
              <Text style={[styles.imageButtonText, { color: colors.primary }]}>Galería</Text>
            </TouchableOpacity>

            {form.imagen && (
              <TouchableOpacity
                style={[
                  styles.imageButton,
                  { backgroundColor: "#FFF", borderColor: "#FF9800", borderWidth: 1 },
                ]}
                onPress={reclasificar}
                disabled={clasificando}
              >
                <Ionicons name="refresh-outline" size={20} color="#FF9800" />
                <Text style={[styles.imageButtonText, { color: "#FF9800" }]}>
                  Reclasificar
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Inputs */}
          <TextInput
            placeholder="Nombre de la prenda"
            style={styles.input}
            value={form.nombre}
            onChangeText={(v) => setForm({ ...form, nombre: v })}
            editable={!clasificando}
          />
          <TextInput
            placeholder="Tipo (camiseta, pantalón...)"
            style={styles.input}
            value={form.tipo}
            onChangeText={(v) => setForm({ ...form, tipo: v })}
            editable={!clasificando}
          />
          <TextInput
            placeholder="Color"
            style={styles.input}
            value={form.color}
            onChangeText={(v) => setForm({ ...form, color: v })}
            editable={!clasificando}
          />
          <TextInput
            placeholder="Categoría / ocasión (casual, trabajo, fiesta...)"
            style={styles.input}
            value={form.ocasion}
            onChangeText={(v) => setForm({ ...form, ocasion: v })}
            editable={!clasificando}
          />
          <TextInput
            placeholder="Estación (verano, invierno, todas...)"
            style={styles.input}
            value={form.estacion}
            onChangeText={(v) => setForm({ ...form, estacion: v })}
            editable={!clasificando}
          />

          <TouchableOpacity
            style={[
              styles.saveButton,
              isWeb && { alignSelf: "center", width: "60%", maxWidth: 400 },
              clasificando && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={clasificando}
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? "Actualizar Prenda" : "Guardar Prenda"}
            </Text>
          </TouchableOpacity>
        </View>
        {Platform.OS === "web" && (
          <input
            type="file"
            accept="image/*"
            id="hiddenFileInput"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              // crea URL local
              const uri = URL.createObjectURL(file);

              setForm((prev) => ({ ...prev, imagen: uri }));

              // clasificar con File real
              await clasificarImagenWeb(file);
            }}
          />
        )}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: "center", paddingBottom: 40 },
  formContainer: { paddingHorizontal: 16, paddingVertical: 20 },
  aiNotice: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  aiNoticeText: {
    flex: 1,
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "500",
  },
  imageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  imageButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  imageButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  imageButtonText: {
    fontWeight: "600",
    color: "#FFF",
    fontSize: 13,
  },
  imagePreview: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    resizeMode: "contain",
    backgroundColor: "#FFF",
  },
  clasificandoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  clasificandoText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
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