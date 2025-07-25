/**
 * Tests for Progress Data Models
 */

import { vi } from 'vitest';
import {
  validateWorldId,
  validatePuzzleId,
  validatePuzzleIdArray,
  validateWorldProgress,
  validateStorageData,
  validateStorageWorldData,
  transformToStorageFormat,
  transformFromStorageFormat,
  createDefaultWorldProgress,
  createDefaultStorageData,
  sanitizeWorldProgress,
  migrations,
  dataIntegrity,
  CURRENT_SCHEMA_VERSION
} from '../../utils/progressDataModels.js';

describe('Progress Data Models', () => {
  describe('Validation Functions', () => {
    test('should validate world ID', () => {
      expect(validateWorldId('test-world')).toBe('test-world');
      expect(validateWorldId('test_world_123')).toBe('test_world_123');
      
      expect(() => validateWorldId('')).toThrow('World ID must be a non-empty string');
      expect(() => validateWorldId(null)).toThrow('World ID must be a non-empty string');
      expect(() => validateWorldId(123)).toThrow('World ID must be a non-empty string');
    });

    test('should validate puzzle ID', () => {
      expect(validatePuzzleId('puzzle_1')).toBe('puzzle_1');
      expect(validatePuzzleId('puzzle-123')).toBe('puzzle-123');
      
      expect(() => validatePuzzleId('')).toThrow('Puzzle ID must be a non-empty string');
      expect(() => validatePuzzleId(null)).toThrow('Puzzle ID must be a non-empty string');
    });

    test('should validate puzzle ID array', () => {
      const validArray = ['puzzle_1', 'puzzle_2'];
      expect(validatePuzzleIdArray(validArray)).toEqual(validArray);
      
      const mixedArray = ['puzzle_1', '', 'puzzle_2', null];
      expect(validatePuzzleIdArray(mixedArray)).toEqual(['puzzle_1', 'puzzle_2']);
      
      expect(() => validatePuzzleIdArray('not-array')).toThrow('Puzzle IDs must be an array');
    });

    test('should validate world progress', () => {
      const validProgress = {
        worldId: 'test-world',
        solvedPuzzles: new Set(['puzzle_1']),
        unlockedPuzzles: new Set(['puzzle_1', 'puzzle_2']),
        lastUpdated: Date.now(),
        version: '1.0.0'
      };
      
      expect(validateWorldProgress(validProgress)).toBe(true);
      expect(validateWorldProgress(null)).toBe(false);
      expect(validateWorldProgress({})).toBe(false);
    });

    test('should validate storage data', () => {
      const validData = {
        version: '1.0.0',
        worlds: {
          'test-world': {
            solvedPuzzles: ['puzzle_1'],
            unlockedPuzzles: ['puzzle_1', 'puzzle_2'],
            lastUpdated: Date.now()
          }
        },
        metadata: {
          createdAt: Date.now(),
          lastAccessed: Date.now()
        }
      };
      
      expect(validateStorageData(validData)).toBe(true);
      expect(validateStorageData(null)).toBe(false);
      expect(validateStorageData({})).toBe(false);
    });
  });

  describe('Transformation Functions', () => {
    test('should transform to storage format', () => {
      const progress = {
        worldId: 'test-world',
        solvedPuzzles: new Set(['puzzle_1']),
        unlockedPuzzles: new Set(['puzzle_1', 'puzzle_2']),
        lastUpdated: 12345,
        version: '1.0.0'
      };
      
      const storageFormat = transformToStorageFormat(progress);
      
      expect(storageFormat.solvedPuzzles).toEqual(['puzzle_1']);
      expect(storageFormat.unlockedPuzzles).toEqual(['puzzle_1', 'puzzle_2']);
      expect(storageFormat.lastUpdated).toBe(12345);
    });

    test('should transform from storage format', () => {
      const storageData = {
        solvedPuzzles: ['puzzle_1'],
        unlockedPuzzles: ['puzzle_1', 'puzzle_2'],
        lastUpdated: 12345
      };
      
      const progress = transformFromStorageFormat('test-world', storageData);
      
      expect(progress.worldId).toBe('test-world');
      expect(progress.solvedPuzzles).toBeInstanceOf(Set);
      expect(progress.solvedPuzzles.has('puzzle_1')).toBe(true);
      expect(progress.unlockedPuzzles).toBeInstanceOf(Set);
      expect(progress.unlockedPuzzles.has('puzzle_2')).toBe(true);
      expect(progress.lastUpdated).toBe(12345);
      expect(progress.version).toBe(CURRENT_SCHEMA_VERSION);
    });
  });

  describe('Creation Functions', () => {
    test('should create default world progress', () => {
      const progress = createDefaultWorldProgress('test-world');
      
      expect(progress.worldId).toBe('test-world');
      expect(progress.solvedPuzzles).toBeInstanceOf(Set);
      expect(progress.solvedPuzzles.size).toBe(0);
      expect(progress.unlockedPuzzles).toBeInstanceOf(Set);
      expect(progress.unlockedPuzzles.has('puzzle_1')).toBe(true);
      expect(typeof progress.lastUpdated).toBe('number');
      expect(progress.version).toBe(CURRENT_SCHEMA_VERSION);
    });

    test('should create default storage data', () => {
      const data = createDefaultStorageData();
      
      expect(data.version).toBe(CURRENT_SCHEMA_VERSION);
      expect(data.worlds).toEqual({});
      expect(typeof data.metadata.createdAt).toBe('number');
      expect(typeof data.metadata.lastAccessed).toBe('number');
    });
  });

  describe('Sanitization Functions', () => {
    test('should sanitize world progress', () => {
      const dirtyProgress = {
        worldId: 'test-world',
        solvedPuzzles: ['puzzle_1', 'invalid@puzzle', 'puzzle_2'],
        unlockedPuzzles: ['puzzle_1', '', 'puzzle_3'],
        lastUpdated: 'invalid-timestamp'
      };
      
      const sanitized = sanitizeWorldProgress(dirtyProgress);
      
      expect(sanitized.worldId).toBe('test-world');
      expect(sanitized.solvedPuzzles).toBeInstanceOf(Set);
      expect(sanitized.unlockedPuzzles).toBeInstanceOf(Set);
      expect(sanitized.unlockedPuzzles.has('puzzle_1')).toBe(true);
      expect(typeof sanitized.lastUpdated).toBe('number');
    });
  });

  describe('Migration Functions', () => {
    test('should check if migration is needed', () => {
      expect(migrations.isMigrationNeeded('0.9.0')).toBe(true);
      expect(migrations.isMigrationNeeded(CURRENT_SCHEMA_VERSION)).toBe(false);
    });

    test('should migrate to current version', () => {
      const oldData = {
        version: '0.9.0',
        worlds: {},
        metadata: { createdAt: Date.now(), lastAccessed: Date.now() }
      };
      
      const migrated = migrations.migrateToCurrentVersion(oldData);
      expect(migrated.version).toBe(CURRENT_SCHEMA_VERSION);
    });

    test('should migrate world data', () => {
      const worldData = {
        solvedPuzzles: ['puzzle_1'],
        unlockedPuzzles: ['puzzle_1', 'puzzle_2'],
        lastUpdated: Date.now()
      };
      
      const migrated = migrations.migrateWorldData('test-world', worldData);
      expect(migrated.solvedPuzzles).toEqual(['puzzle_1']);
      expect(migrated.unlockedPuzzles).toEqual(['puzzle_1', 'puzzle_2']);
    });
  });

  describe('Data Integrity Functions', () => {
    test('should repair corrupted storage data', () => {
      const corruptedData = {
        version: 123, // Invalid version
        worlds: null, // Invalid worlds
        metadata: 'invalid' // Invalid metadata
      };
      
      const repaired = dataIntegrity.repairStorageData(corruptedData);
      
      expect(typeof repaired.version).toBe('string');
      expect(typeof repaired.worlds).toBe('object');
      expect(typeof repaired.metadata).toBe('object');
      expect(typeof repaired.metadata.createdAt).toBe('number');
      expect(typeof repaired.metadata.lastAccessed).toBe('number');
    });

    test('should check data integrity', () => {
      const validData = createDefaultStorageData();
      const issues = dataIntegrity.checkIntegrity(validData);
      expect(Array.isArray(issues)).toBe(true);
    });

    test('should identify integrity issues', () => {
      const invalidData = {
        version: '1.0.0',
        worlds: {
          'test-world': {
            solvedPuzzles: ['puzzle_1', 'puzzle_1'], // Duplicate
            unlockedPuzzles: ['puzzle_2'], // Solved puzzle not unlocked
            lastUpdated: Date.now()
          }
        },
        metadata: {
          createdAt: Date.now(),
          lastAccessed: Date.now()
        }
      };
      
      const issues = dataIntegrity.checkIntegrity(invalidData);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(issue => issue.includes('Duplicate'))).toBe(true);
      expect(issues.some(issue => issue.includes('not unlocked'))).toBe(true);
    });
  });
});