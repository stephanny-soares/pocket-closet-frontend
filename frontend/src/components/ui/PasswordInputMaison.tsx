import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from "react-native";
import colors from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Platform, } from "react-native";


interface PasswordProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function PasswordInputMaison({
  label,
  error,
  style,
  ...props
}: PasswordProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.container, error && styles.errorBorder]}>
        <TextInput
          {...props}
          secureTextEntry={!visible}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
        />

        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          style={styles.iconRight}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={colors.icon}
          />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,

    ...(Platform.OS === "web" && {
      outline: "none",
      outlineColor: "transparent",
    }),
  },

  iconRight: {
    marginLeft: 8,
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
});
