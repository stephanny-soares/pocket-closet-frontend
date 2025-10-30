import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PasswordInputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  placeholder,
  error,
  value,
  onChangeText,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container as any}>
      {label && <Text style={styles.label as any}>{label}</Text>}

      <View style={[styles.inputContainer, error && styles.inputContainerError] as any}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={onChangeText}
          style={styles.input as any}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            color="#4B0082"
          />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error as any}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  } as any,
  label: {
    color: "#222222",
    marginBottom: 4,
    fontWeight: "600",
  } as any,
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  } as any,
  inputContainerError: {
    borderColor: "#E53935",
    borderWidth: 1,
  } as any,
  input: {
    flex: 1,
    paddingVertical: 12,
    color: "#222222",
    fontSize: 16,
    fontFamily: "System",
    outlineWidth: 0,
  } as any,
  error: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 4,
  } as any,
});

export default PasswordInput;
