/**
 * Tests for Progress Service
 */

import { vi } from 'vitest';
import progressService from '../../utils/progressService.js';

describe('Progress Service', () => {
  beforeEach(() => {
    // Reset localStorage mock
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    vi.clearAllMocks();
  });

  test('should get default world progress', () => {
    const worldId = 'test-world';
    const progress = progressService.getWorldProgress(worldId);
    
    expect(progress).toBeDefined();
    expect(progress.worldId).toBe(worldId);
    expect(progress.solvedPuzzles).toBeInstanceOf(Set);
    expect(progress.unlockedPuzzles).toBeInstanceOf(Set);
    expect(progress.unlockedPuzzles.has('puzzle_1')).toBe(true);
    expect(typeof progress.lastUpdated).toBe('number');
  });

  test('should get storage statistics', () => {
    const stats = progressService.getStorageStats();
    
    expect(stats).toBeDefined();
    expect(typeof stats.worldCount).toBe('number');
    expect(typeof stats.totalSolved).toBe('number');
    expect(typeof stats.totalUnlocked).toBe('number');
    expect(typeof stats.storageType).toBe('string');
    expect(typeof stats.crossTabSync).toBe('boolean');
  });

  test('should handle cross-tab synchronization methods', () => {
    expect(typeof progressService.isCrossTabSyncEnabled()).toBe('boolean');
    
    progressService.disableCrossTabSync();
    expect(progressService.isCrossTabSyncEnabled()).toBe(false);
    
    progressService.enableCrossTabSync();
    expect(progressService.isCrossTabSyncEnabled()).toBe(true);
  });

  test('should handle event listeners', () => {
    const callback = vi.fn();
    
    // Should not throw when adding/removing listeners
    expect(() => {
      progressService.onProgressChange(callback);
      progressService.offProgressChange(callback);
    }).not.toThrow();
  });

  test('should handle cleanup', () => {
    expect(() => {
      progressService.cleanup();
    }).not.toThrow();
  });

  test('should handle valid world IDs', () => {
    const result = progressService.getWorldProgress('valid-world-id');
    expect(result).toBeDefined();
    expect(result.worldId).toBe('valid-world-id');
    expect(result.solvedPuzzles).toBeInstanceOf(Set);
    expect(result.unlockedPuzzles).toBeInstanceOf(Set);
  });
});