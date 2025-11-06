import { render, screen } from "@testing-library/react-native";
import LoginScreen from "../pages/LoginScreen";

test("renders login screen correctly", () => {
  render(<LoginScreen />);
  expect(screen.getByText(/Iniciar sesión/i)).toBeTruthy();
});
