import React, { useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // 👈 AÑADIDO
import colors from "../constants/colors";

const navItems = [
  { name: "home", label: "Home", route: "/home", icon: "home-outline" },
  { name: "armario", label: "Armario", route: "/mi-armario", icon: "shirt-outline" },
  { name: "outfits", label: "Outfits", route: "/mis-outfits", icon: "images-outline" },
  { name: "eventos", label: "Eventos", route: "/mis-eventos", icon: "calendar-outline" },
  { name: "viajes", label: "Viajes", route: "/mis-viajes", icon: "airplane-outline" },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets(); // 👈 AÑADIDO

  const isActive = (route: string) => pathname.startsWith(route);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Platform.OS === "ios" ? insets.bottom : insets.bottom + 6, // 👈 FIX REAL
        },
      ]}
    >
      {navItems.map((item) => {
        const active = isActive(item.route);
        const scaleAnim = useRef(new Animated.Value(1)).current;

        const handlePressIn = () => {
          Animated.spring(scaleAnim, {
            toValue: 0.9,
            useNativeDriver: true,
          }).start();
        };

        const handlePressOut = () => {
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
          }).start();
          router.push(item.route as any);
        };

        return (
          <Pressable
            key={item.name}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.navItem}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Ionicons
                name={item.icon as any}
                size={24}
                color={active ? colors.primary : "#999"}
              />
            </Animated.View>
            <Text style={[styles.label, active && styles.activeLabel]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
    elevation: 6,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: "600",
  },
});
