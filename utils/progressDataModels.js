/**
 * Progress Data Models and Transformers
 * Handles data transformation, validation, and migration for progress storage
 */

// Current schema version
export const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * @typedef {Object} WorldProgress
 * @property {string} worldId - The world identifier
 * @property {Set<string>} solvedPuzzles - Set of solved puzzle IDs
 * @property {Set<string>} unlockedPuzzles - Set of unlocked puzzle IDs
 * @property {number} lastUpdated - Timestamp of last update
 * @property {string} version - Schema version
 */

/**
 * @typedef {Object} StorageWorldData
 * @property {string[]} solvedPuzzles - Array of solved puzzle IDs
 * @property {string[]} unlockedPuzzles - Array of unlocked puzzle IDs
 * @property {number} lastUpdated - Timestamp of last update
 */

/**
 * @typedef {Object} StorageData
 * @property {string} version - Schema version
 * @property {Record<string, StorageWorldData>} worlds - World progress data
 * @property {Object} metadata - Storage metadata
 * @property {number} metadata.createdAt - Creation timestamp
 * @property {number} metadata.lastAccessed - Last access timestamp
 */

/**
 * Validate world ID format and sanitize
 * @param {string} worldId - The world identifier to validate
 * @returns {string} Sanitized world ID
 * @throws {Error} If worldId is invalid
 */
export function validateWorldId(worldId) {
  if (typeof worldId !== 'string' || !worldId.trim()) {
    throw new Error('World ID must be a non-empty string');
  }
  
  // Sanitize: allow only alphanumeric, underscore, and hyphen
  const sanitized = worldId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (sanitized !== worldId.trim()) {
    console.warn(`World ID sanitized from "${worldId}" to "${sanitized}"`);
  }
  
  if (!sanitized) {
    throw new Error('World ID contains no valid characters');
  }
  
  return sanitized;
}

/**
 * Validate puzzle ID format and sanitize
 * @param {string} puzzleId - The puzzle identifier to validate
 * @returns {string} Sanitized puzzle ID
 * @throws {Error} If puzzleId is invalid
 */
export function validatePuzzleId(puzzleId) {
  if (typeof puzzleId !== 'string' || !puzzleId.trim()) {
    throw new Error('Puzzle ID must be a non-empty string');
  }
  
  // Sanitize: allow only alphanumeric, underscore, and hyphen
  const sanitized = puzzleId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (sanitized !== puzzleId.trim()) {
    console.warn(`Puzzle ID sanitized from "${puzzleId}" to "${sanitized}"`);
  }
  
  if (!sanitized) {
    throw new Error('Puzzle ID contains no valid characters');
  }
  
  return sanitized;
}

/**
 * Validate array of puzzle IDs
 * @param {any} puzzleIds - Array to validate
 * @returns {string[]} Array of validated puzzle IDs
 */
export function validatePuzzleIdArray(puzzleIds) {
  if (!Array.isArray(puzzleIds)) {
    throw new Error('Puzzle IDs must be an array');
  }
  
  return puzzleIds
    .filter(id => {
      try {
        return typeof id === 'string' && id.trim();
      } catch {
        return false;
      }
    })
    .map(id => validatePuzzleId(id));
}

/**
 * Validate WorldProgress object structure
 * @param {any} progress - Progress object to validate
 * @returns {boolean} True if valid WorldProgress structure
 */
