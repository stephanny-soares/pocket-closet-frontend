// components/ui/BodyText.tsx

import { Text } from "react-native";
import colors from "../../constants/colors";
import typography from "../../constants/typography";

export default function BodyText({ children, style }: any) {
  return (
    <Text
      style={[
        typography.body,
        { color: colors.textPrimary },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
