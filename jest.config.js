export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  transform: {},
  collectCoverageFrom: ['src/**/*.js'],
  coverageProvider: 'v8',
  coverageReporters: ['text', 'json-summary'],
  clearMocks: true
};
