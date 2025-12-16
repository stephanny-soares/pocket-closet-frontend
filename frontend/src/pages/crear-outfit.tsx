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
  Platform,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import HeaderMaison from "../components/Header";
import TitleSerif from "components/ui/TitleSerif";

import colors from "../constants/colors";
import { apiRequest } from "../utils/apiClient";
import { useLoader } from "../context/LoaderContext";
import ModalKeyboardWrapper from "../components/ui/ModalKeyboardWrapper";

export default function CrearOutfit() {
  const { prendaId, eventoId, eventoNombre } = useLocalSearchParams();
  const { showLoader, hideLoader } = useLoader();

  const [outfit, setOutfit] = useState<any>(null);

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estacion, setEstacion] = useState("");
  const [imagen, setImagen] = useState("");

  // --- Chat with AI ---
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");

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

      if (!data?.outfit) throw new Error("No se pudo generar el outfit");

      cargarOutfit(data.outfit);
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
        body: JSON.stringify({ eventoId: id }),
      });

      if (!data?.outfit) throw new Error("No se pudo generar el outfit");

      cargarOutfit(data.outfit);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Error generando outfit");
    } finally {
      hideLoader();
    }
  };

  /** Cargar outfit en formulario */
  const cargarOutfit = (o: any) => {
    setOutfit(o);
    setNombre(o.nombre || "");
    setCategoria(o.categoria || "");
    setEstacion(o.estacion || "");
    setImagen(o.imagen || "");
  };

  /** ----------- GUARDAR OUTFIT ------------ */
  const guardarOutfit = async () => {
    if (!outfit) return;

    const prendasIds = outfit.prendas?.map((p: any) => p.id) ?? [];

    const payload = {
      nombre,
      categoria,
      estacion,
      imagen,
      prendasIds,
      eventoId: eventoId || null,
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

  /** ----------- Enviar mensaje del Chat ------------ */
  const enviarMensajeChat = () => {
    if (!chatInput.trim()) return;

    setChatMessages([...chatMessages, chatInput]);

    // futura integración IA:
    // sendToAI(chatInput).then(response => setChatMessages([...messages, response]))

    setChatInput("");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          {/* HEADER */}
          <HeaderMaison />

          {/* TÍTULO AL ESTILO ADD-PRENDA */}
          <View style={[styles.titleBlock]}>
            <TitleSerif>Crear outfit</TitleSerif>
          </View>

          <ModalKeyboardWrapper>
            {/* ---------- BOTONES PRINCIPALES ---------- */}
            <View style={[styles.mainCard, { width: "100%", maxWidth: 650, alignSelf: "center" }]}>
              <TouchableOpacity
                style={styles.optionBtn}
                onPress={() => router.push("/mi-armario?selectMode=prenda")}
              >
                <Ionicons name="shirt-outline" size={22} color={colors.primary} />
                <Text style={styles.optionText}>Por prenda</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionBtn}
                onPress={() => router.push("/mis-eventos")}
              >
                <Ionicons name="calendar-outline" size={22} color={colors.primary} />
                <Text style={styles.optionText}>Por evento</Text>
              </TouchableOpacity>

              {/* 🔥 NUEVA OPCIÓN CHAT IA */}
              <TouchableOpacity
                style={styles.optionBtn}
                onPress={() => setChatVisible(true)}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
                <Text style={styles.optionText}>Chat con la IA</Text>
              </TouchableOpacity>
            </View>

            {/* ---------- TARJETA DEL OUTFIT ---------- */}
            {outfit && (
              <View style={[styles.card, { width: "100%", maxWidth: 650, alignSelf: "center" }]}>
                {imagen ? (
                  <Image source={{ uri: imagen }} style={styles.cardImage} resizeMode="contain" />
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
                    <Image key={p.id} source={{ uri: p.imagen }} style={styles.prendaThumb} />
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

            {/* ---------- CHAT IA ---------- */}
            {chatVisible && (
              <View style={[styles.chatCard, { maxWidth: 650, alignSelf: "center" }]}>
                <Text style={styles.chatTitle}>Asistente de outfit</Text>

                <ScrollView style={styles.chatMessages}>
                  {chatMessages.map((m, i) => (
                    <View key={i} style={styles.chatBubble}>
                      <Text style={styles.chatBubbleText}>{m}</Text>
                    </View>
                  ))}
                </ScrollView>

                <TextInput
                  style={styles.chatInput}
                  placeholder="Describe tu idea de outfit..."
                  value={chatInput}
                  onChangeText={setChatInput}
                />

                <TouchableOpacity style={styles.chatSendBtn} onPress={enviarMensajeChat}>
                  <Text style={styles.chatSendText}>Enviar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.chatCloseBtn}
                  onPress={() => setChatVisible(false)}
                >
                  <Text style={styles.chatCloseText}>Cerrar chat</Text>
                </TouchableOpacity>
              </View>
            )}

          </ModalKeyboardWrapper>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

/* =====================================================
   STYLES — estilo Maison como Add-Prenda
===================================================== */

const styles = StyleSheet.create({
  titleBlock: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  mainCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginTop: 15,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  optionBtn: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },

  optionText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 18,
    marginTop: 25,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  cardImage: {
    width: "100%",
    height: 260,            
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#F3F3F3",
    ...(Platform.OS === "web" && { objectFit: "contain" }),
  },


  label: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderColor: colors.border,
    borderWidth: 1,
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
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },

  btnGuardarText: {
    color: "#FFF",
    fontWeight: "700",
  },

  btnCancelar: {
    backgroundColor: "#EEE",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },

  btnCancelarText: {
    color: "#444",
    fontWeight: "600",
  },

  /* CHAT */
  chatCard: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 18,
    marginTop: 25,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  chatTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  chatMessages: {
    maxHeight: 200,
    marginBottom: 14,
  },

  chatBubble: {
    backgroundColor: colors.primarySoft,
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
  },

  chatBubbleText: {
    color: colors.textPrimary,
  },

  chatInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
  },

  chatSendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  chatSendText: {
    color: "#FFF",
    fontWeight: "700",
  },

  chatCloseBtn: {
    backgroundColor: "#EEE",
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 10,
    alignItems: "center",
  },

  chatCloseText: {
    fontWeight: "600",
    color: "#333",
  },
});
