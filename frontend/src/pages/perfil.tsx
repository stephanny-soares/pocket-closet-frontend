import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

import colors from "../constants/colors";
import HeaderMaison from "../components/Header";
import TitleSerif from "../components/ui/TitleSerif";
import SubtitleSerif from "../components/ui/SubtitleSerif";
import Card from "../components/ui/Card";
import PrimaryButton from "../components/ui/PrimaryButton";
import { apiRequest } from "../utils/apiClient";
import { useAuth } from "../hooks/useAuth";

type UserPreferences = {
  id: string;
  ciudad: string;
  entorno: string;
  estilo: string[];
  colores: string[];
  createdAt: string;
  updatedAt: string;
};

type ModalType = "generic" | "nombre" | "preferences" | "preferencesEmpty" | null;

export default function Perfil() {
  const { auth, logout } = useAuth();
  const router = useRouter();

  const defaultAvatar = "https://i.pravatar.cc/200?img=1";

  const [usuario, setUsuario] = useState({
    nombre: "",
    email: "",
    avatar: "",
  });

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalTitle, setModalTitle] = useState("");

  // ------------------------------------------------------------
  // Cargar perfil
  // ------------------------------------------------------------
  const cargarUsuario = async () => {
    try {
      const data = await apiRequest("/api/users/perfil", { method: "GET" });

      if (data.ok && data.usuario) {
        setUsuario({
          nombre: data.usuario.userName ?? "",
          email: data.usuario.email ?? "",
          avatar: data.usuario.avatar || "",
        });
      }
    } catch (err) {
      console.error("Error cargando perfil:", err);
    }
  };

  useEffect(() => {
    if (auth?.userId) cargarUsuario();
  }, [auth?.userId]);

  // ------------------------------------------------------------
  // Cambiar avatar (solo cliente por ahora)
  // ------------------------------------------------------------
  const cambiarAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!res.canceled) {
      setUsuario((prev) => ({ ...prev, avatar: res.assets[0].uri }));
      Toast.show({
        type: "info",
        text1: "Avatar actualizado localmente",
      });
    }
  };

  // ------------------------------------------------------------
  // Editar nombre
  // ------------------------------------------------------------
  const guardarNombre = async () => {
    try {
      const body = { name: usuario.nombre };

      const res = await apiRequest("/api/users/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        cargarUsuario();
        Toast.show({ type: "success", text1: "Nombre actualizado" });
      } else {
        Toast.show({ type: "error", text1: "No se pudo actualizar" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Error de conexión" });
    }

    setModalVisible(false);
  };

  // ------------------------------------------------------------
  // Abrir preferencias de estilo
  // ------------------------------------------------------------
  const handleOpenPreferencias = async () => {
    try {
      const data = await apiRequest("/api/users/preferences", {
        method: "GET",
      });

      if (data.ok && data.preferences) {
        setPreferences(data.preferences);
        setModalType("preferences");
        setModalTitle("Preferencias de estilo");
        setModalVisible(true);
        return;
      }
    } catch (err) {
      console.log("Preferencias no encontradas:", err);
    }

    setModalType("preferencesEmpty");
    setModalTitle("Preferencias de estilo");
    setModalVisible(true);
  };

  // ------------------------------------------------------------
  // Guardar preferencias (PUT)
  // ------------------------------------------------------------
  const guardarPreferencias = async () => {
    if (!preferences) return;

    try {
      const res = await apiRequest("/api/users/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        setPreferences(res.preferences);
        Toast.show({ type: "success", text1: "Preferencias actualizadas" });
      } else {
        Toast.show({ type: "error", text1: "No se pudieron actualizar" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Error de conexión" });
    }

    setModalVisible(false);
  };

  // ------------------------------------------------------------
  // Modal genérico
  // ------------------------------------------------------------
  const abrirModalGenerico = (title: string) => {
    setModalTitle(title);
    setModalType("generic");
    setModalVisible(true);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <HeaderMaison />

          {/* TÍTULO */}
          <View style={styles.titleBlock}>
            <TitleSerif>Perfil</TitleSerif>
            <SubtitleSerif>Tu espacio personal y estilo</SubtitleSerif>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* CARD DE PERFIL */}
            <View style={styles.profileCardWrapper}>
              <Card style={styles.profileCard}>
                <View style={{ position: "relative" }}>
                  <Image
                    source={{ uri: usuario.avatar || defaultAvatar }}
                    style={styles.avatar}
                  />

                  <TouchableOpacity
                    onPress={cambiarAvatar}
                    style={styles.editAvatarBtn}
                  >
                    <Ionicons name="camera" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Nombre + lápiz */}
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{usuario.nombre}</Text>

                  <TouchableOpacity
                    onPress={() => {
                      setModalType("nombre");
                      setModalTitle("Editar nombre");
                      setModalVisible(true);
                    }}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.email}>{usuario.email}</Text>
              </Card>
            </View>

            {/* AJUSTES GRUPO 1 */}
            <Card style={styles.settingsCard}>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => abrirModalGenerico("Suscripción")}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name="star-outline" size={22} color={colors.primary} />
                </View>
                <Text style={styles.settingsText}>Suscripción</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsRow} onPress={handleOpenPreferencias}>
                <View style={styles.iconWrapper}>
                  <Ionicons
                    name="color-palette-outline"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.settingsText}>Preferencias de estilo</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => abrirModalGenerico("Favoritos")}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name="heart-outline" size={22} color={colors.primary} />
                </View>
                <Text style={styles.settingsText}>Favoritos</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </Card>

            {/* AJUSTES GRUPO 2 */}
            <Card style={styles.settingsCard}>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => abrirModalGenerico("Notificaciones")}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.settingsText}>Notificaciones</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => abrirModalGenerico("Privacidad y seguridad")}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.settingsText}>Privacidad y seguridad</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => abrirModalGenerico("Soporte")}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons
                    name="help-circle-outline"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.settingsText}>Soporte</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </Card>

            {/* LOGOUT */}
            <PrimaryButton
              text="Cerrar sesión"
              variant="secondary"
              style={styles.signOut}
              onPress={logout}
            />

            {/* -----------------------------------------------------------
                MODALES
            ----------------------------------------------------------- */}

            {/* Modal EN CONSTRUCCIÓN */}
            {modalVisible && modalType === "generic" && (
              <View style={styles.modalOverlay}>
                <Card style={styles.modalBox}>
                  <TitleSerif>{modalTitle}</TitleSerif>
                  <SubtitleSerif>Esta sección está en construcción.</SubtitleSerif>

                  <PrimaryButton
                    text="Cerrar"
                    variant="secondary"
                    onPress={() => setModalVisible(false)}
                    style={{ marginTop: 20 }}
                  />
                </Card>
              </View>
            )}

            {/* Modal EDITAR NOMBRE */}
            {modalVisible && modalType === "nombre" && (
              <View style={styles.modalOverlay}>
                <Card style={styles.modalBox}>
                  <TitleSerif>Editar nombre</TitleSerif>

                  <Text>Nombre</Text>
                  <TextInput
                    value={usuario.nombre}
                    onChangeText={(val) =>
                      setUsuario((prev) => ({ ...prev, nombre: val }))
                    }
                    style={styles.input}
                  />

                  <PrimaryButton text="Guardar" onPress={guardarNombre} />
                  <PrimaryButton
                    text="Cancelar"
                    variant="secondary"
                    onPress={() => setModalVisible(false)}
                    style={{ marginTop: 10 }}
                  />
                </Card>
              </View>
            )}

            {/* Modal: SIN preferencias todavía */}
            {modalVisible && modalType === "preferencesEmpty" && (
              <View style={styles.modalOverlay}>
                <Card style={styles.modalBox}>
                  <TitleSerif>Preferencias de estilo</TitleSerif>
                  <SubtitleSerif>
                    Aún no has completado tu cuestionario de estilo. ¿Quieres hacerlo ahora?
                  </SubtitleSerif>

                  <PrimaryButton
                    text="Completar cuestionario"
                    onPress={() => {
                      setModalVisible(false);
                      router.push("/questionnaire");
                    }}
                    style={{ marginTop: 20 }}
                  />

                  <PrimaryButton
                    text="Ahora no"
                    variant="secondary"
                    onPress={() => setModalVisible(false)}
                    style={{ marginTop: 10 }}
                  />
                </Card>
              </View>
            )}

            {/* Modal: EDITAR preferencias existentes */}
            {modalVisible && modalType === "preferences" && preferences && (
              <View style={styles.modalOverlay}>
                <Card style={styles.modalBox}>
                  <TitleSerif>Editar preferencias</TitleSerif>

                  <Text>Ciudad</Text>
                  <TextInput
                    value={preferences.ciudad}
                    onChangeText={(val) =>
                      setPreferences((prev) =>
                        prev ? { ...prev, ciudad: val } : prev
                      )
                    }
                    style={styles.input}
                  />

                  <Text>Entorno</Text>
                  <TextInput
                    value={preferences.entorno}
                    onChangeText={(val) =>
                      setPreferences((prev) =>
                        prev ? { ...prev, entorno: val } : prev
                      )
                    }
                    style={styles.input}
                  />

                  <Text>Estilo (separado por comas)</Text>
                  <TextInput
                    value={preferences.estilo.join(", ")}
                    onChangeText={(val) =>
                      setPreferences((prev) =>
                        prev
                          ? {
                              ...prev,
                              estilo: val.split(",").map((v) => v.trim()),
                            }
                          : prev
                      )
                    }
                    style={styles.input}
                  />

                  <Text>Colores (separado por comas)</Text>
                  <TextInput
                    value={preferences.colores.join(", ")}
                    onChangeText={(val) =>
                      setPreferences((prev) =>
                        prev
                          ? {
                              ...prev,
                              colores: val.split(",").map((v) => v.trim()),
                            }
                          : prev
                      )
                    }
                    style={styles.input}
                  />

                  <PrimaryButton
                    text="Guardar preferencias"
                    onPress={guardarPreferencias}
                    style={{ marginTop: 10 }}
                  />

                  <PrimaryButton
                    text="Cancelar"
                    variant="secondary"
                    onPress={() => setModalVisible(false)}
                    style={{ marginTop: 10 }}
                  />
                </Card>
              </View>
            )}
          </ScrollView>
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
    marginBottom: 10,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  profileCardWrapper: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    marginBottom: 20,
  },

  profileCard: {
    alignItems: "center",
    paddingVertical: 30,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 60,
    marginBottom: 12,
  },

  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  name: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  email: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  settingsCard: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    marginBottom: 20,
  },

  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  iconWrapper: {
    width: 32,
    alignItems: "center",
    marginRight: 10,
  },

  settingsText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },

  signOut: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    marginTop: 10,
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#00000055",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalBox: {
    width: "100%",
    maxWidth: 380,
    padding: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
});
