
import React from "react";
import { render } from "@testing-library/react-native";
import ErrorBoundary from "../logger/ErrorBoundary";
import * as logEventModule from "../logger/logEvent";

jest.mock("../logger/logEvent");

const ThrowError = () => {
  throw new Error("UI crashed");
};

describe("ErrorBoundary logging", () => {
  it("logs UIError event when component throws", () => {
    const mockLog = jest.spyOn(logEventModule, "logEvent").mockResolvedValue();

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

   expect(mockLog).toHaveBeenCalledWith(
     expect.objectContaining({
       event: expect.stringMatching(/UIError|RenderError|AppError|UnhandledFrontendError/),
       level: "error",
     })
    );

  });
});
