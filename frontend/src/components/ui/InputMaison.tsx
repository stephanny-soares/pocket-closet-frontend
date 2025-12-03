import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import colors from "../../constants/colors";
import { Platform,} from "react-native";


interface InputMaisonProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function InputMaison({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  ...props
}: InputMaisonProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.container, error && styles.errorBorder]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          {...props}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
        />

        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
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
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
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


  errorBorder: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
});
