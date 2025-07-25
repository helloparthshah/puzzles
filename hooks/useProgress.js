/**
 * useProgress Hook - React hook for managing puzzle progress
 * Provides world-specific state management with loading states and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import progressService from '../utils/progressService.js';

/**
 * Custom hook for managing puzzle progress in a specific world
 * @param {string} worldId - The world identifier
 * @returns {object} Progress state and methods
 */
export function useProgress(worldId) {
  // State management
  const [worldProgress, setWorldProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs for cleanup and preventing stale closures
  const mountedRef = useRef(true);
  const worldIdRef = useRef(worldId);

  // Update worldId ref when it changes
  useEffect(() => {
    worldIdRef.current = worldId;
  }, [worldId]);

  /**
   * Load progress for the current world
   */
  const loadProgress = useCallback(async () => {
    if (!worldId) {
      setError(new Error('World ID is required'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get progress from service
      const progress = progressService.getWorldProgress(worldId);

      // Only update state if component is still mounted and worldId hasn't changed
      if (mountedRef.current && worldIdRef.current === worldId) {
        setWorldProgress(progress);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error loading progress:', err);
      if (mountedRef.current && worldIdRef.current === worldId) {
        setError(err);
        setIsLoading(false);

        // Set default progress on error
        try {
          const defaultProgress = progressService.getDefaultWorldProgress(worldId);
          setWorldProgress(defaultProgress);
        } catch (defaultError) {
          console.error('Error setting default progress:', defaultError);
        }
      }
    }
  }, [worldId]);

  /**
   * Handle progress changes from other sources (cross-tab sync, etc.)
   */
  const handleProgressChange = useCallback((changedWorldId, newProgress) => {
    // Only update if this is for our world and component is mounted
    if (mountedRef.current && changedWorldId === worldIdRef.current) {
      setWorldProgress(newProgress);
      setError(null); // Clear any previous errors
    }
  }, []);

  /**
   * Mark a puzzle as solved and update progress
   */
  const markPuzzleSolved = useCallback(async (puzzleId) => {
    if (!worldProgress || !puzzleId) {
      throw new Error('Invalid puzzle ID or world progress not loaded');
    }

    try {
      // Create updated progress
      const updatedProgress = {
        ...worldProgress,
        solvedPuzzles: new Set([...worldProgress.solvedPuzzles, puzzleId]),
        lastUpdated: Date.now()
      };

      // Auto-unlock next puzzle (assuming sequential puzzle IDs)
      const puzzleNumber = parseInt(puzzleId.replace('puzzle_', ''));
      if (!isNaN(puzzleNumber)) {
        const nextPuzzleId = `puzzle_${puzzleNumber + 1}`;
        updatedProgress.unlockedPuzzles = new Set([
          ...updatedProgress.unlockedPuzzles,
          nextPuzzleId
        ]);
      }

      // Update local state immediately for UI responsiveness
      if (mountedRef.current) {
        setWorldProgress(updatedProgress);
      }

      // Save to service (this will trigger cross-tab sync)
      progressService.saveWorldProgress(worldId, updatedProgress);

    } catch (err) {
      console.error('Error marking puzzle as solved:', err);
      if (mountedRef.current) {
        setError(err);
      }
      throw err;
    }
  }, [worldId, worldProgress]);

  /**
   * Reset progress for the current world
   */
  const resetProgress = useCallback(async () => {
    if (!worldId) {
      throw new Error('World ID is required');
    }

    try {
      // Reset progress in service
      progressService.resetWorldProgress(worldId);

      // Get the reset progress and update local state
      const resetProgress = progressService.getWorldProgress(worldId);

      if (mountedRef.current) {
        setWorldProgress(resetProgress);
        setError(null);
      }

    } catch (err) {
      console.error('Error resetting progress:', err);
      if (mountedRef.current) {
        setError(err);
      }
      throw err;
    }
  }, [worldId]);

  /**
   * Check if a puzzle is solved
   */
  const isPuzzleSolved = useCallback((puzzleId) => {
    if (!worldProgress || !puzzleId) {
      return false;
    }
    return worldProgress.solvedPuzzles.has(puzzleId);
  }, [worldProgress]);

  /**
   * Check if a puzzle is unlocked
   */
  const isPuzzleUnlocked = useCallback((puzzleId) => {
    if (!worldProgress || !puzzleId) {
      return false;
    }
    return worldProgress.unlockedPuzzles.has(puzzleId);
  }, [worldProgress]);

  /**
   * Get array of solved puzzle IDs
   */
  const getSolvedPuzzles = useCallback(() => {
    if (!worldProgress) {
      return [];
    }
    return Array.from(worldProgress.solvedPuzzles);
  }, [worldProgress]);

  /**
   * Get array of unlocked puzzle IDs
   */
  const getUnlockedPuzzles = useCallback(() => {
    if (!worldProgress) {
      return ['puzzle_1']; // Default to first puzzle
    }
    return Array.from(worldProgress.unlockedPuzzles);
  }, [worldProgress]);

  /**
   * Refresh progress from storage (useful for manual refresh)
   */
  const refreshProgress = useCallback(() => {
    loadProgress();
  }, [loadProgress]);

  // Initial load and setup
  useEffect(() => {
    mountedRef.current = true;
    loadProgress();

    // Subscribe to progress changes for cross-tab sync
    progressService.onProgressChange(handleProgressChange);

    // Cleanup function
    return () => {
      mountedRef.current = false;
      progressService.offProgressChange(handleProgressChange);
    };
  }, [loadProgress, handleProgressChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Return hook interface
  return {
    // State
    worldProgress,
    isLoading,
    error,

    // Actions
    markPuzzleSolved,
    resetProgress,
    refreshProgress,

    // Computed values / utilities
    isPuzzleSolved,
    isPuzzleUnlocked,
    getSolvedPuzzles,
    getUnlockedPuzzles,

    // Metadata
    isReady: !isLoading && !error && worldProgress !== null
  };
}

export default useProgress;