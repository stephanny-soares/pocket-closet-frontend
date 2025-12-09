import { TouchableOpacity, Text, StyleSheet } from "react-native";
import colors from "../../constants/colors";

export default function PrimaryButton({
  title,
  text,
  children,
  onPress,
  style,
  variant = "primary",
}: any) {
  const label = title || text || children;

  const isSecondary = variant === "secondary";

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isSecondary ? styles.secondary : styles.primary,
        style,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.text,
          isSecondary ? styles.textSecondary : null,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
  },

  primary: {
    backgroundColor: colors.primary,
  },

  secondary: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.border,
  },

  text: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "600",
  },

  textSecondary: {
    color: colors.textPrimary,
  },
});
