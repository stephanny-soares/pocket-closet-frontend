// ================================================
//  RegisterScreen.tsx
//  Pantalla de registro con conexión al backend
//  Adaptada a NativeWind + LinearGradient + Dark Mode automático
// ================================================

import React, { useState } from "react";
import { useWindowDimensions } from "react-native";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import CustomInput from "../components/CustomInput";
import PasswordInput from "../components/PasswordInput";
import CheckBox from "../components/CheckBox";
import PrimaryButton from "../components/PrimaryButton";
import colors from "../constants/colors";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from "../utils/validation";

// ===============================
//  Tipos de datos
// ===============================
interface FormState {
  password: string;
  confirmPassword: string;
  email: string;
  terms: boolean;
}

interface Errors {
  password?: string;
  confirmPassword?: string;
  email?: string;
  terms?: string;
  captcha?: string;
}

interface PasswordStrength {
  label: string;
  color: string;
}

// URL base del backend (leída del .env, con fallback a localhost)
const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const RegisterScreen: React.FC = () => {
  // Hook que da el ancho actual de la pantalla (para comportamiento responsive)
  const { width } = useWindowDimensions();

  // Define el ancho máximo del formulario (420px en desktop, 88% en móvil)
  const maxWidth = Math.min(420, width * 0.88);

  // Detectar modo del sistema (claro / oscuro)
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // Estado que almacena los valores del formulario
  const [form, setForm] = useState<FormState>({
    password: "",
    confirmPassword: "",
    email: "",
    terms: false, // checkbox de Términos y Condiciones
  });

  // Estado para almacenar los errores de validación
  const [errors, setErrors] = useState<Errors>({});

  // Estado para mostrar animación de carga al enviar datos
  const [sending, setSending] = useState(false);

  // Estado para fuerza de contraseña
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    label: "",
    color: "",
  });

  /* Implementar cuando se conecte con el Backend
  // Referencia y token del Captcha
  const recaptchaRef = useRef<GoogleReCaptcha>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  */

  // Función auxiliar para actualizar cualquier campo del formulario
  const setField = (key: keyof FormState, val: string | boolean) => {
    setForm((s) => ({ ...s, [key]: val }));

    // Si el campo cambiado es contraseña, calculamos su fuerza
    if (key === "password" && typeof val === "string") evaluatePasswordStrength(val);
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
      setPasswordStrength({ label: "Débil", color: "#E53935" });
    else if (score === 2)
      setPasswordStrength({ label: "Media", color: "#FFA726" });
    else if (score >= 3)
      setPasswordStrength({ label: "Fuerte", color: "#43A047" });
    else setPasswordStrength({ label: "", color: "" });
  };

  // ===============================
  // VALIDACIÓN DEL FORMULARIO
  // ===============================
  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!form.email.trim()) newErrors.email = "El correo electrónico es obligatorio";
    else if (!validateEmail(form.email))
      newErrors.email = "Formato de correo electrónico inválido";

    if (!validatePassword(form.password))
      newErrors.password =
        "La contraseña debe tener al menos 8 caracteres, un número y un símbolo";

    if (!validatePasswordMatch(form.password, form.confirmPassword))
      newErrors.confirmPassword = "Las contraseñas no coinciden";

    if (!form.terms)
      newErrors.terms =
        "Debes aceptar los Términos y la Política de Privacidad";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===============================
  // ENVÍO DE FORMULARIO AL BACKEND
  // ===============================
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSending(true);

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Registro exitoso",
          data.message || "Usuario creado correctamente."
        );
        setForm({
          email: "",
          password: "",
          confirmPassword: "",
          terms: false,
        });
        setPasswordStrength({ label: "", color: "" });
      } else {
        Alert.alert("Error", data.error || "No se pudo registrar el usuario.");
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar con el servidor. Inténtalo más tarde."
      );
    } finally {
      setSending(false);
    }
  };

  // ===============================
  // MANEJO DE TÉRMINOS Y PRIVACIDAD
  // ===============================
  const handleTermsPress = () =>
    Alert.alert(
      "Términos y Condiciones",
      "Aquí se mostrará el enlace o vista de términos."
    );

  const handlePrivacyPress = () =>
    Alert.alert(
      "Política de Privacidad",
      "Aquí se mostrará el enlace o vista de privacidad."
    );

  // ===============================
  // RENDERIZADO PRINCIPAL
  // ===============================
  return (
    <LinearGradient
      colors={colors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 justify-center items-center"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 w-full justify-center items-center"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          className="w-full px-8"
        >
          {/* ---------- Título ---------- */}
          <View
            style={{ maxWidth }}
            className="w-full items-center mb-8 mt-8 self-center"
          >
            <Text
              className={`text-3xl font-bold mb-2 text-center ${
                isDark ? "text-white" : "text-textDark"
              }`}
            >
              Crear cuenta
            </Text>

          </View>

          {/* ---------- Formulario ---------- */}
          <View style={{ maxWidth }} className="self-center w-full">
            {/* Email */}
            <CustomInput
              label="Correo electrónico"
              placeholder="Introduce tu correo"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(val) => setField("email", val)}
              error={errors.email}
            />

            {/* Contraseña */}
            <PasswordInput
              label="Contraseña"
              placeholder="Introduce tu contraseña"
              value={form.password}
              onChangeText={(val) => setField("password", val)}
              error={errors.password}
            />

            {/* Indicador de fuerza de contraseña */}
            {passwordStrength.label ? (
              <Text
                className={`text-sm mt-1 mb-2 ${
                  isDark ? "text-gray-200" : "text-textDark"
                }`}
                style={{ color: passwordStrength.color }}
              >
                Fuerza: {passwordStrength.label}
              </Text>
            ) : null}

            {/* Confirmar contraseña */}
            <PasswordInput
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              value={form.confirmPassword}
              onChangeText={(val) => setField("confirmPassword", val)}
              error={errors.confirmPassword}
            />

            {/* Política de privacidad */}
            <View className="mt-4">
              <CheckBox
                checked={form.terms}
                onToggle={() => setField("terms", !form.terms)}
                label=""
              />
              <Text
                className={`text-sm flex-wrap leading-5 ml-8 -mt-6 ${
                  isDark ? "text-gray-300" : "text-textMuted"
                }`}
              >
                Acepto los{" "}
                <TouchableOpacity onPress={handleTermsPress}>
                  <Text className="text-primary underline">
                    Términos y Condiciones
                  </Text>
                </TouchableOpacity>{" "}
                y la{" "}
                <TouchableOpacity onPress={handlePrivacyPress}>
                  <Text className="text-primary underline">
                    Política de Privacidad
                  </Text>
                </TouchableOpacity>
              </Text>
              {errors.terms && (
                <Text className="text-error text-sm mt-2 ml-8">
                  {errors.terms}
                </Text>
              )}
            </View>

            {/* Botón */}
            <View className="mt-8 mb-12">
              <PrimaryButton
                title={sending ? "Registrando..." : "Registrar"}
                onPress={handleSubmit}
                loading={sending}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default RegisterScreen;
