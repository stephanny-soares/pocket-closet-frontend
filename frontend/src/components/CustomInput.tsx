import React from "react";
import { TextInput, View, Text, TextInputProps, StyleSheet } from "react-native";

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
    <View style={styles.container as any}>
      {label && <Text style={styles.label as any}>{label}</Text>}
      <TextInput
        {...props}
        placeholderTextColor="#888"
        style={[styles.input, error && styles.inputError] as any}
      />
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
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#222222",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    fontSize: 16,
    fontFamily: "System",
    outlineWidth: 0,
  } as any,
  inputError: {
    borderColor: "#E53935",
    borderWidth: 1,
  } as any,
  error: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 4,
  } as any,
});

export default CustomInput;
