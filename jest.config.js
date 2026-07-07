/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@scf/shared/kernel$': '<rootDir>/libs/shared/kernel/src/index.ts',
    '^@scf/invoicing/domain$': '<rootDir>/libs/invoicing/domain/src/index.ts',
    '^@scf/invoicing/data-access$': '<rootDir>/libs/invoicing/data-access/src/index.ts',
    '^@scf/invoicing/ui$': '<rootDir>/libs/invoicing/ui/src/index.ts',
    '^@scf/invoicing/feature-list$': '<rootDir>/libs/invoicing/feature-list/src/index.ts',
    '^@scf/auth/data-access$': '<rootDir>/libs/auth/data-access/src/index.ts',
  },
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
};
