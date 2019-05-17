module.exports = {
  automock: false,
  moduleFileExtensions: [
    'js'
  ],
  moduleDirectories: [
    'node_modules'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/build/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!ol)'
  ],
  setupFiles: [
    '<rootDir>/spec/jest/setup.js'
  ],
  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage'
};
