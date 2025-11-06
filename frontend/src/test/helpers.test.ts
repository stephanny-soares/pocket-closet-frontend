
import { maskEmail, uuidv4, getEnv } from "../logger/helpers";

describe("Helpers utility tests", () => {
  test("maskEmail anonymizes emails correctly", () => {
    expect(maskEmail("user@example.com")).toBe("us***@example.com");
    expect(maskEmail("a@domain.com")).toBe("a***@domain.com");
    expect(maskEmail("")).toBe("***");
  });

  test("uuidv4 generates unique IDs", () => {
    const id1 = uuidv4();
    const id2 = uuidv4();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/[0-9a-fA-F-]{36}/);
  });

  test("getEnv returns valid environment string", () => {
    const env = getEnv();
    expect(["development", "production", "test", "staging"]).toContain(env);
  });
});

