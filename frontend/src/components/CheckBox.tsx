import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
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
      style={styles.container as any}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.checkbox,
          checked && styles.checkboxChecked,
        ] as any}
      >
        {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
      <Text style={styles.label as any}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  } as any,
  checkbox: {
    width: 20,
    height: 20,
    marginRight: 12,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  } as any,
  checkboxChecked: {
    backgroundColor: "#4B0082",
    borderColor: "#4B0082",
  } as any,
  label: {
    color: "#666666",
    fontSize: 14,
  } as any,
});

export default CheckBox;
