import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

const ErrorContext = createContext(null);

export function ErrorProvider({ children }) {
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const showError = useCallback((msg) => {
    const text = typeof msg === "string" ? msg : msg?.message || "Une erreur est survenue.";
    setMessage(text);
    setIsSuccess(false);
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setMessage(null);
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  const showSuccess = useCallback((msg) => {
    const text = typeof msg === "string" ? msg : "Opération réussie.";
    setMessage(text);
    setIsSuccess(true);
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setMessage(null);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  const hideError = useCallback(() => {
    setVisible(false);
    setMessage(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, showSuccess, hideError }}>
      {children}
      {visible && message && (
        <div
          className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-4 px-4 py-3 text-white shadow-lg ${
            isSuccess ? "bg-emerald-600" : "bg-red-600"
          }`}
          role="alert"
        >
          <div className="flex items-center gap-3 min-w-0">
            {isSuccess ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium truncate">{message}</p>
          </div>
          <button
            type="button"
            onClick={hideError}
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isSuccess ? "hover:bg-emerald-700" : "hover:bg-red-700"}`}
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const ctx = useContext(ErrorContext);
  if (!ctx) {
    return {
      showError: (msg) => console.error("[ErrorContext non disponible]", msg),
      showSuccess: () => {},
      hideError: () => {},
    };
  }
  return ctx;
}
