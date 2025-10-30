import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";

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
  const isDisabled = disabled || loading;
  const buttonStyle = isDisabled ? styles.buttonDisabled : styles.button;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.container, buttonStyle] as any}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text as any}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  } as any,
  button: {
    backgroundColor: "#4B0082",
  } as any,
  buttonDisabled: {
    backgroundColor: "rgba(75, 0, 130, 0.5)",
  } as any,
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  } as any,
});

export default PrimaryButton;
