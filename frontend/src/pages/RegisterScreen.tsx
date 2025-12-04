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
import { router } from "expo-router";
import Toast from "react-native-toast-message";

import InputMaison from "../components/ui/InputMaison";
import PasswordInputMaison from "../components/ui/PasswordInputMaison";
import CheckBoxMaison from "../components/ui/CheckBoxMaison";
import PrimaryButton from "../components/ui/PrimaryButton";

import TitleSerif from "../components/ui/TitleSerif";
import BodyText from "../components/ui/BodyText";

import colors from "../constants/colors";
import { validateEmail, validatePassword, validatePasswordMatch } from "../utils/validation";
import { useAuth } from "../hooks/useAuth";
import { logEvent } from "../logger/logEvent";
import { useLoader } from "../context/LoaderContext";

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
  const { showLoader, hideLoader } = useLoader();

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

    showLoader("Creando tu cuenta...");

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
      Toast.show({
        type: "error",
        text1: "⚠️ Error de conexión",
        text2: "No se pudo conectar con el servidor.",
      });
    } finally {
      hideLoader();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.cardWrapper, { maxWidth }]}>
          <View style={styles.card}>
            
            {/* TITLE */}
            <TitleSerif style={styles.title}>Crear cuenta</TitleSerif>
            <BodyText style={styles.subtitle}>Regístrate para comenzar</BodyText>

            {/* NAME */}
            <InputMaison
              label="Nombre completo"
              placeholder="Introduce tu nombre"
              value={form.name}
              onChangeText={(v: string) => setField("name", v)}
              error={errors.name}
            />

            {/* EMAIL */}
            <InputMaison
              label="Correo electrónico"
              placeholder="Introduce tu correo"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(v: string) => setField("email", v)}
              error={errors.email}
            />

            {/* PASSWORD */}
            <PasswordInputMaison
              label="Contraseña"
              placeholder="Introduce tu contraseña"
              value={form.password}
              onChangeText={(v: string) => setField("password", v)}
              error={errors.password}
            />

            {/* STRENGTH */}
            {passwordStrength.label ? (
              <Text style={[styles.strength, { color: passwordStrength.color }]}>
                Fuerza: {passwordStrength.label}
              </Text>
            ) : null}

            {/* CONFIRM PASSWORD */}
            <PasswordInputMaison
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              value={form.confirmPassword}
              onChangeText={(v: string) => setField("confirmPassword", v)}
              error={errors.confirmPassword}
            />

            {/* TERMS */}
            <View style={styles.termsRow}>
              <CheckBoxMaison
                checked={form.terms}
                onToggle={() => setField("terms", !form.terms)}
              />

              <Text style={styles.termsText}>
                Acepto los{" "}
                <Text style={styles.termsLink}>Términos y Condiciones</Text>{" "}
                y la{" "}
                <Text style={styles.termsLink}>Política de Privacidad</Text>
              </Text>
            </View>

            {errors.terms && <Text style={styles.error}>{errors.terms}</Text>}

            {/* SUBMIT */}
            <PrimaryButton title="Registrar" onPress={handleSubmit} style={{ marginTop: 28 }} />

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  cardWrapper: {
    width: "100%",
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 30,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 15,
    color: "#777",
    marginBottom: 28,
  },
  strength: {
    marginTop: -4,
    marginBottom: 12,
    fontSize: 12,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  termsText: {
    marginLeft: 8,
    color: "#444",
    flex: 1,
    fontSize: 13,
  },
  termsLink: {
    color: "#A5A5A5",
    textDecorationLine: "underline",
  },
  error: {
    fontSize: 12,
    color: "#E53935",
    marginTop: 6,
  },
});

export default RegisterScreen;
