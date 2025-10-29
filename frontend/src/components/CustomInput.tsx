import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  KeyboardTypeOptions,
  DimensionValue,
  TextStyle,
} from 'react-native';
import colors from '../constants/colors';

/**
 * Campo de texto genérico.
 * - Fondo blanco translúcido, bordes redondeados, sombra sutil
 * - Error debajo del campo si corresponde
 */
interface CustomInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  width?: DimensionValue;
  inputStyle?: TextStyle; // ✅ nueva prop opcional
}

const CustomInput: React.FC<CustomInputProps> = ({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  width = '100%',
  inputStyle, // ✅ añadida
}) => {
  return (
    <View style={[styles.wrapper, { width: width as any }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          inputStyle, // ✅ aplicado aquí
          error && { borderColor: colors.error, borderWidth: 1 },
        ]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  input: {
    backgroundColor: colors.inputBg,
    color: colors.textDark,
    borderRadius: 24,
    paddingVertical: 13,
    paddingHorizontal: 18,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    outlineStyle: 'solid' as any, // compatible con web
  },
  error: {
    marginTop: 6,
    marginLeft: 10,
    color: colors.error,
    fontSize: 13,
  },
});

export default CustomInput;
