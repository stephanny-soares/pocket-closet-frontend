// components/ui/SubtitleSerif.tsx

import { Text } from "react-native";
import colors from "../../constants/colors";
import typography from "../../constants/typography";

export default function SubtitleSerif({ children, style }: any) {
  return (
    <Text
      style={[
        typography.subtitleSerif,
        { color: colors.textSecondary, marginBottom: 10 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
