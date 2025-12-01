// components/ui/PrimaryButton.tsx

import { TouchableOpacity, Text, StyleSheet } from "react-native";
import colors from "../../constants/colors";

export default function PrimaryButton({ title, onPress, style }: any) {
  return (
    <TouchableOpacity style={[styles.btn, style]} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  text: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
