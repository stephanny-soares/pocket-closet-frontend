// ✅ CheckBox.tsx
// Componente de casilla personalizada (checkbox) con NativeWind
import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CheckBoxProps {
  checked: boolean;
  label: string;
  onToggle: () => void;
}

const CheckBox: React.FC<CheckBoxProps> = ({ checked, label, onToggle }) => {
  return (
    <TouchableOpacity
      onPress={onToggle}
      className="flex-row items-center my-2"
      activeOpacity={0.8}
    >
      <View
        className={`w-5 h-5 mr-3 rounded-md justify-center items-center shadow-sm ${
          checked ? "bg-primary" : "bg-inputBg"
        }`}
      >
        {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
      <Text className="text-textMuted text-sm">{label}</Text>
    </TouchableOpacity>
  );
};

export default CheckBox;
