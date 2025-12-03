import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import colors from "../../constants/colors";

interface Props {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  error?: string;
}

export default function CheckBoxMaison({
  checked,
  onToggle,
  label,
  error,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPress={onToggle}
        style={styles.row}
        activeOpacity={0.8}
      >
        <View style={[styles.box, checked && styles.boxChecked]}>
          {checked && <Text style={styles.tick}>✓</Text>}
        </View>

        {label && <Text style={styles.label}>{label}</Text>}
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.card,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tick: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  label: {
    marginLeft: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
});
