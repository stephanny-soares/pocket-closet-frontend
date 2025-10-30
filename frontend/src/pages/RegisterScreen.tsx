import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

interface PasswordStrength {
  label: string;
  color: string;
}

const RegisterScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const maxWidth = isWeb ? Math.min(450, width * 0.9) : width * 0.9;

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    label: "",
    color: "",
  });

  const setField = (key: keyof FormState, val: string | boolean) => {
    setForm((s) => ({ ...s, [key]: val }));
    if (key === "password" && typeof val === "string") evaluatePasswordStrength(val);
  };

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

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!form.name.trim()) newErrors.name = "El nombre es obligatorio";

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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSending(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Guardar token y datos del usuario
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userName', data.usuario?.name || 'Usuario');
          localStorage.setItem('userId', data.usuario?.id || '');
        }
        Alert.alert(
          "Registro exitoso",
          "Usuario creado correctamente."
        );
        setForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          terms: false,
        });
        setPasswordStrength({ label: "", color: "" });
        router.push("/home");
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

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient as any}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView as any}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent as any}
        >
          <View style={[styles.content, { maxWidth }] as any}>
            <View style={styles.titleSection as any}>
              <Text style={styles.title as any}>Crear cuenta</Text>
              <Text style={styles.subtitle as any}>Regístrate para comenzar</Text>
            </View>

            <View style={styles.formContainer as any}>
              <CustomInput
                label="Nombre completo"
                placeholder="Introduce tu nombre"
                value={form.name}
                onChangeText={(val) => setField("name", val)}
                error={errors.name}
              />

              <CustomInput
                label="Correo electrónico"
                placeholder="Introduce tu correo"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(val) => setField("email", val)}
                error={errors.email}
              />

              <PasswordInput
                label="Contraseña"
                placeholder="Introduce tu contraseña"
                value={form.password}
                onChangeText={(val) => setField("password", val)}
                error={errors.password}
              />

              {passwordStrength.label ? (
                <Text
                  style={[styles.strengthText as any, { color: passwordStrength.color }]}
                >
                  Fuerza: {passwordStrength.label}
                </Text>
              ) : null}

              <PasswordInput
                label="Confirmar contraseña"
                placeholder="Repite tu contraseña"
                value={form.confirmPassword}
                onChangeText={(val) => setField("confirmPassword", val)}
                error={errors.confirmPassword}
              />

              <View style={styles.termsSection as any}>
                <CheckBox
                  checked={form.terms}
                  onToggle={() => setField("terms", !form.terms)}
                  label=""
                />
                <Text style={styles.termsText as any}>
                  Acepto los{" "}
                  <TouchableOpacity onPress={handleTermsPress}>
                    <Text style={styles.termsLink as any}>
                      Términos y Condiciones
                    </Text>
                  </TouchableOpacity>{" "}
                  y la{" "}
                  <TouchableOpacity onPress={handlePrivacyPress}>
                    <Text style={styles.termsLink as any}>
                      Política de Privacidad
                    </Text>
                  </TouchableOpacity>
                </Text>
              </View>
              {errors.terms && (
                <Text style={styles.error as any}>{errors.terms}</Text>
              )}

              <View style={styles.buttonContainer as any}>
                <PrimaryButton
                  title={sending ? "Registrando..." : "Registrar"}
                  onPress={handleSubmit}
                  loading={sending}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    minHeight: "100vh" as any,
  } as any,
  keyboardView: {
    flex: 1,
  } as any,
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 40,
  } as any,
  content: {
    width: "100%",
    alignSelf: "center",
  } as any,
  titleSection: {
    marginBottom: 40,
    alignItems: "center",
  } as any,
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1E1E1E",
    marginBottom: 8,
    textAlign: "center",
  } as any,
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  } as any,
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  } as any,
  strengthText: {
    fontSize: 12,
    marginBottom: 12,
  } as any,
  termsSection: {
    marginTop: 16,
    marginBottom: 16,
  } as any,
  termsText: {
    color: "#666666",
    fontSize: 14,
    marginLeft: 32,
    marginTop: -24,
  } as any,
  termsLink: {
    color: "#4B0082",
    textDecorationLine: "underline",
  } as any,
  error: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 8,
  } as any,
  buttonContainer: {
    marginTop: 24,
  } as any,
});

export default RegisterScreen;
