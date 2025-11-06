import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import RegisterScreen from "../pages/RegisterScreen";
import * as analyticsModule from "../utils/analitics";

// Mock del Toast (para que no falle durante el test)
jest.mock("react-native-toast-message", () => ({
show: jest.fn(),
}));
// Mock de Alert para evitar bloqueos y permitir continuar el flujo
import { Alert } from "react-native";
jest.spyOn(Alert, "alert").mockImplementation(() => {});

// Mock del navigation (para evitar errores de navigate durante el test)
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock global de fetch
global.fetch = jest.fn();

describe("Register logging", () => {
beforeEach(() => {
jest.clearAllMocks();
});

test("should log UserRegistered on successful registration", async () => {
// Simula una respuesta exitosa del backend
(global.fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  status: 201,
  json: async () => ({ token: "fakeToken", message: "User created" }),
});




const logSpy = jest.spyOn(analyticsModule, "logEventAnalytics").mockResolvedValue();


const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

fireEvent.changeText(getByPlaceholderText("Introduce tu nombre"), "Irene");
fireEvent.changeText(getByPlaceholderText("Introduce tu correo"), "irene@example.com");
fireEvent.changeText(getByPlaceholderText("Introduce tu contraseña"), "123456");

const registerButton = getByText("Registrar");
await act(async () => {
  fireEvent.press(registerButton);
  // Espera a que terminen las promesas internas del fetch y logEvent
   await new Promise(resolve => setTimeout(resolve, 10));
});
// 🔧 Fuerza a ejecutar los microtasks (como logEvent) pendientes
await act(async () => {
  await new Promise(resolve => setTimeout(resolve, 20));
});

await waitFor(() => {
  expect(logSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      event: "UserRegistered",
      level: "Evento de uso registrado",
    })
  );
});



});

test("should log RegisterFailed when registration fails", async () => {
// Simula una respuesta fallida del backend
(global.fetch as jest.Mock).mockResolvedValueOnce({
  ok: false,
  status: 400,
  json: async () => ({ message: "Email already exists" }),
});

const logSpy = jest.spyOn(analyticsModule, "logEventAnalytics").mockResolvedValue();

const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

fireEvent.changeText(getByPlaceholderText("Introduce tu nombre"), "Irene");
fireEvent.changeText(getByPlaceholderText("Introduce tu correo"), "irene@example.com");
fireEvent.changeText(getByPlaceholderText("Introduce tu contraseña"), "123456");

const registerButton = getByText("Registrar");
await act(async () => {
  fireEvent.press(registerButton);
   await new Promise(resolve => setTimeout(resolve, 10));
});
// 🔧 Fuerza a ejecutar los microtasks (como logEvent) pendientes
await act(async () => {
  await new Promise(resolve => setTimeout(resolve, 20));
});


await waitFor(() => {
  expect(logSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      event: "RegisterFailed",
      level: "Evento de uso registrado",
    })
  );
});


});
});
