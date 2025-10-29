// CheckBox.tsx
// Componente reutilizable y compatible con Android, iOS y Web
// Si @react-native-community/checkbox no funciona en Web, usamos un fallback visual

import React from 'react';
import {
  Platform,
  Pressable,
  View,
  StyleSheet,
} from 'react-native';
import CheckBoxBase from '@react-native-community/checkbox';
import colors from '../constants/colors';

// Tipado de las props
interface CheckBoxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  tintColors?: { true: string; false: string };
}

// Fallback para Web: dibuja un recuadro clicable con estilo similar
const WebCheckBox: React.FC<CheckBoxProps> = ({ value, onValueChange }) => (
  <Pressable
    onPress={() => onValueChange(!value)}
    style={[
      styles.webBox,
      {
        borderColor: value ? colors.primary : '#999',
        backgroundColor: value ? colors.primary : 'transparent',
      },
    ]}
  >
    {value && <View style={styles.innerMark} />}
  </Pressable>
);

// ✅ Solución: usa React.ComponentType con cast intermedio
const CheckBox: React.ComponentType<CheckBoxProps> =
  Platform.OS === 'web'
    ? WebCheckBox
    : (CheckBoxBase as unknown as React.ComponentType<CheckBoxProps>);

const styles = StyleSheet.create({
  webBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerMark: {
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});

export default CheckBox;

