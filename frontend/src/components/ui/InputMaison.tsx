// components/ui/InputMaison.tsx

import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import colors from "../../constants/colors";
import typography from "../../constants/typography";

export default function InputMaison({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  ...rest
}: any) {
  return (
    <View style={{ marginBottom: 18 }}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      <TextInput
        style={[
          styles.input,
          error && styles.inputError
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        {...rest}
      />

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 6,
  },

  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
  },

  inputError: {
    borderColor: colors.danger,
  },

  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
});
