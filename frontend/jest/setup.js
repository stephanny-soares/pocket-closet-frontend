// Mock de Expo Linear Gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock de Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  router: { push: jest.fn() },
}));

// Mock de vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock de uuid
jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));
// Mock de AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));