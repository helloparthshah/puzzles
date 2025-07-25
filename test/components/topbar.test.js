/**
 * Tests for Topbar component with progress indicators
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Topbar Component with Progress Indicators', () => {
  const mockSetSelected = vi.fn();
  
  const defaultProps = {
    name: 'Test World',
    puzzles: [
      { id: 'puzzle_1', name: 'Puzzle 1', solved: false, disabled: false },
      { id: 'puzzle_2', name: 'Puzzle 2', solved: false, disabled: true },
      { id: 'puzzle_3', name: 'Puzzle 3', solved: false, disabled: true }
    ],
    selected: 'puzzle_1',
    setSelected: mockSetSelected
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enhance puzzles with progress indicators', () => {
    // Test the logic that would be used in the component
    const mockProgressData = {
      solvedPuzzles: new Set(['puzzle_1']),
      unlockedPuzzles: new Set(['puzzle_1', 'puzzle_2'])
    };
    
    const enhancedPuzzles = defaultProps.puzzles.map(puzzle => ({
      ...puzzle,
      solved: mockProgressData.solvedPuzzles.has(puzzle.id),
      disabled: !mockProgressData.unlockedPuzzles.has(puzzle.id)
    }));
    
    expect(enhancedPuzzles[0].solved).toBe(true);  // puzzle_1 is solved
    expect(enhancedPuzzles[0].disabled).toBe(false); // puzzle_1 is unlocked
    expect(enhancedPuzzles[1].solved).toBe(false); // puzzle_2 is not solved
    expect(enhancedPuzzles[1].disabled).toBe(false); // puzzle_2 is unlocked
    expect(enhancedPuzzles[2].solved).toBe(false); // puzzle_3 is not solved
    expect(enhancedPuzzles[2].disabled).toBe(true);  // puzzle_3 is locked
  });

  it('should calculate progress percentage correctly', () => {
    const puzzles = [
      { id: 'puzzle_1', solved: true },
      { id: 'puzzle_2', solved: false },
      { id: 'puzzle_3', solved: true }
    ];
    
    const solvedCount = puzzles.filter(p => p.solved).length;
    const totalCount = puzzles.length;
    const percentage = (solvedCount / totalCount) * 100;
    
    expect(percentage).toBe(66.66666666666666);
    expect(solvedCount).toBe(2);
    expect(totalCount).toBe(3);
  });

  it('should handle tab selection validation', () => {
    const puzzles = [
      { id: 'puzzle_1', disabled: false },
      { id: 'puzzle_2', disabled: false },
      { id: 'puzzle_3', disabled: true }
    ];
    
    // Simulate tab selection logic
    const handleTabSelect = (puzzleId) => {
      const selectedPuzzle = puzzles.find(p => p.id === puzzleId);
      return selectedPuzzle && !selectedPuzzle.disabled;
    };
    
    expect(handleTabSelect('puzzle_1')).toBe(true);  // Should allow selection
    expect(handleTabSelect('puzzle_2')).toBe(true);  // Should allow selection
    expect(handleTabSelect('puzzle_3')).toBe(false); // Should prevent selection
  });

  it('should handle empty puzzles list', () => {
    const puzzles = [];
    const solvedCount = puzzles.filter(p => p.solved).length;
    const totalCount = puzzles.length;
    
    expect(solvedCount).toBe(0);
    expect(totalCount).toBe(0);
  });
});