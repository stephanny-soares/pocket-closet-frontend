import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  DimensionValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

/**
 * Campo de contraseña con icono de ojo (cerrado por defecto).
 * - Icono dentro del input, alineado a la derecha
 * - Sombra y estilo consistente con CustomInput
 * - Mensaje de caracteres mínimos de contraseña
 */
interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  width?: DimensionValue;
  secureDefault?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Contraseña',
  error,
  width = '100%',
  secureDefault = true,
}) => {
  const [visible, setVisible] = useState(!secureDefault);
  const [showHint, setShowHint] = useState(false);

  const isPasswordValid = (password: string) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);

  return (
    <View style={[styles.wrapper, { width: width as any }]}>
      <View
        style={[styles.inputRow, error && { borderColor: colors.error, borderWidth: 1 }]}
      >
        <TextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!visible}
          style={styles.input}
          autoCapitalize="none"
          onFocus={() => setShowHint(true)}
          onBlur={() => {
            if (isPasswordValid(value)) setShowHint(false);
          }}
          onChangeText={(text) => {
            onChangeText(text);
            if (isPasswordValid(text)) setShowHint(false);
          }}
        />

        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          style={styles.iconBtn}
          hitSlop={10}
        >
          <Ionicons name={visible ? 'eye' : 'eye-off'} size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
      {!error && showHint && (
        <Text style={styles.hint}>
          La contraseña debe contener mínimo 8 caracteres, una mayúscula, un número y un
          símbolo.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 24,
    paddingLeft: 18,
    paddingRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    flex: 1,
    color: colors.textDark,
    fontSize: 16,
    paddingVertical: 13,
    paddingRight: 8,
    // 👇 En Web, evita el borde azul del input. En móvil no afecta.
    outlineStyle: 'solid' as any, // Evita el error TS: "none" no es tipo válido
  },
  iconBtn: {
    padding: 6,
  },
  error: {
    marginTop: 6,
    marginLeft: 10,
    color: colors.error,
    fontSize: 13,
  },
  hint: {
    marginTop: 6,
    marginLeft: 10,
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default PasswordInput;
