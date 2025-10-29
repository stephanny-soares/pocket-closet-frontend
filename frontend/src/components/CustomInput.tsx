// ✅ CustomInput.tsx
// Campo de texto reutilizable con estilos NativeWind
import React from "react";
import { TextInput, View, Text, TextInputProps } from "react-native";

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  ...props
}) => {
  return (
    <View className="w-full mb-4">
      {label && <Text className="text-textDark mb-1 font-semibold">{label}</Text>}
      <TextInput
        {...props}
        placeholderTextColor="#888"
        className={`w-full bg-inputBg shadow-md rounded-xl px-4 py-3 text-textDark ${
          error ? "border border-error" : ""
        }`}
      />
      {error && <Text className="text-error text-sm mt-1">{error}</Text>}
    </View>
  );
};

export default CustomInput;

