module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  setupFiles: ["<rootDir>/tests/setupEnv.ts"],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
