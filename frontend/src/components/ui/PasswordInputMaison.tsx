// components/ui/PasswordInputMaison.tsx

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../constants/colors";
import typography from "../../constants/typography";

export default function PasswordInputMaison({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  ...rest
}: any) {
  const [show, setShow] = useState(false);

  return (
    <View style={{ marginBottom: 18 }}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      <View style={[
        styles.inputWrapper,
        error && styles.inputError
      ]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!show}
          value={value}
          onChangeText={onChangeText}
          {...rest}
        />

        <TouchableOpacity onPress={() => setShow(!show)}>
          <Ionicons
            name={show ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={colors.icon}
          />
        </TouchableOpacity>
      </View>

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

  inputWrapper: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    marginRight: 10,
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
