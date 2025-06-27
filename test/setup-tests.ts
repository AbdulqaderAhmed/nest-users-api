// Global test configuration
jest.setTimeout(30000);

// Mock console methods in test environment
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}

// Global test utilities
global.testUtils = {
  createValidUser: () => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'USER',
  }),

  createValidAdmin: () => ({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'ADMIN',
  }),
};
