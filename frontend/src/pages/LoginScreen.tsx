import React, { useState, useEffect } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

import colors from "../constants/colors";
import { validateEmail } from "../utils/validation";
import { useAuth } from "../hooks/useAuth";
import { logEvent } from "../logger/logEvent";
import { getClientInfo } from "../utils/getClientInfo";
import { useLoader } from "../context/LoaderContext";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";

// ✅ NUEVOS COMPONENTES MAISON
import TitleSerif from "components/ui/TitleSerif";
import BodyText from "components/ui/BodyText";
import PrimaryButton from "components/ui/PrimaryButton";
import InputMaison from "components/ui/InputMaison";
import PasswordInputMaison from "components/ui/PasswordInputMaison";
import CheckBoxMaison from "components/ui/CheckBoxMaison";

WebBrowser.maybeCompleteAuthSession();

declare const window: any;

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  ""
);

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
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_ID,
  });

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
        await login(
          data.token,
          data.usuario?.nombre || data.usuario?.name,
          data.usuario?.id,
          rememberMe
        );

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

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();

      if (result?.type === "success") {
        const idToken = result.authentication?.idToken;

        const res = await fetch(`${API_BASE}/api/auth/oauth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken }),
        });

        const data = await res.json();

        if (res.ok && data.token) {
          await login(data.token, data.usuario?.name, data.usuario?.id, true);

          Toast.show({
            type: "success",
            text1: "Inicio de sesión con Google exitoso",
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Error con Google",
            text2: data.error || "No se pudo iniciar sesión",
          });
        }
      }
    } catch (error) {
      console.log("Google login error:", error);
      Toast.show({
        type: "error",
        text1: "Error inesperado",
      });
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== "ios") {
      Toast.show({
        type: "info",
        text1: "Apple Login no disponible",
        text2: "Solo funciona en dispositivos iOS reales.",
      });
      return;
    }

    try {
      const appleResponse = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const res = await fetch(`${API_BASE}/api/auth/oauth/apple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: appleResponse.identityToken }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        await login(data.token, data.usuario?.name, data.usuario?.id, true);
        Toast.show({
          type: "success",
          text1: "Inicio de sesión con Apple exitoso",
        });
      }
    } catch (error: any) {
      if (error?.code !== "ERR_CANCELED") {
        Toast.show({
          type: "error",
          text1: "No se pudo iniciar sesión con Apple",
        });
      }
    }
  };

  const handleRegisterPress = () => {
    router.push("/register");
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Banner superior de logout */}
        {bannerMessage && (
          <View style={styles.banner}>
            <BodyText style={styles.bannerText}>{bannerMessage}</BodyText>
          </View>
        )}

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.content, { maxWidth }]}>
            <View style={styles.card}>
              {/* Título editorial */}
              <TitleSerif style={styles.title}>Inicio de sesión</TitleSerif>
              <BodyText style={styles.subtitle}>
                Accede a tu cuenta para continuar
              </BodyText>

              {/* FORM */}
              <View style={{ marginTop: 28 }}>
                <InputMaison
                  label="Correo electrónico"
                  placeholder="Introduce tu correo"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={(val: string) => setField("email", val)}
                  error={errors.email}
                />

                <PasswordInputMaison
                  label="Contraseña"
                  placeholder="Introduce tu contraseña"
                  value={form.password}
                  onChangeText={(val: string) => setField("password", val)}
                  error={errors.password}
                />
              </View>

              {/* Recordarme */}
              <View style={styles.rememberRow}>
                <CheckBoxMaison
                  checked={rememberMe}
                  onToggle={() => setRememberMe(!rememberMe)}
                />
                <BodyText style={styles.rememberText}>Recordarme</BodyText>
              </View>

              {/* Botón principal */}
              <PrimaryButton
                title="Iniciar sesión"
                onPress={handleLogin}
                style={{ marginTop: 12 }}
              />

              {/* Social */}
              <View style={styles.socialRow}>
                {/* GOOGLE */}
                <TouchableOpacity style={styles.socialCircle} onPress={handleGoogleLogin}>
                  <Image
                    source={require("../../assets/icons/google.png")}
                    style={styles.socialIcon}
                  />
                </TouchableOpacity>

                {/* APPLE */}
                <TouchableOpacity style={styles.socialCircle} onPress={handleAppleLogin}>
                  <Image
                    source={require("../../assets/icons/apple.png")}
                    style={styles.socialIcon}
                  />
                </TouchableOpacity>
              </View>

              {/* Registro */}
              <View style={styles.registerContainer}>
                <BodyText style={styles.registerText}>¿No tienes cuenta?</BodyText>
                <TouchableOpacity onPress={handleRegisterPress}>
                  <BodyText style={styles.registerLink}> Regístrate</BodyText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F1EB", // fondo crema Neutral Closet
  },
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

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 26,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },

  title: {
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    color: colors.textSecondary,
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 18,
  },
  rememberText: {
    marginLeft: 10,
    color: "#333",
  },

  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
    gap: 20,
  },
  socialCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  socialIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  registerText: {
    color: "#666666",
  },
  registerLink: {
    color: colors.primary,
    fontWeight: "600",
  },
});

export default LoginScreen;
