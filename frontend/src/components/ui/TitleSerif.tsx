// components/ui/TitleSerif.tsx

import { Text } from "react-native";
import colors from "../../constants/colors";
import typography from "../../constants/typography";

export default function TitleSerif({ children, style }: any) {
  return (
    <Text
      style={[
        typography.titleSerif,
        { color: colors.textPrimary, marginBottom: 6 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
