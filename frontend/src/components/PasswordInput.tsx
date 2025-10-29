// ✅ PasswordInput.tsx
// Campo de contraseña con icono de ojo (mostrar/ocultar)
import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity } from "react-native";
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
    <View className="w-full mb-4">
      {label && <Text className="text-textDark mb-1 font-semibold">{label}</Text>}

      <View
        className={`flex-row items-center bg-inputBg shadow-md rounded-xl px-4 ${
          error ? "border border-error" : ""
        }`}
      >
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={onChangeText}
          className="flex-1 py-3 text-textDark"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            color="#4B0082"
          />
        </TouchableOpacity>
      </View>

      {error && <Text className="text-error text-sm mt-1">{error}</Text>}
    </View>
  );
};

export default PasswordInput;
