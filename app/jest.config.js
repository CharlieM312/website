module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|mjs|html|js)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|@ngrx|tslib|ngx-cookie-service)/)'
  ],
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: './test-results', outputName: 'results.xml' }]
  ]
};