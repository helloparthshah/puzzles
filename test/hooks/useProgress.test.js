/**
 * Tests for useProgress hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useProgress } from '../../hooks/useProgress.js';

// Mock the progress service
vi.mock('../../utils/progressService.js', () => ({
  default: {
    getWorldProgress: vi.fn(),
    getDefaultWorldProgress: vi.fn(),
    saveWorldProgress: vi.fn(),
    resetWorldProgress: vi.fn(),
    onProgressChange: vi.fn(),
    offProgressChange: vi.fn(),
  },
}));

import progressService from '../../utils/progressService.js';

describe('useProgress Hook', () => {
  const mockWorldId = 'test-world';
  const mockProgress = {
    worldId: mockWorldId,
    solvedPuzzles: new Set(['puzzle_1']),
    unlockedPuzzles: new Set(['puzzle_1', 'puzzle_2']),
    lastUpdated: Date.now(),
    version: '1.0.0'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    progressService.getWorldProgress.mockReturnValue(mockProgress);
    progressService.getDefaultWorldProgress.mockReturnValue({
      worldId: mockWorldId,
      solvedPuzzles: new Set(),
      unlockedPuzzles: new Set(['puzzle_1']),
      lastUpdated: Date.now(),
      version: '1.0.0'
    });
  });

  test('should load progress on mount', async () => {
    const { result } = renderHook(() => useProgress(mockWorldId));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(progressService.getWorldProgress).toHaveBeenCalledWith(mockWorldId);
    expect(result.current.worldProgress).toEqual(mockProgress);
    expect(result.current.error).toBe(null);
  });

  test('should provide utility methods', async () => {
    const { result } = renderHook(() => useProgress(mockWorldId));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.isPuzzleSolved('puzzle_1')).toBe(true);
    expect(result.current.isPuzzleSolved('puzzle_2')).toBe(false);
    expect(result.current.isPuzzleUnlocked('puzzle_1')).toBe(true);
    expect(result.current.isPuzzleUnlocked('puzzle_2')).toBe(true);
    expect(result.current.getSolvedPuzzles()).toEqual(['puzzle_1']);
    expect(result.current.getUnlockedPuzzles()).toEqual(['puzzle_1', 'puzzle_2']);
  });

  test('should handle invalid world ID', async () => {
    const { result } = renderHook(() => useProgress(''));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('World ID is required');
  });

  test('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useProgress(mockWorldId));
    
    unmount();
    
    expect(progressService.offProgressChange).toHaveBeenCalled();
  });

  test('should provide ready state', async () => {
    const { result } = renderHook(() => useProgress(mockWorldId));
    
    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.worldProgress).not.toBe(null);
  });
});