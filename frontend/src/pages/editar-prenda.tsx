import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router, useLocalSearchParams } from "expo-router";
import Header from "components/Header";
import colors from "../constants/colors";
import { apiRequest } from "../utils/apiClient";
import { useLoader } from "../context/LoaderContext";

type PrendaApi = {
  id: string;
  imagen: string;
  nombre: string;
  tipo: string;
  color: string;
  estacion?: string;
  ocasion?: string;
  seccion?: string;
  marca?: string;
};

export default function EditarPrenda() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { showLoader, hideLoader } = useLoader();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [imagen, setImagen] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [color, setColor] = useState("");
  const [ocasion, setOcasion] = useState("");
  const [estacion, setEstacion] = useState("");
  const [seccion, setSeccion] = useState("");
  const [marca, setMarca] = useState("");
  
  console.log("🟣 EDITAR PRENDA - ID RECIBIDO:", id);

  // ================= CARGAR PRENDA =================
  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      try {
        showLoader("Cargando prenda...");

        const response = await apiRequest<{ ok: boolean; prenda: PrendaApi }>(
         `/api/prendas/${id}`,
         { method: "GET" }
        );

        const data = response.prenda;
        console.log("🟡 DATOS RECIBIDOS:", data);


        setImagen(data.imagen || "");
        setNombre(data.nombre || "");
        setTipo(data.tipo || "");
        setColor(data.color || "");
        setOcasion(data.ocasion || "");
        setEstacion(data.estacion || "");
        setSeccion(data.seccion || "");
        setMarca(data.marca || "");
      } catch (err: any) {
        Alert.alert("Error", err.message || "No se pudo cargar la prenda");
      } finally {
        hideLoader();
      }
    };
    

    cargar();
  }, [id]);

  // ================= GUARDAR CAMBIOS =================
  const guardarCambios = async () => {
    if (!id) return;

    try {
      showLoader("Guardando cambios...");

      await apiRequest(`/api/prendas/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          imagen,
          nombre,
          tipo,
          color,
          ocasion,
          estacion,
          seccion,
          marca,
        }),
      });

      hideLoader();
      router.replace("/mi-armario");
    } catch (err: any) {
      hideLoader();
      Alert.alert("Error", err.message || "No se pudieron guardar los cambios");
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
        <Header title="Editar Prenda" />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && { alignItems: "center" },
          ]}
        >
          <View style={[styles.card, isWeb && { width: 650 }]}>
            {/* Imagen actual */}
            {imagen ? (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: imagen }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
            ) : null}

            <Campo label="Nombre" value={nombre} onChangeText={setNombre} />
            <Campo label="Tipo" value={tipo} onChangeText={setTipo} />
            <Campo label="Color" value={color} onChangeText={setColor} />
            <Campo label="Ocasión" value={ocasion} onChangeText={setOcasion} />
            <Campo
              label="Estación"
              value={estacion}
              onChangeText={setEstacion}
            />
            <Campo
              label="Sección"
              value={seccion}
              onChangeText={setSeccion}
            />
            <Campo
              label="Marca (opcional)"
              value={marca}
              onChangeText={setMarca}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={guardarCambios}>
              <Text style={styles.saveBtnText}>Guardar cambios</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

// =============== Campo reutilizable ===============
type CampoProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
};

const Campo = ({ label, value, onChangeText }: CampoProps) => (
  <View style={styles.fieldBlock}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

// =============== STYLES ===============
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 24,
    padding: 20,
  },
  imageWrapper: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    padding: 10,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: 260,
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
    fontSize: 16,
  },
});
