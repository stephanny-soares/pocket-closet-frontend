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
