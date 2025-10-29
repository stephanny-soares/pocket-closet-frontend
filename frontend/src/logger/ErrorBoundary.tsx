// ==============================================
// 📄 ErrorBoundary.tsx — Captura global de errores (Frontend Logging PocketCloset)
// ==============================================
// - Captura errores de renderizado en React Native / Web
// - Registra el error con logEvent() siguiendo la especificación
// - Muestra un mensaje visual seguro al usuario
// - Evita que errores rompan la aplicación
// ==============================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../constants/colors';
import { logEvent } from './logEvent';
import { uuidv4 } from './helpers';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: Error | null;
  requestId: string;
  correlationId: string;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorInfo: null,
      requestId: uuidv4(),
      correlationId: uuidv4(),
    };
  }

  // =====================================================
  //  🚨 Método de ciclo de vida — Captura el error
  // =====================================================
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, errorInfo: error };
  }

  async componentDidCatch(error: Error, info: React.ErrorInfo) {
    // ============================================
    //  🧾 Registro del error según estándar PocketCloset
    // ============================================
    await logEvent({
      level: 'error',
      event: 'UnhandledFrontendError',
      message: error?.message || 'Error desconocido en interfaz',
      requestId: this.state.requestId,
      correlationId: this.state.correlationId,
      extra: {
        componentStack: info?.componentStack,
        name: error?.name,
        stack: error?.stack,
      },
    });
  }

  // =====================================================
  //  🔄 Función para reiniciar la app (recarga visual)
  // =====================================================
  handleReload = (): void => {
    this.setState({ hasError: false, errorInfo: null });
    if (this.props.onReset) this.props.onReset();
  };

  // =====================================================
  //  🖼 Renderizado visual de fallback UI
  // =====================================================
  render() {
    if (this.state.hasError) {
      return (
        <LinearGradient
          colors={colors.gradient as unknown as [
            import('react-native').ColorValue,
            import('react-native').ColorValue,
            ...import('react-native').ColorValue[],
          ]}
          style={styles.container}
        >
          <View style={styles.card}>
            <Text style={styles.title}>¡Vaya! 😔</Text>
            <Text style={styles.subtitle}>
              Ha ocurrido un error inesperado en PocketCloset.
            </Text>
            <Text style={styles.message}>
              Hemos registrado el incidente para resolverlo pronto.
            </Text>

            <TouchableOpacity style={styles.button} onPress={this.handleReload}>
              <Text style={styles.buttonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      );
    }

    // Si no hay errores, renderiza los hijos normalmente
    return this.props.children;
  }
}

// ==============================================
// 🎨 Estilos (siguiendo el diseño de RegisterScreen)
// ==============================================
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 40,
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 25,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
