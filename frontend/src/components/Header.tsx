import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, router } from 'expo-router';
import colors from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context'; // 👈 añadido

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const pathname = usePathname();
  const { auth } = useAuth();
  const isHome = pathname === '/home';

  const handleBack = () => router.back();
  const handleNotifications = () => router.push('/notificaciones' as any);
  const handleProfile = () => router.push('/perfil' as any);

  const displayTitle = isHome
    ? `¡Hola ${auth.userName || 'Usuario'}! 👋`
    : title || '';

  return (
    <SafeAreaView
      edges={['top']} // 👈 asegura que respeta la barra superior
      style={styles.safeArea}
    >
      <View style={styles.container}>
        {/* IZQUIERDA: botón atrás o hueco */}
        <View style={styles.side}>
          {!isHome && (
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* CENTRO: título */}
        <View style={styles.center}>
          <Text numberOfLines={1} style={styles.title}>
            {displayTitle}
          </Text>
        </View>

        {/* DERECHA: notificaciones + perfil */}
        <View style={[styles.side, styles.rightSide]}>
          <TouchableOpacity
            onPress={handleNotifications}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleProfile}
            style={[
              styles.iconButton,
              pathname === '/perfil' && styles.profileSelected,
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 8 : 10,
  },
  side: {
    width: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  rightSide: {
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1E1E',
    textAlign: 'center',
  },
  backButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFFCC',
  },
  iconButton: {
    padding: 4,
    marginLeft: 4,
  },
  profileSelected: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primary,
  },
});

export default Header;
