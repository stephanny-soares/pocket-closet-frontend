// ================================================
//  LoginScreen.tsx
//  Pantalla de inicio de sesión conectada al backend
//  Migrada a NativeWind + LinearGradient + modo oscuro
//  Mantiene toda la lógica original y estructura visual
// ================================================

import React, { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { v4 as uuidv4 } from "uuid";
import CustomInput from "../components/CustomInput";
import PasswordInput from "../components/PasswordInput";
import PrimaryButton from "../components/PrimaryButton";
import colors from "../constants/colors";
import { validateEmail, validatePassword } from "../utils/validation";
import { logEvent } from "../utils/analytics"; // Si lo tienes implementado

// URL base del backend (leída del .env, con fallback a localhost)
const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const LoginScreen: React.FC = () => {
  // ===============================
  // Estados del formulario
  // ===============================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [sending, setSending] = useState(false);

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // ===============================
  // Validación de campos
  // ===============================
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

  // ===============================
  // Manejo del envío (conexión al backend)
  // ===============================
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
        logEvent("user_login", { email });
        Alert.alert("Inicio de sesión exitoso", data.message || "Bienvenido/a");
        router.push("/home"); // Ajusta según tus rutas
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

  // ===============================
  // Inicio de sesión como invitado
  // ===============================
  const handleGuestAccess = () => {
    const guestId = uuidv4();
    logEvent("guest_login", { guestId });
    Alert.alert("Acceso como invitado", "Has iniciado sesión como invitado.");
    router.push("/home"); // Ajusta si es otra ruta
  };

  // ===============================
  // Render principal
  // ===============================
  return (
    <LinearGradient
      colors={colors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          className="flex-1 px-8 pt-20"
        >
          {/* ---------- Título ---------- */}
          <View className="mb-8">
            <Text
              className={`text-4xl font-bold mb-2 ${
                isDark ? "text-white" : "text-textDark"
              }`}
            >
              Bienvenido
            </Text>
            <Text
              className={`text-base ${
                isDark ? "text-gray-300" : "text-textMuted"
              }`}
            >
              Inicia sesión para continuar
            </Text>
          </View>

          {/* ---------- Contenedor del formulario ---------- */}
          <View
            className={`rounded-3xl shadow-lg p-6 ${
              isDark ? "bg-gray-800" : "bg-inputBg"
            }`}
          >
            {/* Campo Email */}
            <CustomInput
              label="Correo electrónico"
              placeholder="Introduce tu correo"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />

            {/* Campo Contraseña */}
            <PasswordInput
              label="Contraseña"
              placeholder="Introduce tu contraseña"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            {/* Botón principal */}
            <View className="mt-6">
              <PrimaryButton
                title={sending ? "Ingresando..." : "Iniciar sesión"}
                onPress={handleLogin}
                loading={sending}
              />
            </View>

            {/* Acceso invitado */}
            <TouchableOpacity
              onPress={handleGuestAccess}
              className="mt-4 items-center"
            >
              <Text className="text-primary underline font-medium">
                Acceder como invitado
              </Text>
            </TouchableOpacity>
          </View>

          {/* ---------- Botones sociales ---------- */}
          <View className="items-center mt-10">
            <Text
              className={`text-base mb-4 ${
                isDark ? "text-gray-300" : "text-textMuted"
              }`}
            >
              O inicia sesión con
            </Text>

            <View className="flex-row justify-center space-x-6">
              <TouchableOpacity
                onPress={() => Alert.alert("Google", "Inicio con Google")}
                className={`p-3 rounded-full shadow-md ${
                  isDark ? "bg-gray-700" : "bg-white"
                }`}
              >
                <Ionicons name="logo-google" size={26} color="#DB4437" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Alert.alert("Apple", "Inicio con Apple")}
                className={`p-3 rounded-full shadow-md ${
                  isDark ? "bg-gray-700" : "bg-white"
                }`}
              >
                <Ionicons name="logo-apple" size={26} color={isDark ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ---------- Registro ---------- */}
          <View className="items-center mt-12 mb-8">
            <Text
              className={`text-base ${
                isDark ? "text-gray-300" : "text-textMuted"
              }`}
            >
              ¿No tienes cuenta?
            </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text className="text-primary font-semibold mt-1 underline">
                Regístrate aquí
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;
