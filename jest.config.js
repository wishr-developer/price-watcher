const nextJest = require('next/jest');

/**
 * Jest設定ファイル
 * Next.js 14 App Router環境で動作するように設定
 */
const createJestConfig = nextJest({
  // Next.jsアプリのパスを指定
  dir: './',
});

// Jestのカスタム設定
const customJestConfig = {
  // テスト環境
  testEnvironment: 'jest-environment-jsdom',
  
  // モジュールのパス解決（TypeScriptのパスエイリアスに対応）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // テストファイルのパターン
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  
  // カバレッジ収集対象
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // モジュールの拡張子解決
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // 変換設定
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },
  
  // 無視するパス
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/out/',
  ],
  
  // グローバル設定
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
      },
    },
  },
};

// Next.jsのJest設定とカスタム設定をマージ
module.exports = createJestConfig(customJestConfig);

