// ===============================
//  RegisterScreen.tsx
// Pantalla de registro principal
// Diseño: campos flotando sobre fondo degradado
// Validaciones completas + feedback visual (falta éxito cuando se conecte con el backend) + responsive
// Incluye indicador de fuerza de contraseña, loader durante envío, mostrar/ocultar contraseña y Captcha anti-bot (para implantar cuando se conecte con el Backend)
// ===============================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Fondo degradado (como el Splash)
import colors from '../constants/colors'; // Paleta centralizada
import CustomInput from '../components/CustomInput';
import PasswordInput from '../components/PasswordInput';
import PrimaryButton from '../components/PrimaryButton';
import { isValidEmail, isValidPassword, isValidDate } from '../utils/validation'; // Reglas de validación
import CheckBox from '../components/CheckBox';
import { router } from 'expo-router';

/* Implementar cuando se conecte con el Backend
// Importamos el componente reCAPTCHA de Expo
import { GoogleReCaptcha } from 'expo-google-recaptcha';
*/

// ===============================
//  Tipos de datos
// ===============================
interface FormState {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  fullName: string;
  birthDate: string;
  terms: boolean;
}

interface Errors {
  username?: string;
  password?: string;
  confirmPassword?: string;
  email?: string;
  fullName?: string;
  birthDate?: string;
  terms?: string;
  captcha?: string;
}

interface PasswordStrength {
  label: string;
  color: string;
}

// URL base del backend (leída del .env, con fallback a localhost)
const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

