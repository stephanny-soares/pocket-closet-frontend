// src/context/LoaderContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

import LoaderOverlay from "../components/LoaderOverlay";

/* ────────────────────────────────── */
/* Types */
/* ────────────────────────────────── */
interface LoaderContextValue {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
}

/* ────────────────────────────────── */
/* Context */
/* ────────────────────────────────── */
const LoaderContext = createContext<LoaderContextValue | null>(null);

/* ────────────────────────────────── */
/* Provider */
/* ────────────────────────────────── */
export function LoaderProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const showLoader = (msg?: string) => {
    setMessage(msg);
    setVisible(true);
  };

  const hideLoader = () => {
    setVisible(false);
    setMessage(undefined);
  };

  const value = useMemo(
    () => ({
      showLoader,
      hideLoader,
    }),
    []
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}
      {visible && <LoaderOverlay visible message={message} />}
    </LoaderContext.Provider>
  );
}

/* ────────────────────────────────── */
/* Hook */
/* ────────────────────────────────── */
export function useLoader(): LoaderContextValue {
  const context = useContext(LoaderContext);

  if (!context) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }

  return context;
}
