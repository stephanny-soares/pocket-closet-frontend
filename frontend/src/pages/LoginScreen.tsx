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
import { getClientInfo } from "../utils/getClientInfo";
import { useLoader } from "../context/LoaderContext";

declare const window: any;
const API_BASE = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

const LoginScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const maxWidth = isWeb ? Math.min(450, width * 0.9) : width * 0.9;

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<any>({});
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { showLoader, hideLoader } = useLoader();

  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.replace("/(protected)/home");
  }, [isAuthenticated]);

  // Mostrar mensajes si vienen parámetros en la URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);

      if (params.get("expired")) {
        setBannerMessage("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
      }

      if (params.get("loggedOut")) {
        setBannerMessage("👋 Tu sesión se cerró correctamente.");

        // Limpia el parámetro de la URL
        const url = new URL(window.location.href);
        url.searchParams.delete("loggedOut");
        window.history.replaceState({}, (document as any).title, url.toString());

        // Ocultar banner automáticamente tras 3 segundos
        const timeout = setTimeout(() => setBannerMessage(null), 3000);
        return () => clearTimeout(timeout);
      }
    }
  }, []);

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
    showLoader("Verificando credenciales...");

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

      if (response.ok && data.token) {
        await login(data.token, data.usuario?.nombre || data.usuario?.name, data.usuario?.id, rememberMe);

        Toast.show({
          type: "success",
          text1: "✅ Inicio de sesión exitoso",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 70,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "⚠️ Error",
          text2: data?.error || "Credenciales incorrectas.",
          position: "bottom",
          visibilityTime: 2500,
          bottomOffset: 70,
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error de conexión",
        text2: "No se pudo conectar con el servidor.",
        position: "bottom",
        visibilityTime: 2500,
        bottomOffset: 70,
      });
    } finally {
      hideLoader();
    }
  };

  const handleRegisterPress = () => {
    router.push("/register");
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
        {/* Banner superior de logout */}
        {bannerMessage && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{bannerMessage}</Text>
          </View>
        )}

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

              <View style={styles.buttonContainer}>
                <PrimaryButton title="Iniciar sesión" onPress={handleLogin} />
              </View>

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
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  banner: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bannerText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
  },
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
  buttonContainer: { marginTop: 24 },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: { color: "#666666" },
  registerLink: { color: "#4B0082", fontWeight: "bold" },
});

export default LoginScreen;
