import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import CustomInput from "components/CustomInput";
import PasswordInput from "components/PasswordInput";
import CheckBox from "components/CheckBox";
import PrimaryButton from "components/PrimaryButton";
import colors from "../constants/colors";
import { validateEmail, validatePassword, validatePasswordMatch } from "../utils/validation";
import { useAuth } from "../hooks/useAuth";
import { logEvent } from "../logger/logEvent";
import { useLoader } from "../context/LoaderContext"; // 👈 Loader global

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

const RegisterScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const maxWidth = isWeb ? Math.min(450, width * 0.9) : width * 0.9;

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [errors, setErrors] = useState<any>({});
  const [passwordStrength, setPasswordStrength] = useState({ label: "", color: "" });

  const { login, isAuthenticated } = useAuth();
  const { showLoader, hideLoader } = useLoader(); // 👈 Loader global

  useEffect(() => {
    if (isAuthenticated) router.replace("/home");
  }, [isAuthenticated]);

  const setField = (key: keyof typeof form, val: string | boolean) => {
    setForm((s) => ({ ...s, [key]: val }));
    if (key === "password" && typeof val === "string") evaluatePasswordStrength(val);
  };

  const evaluatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+.,;:?\-=]/.test(password)) score++;

    if (score <= 1) setPasswordStrength({ label: "Débil", color: "#E53935" });
    else if (score === 2) setPasswordStrength({ label: "Media", color: "#FFA726" });
    else if (score >= 3) setPasswordStrength({ label: "Fuerte", color: "#43A047" });
    else setPasswordStrength({ label: "", color: "" });
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};
    if (!form.name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!form.email.trim()) newErrors.email = "El correo electrónico es obligatorio";
    else if (!validateEmail(form.email)) newErrors.email = "Formato de correo electrónico inválido";
    if (!validatePassword(form.password))
      newErrors.password = "La contraseña debe tener al menos 8 caracteres, un número y un símbolo";
    if (!validatePasswordMatch(form.password, form.confirmPassword))
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    if (!form.terms)
      newErrors.terms = "Debes aceptar los Términos y la Política de Privacidad";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    showLoader("Creando tu cuenta..."); // 👈 Muestra loader

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

      const data: any = await response.json();

      if (response.ok && data.token) {
        await login(data.token, data.usuario?.nombre || data.usuario?.name, data.usuario?.id);

        await logEvent({
          event: "UserRegistered",
          message: "Nuevo usuario registrado correctamente",
          level: "info",
          extra: { email: form.email },
        });

        Toast.show({
          type: "success",
          text1: "🎉 Registro exitoso",
          text2: "Usuario creado correctamente",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 70,
        });
        setTimeout(() => {
         router.replace("/(protected)/questionnaire");
        }, 2100);

      } else {
        await logEvent({
          level: "warn",
          event: "RegisterFailed",
          message: data.error || "Fallo en registro de usuario",
          extra: { email: form.email },
        });

        Toast.show({
          type: "error",
          text1: "⚠️ Error",
          text2: data.error || "No se pudo registrar el usuario.",
          position: "bottom",
          visibilityTime: 3000,
          bottomOffset: 70,
        });
      }
    } catch (error: any) {
      await logEvent({
        event: "RegisterFailed",
        message: error?.message || "Error al conectar con el servidor",
        level: "warn",
        extra: { email: form.email },
      });

      Toast.show({
        type: "error",
        text1: "⚠️ Error de conexión",
        text2: "No se pudo conectar con el servidor. Inténtalo más tarde.",
        position: "bottom",
        visibilityTime: 3000,
        bottomOffset: 70,
      });
    } finally {
      hideLoader(); // 👈 Cierra loader
    }
  };

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={[styles.content, { maxWidth }]}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Crear cuenta</Text>
              <Text style={styles.subtitle}>Regístrate para comenzar</Text>
            </View>

            <View style={styles.formContainer}>
              <CustomInput
                label="Nombre completo"
                placeholder="Introduce tu nombre"
                value={form.name}
                onChangeText={(val: string) => setField("name", val)}
                error={errors.name}
              />

              <CustomInput
                label="Correo electrónico"
                placeholder="Introduce tu correo"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(val: string) => setField("email", val)}
                error={errors.email}
              />

              <PasswordInput
                label="Contraseña"
                placeholder="Introduce tu contraseña"
                value={form.password}
                onChangeText={(val: string) => setField("password", val)}
                error={errors.password}
              />

              {passwordStrength.label ? (
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  Fuerza: {passwordStrength.label}
                </Text>
              ) : null}

              <PasswordInput
                label="Confirmar contraseña"
                placeholder="Repite tu contraseña"
                value={form.confirmPassword}
                onChangeText={(val: string) => setField("confirmPassword", val)}
                error={errors.confirmPassword}
              />

              <View style={styles.termsSection}>
                <CheckBox checked={form.terms} onToggle={() => setField("terms", !form.terms)} label="" />
                <Text style={styles.termsText}>
                  Acepto los{" "}
                  <TouchableOpacity>
                    <Text style={styles.termsLink}>Términos y Condiciones</Text>
                  </TouchableOpacity>{" "}
                  y la{" "}
                  <TouchableOpacity>
                    <Text style={styles.termsLink}>Política de Privacidad</Text>
                  </TouchableOpacity>
                </Text>
              </View>

              {errors.terms && <Text style={styles.error}>{errors.terms}</Text>}

              <View style={styles.buttonContainer}>
                <PrimaryButton title="Registrar" onPress={handleSubmit} />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1, minHeight: "100vh" as any },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  content: { width: "100%", alignSelf: "center" },
  titleSection: { marginBottom: 40, alignItems: "center" },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1E1E1E",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: { fontSize: 16, color: "#666666", textAlign: "center" },
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
  },
  strengthText: { fontSize: 12, marginBottom: 12 },
  termsSection: { marginTop: 16, marginBottom: 16 },
  termsText: { color: "#666666", fontSize: 14, marginLeft: 32, marginTop: -24 },
  termsLink: { color: "#4B0082", textDecorationLine: "underline" },
  error: { color: "#E53935", fontSize: 12, marginTop: 8 },
  buttonContainer: { marginTop: 24 },
});

export default RegisterScreen;
