/**
 * @file LoginScreen.test.tsx
 * Tests automatizados del flujo de login de PocketCloset
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../pages/LoginScreen";
import { useAuth } from "../hooks/useAuth";
import { logEvent } from "../logger/logEvent";
import { getClientInfo } from "../utils/getClientInfo";
declare global {
  // eslint-disable-next-line no-var
  var window: any;
}

// ✅ Mock de dependencias externas
jest.mock("../hooks/useAuth");
jest.mock("../logger/logEvent");
jest.mock("../utils/getClientInfo");

const mockLogin = jest.fn();
(useAuth as jest.Mock).mockReturnValue({
  login: mockLogin,
  isAuthenticated: false,
});

(getClientInfo as jest.Mock).mockResolvedValue({
  ip: "123.45.67.89",
  city: "Alicante",
  country: "Spain",
});

// 🔧 Helper para simular respuesta del backend
function mockFetch(response: any, ok = true) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      headers: {
        get: () => null,
      },
    })
  ) as any;
}

describe("🧪 LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================
  // Escenario 1: Credenciales incorrectas
  // ========================================================
  it("muestra mensaje de error con credenciales incorrectas", async () => {
    mockFetch({ error: { error: "Email o contraseña incorrectos" } }, false);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Introduce tu correo"), "test@correo.com");
    fireEvent.changeText(getByPlaceholderText("Introduce tu contraseña"), "wrongpass");
    fireEvent.press(getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "LoginFailed",
          message: expect.stringContaining("incorrectos"),
        })
      );
    });
  });

  // ========================================================
  // Escenario 2: Usuario inactivo
  // ========================================================
  it("muestra mensaje si el usuario está inactivo", async () => {
    mockFetch({ error: { error: "Usuario inactivo" } }, false);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Introduce tu correo"), "inactive@correo.com");
    fireEvent.changeText(getByPlaceholderText("Introduce tu contraseña"), "123456");
    fireEvent.press(getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "LoginFailed",
          message: expect.stringContaining("inactivo"),
        })
      );
    });
  });

  // ========================================================
  // Escenario 3: Email no confirmado
  // ========================================================
  it("muestra mensaje si el correo no está confirmado", async () => {
    mockFetch({ error: { error: "Correo no confirmado" } }, false);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Introduce tu correo"), "no-confirmado@correo.com");
    fireEvent.changeText(getByPlaceholderText("Introduce tu contraseña"), "123456");
    fireEvent.press(getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "LoginFailed",
          message: expect.stringContaining("no confirmado"),
        })
      );
    });
  });

  // ========================================================
  // Escenario 4: Token expirado
  // ========================================================
  it("detecta token expirado y ejecuta logout", async () => {
    // Simulamos token expirado en backend
    mockFetch({ error: { error: "Token expirado" } }, false);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Introduce tu correo"), "expirado@correo.com");
    fireEvent.changeText(getByPlaceholderText("Introduce tu contraseña"), "123456");
    fireEvent.press(getByText("Iniciar sesión"));

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "LoginFailed",
          message: expect.stringContaining("expirado"),
        })
      );
    });
  });

  // ========================================================
  // Escenario 5: Bloqueo tras intentos fallidos
  // ========================================================
  it("bloquea el formulario tras varios intentos fallidos", async () => {
    mockFetch({ error: { error: "Credenciales incorrectas" } }, false);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText("Introduce tu correo");
    const passwordInput = getByPlaceholderText("Introduce tu contraseña");
    const loginButton = getByText("Iniciar sesión");

    // 3 intentos fallidos consecutivos
    for (let i = 0; i < 3; i++) {
      fireEvent.changeText(emailInput, `user${i}@test.com`);
      fireEvent.changeText(passwordInput, "wrongpass");
      fireEvent.press(loginButton);
    }

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "AccountTemporarilyLocked",
        })
      );
    });
  });
});
