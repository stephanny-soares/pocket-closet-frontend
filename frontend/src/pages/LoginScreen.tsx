// src/pages/LoginScreen.tsx
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
import PrimaryButton from "components/PrimaryButton";
import colors from "../constants/colors";
import { validateEmail } from "../utils/validation";
import { useAuth } from "../hooks/useAuth";
import { logEvent } from "../logger/logEvent";

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

const LoginScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const maxWidth = isWeb ? Math.min(450, width * 0.9) : width * 0.9;

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const MAX_ATTEMPTS = 3;
  const LOCK_TIME = 30; // segundos

  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);


  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace("/home");
  }, [isAuthenticated]);

  const setField = (key: keyof typeof form, val: string) => {
    setForm((s) => ({ ...s, [key]: val }));
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};
    if (!form.email.trim()) newErrors.email = "El correo electrónico es obligatorio";
    else if (!validateEmail(form.email)) newErrors.email = "Formato de correo electrónico inválido";
    if (!form.password.trim()) newErrors.password = "La contraseña es obligatoria";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data: any = await response.json();
      const requestId = response.headers.get("x-request-id") || undefined;
      const correlationId = response.headers.get("x-correlation-id") || undefined;

      if (response.ok && data.token) {
        await login(
          data.token,
          data.usuario?.nombre || data.usuario?.name,
          data.usuario?.id,
          rememberMe
        );

        await logEvent({
          event: "UserLogin",
          message: "Inicio de sesión exitoso",
          userId: data.usuario?.id,
          requestId,
          correlationId,
        });
        Toast.show({
          type: "success",
          text1: "✅ Inicio de sesión exitoso",
          text2: "¡Bienvenido/a!",
          position: "bottom",
          visibilityTime: 3000,
          bottomOffset: 70,
        });
      } else {
          await logEvent({
            level: "warn",
            event: "LoginFailed",
            message: data.error || "Credenciales incorrectas",
            extra: { email: form.email },
            requestId,
            correlationId,
          });

          // Incrementar contador de intentos
          setAttempts((prev) => {
            const newAttempts = prev + 1;
            if (newAttempts >= MAX_ATTEMPTS) {
             setLocked(true);
             setLockTimer(LOCK_TIME);

             // Log del bloqueo
             logEvent({
               level: "warn",
               event: "AccountTemporarilyLocked",
               message: `Cuenta bloqueada temporalmente tras ${MAX_ATTEMPTS} intentos fallidos`,
               extra: { email: form.email },
              });

             // Iniciar temporizador
             const interval = setInterval(() => {
               setLockTimer((t) => {
                 if (t <= 1) {
                   clearInterval(interval);
                   setLocked(false);
                   setAttempts(0);
                   return 0;
                  }
                 return t - 1;
                });
              }, 1000);
            }
             return newAttempts;
          });

          Toast.show({
           type: "error",
            text1: "⚠️ Error",
           text2: data.error || "Credenciales incorrectas.",
           position: "bottom",
           visibilityTime: 3000,
           bottomOffset: 70,
          });
      }

    } catch (error: any) {
      await logEvent({
        level: "warn",
        event: "LoginFailed",
        message: error?.message || "Error al conectar con el servidor.",
        extra: { email: form.email },
      });
      Toast.show({
        type: "error",
        text1: "⚠️ Error de conexión",
        text2: "No se pudo conectar con el servidor.",
        position: "bottom",
        visibilityTime: 3000,
        bottomOffset: 70,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPress = () => {
    router.push("/register");
  };

  return (
    <LinearGradient colors={colors.gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={[styles.content, { maxWidth }]}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Inicio de sesión</Text>
              <Text style={styles.subtitle}>Accede a tu cuenta para continuar</Text>
            </View>

            <View style={styles.formContainer}>
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
              <View style={styles.rememberContainer}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
                  <Text style={styles.rememberText}>Recordarme</Text>
                </TouchableOpacity>
              </View>


              <View style={styles.buttonContainer}>
                <PrimaryButton
                  title={
                    locked
                    ? `Bloqueado (${lockTimer}s)`
                    : loading
                    ? "Iniciando..."
                    : "Iniciar sesión"
                  }
                  onPress={handleLogin}
                  loading={loading}
                  disabled={locked}
                />
                
            </View>
            {locked && (
              <Text style={{ color: "#E53935", textAlign: "center", marginTop: 12 }}>
               Demasiados intentos fallidos. Intenta nuevamente en {lockTimer}s.
              </Text>
            )}

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>¿No tienes cuenta?</Text>
                <TouchableOpacity onPress={handleRegisterPress}>
                  <Text style={styles.registerLink}> Regístrate</Text>
                </TouchableOpacity>
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
  title: { fontSize: 32, fontWeight: "bold", color: "#1E1E1E", marginBottom: 8, textAlign: "center" },
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
  buttonContainer: { marginTop: 24 },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: { color: "#666666" },
  registerLink: { color: "#4B0082", fontWeight: "bold" },
    rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#4B0082",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#4B0082",
  },
  rememberText: {
    color: "#444",
    fontSize: 14,
  },

});

export default LoginScreen;
