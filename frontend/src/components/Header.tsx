import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import colors from "../constants/colors";

export default function HeaderMaison({
  onBack,
  onProfilePress,
}: {
  onBack?: () => void;
  onProfilePress?: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.headerWrapper,
        { paddingTop: insets.top + 6 }, // safe area always respected
      ]}
    >
      <View style={styles.innerRow}>

        {/* BOTÓN ATRÁS */}
        <TouchableOpacity
          style={styles.roundButton}
          onPress={onBack || (() => router.back())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-back-outline"
            size={26}
            color={colors.iconActive}
          />
        </TouchableOpacity>

        {/* BOTÓN PERFIL */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={onProfilePress || (() => router.push("/perfil"))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="person-circle-outline"
            size={32}
            color={colors.iconActive}
          />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* FULL WIDTH SIEMPRE */
  headerWrapper: {
    width: "100%",
    backgroundColor: "transparent",
    alignItems: "center",
    marginBottom: 10,
  },

  /* CONTENIDO CENTRADO */
  innerRow: {
    width: "100%",
    maxWidth: 650,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  /* BOTÓN ATRÁS / PERFIL — estilo Maison */
  roundButton: {
    backgroundColor: colors.card,
    padding: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  profileButton: {
    padding: 4,
  },
});
