
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../pages/LoginScreen";
import * as logEventModule from "../logger/logEvent";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
}));


jest.mock("../logger/logEvent");

describe("Login logging", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call logEvent after successful login", async () => {
    const mockLogEvent = jest.spyOn(logEventModule, "logEvent").mockResolvedValue();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            token: "fake-token",
            usuario: { id: "123", nombre: "Test User" },
          }),
        headers: new Headers({
          "x-request-id": "req-1",
          "x-correlation-id": "corr-1",
        }),
      })
    ) as any;

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText(/correo/i), "user@example.com");
    fireEvent.changeText(getByPlaceholderText(/contraseña/i), "123456");
    fireEvent.press(getByText(/iniciar sesión/i));

    await waitFor(() => {
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "UserLogin",
          message: expect.any(String),
          userId: "123",
          requestId: "req-1",
          correlationId: "corr-1",
        })
      );
    });
  });

  it("should log LoginFailed when backend returns error", async () => {
    const mockLogEvent = jest.spyOn(logEventModule, "logEvent").mockResolvedValue();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Invalid credentials" }),
      })
    ) as any;

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText(/correo/i), "baduser@example.com");
    fireEvent.changeText(getByPlaceholderText(/contraseña/i), "wrongpass");
    fireEvent.press(getByText(/iniciar sesión/i));

    await waitFor(() => {
       expect(mockLogEvent).toHaveBeenCalled();
       const loggedEvent = mockLogEvent.mock.calls[0][0];
       expect(["LoginFailed", "LoginException"]).toContain(loggedEvent.event);
    });

  });
});

