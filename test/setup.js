import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
});

// Mock window.addEventListener and removeEventListener
window.addEventListener = vi.fn();
window.removeEventListener = vi.fn();
window.dispatchEvent = vi.fn();

// Mock StorageEvent
global.StorageEvent = class StorageEvent extends Event {
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);
    this.key = eventInitDict.key || null;
    this.newValue = eventInitDict.newValue || null;
    this.oldValue = eventInitDict.oldValue || null;
    this.storageArea = eventInitDict.storageArea || null;
  }
};

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  window.addEventListener.mockClear();
  window.removeEventListener.mockClear();
  window.dispatchEvent.mockClear();
});