import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";


import colors from "../constants/colors";
import HeaderMaison from "../components/Header";
import TitleSerif from "../components/ui/TitleSerif";
import SubtitleSerif from "../components/ui/SubtitleSerif";
import Card from "../components/ui/Card";
import PrimaryButton from "../components/ui/PrimaryButton";
import { apiRequest } from "../utils/apiClient";
import { useAuth } from "../hooks/useAuth";


export default function Perfil() {
  const { auth, logout } = useAuth();

  console.log("AUTH EN PERFIL =>", auth);

  const defaultAvatar = "https://i.pravatar.cc/200?img=1";

  const [usuario, setUsuario] = useState({
    nombre: "",
    email: "",
    avatar: "",
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");

  const abrirModal = (title: string) => {
    setModalTitle(title);
    setModalVisible(true);
  };

  // Cargar datos reales del usuario
  const cargarUsuario = async () => {
    try {
      const data = await apiRequest("/api/users/perfil", { method: "GET" });
      console.log("RESPUESTA /api/users/perfil =>", data);

      if (data.ok && data.usuario) {
        const nombre =
          data.usuario.userName ??
          data.usuario.name ??               // fallback por si el servicio devuelve name
          auth?.userName ??                  // último recurso
          "";

        setUsuario({
          nombre,
          email: data.usuario.email ?? "",
          avatar: data.usuario.avatar || "",
        });
      }
    } catch (err) {
      console.error("Error cargando perfil:", err);
    }
};

  useEffect(() => {
    if (auth?.userId) {
      cargarUsuario();
    }
  }, [auth?.userId]);




  // Elegir nueva foto de perfil
  const cambiarAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!res.canceled) {
      const uri = res.assets[0].uri;

      setUsuario((prev) => ({ ...prev, avatar: uri }));

      // TODO: Subir avatar al backend aquí
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={colors.gradient} style={{ flex: 1 }}>
        <HeaderMaison />

        {/* TITLE */}
        <View style={styles.titleBlock}>
          <TitleSerif>Perfil</TitleSerif>
          <SubtitleSerif>Tu espacio personal y estilo</SubtitleSerif>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* --------------------------- */}
          {/* PROFILE CARD */}
          {/* --------------------------- */}
          <View style={styles.profileCardWrapper}>
            <Card style={styles.profileCard}>
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: usuario.avatar || defaultAvatar }}
                  style={styles.avatar}
                />

                {/* Botón editar avatar */}
                <TouchableOpacity
                  onPress={cambiarAvatar}
                  style={styles.editAvatarBtn}
                >
                  <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.name}>
                {usuario.nombre || auth?.userName || "Usuario"}
              </Text>

              <Text style={styles.email}>
                {usuario.email || ""}
              </Text>

            </Card>
          </View>

          {/* --------------------------- */}
          {/* SETTINGS GRUPO 1 */}
          {/* --------------------------- */}
          <Card style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => abrirModal("Suscripción")}
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

            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => abrirModal("Preferencias de estilo")}
            >
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
              onPress={() => abrirModal("Favoritos")}
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

          {/* --------------------------- */}
          {/* SETTINGS GRUPO 2 */}
          {/* --------------------------- */}
          <Card style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => abrirModal("Notificaciones")}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.settingsText}>Notificaciones</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => abrirModal("Privacidad y seguridad")}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.settingsText}>Privacidad y seguridad</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => abrirModal("Soporte")}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="help-circle-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.settingsText}>Soporte</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </Card>

          {/* LOGOUT */}
          <PrimaryButton
            text="Cerrar sesión"
            variant="secondary"
            style={styles.signOut}
            onPress={logout}
          />


          {/* --------------------------- */}
          {/* MODAL */}
          {/* --------------------------- */}
          {modalVisible && (
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
        </ScrollView>
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
  },
});
