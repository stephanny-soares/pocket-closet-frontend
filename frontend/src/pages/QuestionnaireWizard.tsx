import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import PrimaryButton from "../components/ui/PrimaryButton";
import colors from "../constants/colors";
import { apiRequest } from "../utils/apiClient";

export default function QuestionnaireWizard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const maxWidth = isWeb ? Math.min(450, width * 0.9) : width * 0.9;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const steps = [
    {
      key: "intro",
      type: "intro",
      title: "Responde unas preguntas para personalizar tu experiencia",
      subtitle: "Solo tomará unos segundos ✨",
    },
    {
      key: "ciudad",
      title: "¿En qué ciudad vives?",
      type: "text",
      placeholder: "Introduce tu ciudad",
      required: true,
    },
    {
      key: "entorno",
      title: "¿Dónde pasas la mayor parte del día?",
      type: "single",
      options: ["Oficina", "Casa", "Universidad", "Exterior"],
      required: true,
    },
    {
      key: "estilo",
      title: "¿Cómo defines tu estilo principal?",
      type: "multiple",
      options: ["Casual", "Elegante", "Deportivo", "Minimalista", "Streetwear"],
      required: true,
    },
    {
      key: "colores",
      title: "¿Qué colores prefieres vestir?",
      type: "multiple",
      options: ["Neutros", "Tierra", "Pasteles", "Vibrantes", "Oscuros"],
      required: true,
    },
  ];

  const step = steps[index];

  const handleSelect = (value: string) => {
    if (step.type === "multiple") {
      const current = (answers[step.key] as string[]) || [];
      const exists = current.includes(value);
      const updated = exists
        ? current.filter((v) => v !== value)
        : [...current, value];

      setAnswers({ ...answers, [step.key]: updated });
    } else {
      setAnswers({ ...answers, [step.key]: value });
    }
  };

  const validateStep = () => {
    if (!step.required) return true;

    if (step.type === "text" && !(answers[step.key] as string)?.trim()) {
      Toast.show({
        type: "error",
        text1: "Campo obligatorio",
        text2: "Por favor, indica tu ciudad antes de continuar.",
        position: "bottom",
        bottomOffset: 70,
      });
      return false;
    }

    if (step.type === "single" && !answers[step.key]) {
      Toast.show({
        type: "error",
        text1: "Selecciona una opción",
        text2: "Debes elegir al menos una respuesta antes de avanzar.",
        position: "bottom",
        bottomOffset: 70,
      });
      return false;
    }

    if (
      step.type === "multiple" &&
      (!Array.isArray(answers[step.key]) ||
        (answers[step.key] as string[]).length === 0)
    ) {
      Toast.show({
        type: "error",
        text1: "Selecciona al menos una opción",
        text2: "Elige una o varias respuestas antes de continuar.",
        position: "bottom",
        bottomOffset: 70,
      });
      return false;
    }

    return true;
  };

  // 🚀 Enviar al backend
  const finalizarCuestionario = async () => {
    try {
      const payload = {
        ciudad: answers.ciudad,
        entorno: answers.entorno,
        estilo: answers.estilo,
        colores: answers.colores,
      };

      const res = await apiRequest("/api/users/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });


      if (res.ok) {
        Toast.show({
          type: "success",
          text1: "Preferencias guardadas",
          text2: "Tu experiencia se personalizará desde ahora.",
        });

        return router.replace("/(protected)/home");
      } else {
        Toast.show({
          type: "error",
          text1: "No se pudieron guardar",
          text2: res.message || "Intenta nuevamente",
        });
      }
    } catch (err) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Error de conexión",
      });
    }
  };

  const handleNext = async () => {
    if (step.type !== "intro" && !validateStep()) return;

    if (index < steps.length - 1) {
      setIndex(index + 1);
    } else {
      await finalizarCuestionario();
    }
  };

  const handlePrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  return (
    <LinearGradient
      colors={colors.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            width: maxWidth,
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 28,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {step.type !== "intro" && (
            <Text style={{ textAlign: "center", color: "#666", marginBottom: 10 }}>
              Paso {index} de {steps.length - 1}
            </Text>
          )}

          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              textAlign: "center",
              color: "#1E1E1E",
              marginBottom: 12,
            }}
          >
            {step.title}
          </Text>

          {step.subtitle && (
            <Text
              style={{
                fontSize: 15,
                color: "#666",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              {step.subtitle}
            </Text>
          )}

          {step.type === "text" && (
            <TextInput
              placeholder={step.placeholder}
              placeholderTextColor="#999"
              style={{
                borderWidth: 1,
                borderColor: "#DDD",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 16,
                marginBottom: 24,
              }}
              value={(answers[step.key] as string) || ""}
              onChangeText={(val) => setAnswers({ ...answers, [step.key]: val })}
            />
          )}

          {(step.type === "single" || step.type === "multiple") && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 10,
                marginBottom: 24,
              }}
            >
              {step.options?.map((opt) => {
                const selected =
                  step.type === "multiple"
                    ? ((answers[step.key] as string[]) || []).includes(opt)
                    : answers[step.key] === opt;

                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => handleSelect(opt)}
                    style={{
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : "#CCC",
                      backgroundColor: selected ? colors.primary : "white",
                      borderRadius: 30,
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? "#FFF" : "#1E1E1E",
                        fontWeight: "500",
                        fontSize: 15,
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 16,
              marginTop: 10,
            }}
          >
            {index > 0 && (
              <TouchableOpacity
                onPress={handlePrev}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 28,
                  minWidth: 120,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontWeight: "600" }}>Atrás</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNext}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 28,
                minWidth: 120,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "600" }}>
                {index < steps.length - 1
                  ? step.type === "intro"
                    ? "Comenzar"
                    : "Siguiente"
                  : "Finalizar"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={() => {
              Toast.show({
                type: "info",
                text1: "Cuestionario omitido",
                text2: "Podrás completarlo más tarde desde tu perfil.",
                position: "bottom",
                bottomOffset: 70,
              });
              setTimeout(() => router.replace("/(protected)/home"), 1000);
            }}
          >
            <Text
              style={{
                textAlign: "center",
                color: "#666",
                textDecorationLine: "underline",
              }}
            >
              Saltar cuestionario
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
