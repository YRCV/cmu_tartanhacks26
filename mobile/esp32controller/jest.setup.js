// Jest setup file
// Add any global test setup here

// Mock expo-constants for tests
jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.0',
    extra: {},
  },
  deviceName: 'Test Device',
}));


