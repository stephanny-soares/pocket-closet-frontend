
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isWeb = Platform.OS === "web";

export const storage = {
  async setItem(key: string, value: string) {
    if (isWeb && typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (isWeb && typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  },

  async removeItem(key: string) {
    if (isWeb && typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },

  async clear() {
    if (isWeb && typeof localStorage !== "undefined") {
      localStorage.clear();
    } else {
      await AsyncStorage.clear();
    }
  },
};
