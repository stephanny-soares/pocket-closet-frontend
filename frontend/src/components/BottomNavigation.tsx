import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, router } from 'expo-router';

interface NavItem {
  name: string;
  route: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: 'home', route: '/home', icon: 'home' },
  { name: 'armario', route: '/mi-armario', icon: 'shirt' },
  { name: 'outfits', route: '/mis-outfits', icon: 'images' },
  { name: 'perfil', route: '/perfil', icon: 'person' },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (route: string) => {
    return pathname.includes(route.replace('/', ''));
  };

  return (
    <View style={styles.navbar as any}>
      {navItems.map((item) => {
        const active = isActive(item.route);
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem as any}
            onPress={() => router.push(item.route as any)}
          >
            <Ionicons
              name={item.icon as any}
              size={28}
              color={active ? '#4B0082' : '#CCCCCC'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingVertical: 12,
    paddingBottom: 16,
  } as any,
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  } as any,
});
