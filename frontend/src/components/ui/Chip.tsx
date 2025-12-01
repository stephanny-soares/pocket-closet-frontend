// components/ui/Chip.tsx

import { TouchableOpacity, Text, StyleSheet } from "react-native";
import colors from "../../constants/colors";

export default function Chip({ label, active, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.active]}
    >
      <Text style={[styles.text, active && styles.textActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.chipBackground,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  active: {
    backgroundColor: colors.chipBackgroundActive,
    borderColor: colors.chipBackgroundActive,
  },
  text: {
    color: colors.chipText,
    fontSize: 14,
  },
  textActive: {
    color: colors.chipTextActive,
  },
});
