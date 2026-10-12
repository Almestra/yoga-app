module.exports = {
  moduleNameMapper: {
    '@core/(.*)': '<rootDir>/src/app/core/$1',
  },
  preset: 'jest-preset-angular',
  testEnvironment: 'jest-preset-angular/environments/jest-jsdom-env',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  bail: false,
  verbose: false,
  collectCoverage: false,
  collectCoverageFrom: ['src/app/**/*.ts', '!src/app/**/*.spec.ts'],
  coverageDirectory: './coverage/jest',
  coverageReporters: ['html', 'text'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  roots: [
    "<rootDir>"
  ],
  modulePaths: [
    "<rootDir>"
  ],
  moduleDirectories: [
    "node_modules"
  ],
};
