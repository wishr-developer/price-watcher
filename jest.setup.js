// Jestのセットアップファイル
// @testing-library/jest-domのマッチャーをインポート
import '@testing-library/jest-dom';

// Reactをインポート（JSX変換用）
const React = require('react');

// ブラウザAPIのモック
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// localStorageのモック
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// window.dispatchEventのモック
window.dispatchEvent = jest.fn();

// Next.jsのImageコンポーネントをモック
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // Next.jsのImageコンポーネント固有のプロパティを除外
    const { priority, fill, sizes, ...imgProps } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return React.createElement('img', imgProps);
  },
}));

// Next.jsのuseRouterをモック
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// rechartsのResponsiveContainerをモック（ResizeObserverエラーを回避）
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children, ...props }) => React.createElement('div', props, children),
  LineChart: ({ children, ...props }) => React.createElement('div', props, children),
  Line: (props) => React.createElement('div', props),
}));

