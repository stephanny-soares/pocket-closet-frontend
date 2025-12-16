import React, { useEffect, useState } from "react";
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

import colors from "../constants/colors";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from "../utils/validation";
import { apiRequest } from "../utils/apiClient";
import { useAuth } from "../hooks/useAuth";
import { logEvent } from "../logger/logEvent";
import { useLoader } from "../context/LoaderContext";

// UI Maison
import InputMaison from "../components/ui/InputMaison";
import PasswordInputMaison from "../components/ui/PasswordInputMaison";
import CheckBoxMaison from "../components/ui/CheckBoxMaison";
import PrimaryButton from "../components/ui/PrimaryButton";
import TitleSerif from "../components/ui/TitleSerif";
import BodyText from "../components/ui/BodyText";

/* ────────────────────────────────── */
/* Types */
/* ────────────────────────────────── */
interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

interface RegisterErrors {
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

/* ────────────────────────────────── */
/* Screen */
/* ────────────────────────────────── */
const RegisterScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const maxWidth = isWeb ? Math.min(450, width * 0.9) : width * 0.9;

  const { login, isAuthenticated } = useAuth();
  const { showLoader, hideLoader } = useLoader();

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [errors, setErrors] = useState<RegisterErrors>({});
  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrength | null>(null);

  /* ──────────────────────────────── */
  /* Redirect if logged */
  /* ──────────────────────────────── */
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(protected)/home");
    }
  }, [isAuthenticated]);

  /* ──────────────────────────────── */
  /* Helpers */
  /* ──────────────────────────────── */
  const setField = (key: keyof RegisterForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === "password" && typeof value === "string") {
      evaluatePasswordStrength(value);
    }
  };

  const evaluatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1)
      setPasswordStrength({ label: "Débil", color: colors.danger });
    else if (score === 2)
      setPasswordStrength({ label: "Media", color: colors.warning });
    else
      setPasswordStrength({ label: "Fuerte", color: colors.success });
  };

  const validateForm = (): boolean => {
    const newErrors: RegisterErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    if (!form.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Formato de correo electrónico inválido";
    }

    if (!validatePassword(form.password)) {
      newErrors.password =
        "Debe tener al menos 8 caracteres, un número y un símbolo";
    }

    if (!validatePasswordMatch(form.password, form.confirmPassword)) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (!form.terms) {
      newErrors.terms =
        "Debes aceptar los Términos y la Política de Privacidad";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ──────────────────────────────── */
  /* Submit */
  /* ──────────────────────────────── */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    showLoader("Creando tu cuenta...");

    try {
      const data = await apiRequest<{
        token: string;
        usuario: { id: string; nombre?: string; name?: string };
      }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      await logEvent({
        event: "UserRegistered",
        message: "Nuevo usuario registrado correctamente",
        extra: { email: form.email },
      });

      await login(
        data.token,
        data.usuario?.nombre || data.usuario?.name,
        data.usuario?.id
      );

      Toast.show({
        type: "success",
        text1: "🎉 Registro exitoso",
        text2: "Usuario creado correctamente",
        position: "bottom",
      });

      setTimeout(() => {
        router.replace("/(protected)/questionnaire");
      }, 1800);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "No se pudo registrar el usuario",
        position: "bottom",
      });
    } finally {
      hideLoader();
    }
  };

  /* ──────────────────────────────── */
  /* Render */
  /* ──────────────────────────────── */
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <View style={[styles.card, { maxWidth }]}>
          <TitleSerif style={styles.title}>Crear cuenta</TitleSerif>
          <BodyText style={styles.subtitle}>
            Regístrate para comenzar
          </BodyText>

          <InputMaison
            label="Nombre completo"
            value={form.name}
            onChangeText={(v) => setField("name", v)}
            error={errors.name}
          />

          <InputMaison
            label="Correo electrónico"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(v) => setField("email", v)}
            error={errors.email}
          />

          <PasswordInputMaison
            label="Contraseña"
            value={form.password}
            onChangeText={(v) => setField("password", v)}
            error={errors.password}
          />

          {passwordStrength && (
            <Text
              style={[
                styles.strength,
                { color: passwordStrength.color },
              ]}
            >
              Fuerza: {passwordStrength.label}
            </Text>
          )}

          <PasswordInputMaison
            label="Confirmar contraseña"
            value={form.confirmPassword}
            onChangeText={(v) => setField("confirmPassword", v)}
            error={errors.confirmPassword}
          />

          <View style={styles.termsRow}>
            <CheckBoxMaison
              checked={form.terms}
              onToggle={() => setField("terms", !form.terms)}
            />
            <Text style={styles.termsText}>
              Acepto los{" "}
              <Text style={styles.termsLink}>Términos y Condiciones</Text>{" "}
              y la{" "}
              <Text style={styles.termsLink}>
                Política de Privacidad
              </Text>
            </Text>
          </View>

          {errors.terms && (
            <Text style={styles.errorText}>{errors.terms}</Text>
          )}

          <PrimaryButton
            title="Registrar"
            onPress={handleSubmit}
            style={{ marginTop: 28 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

/* ────────────────────────────────── */
/* Styles */
/* ────────────────────────────────── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    textAlign: "center",
    color: colors.textSecondary,
    marginBottom: 28,
  },
  strength: {
    fontSize: 12,
    marginTop: -6,
    marginBottom: 12,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  termsText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  termsLink: {
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 6,
  },
});
