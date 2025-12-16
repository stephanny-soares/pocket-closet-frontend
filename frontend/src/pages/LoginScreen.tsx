import React, { useEffect, useState } from "react";
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
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";

import colors from "../constants/colors";
import { validateEmail } from "../utils/validation";
import { apiRequest } from "../utils/apiClient";
import { useAuth } from "../hooks/useAuth";
import { logEvent } from "../logger/logEvent";
import { getClientInfo } from "../utils/getClientInfo";
import { useLoader } from "../context/LoaderContext";

// UI Maison
import TitleSerif from "components/ui/TitleSerif";
import BodyText from "components/ui/BodyText";
import PrimaryButton from "components/ui/PrimaryButton";
import InputMaison from "components/ui/InputMaison";
import PasswordInputMaison from "components/ui/PasswordInputMaison";
import CheckBoxMaison from "components/ui/CheckBoxMaison";

WebBrowser.maybeCompleteAuthSession();

/* ────────────────────────────────── */
/* Types */
/* ────────────────────────────────── */
interface LoginForm {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

/* ────────────────────────────────── */
/* Hook banner web (expired / logout) */
/* ────────────────────────────────── */
function useLoginBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const params = new URLSearchParams(window.location.search);

    if (params.get("expired")) {
      setMessage("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
    }

    if (params.get("loggedOut")) {
      setMessage("👋 Tu sesión se cerró correctamente.");

      const url = new URL(window.location.href);
      url.searchParams.delete("loggedOut");
      window.history.replaceState({}, document.title, url.toString());

      const timeout = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, []);

  return message;
}

/* ────────────────────────────────── */
/* Screen */
/* ────────────────────────────────── */
const LoginScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const maxWidth = isWeb ? Math.min(450, width * 0.9) : width * 0.9;

  const { login, isAuthenticated } = useAuth();
  const { showLoader, hideLoader } = useLoader();

  const bannerMessage = useLoginBanner();

  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [rememberMe, setRememberMe] = useState(false);

  /* ──────────────────────────────── */
  /* Google OAuth config */
  /* ──────────────────────────────── */
  const redirectUri = makeRedirectUri({ scheme: "pocketcloset" });

  const [, , promptGoogle] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_ID,
    redirectUri,
  });

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
  const setField = (key: keyof LoginForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Formato de correo electrónico inválido";
    }

    if (!form.password.trim()) {
      newErrors.password = "La contraseña es obligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ──────────────────────────────── */
  /* Login normal */
  /* ──────────────────────────────── */
  const handleLogin = async () => {
    if (!validateForm()) return;

    showLoader("Verificando credenciales...");

    logEvent({
      event: "LoginAttempt",
      message: "Intento de inicio de sesión",
      extra: { email: form.email },
    });

    try {
      const client = await getClientInfo();

      const data = await apiRequest<{
        token: string;
        usuario: { id: string; nombre?: string; name?: string };
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          client,
        }),
      });

      await logEvent({
        event: "LoginSuccess",
        message: "Inicio de sesión exitoso",
        extra: { userId: data.usuario?.id },
      });

      await login(
        data.token,
        data.usuario?.nombre || data.usuario?.name,
        data.usuario?.id,
        rememberMe
      );

      Toast.show({
        type: "success",
        text1: "Inicio de sesión correcto",
        position: "bottom",
      });
    } catch (err: any) {
      logEvent({
        level: "warn",
        event: "LoginFailed",
        message: err.message,
        extra: { email: form.email },
      });

      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Credenciales incorrectas",
        position: "bottom",
      });
    } finally {
      hideLoader();
    }
  };

  /* ──────────────────────────────── */
  /* Google Login */
  /* ──────────────────────────────── */
  const handleGoogleLogin = async () => {
    try {
      const result = await promptGoogle();

      if (result?.type !== "success") return;

      const token =
        result.authentication?.idToken ||
        result.authentication?.accessToken;

      const data = await apiRequest<any>("/api/auth/oauth/google", {
        method: "POST",
        body: JSON.stringify({ id_token: token }),
      });

      await login(data.token, data.usuario?.name, data.usuario?.id, true);

      Toast.show({ type: "success", text1: "Inicio con Google exitoso" });
    } catch (err: any) {
      logEvent({
        level: "error",
        event: "LoginGoogleError",
        message: err.message,
      });

      Toast.show({
        type: "error",
        text1: "Error con Google",
        text2: err.message,
      });
    }
  };

  /* ──────────────────────────────── */
  /* Apple Login */
  /* ──────────────────────────────── */
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
      const apple = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      const data = await apiRequest<any>("/api/auth/oauth/apple", {
        method: "POST",
        body: JSON.stringify({ id_token: apple.identityToken }),
      });

      await login(data.token, data.usuario?.name, data.usuario?.id, true);

      Toast.show({ type: "success", text1: "Inicio con Apple exitoso" });
    } catch (err: any) {
      if (err?.code !== "ERR_CANCELED") {
        Toast.show({
          type: "error",
          text1: "No se pudo iniciar sesión con Apple",
        });
      }
    }
  };

  /* ──────────────────────────────── */
  /* Render */
  /* ──────────────────────────────── */
  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {bannerMessage && (
          <View style={styles.banner}>
            <BodyText style={styles.bannerText}>{bannerMessage}</BodyText>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.card, { maxWidth }]}>
            <TitleSerif style={styles.title}>Inicio de sesión</TitleSerif>
            <BodyText style={styles.subtitle}>
              Accede a tu cuenta para continuar
            </BodyText>

            <InputMaison
              label="Correo electrónico"
              value={form.email}
              keyboardType="email-address"
              onChangeText={(v) => setField("email", v)}
              error={errors.email}
            />

            <PasswordInputMaison
              label="Contraseña"
              value={form.password}
              onChangeText={(v) => setField("password", v)}
              error={errors.password}
            />

            <View style={styles.rememberRow}>
              <CheckBoxMaison
                checked={rememberMe}
                onToggle={() => setRememberMe(!rememberMe)}
              />
              <BodyText style={styles.rememberText}>Recordarme</BodyText>
            </View>

            <PrimaryButton title="Iniciar sesión" onPress={handleLogin} />

            <View style={styles.socialRow}>
              <TouchableOpacity onPress={handleGoogleLogin}>
                <Image
                  source={require("../../assets/icons/google.png")}
                  style={styles.socialIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleAppleLogin}>
                <Image
                  source={require("../../assets/icons/apple.png")}
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.registerRow}>
              <BodyText>¿No tienes cuenta?</BodyText>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <BodyText style={styles.registerLink}> Regístrate</BodyText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

/* ────────────────────────────────── */
/* Styles */
/* ────────────────────────────────── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  banner: {
    backgroundColor: colors.primary,
    padding: 12,
  },
  bannerText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 26,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: colors.textSecondary,
    marginBottom: 24,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  rememberText: {
    marginLeft: 10,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 24,
  },
  socialIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  registerLink: {
    color: colors.primary,
    fontWeight: "600",
  },
});
