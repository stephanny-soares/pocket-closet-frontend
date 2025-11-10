import React from "react";
import { View, ActivityIndicator, Text, StyleSheet, Modal } from "react-native";
import colors from "../constants/colors";

interface LoaderOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoaderOverlay({ visible, message }: LoaderOverlayProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
          {message && <Text style={styles.text}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "white",
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textDark,
    fontWeight: "500",
    textAlign: "center",
  },
});