const RegisterScreen: React.FC = () => {
  // Hook que da el ancho actual de la pantalla (para comportamiento responsive)
  const { width } = useWindowDimensions();

  // Define el ancho máximo del formulario (420px en desktop, 88% en móvil)
  const maxWidth = Math.min(420, width * 0.88);

  // Estado que almacena los valores del formulario
  const [form, setForm] = useState<FormState>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    birthDate: '',
    terms: false, // checkbox de Términos y Condiciones
  });

  // Estado para almacenar los errores de validación
  const [errors, setErrors] = useState<Errors>({});

  // Estado para mostrar animación de carga al enviar datos
  const [sending, setSending] = useState(false);

  // Estado para fuerza de contraseña
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ label: '', color: '' });

  /* Implementar cuando se conecte con el Backend
  // Referencia y token del Captcha
  const recaptchaRef = useRef<GoogleReCaptcha>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  */

  // Función auxiliar para actualizar cualquier campo del formulario
  const setField = (key: keyof FormState, val: string | boolean) => {
    setForm((s) => ({ ...s, [key]: val }));

    // Si el campo cambiado es contraseña, calculamos su fuerza
    if (key === 'password' && typeof val === 'string') evaluatePasswordStrength(val);
  };

  // ===============================
  // FUNCIÓN EVALUAR FUERZA DE CONTRASEÑA
  // ===============================
  const evaluatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+.,;:?\-=]/.test(password)) score++;

    if (score <= 1)
      setPasswordStrength({ label: 'Débil', color: '#E53935' });
    else if (score === 2)
      setPasswordStrength({ label: 'Media', color: '#FFA726' });
    else if (score >= 3)
      setPasswordStrength({ label: 'Fuerte', color: '#43A047' });
    else setPasswordStrength({ label: '', color: '' });
  };

  // ===============================
  //  VALIDACIÓN DE CAMPOS
  // ===============================
  const validate = (): boolean => {
    const e: Errors = {}; // objeto temporal de errores

    // Validar usuario
    if (!form.username.trim()) e.username = 'El nombre de usuario es obligatorio.';

    // Validar email
    if (!form.email.trim()) e.email = 'El correo electrónico es obligatorio.';
    else if (!isValidEmail(form.email)) e.email = 'Correo electrónico inválido.';

    // Validar contraseña
    if (!form.password) e.password = 'La contraseña es obligatoria.';
    else if (!isValidPassword(form.password))
      e.password = 'Mín. 8 caracteres, una mayúscula, un número y un símbolo.';

    // Confirmar contraseña
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Las contraseñas no coinciden.';

    // Validar fecha opcional
    if (form.birthDate && !isValidDate(form.birthDate))
      e.birthDate = 'Formato de fecha inválido (AAAA/MM/DD).';

    // Términos y condiciones (obligatorio)
    if (!form.terms)
      e.terms = 'Debes aceptar Términos y Condiciones y la Política de Privacidad.';

    /* Implementar cuando se conecte con el Backend
    // Verificación de Captcha (anti-bot)
    if (!recaptchaToken)
      e.captcha = 'Por favor, verifica que no eres un robot.';
    */

    // Actualiza estado de errores y devuelve si el formulario es válido
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ===============================
  //  ENVÍO DE DATOS
  // ===============================
  const onSubmit = async (): Promise<void> => {
    // Primero, validar el formulario
    if (!validate()) return;

    setSending(true); // muestra loader

    try {
      // Cuerpo de la petición: no enviamos confirmPassword ni terms
      const payload = {
        nombre: form.fullName?.trim() || form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        birthDate: form.birthDate?.trim() || null,
        /* Implementar cuando se conecte con el Backend
        recaptchaToken, 
        */
      };

      // Petición POST al backend
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Manejo de respuestas según código HTTP
      if (res.status === 201) {
        Alert.alert('✅ Registro exitoso', 'Tu cuenta ha sido creada correctamente.');
        setForm({
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          fullName: '',
          birthDate: '',
          terms: false,
        });
        setErrors({});
        setPasswordStrength({ label: '', color: '' });
        //setRecaptchaToken(null);
        router.replace('/home');
      } else if (res.status === 409) {
        setErrors({ email: 'El correo electrónico ya está registrado.' });
      } else if (res.status === 400) {
        const data = await safeJson(res);
        const msg = data?.error || 'Campos inválidos o incompletos.';
        Alert.alert('Error', msg);
      } else {
        const data = await safeJson(res);
        const msg = data?.error || 'Ha ocurrido un error inesperado.';
        Alert.alert('Error', msg);
      }
    } catch (err) {
      Alert.alert('Error de conexión', 'No se pudo contactar con el servidor.');
    } finally {
      setSending(false);
    }
  };

  // ===============================
  //  RENDER DEL COMPONENTE
  // ===============================
  return (
    // Fondo con degradado suave 
      <LinearGradient
       colors={colors.gradient as unknown as [import("react-native").ColorValue, import("react-native").ColorValue, ...import("react-native").ColorValue[]]}
       style={styles.container}
      >


      {/* Evita que el teclado oculte los campos en iOS */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Título de la pantalla */}
          <Text style={styles.title}>Crear cuenta</Text>

          {/* Contenedor del formulario */}
          <View style={[styles.form, { width: maxWidth }]}>
            {/* Campo: Usuario */}
            <CustomInput
              placeholder="Usuario"
              value={form.username}
              onChangeText={(v: string) => setField('username', v)}
              error={errors.username}
            />

            {/* Campo: Contraseña */}
            <PasswordInput
              placeholder="Contraseña"
              value={form.password}
              onChangeText={(v: string) => setField('password', v)}
              error={errors.password}
              secureDefault={true}
            />

            {/* Indicador de fuerza de contraseña */}
            {!!form.password && (
              <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                Fortaleza: {passwordStrength.label}
              </Text>
            )}

            {/* Campo: Confirmar contraseña */}
            <PasswordInput
              placeholder="Confirmar contraseña"
              value={form.confirmPassword}
              onChangeText={(v: string) => setField('confirmPassword', v)}
              error={errors.confirmPassword}
              secureDefault={true}
            />

            {/* Campo: Email */}
            <CustomInput
              placeholder="Correo electrónico"
              value={form.email}
              onChangeText={(v: string) => setField('email', v)}
              error={errors.email}
              keyboardType="email-address"
            />

            {/* Campo: Nombre completo (opcional) */}
            <CustomInput
              placeholder="Nombre completo (opcional)"
              value={form.fullName}
              onChangeText={(v: string) => setField('fullName', v)}
            />

            {/* Campo: Fecha de nacimiento (opcional AAAA/MM/DD) */}
            <CustomInput
              placeholder="Fecha de nacimiento (AAAA/MM/DD)"
              value={form.birthDate}
              onChangeText={(v: string) => setField('birthDate', v)}
              error={errors.birthDate}
            />

            {/* Bloque de aceptación de términos */}
            <TouchableOpacity
              style={styles.termsRow}
              activeOpacity={0.8}
              onPress={() => setField('terms', !form.terms)}
            >
              <CheckBox
                value={form.terms}
                onValueChange={(v: boolean) => setField('terms', v)}
                tintColors={{ true: colors.primary, false: colors.textMuted }}
              />
              <Text style={styles.termsText}>
                Acepto los{' '}
                <Text
                  style={styles.link}
                  onPress={(e) => {
                    e.stopPropagation();
                    console.log('➡️ Navegar a Términos y Condiciones');
                  }}
                >
                  Términos y Condiciones
                </Text>{' '}
                y la{' '}
                <Text
                  style={styles.link}
                  onPress={(e) => {
                    e.stopPropagation();
                    console.log('➡️ Navegar a Política de Privacidad');
                  }}
                >
                  Política de Privacidad
                </Text>
              </Text>
            </TouchableOpacity>

            {!!errors.terms && <Text style={styles.error}>{errors.terms}</Text>}

            {/* Botón o loader */}
            {sending ? (
              <View style={{ marginTop: 10 }}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            ) : (
              <PrimaryButton text="Registrarse" onPress={onSubmit} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// ===============================
//  Función auxiliar: parsea JSON seguro
// ===============================
async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ===============================
//  ESTILOS
// ===============================
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 28,
    letterSpacing: 0.3,
  },
  form: {
    alignItems: 'center',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
  termsText: {
    color: colors.textDark,
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    fontSize: 13,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 6,
  },
  strengthLabel: {
    alignSelf: 'flex-start',
    fontWeight: '600',
    fontSize: 13,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 10,
  },
});

export default RegisterScreen;
