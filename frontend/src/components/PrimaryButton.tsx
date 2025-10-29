// ✅ PrimaryButton.tsx
// Botón principal reutilizable con colores base de Tailwind y NativeWind
import React from "react";
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      className={`w-full py-3 rounded-xl items-center justify-center ${
        disabled ? "bg-primary/50" : "bg-primary"
      }`}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white text-lg font-semibold">{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default PrimaryButton;
