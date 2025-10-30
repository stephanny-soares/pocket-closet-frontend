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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { v4 as uuidv4 } from "uuid";
import CustomInput from "../components/CustomInput";
import PasswordInput from "../components/PasswordInput";
import PrimaryButton from "../components/PrimaryButton";
import colors from "../constants/colors";
import { validateEmail, validatePassword } from "../utils/validation";

const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const LoginScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const maxWidth = isWeb ? Math.min(450, width * 0.9) : width * 0.9;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [sending, setSending] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = "El correo electrónico es obligatorio";
    else if (!validateEmail(email))
      newErrors.email = "Formato de correo electrónico inválido";
    if (!validatePassword(password))
      newErrors.password =
        "La contraseña debe tener al menos 8 caracteres, un número y un símbolo";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setSending(true);
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Inicio de sesión exitoso", data.message || "Bienvenido/a");
        router.push("/home");
      } else {
        Alert.alert("Error", data.error || "Credenciales incorrectas.");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar con el servidor. Inténtalo más tarde."
      );
    } finally {
      setSending(false);
    }
  };

  const handleGuestAccess = () => {
    const guestId = uuidv4();
    Alert.alert("Acceso como invitado", "Has iniciado sesión como invitado.");
    router.push("/home");
  };

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
              <Text style={styles.title as any}>Bienvenido</Text>
              <Text style={styles.subtitle as any}>Inicia sesión para continuar</Text>
            </View>

            <View style={styles.formContainer as any}>
              <CustomInput
                label="Correo electrónico"
                placeholder="Introduce tu correo"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
              />

              <PasswordInput
                label="Contraseña"
                placeholder="Introduce tu contraseña"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
              />

              <View style={styles.buttonContainer as any}>
                <PrimaryButton
                  title={sending ? "Ingresando..." : "Iniciar sesión"}
                  onPress={handleLogin}
                  loading={sending}
                />
              </View>

              <TouchableOpacity onPress={handleGuestAccess} style={styles.guestButton as any}>
                <Text style={styles.guestButtonText as any}>Acceder como invitado</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.socialSection as any}>
              <Text style={styles.socialLabel as any}>O inicia sesión con</Text>
              <View style={styles.socialButtons as any}>
                <TouchableOpacity
                  onPress={() => Alert.alert("Google", "Inicio con Google")}
                  style={styles.socialIcon as any}
                >
                  <Ionicons name="logo-google" size={26} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Alert.alert("Apple", "Inicio con Apple")}
                  style={styles.socialIcon as any}
                >
                  <Ionicons name="logo-apple" size={26} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.registerSection as any}>
              <Text style={styles.registerLabel as any}>¿No tienes cuenta?</Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.registerLink as any}>Regístrate aquí</Text>
              </TouchableOpacity>
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
  buttonContainer: {
    marginTop: 24,
  } as any,
  guestButton: {
    marginTop: 16,
    alignItems: "center",
  } as any,
  guestButtonText: {
    color: "#4B0082",
    textDecorationLine: "underline",
    fontWeight: "500",
  } as any,
  socialSection: {
    alignItems: "center",
    marginBottom: 32,
  } as any,
  socialLabel: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 16,
  } as any,
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  } as any,
  socialIcon: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  } as any,
  registerSection: {
    alignItems: "center",
  } as any,
  registerLabel: {
    fontSize: 16,
    color: "#666666",
  } as any,
  registerLink: {
    color: "#4B0082",
    fontWeight: "600",
    marginTop: 4,
    textDecorationLine: "underline",
  } as any,
});

export default LoginScreen;
