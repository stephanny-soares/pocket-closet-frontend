import React, { createContext, useContext, useState, ReactNode } from "react";
import LoaderOverlay from "../components/LoaderOverlay";

interface LoaderContextType {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
}

export const LoaderContext = createContext<LoaderContextType | undefined>(
  undefined
);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const showLoader = (msg?: string) => {
    setMessage(msg);
    setVisible(true);
  };

  const hideLoader = () => {
    setVisible(false);
    setMessage(undefined);
  };

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      <LoaderOverlay visible={visible} message={message} />
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  return context;
}
