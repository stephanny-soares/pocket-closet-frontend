// components/ui/CheckBoxMaison.tsx

import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../constants/colors";

export default function CheckBoxMaison({ checked, onToggle }: any) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.container}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && (
          <Ionicons name="checkmark" size={16} color="#FFF" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: "center", alignItems: "center" },

  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
  },

  boxChecked: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
});
