// ==============================================
// 📄 LoginScreen.tsx — PocketCloset (UI final + Logging profesional estructurado)
// ==============================================
// - Diseño responsive con degradado igual que RegisterScreen
// - Estructura limpia y comentada
// - Integración con logger modular (logEvent / helpers)
// - Cumple el estándar PocketCloset_Logging_Spec_v1.md
// ==============================================

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import CustomInput from '../components/CustomInput';
import PasswordInput from '../components/PasswordInput';
import PrimaryButton from '../components/PrimaryButton';
import colors from '../constants/colors';
import { isValidEmail } from '../utils/validation';
import { logEvent } from '../logger/logEvent';
import { uuidv4, maskEmail } from '../logger/helpers';

// ==============================================
// 📦 Configuración base
// ==============================================
const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const AUTH_ENDPOINT = `${API_BASE}/v1/auth/login`;

interface LoginErrors {
  identifier?: string;
  password?: string;
}

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(420, width * 0.9);

  // Estado de campos y validaciones
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  // IDs únicos de trazabilidad (para correlación entre eventos)
  const baseIds = useMemo(
    () => ({
      requestId: uuidv4(),
      correlationId: uuidv4(),
    }),
    []
  );

  // =====================================================
  //  🎯 Log automático al abrir la pantalla
  // =====================================================
  useEffect(() => {
    logEvent({
      level: 'info',
      event: 'LoginViewed',
      message: 'Pantalla de inicio de sesión abierta',
      requestId: baseIds.requestId,
      correlationId: baseIds.correlationId,
    });
  }, []);

  // =====================================================
  //  🧩 Validación simple
  // =====================================================
  const validate = (): boolean => {
    const e: LoginErrors = {};
    if (!identifier.trim()) e.identifier = 'Introduce tu usuario o correo electrónico';
    if (!password) e.password = 'Introduce tu contraseña';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // =====================================================
  //  🚀 Evento: Iniciar sesión
  // =====================================================
  const handleLogin = async (): Promise<void> => {
    if (!validate()) return;

    const requestId = uuidv4();
    const correlationId = baseIds.correlationId;

    // Log intento de login
    await logEvent({
      level: 'info',
      event: 'LoginAttempted',
      message: 'Intento de inicio de sesión',
      requestId,
      correlationId,
      extra: {
        identifierMasked: isValidEmail(identifier)
          ? maskEmail(identifier)
          : `${identifier.slice(0, 2)}***`,
      },
    });

    setLoading(true);

    try {
      const res = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
        },
        body: JSON.stringify({ identifier, password }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({})) as { userId?: string };

        // Log: éxito
        await logEvent({
          level: 'info',
          event: 'LoginSucceeded',
          message: 'Inicio de sesión exitoso',
          requestId,
          correlationId,
          userId: data?.userId ?? undefined,
        });

        Alert.alert('Bienvenido a PocketCloset', 'Has iniciado sesión correctamente.');
        // Redirige a Home tras login correcto
        router.replace('/home');
      } else {
        const errBody = await res.json().catch(() => ({})) as { message?: string };
        const msg = errBody?.message || 'Credenciales inválidas';
        setErrors({ password: msg });

        // Log: fallo controlado
        await logEvent({
          level: 'warn',
          event: 'LoginFailed',
          message: msg,
          requestId,
          correlationId,
        });
      }
    } catch (err: any) {
      // Log: error de red o inesperado
      await logEvent({
        level: 'error',
        event: 'LoginError',
        message: err.message,
        requestId,
        correlationId,
      });
      Alert.alert('Error de red', 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  //  🔗 Evento: Ir a pantalla de registro
  // =====================================================
  const goToRegister = (): void => {
    logEvent({
      level: 'info',
      event: 'NavigateRegister',
      message: 'El usuario navega a la pantalla de registro',
      requestId: uuidv4(),
      correlationId: baseIds.correlationId,
    });
    router.push('/register');
  };

  // =====================================================
  //  🚪 Evento: Acceso como invitado
  // =====================================================
  const handleGuestAccess = (): void => {
    const requestId = uuidv4();
    const correlationId = baseIds.correlationId;

    // Log de acceso como invitado (para trazabilidad)
    logEvent({
      level: 'info',
      event: 'GuestAccess',
      message: 'Usuario accedió como invitado',
      requestId,
      correlationId,
    });

    // Navegación directa a Home
    router.replace('/home');
  };

  // =====================================================
  //  🎨 UI principal
  // =====================================================
  return (
    <LinearGradient
      colors={
        colors.gradient as unknown as [
          import('react-native').ColorValue,
          import('react-native').ColorValue,
          ...import('react-native').ColorValue[],
        ]
      }
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Bloque blanco con bordes redondeados */}
          <View style={[styles.card, { width: maxWidth }]}>
            <Text style={styles.title}>BIENVENIDO A</Text>
            <Text style={[styles.title, { marginBottom: 20 }]}>POCKETCLOSET</Text>

            <CustomInput
              placeholder="Usuario o correo electrónico"
              value={identifier}
              onChangeText={setIdentifier}
              error={errors.identifier}
              inputStyle={{ outlineStyle: 'none' as any }}
            />

            <PasswordInput
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            <TouchableOpacity style={styles.forgotContainer}>
              <Text style={styles.forgotText}>¿Has olvidado tu contraseña?</Text>
            </TouchableOpacity>

            <PrimaryButton
              text={loading ? 'Iniciando...' : 'Iniciar Sesión'}
              onPress={handleLogin}
              disabled={loading}
            />

            <Text style={styles.orText}>O accede con</Text>

            {/* Botones sociales */}
            <View style={styles.socialContainer}>
              <TouchableOpacity>
                <Image source={require('../../assets/icons/google.png')} style={styles.socialIcon} />
              </TouchableOpacity>
              <TouchableOpacity>
                <Image source={require('../../assets/icons/apple.png')} style={styles.socialIcon} />
              </TouchableOpacity>
            </View>

            {/* Enlace a registro */}
            <View style={styles.registerRow}>
              <Text style={styles.footerText}>¿Todavía no tienes cuenta? </Text>
              <TouchableOpacity onPress={goToRegister}>
                <Text style={styles.link}>Crea una</Text>
              </TouchableOpacity>
            </View>

            {/* Acceso como invitado */}
            <TouchableOpacity style={styles.guestButton} onPress={handleGuestAccess}>
              <Text style={styles.guestText}>Accede como invitado</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;

// ==============================================
// 🎨 Estilos
// ==============================================
const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 50,
    paddingVertical: 40,
    paddingHorizontal: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: 6,
    marginBottom: 14,
  },
  forgotText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  orText: {
    marginVertical: 16,
    color: colors.textDark,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 25,
    marginBottom: 20,
  },
  socialIcon: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  footerText: {
    color: colors.textDark,
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  guestButton: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  guestText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