export function validateWorldProgress(progress) {
  if (!progress || typeof progress !== 'object') {
    return false;
  }
  
  // Check required properties
  if (typeof progress.worldId !== 'string' ||
      typeof progress.lastUpdated !== 'number' ||
      !progress.solvedPuzzles ||
      !progress.unlockedPuzzles) {
    return false;
  }
  
  // Check if puzzle collections are iterable (Set or Array)
  try {
    // Should be able to iterate over both
    [...progress.solvedPuzzles];
    [...progress.unlockedPuzzles];
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate StorageData object structure
 * @param {any} data - Storage data to validate
 * @returns {boolean} True if valid StorageData structure
 */
export function validateStorageData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Check required top-level fields
  if (!data.version || !data.worlds || !data.metadata) {
    return false;
  }
  
  // Validate version
  if (typeof data.version !== 'string') {
    return false;
  }
  
  // Validate worlds structure
  if (typeof data.worlds !== 'object') {
    return false;
  }
  
  // Validate metadata
  if (typeof data.metadata !== 'object' ||
      typeof data.metadata.createdAt !== 'number' ||
      typeof data.metadata.lastAccessed !== 'number') {
    return false;
  }
  
  // Validate each world's data
  for (const [worldId, worldData] of Object.entries(data.worlds)) {
    if (!validateStorageWorldData(worldData)) {
      console.warn(`Invalid world data for world: ${worldId}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Validate individual world storage data
 * @param {any} worldData - World data to validate
 * @returns {boolean} True if valid world data
 */
export function validateStorageWorldData(worldData) {
  if (!worldData || typeof worldData !== 'object') {
    return false;
  }
  
  return Array.isArray(worldData.solvedPuzzles) &&
         Array.isArray(worldData.unlockedPuzzles) &&
         typeof worldData.lastUpdated === 'number';
}

/**
 * Transform WorldProgress to storage format
 * @param {WorldProgress} progress - Application format progress
 * @returns {StorageWorldData} Storage format world data
 */
export function transformToStorageFormat(progress) {
  if (!validateWorldProgress(progress)) {
    throw new Error('Invalid WorldProgress object');
  }
  
  return {
    solvedPuzzles: validatePuzzleIdArray([...progress.solvedPuzzles]),
    unlockedPuzzles: validatePuzzleIdArray([...progress.unlockedPuzzles]),
    lastUpdated: progress.lastUpdated
  };
}

/**
 * Transform storage format to WorldProgress
 * @param {string} worldId - World identifier
 * @param {StorageWorldData} storageData - Storage format data
 * @returns {WorldProgress} Application format progress
 */
export function transformFromStorageFormat(worldId, storageData) {
  if (!validateStorageWorldData(storageData)) {
    throw new Error('Invalid storage world data');
  }
  
  const sanitizedWorldId = validateWorldId(worldId);
  const solvedPuzzles = validatePuzzleIdArray(storageData.solvedPuzzles);
  const unlockedPuzzles = validatePuzzleIdArray(storageData.unlockedPuzzles);
  
  return {
    worldId: sanitizedWorldId,
    solvedPuzzles: new Set(solvedPuzzles),
    unlockedPuzzles: new Set(unlockedPuzzles),
    lastUpdated: storageData.lastUpdated,
    version: CURRENT_SCHEMA_VERSION
  };
}

/**
 * Create default WorldProgress object
 * @param {string} worldId - World identifier
 * @returns {WorldProgress} Default progress object
 */
export function createDefaultWorldProgress(worldId) {
  const sanitizedWorldId = validateWorldId(worldId);
  
  return {
    worldId: sanitizedWorldId,
    solvedPuzzles: new Set(),
    unlockedPuzzles: new Set(['puzzle_1']), // First puzzle always unlocked
    lastUpdated: Date.now(),
    version: CURRENT_SCHEMA_VERSION
  };
}

/**
 * Create default StorageData object
 * @returns {StorageData} Default storage data
 */
export function createDefaultStorageData() {
  return {
    version: CURRENT_SCHEMA_VERSION,
    worlds: {},
    metadata: {
      createdAt: Date.now(),
      lastAccessed: Date.now()
    }
  };
}

/**
 * Sanitize and validate progress data, removing invalid entries
 * @param {WorldProgress} progress - Progress to sanitize
 * @returns {WorldProgress} Sanitized progress
 */
export function sanitizeWorldProgress(progress) {
  if (!progress || typeof progress !== 'object') {
    throw new Error('Progress must be an object');
  }
  
  const worldId = validateWorldId(progress.worldId || '');
  
  // Sanitize puzzle ID collections
  let solvedPuzzles = new Set();
  let unlockedPuzzles = new Set(['puzzle_1']); // Always include first puzzle
  
  try {
    if (progress.solvedPuzzles) {
      const solvedArray = [...progress.solvedPuzzles];
      const validSolved = validatePuzzleIdArray(solvedArray);
      solvedPuzzles = new Set(validSolved);
    }
  } catch (error) {
    console.warn('Invalid solved puzzles, using empty set:', error.message);
  }
  
  try {
    if (progress.unlockedPuzzles) {
      const unlockedArray = [...progress.unlockedPuzzles];
      const validUnlocked = validatePuzzleIdArray(unlockedArray);
      unlockedPuzzles = new Set([...unlockedPuzzles, ...validUnlocked]);
    }
  } catch (error) {
    console.warn('Invalid unlocked puzzles, using default:', error.message);
  }
  
  return {
    worldId,
    solvedPuzzles,
    unlockedPuzzles,
    lastUpdated: typeof progress.lastUpdated === 'number' ? progress.lastUpdated : Date.now(),
    version: CURRENT_SCHEMA_VERSION
  };
}

/**
 * Migration utilities for schema version changes
 */
export const migrations = {
  /**
   * Get available migration versions
   * @returns {string[]} Array of supported versions
   */
  getSupportedVersions() {
    return ['1.0.0'];
  },
  
  /**
   * Check if migration is needed
   * @param {string} fromVersion - Current data version
   * @param {string} toVersion - Target version
   * @returns {boolean} True if migration is needed
   */
  isMigrationNeeded(fromVersion, toVersion = CURRENT_SCHEMA_VERSION) {
    return fromVersion !== toVersion;
  },
  
  /**
   * Migrate storage data to current version
   * @param {StorageData} data - Data to migrate
   * @returns {StorageData} Migrated data
   */
  migrateToCurrentVersion(data) {
    if (!data || typeof data !== 'object') {
      console.warn('Invalid data for migration, creating default');
      return createDefaultStorageData();
    }
    
    const currentVersion = data.version || '0.0.0';
    
    if (!this.isMigrationNeeded(currentVersion)) {
      return data;
    }
    
    console.log(`Migrating data from version ${currentVersion} to ${CURRENT_SCHEMA_VERSION}`);
    
    // For now, we only support 1.0.0, so any other version gets reset
    if (currentVersion !== '1.0.0') {
      console.warn(`Unsupported version ${currentVersion}, resetting to default`);
      return createDefaultStorageData();
    }
    
    return data;
  },
  
  /**
   * Migrate individual world data
   * @param {string} worldId - World identifier
   * @param {any} worldData - World data to migrate
   * @returns {StorageWorldData} Migrated world data
   */
  migrateWorldData(worldId, worldData) {
    if (!validateStorageWorldData(worldData)) {
      console.warn(`Invalid world data for ${worldId}, using default`);
      return {
        solvedPuzzles: [],
        unlockedPuzzles: ['puzzle_1'],
        lastUpdated: Date.now()
      };
    }
    
    // Sanitize puzzle IDs in existing data
    try {
      return {
        solvedPuzzles: validatePuzzleIdArray(worldData.solvedPuzzles),
        unlockedPuzzles: validatePuzzleIdArray(worldData.unlockedPuzzles),
        lastUpdated: worldData.lastUpdated
      };
    } catch (error) {
      console.warn(`Error migrating world data for ${worldId}:`, error.message);
      return {
        solvedPuzzles: [],
        unlockedPuzzles: ['puzzle_1'],
        lastUpdated: Date.now()
      };
    }
  }
};

/**
 * Data integrity utilities
 */
export const dataIntegrity = {
  /**
   * Repair corrupted storage data
   * @param {any} data - Potentially corrupted data
   * @returns {StorageData} Repaired data
   */
  repairStorageData(data) {
    if (!data || typeof data !== 'object') {
      return createDefaultStorageData();
    }
    
    const repaired = {
      version: typeof data.version === 'string' ? data.version : CURRENT_SCHEMA_VERSION,
      worlds: {},
      metadata: {
        createdAt: typeof data.metadata?.createdAt === 'number' ? data.metadata.createdAt : Date.now(),
        lastAccessed: Date.now()
      }
    };
    
    // Repair world data
    if (data.worlds && typeof data.worlds === 'object') {
      for (const [worldId, worldData] of Object.entries(data.worlds)) {
        try {
          const sanitizedWorldId = validateWorldId(worldId);
          repaired.worlds[sanitizedWorldId] = migrations.migrateWorldData(sanitizedWorldId, worldData);
        } catch (error) {
          console.warn(`Skipping invalid world ${worldId}:`, error.message);
        }
      }
    }
    
    return repaired;
  },
  
  /**
   * Validate data integrity and return issues found
   * @param {StorageData} data - Data to check
   * @returns {string[]} Array of integrity issues found
   */
  checkIntegrity(data) {
    const issues = [];
    
    if (!validateStorageData(data)) {
      issues.push('Invalid storage data structure');
      return issues;
    }
    
    // Check version compatibility
    if (migrations.isMigrationNeeded(data.version)) {
      issues.push(`Version mismatch: ${data.version} vs ${CURRENT_SCHEMA_VERSION}`);
    }
    
    // Check world data integrity
    for (const [worldId, worldData] of Object.entries(data.worlds)) {
      try {
        validateWorldId(worldId);
      } catch {
        issues.push(`Invalid world ID: ${worldId}`);
      }
      
      if (!validateStorageWorldData(worldData)) {
        issues.push(`Invalid world data for: ${worldId}`);
      }
      
      // Check for duplicate puzzle IDs
      const solved = new Set(worldData.solvedPuzzles);
      const unlocked = new Set(worldData.unlockedPuzzles);
      
      if (solved.size !== worldData.solvedPuzzles.length) {
        issues.push(`Duplicate solved puzzles in world: ${worldId}`);
      }
      
      if (unlocked.size !== worldData.unlockedPuzzles.length) {
        issues.push(`Duplicate unlocked puzzles in world: ${worldId}`);
      }
      
      // Check if all solved puzzles are also unlocked
      for (const puzzleId of worldData.solvedPuzzles) {
        if (!worldData.unlockedPuzzles.includes(puzzleId)) {
          issues.push(`Solved puzzle ${puzzleId} not unlocked in world: ${worldId}`);
        }
      }
    }
    
    return issues;
  }
};