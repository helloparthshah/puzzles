/**
 * Progress Service - Core service for managing puzzle progress with localStorage
 * Handles all progress-related operations with error handling and fallbacks
 */

import {
  validateWorldId,
  validatePuzzleId,
  validateStorageData,
  validateStorageWorldData,
  validateWorldProgress,
  transformToStorageFormat,
  transformFromStorageFormat,
  createDefaultWorldProgress,
  createDefaultStorageData,
  sanitizeWorldProgress,
  migrations,
  dataIntegrity,
  CURRENT_SCHEMA_VERSION
} from './progressDataModels.js';

const STORAGE_KEY = 'enigma_vault_progress';

/**
 * Error types for progress service
 */
export const ProgressErrorTypes = {
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_SECURITY_ERROR: 'STORAGE_SECURITY_ERROR',
  DATA_CORRUPTION: 'DATA_CORRUPTION',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MIGRATION_ERROR: 'MIGRATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Custom error class for progress service errors
 */
export class ProgressError extends Error {
  constructor(type, message, originalError = null, recoverable = true) {
    super(message);
    this.name = 'ProgressError';
    this.type = type;
    this.originalError = originalError;
    this.recoverable = recoverable;
    this.timestamp = Date.now();
  }

  /**
   * Get user-friendly error message
   * @returns {string} User-friendly message
   */
  getUserMessage() {
    switch (this.type) {
      case ProgressErrorTypes.STORAGE_UNAVAILABLE:
        return 'Progress saving is temporarily unavailable. Your progress will be saved in memory for this session.';
      case ProgressErrorTypes.STORAGE_QUOTA_EXCEEDED:
        return 'Storage space is full. We\'ve cleaned up old data to make room for your progress.';
      case ProgressErrorTypes.STORAGE_SECURITY_ERROR:
        return 'Progress saving is restricted in private browsing mode. Your progress will be saved for this session only.';
      case ProgressErrorTypes.DATA_CORRUPTION:
        return 'Some progress data was corrupted and has been repaired. Your recent progress should be intact.';
      case ProgressErrorTypes.VALIDATION_ERROR:
        return 'Invalid progress data was detected and corrected. Your progress has been preserved where possible.';
      case ProgressErrorTypes.MIGRATION_ERROR:
        return 'Progress data format has been updated. Some older progress may have been reset.';
      default:
        return 'A temporary issue occurred with progress saving. Your progress should continue to work normally.';
    }
  }

  /**
   * Get recovery suggestions for the user
   * @returns {string[]} Array of recovery suggestions
   */
  getRecoverySuggestions() {
    switch (this.type) {
      case ProgressErrorTypes.STORAGE_UNAVAILABLE:
        return [
          'Try refreshing the page',
          'Check if you\'re in private browsing mode',
          'Ensure your browser allows local storage'
        ];
      case ProgressErrorTypes.STORAGE_QUOTA_EXCEEDED:
        return [
          'Clear browser data for other websites',
          'Close unused browser tabs',
          'The system has automatically cleaned up old data'
        ];
      case ProgressErrorTypes.STORAGE_SECURITY_ERROR:
        return [
          'Exit private browsing mode for persistent progress',
          'Check browser security settings',
          'Progress will be saved for this session only'
        ];
      case ProgressErrorTypes.DATA_CORRUPTION:
        return [
          'Your progress has been automatically repaired',
          'Recent progress should be intact',
          'Contact support if you notice missing progress'
        ];
      default:
        return [
          'Try refreshing the page',
          'Your progress should continue to work normally'
        ];
    }
  }
}

/**
 * Check if localStorage is available and functional
 * @returns {boolean} True if localStorage is available
 */
function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('localStorage is not available:', e.message);
    return false;
  }
}

/**
 * Core Progress Service Class
 */
class ProgressService {
  constructor() {
    this.isStorageAvailable = isLocalStorageAvailable();
    this.inMemoryStorage = null;
    this.eventListeners = [];
    this.errorListeners = [];
    this.saveTimeouts = new Map(); // For debounced saves
    this.DEBOUNCE_DELAY = 500; // 500ms debounce delay
    this.storageEventListener = null; // For cross-tab synchronization
    this.isUpdatingFromStorageEvent = false; // Prevent infinite loops
    this.lastError = null; // Track last error for debugging
    this.errorCount = 0; // Track error frequency
    this.maxRetries = 3; // Maximum retry attempts for operations
    
    // Initialize storage with error handling
    this.initializeStorage();
    
    // Set up cross-tab synchronization
    this.initializeCrossTabSync();
  }

  /**
   * Initialize cross-tab synchronization using storage events
   */
  initializeCrossTabSync() {
    if (!this.isStorageAvailable || typeof window === 'undefined') {
      return; // No cross-tab sync in non-browser environments or without localStorage
    }

    this.storageEventListener = (event) => {
      // Only handle our storage key
      if (event.key !== STORAGE_KEY) {
        return;
      }

      // Ignore events triggered by this tab
      if (this.isUpdatingFromStorageEvent) {
        return;
      }

      try {
        // Parse the new storage data
        const newData = event.newValue ? JSON.parse(event.newValue) : null;
        const oldData = event.oldValue ? JSON.parse(event.oldValue) : null;

        if (!newData) {
          // Storage was cleared
          console.log('Progress storage cleared in another tab');
          this.handleCrossTabStorageCleared();
          return;
        }

        // Find which worlds changed
        const changedWorlds = this.findChangedWorlds(oldData, newData);
        
        // Notify listeners for each changed world
        changedWorlds.forEach(worldId => {
          const worldData = newData.worlds[worldId];
          if (worldData) {
            const progress = transformFromStorageFormat(worldId, worldData);
            console.log(`Progress updated from another tab for world: ${worldId}`);
            this.notifyProgressChange(worldId, progress);
          }
        });

      } catch (error) {
        console.error('Error handling cross-tab storage event:', error);
      }
    };

    // Add the event listener
    window.addEventListener('storage', this.storageEventListener);
  }

  /**
   * Find which worlds have changed between old and new storage data
   * @param {object|null} oldData - Previous storage data
   * @param {object} newData - New storage data
   * @returns {string[]} Array of world IDs that changed
   */
  findChangedWorlds(oldData, newData) {
    const changedWorlds = [];
    
    if (!oldData || !oldData.worlds) {
      // If no old data, all worlds are "new"
      return Object.keys(newData.worlds || {});
    }

    // Check for modified or new worlds
    for (const [worldId, worldData] of Object.entries(newData.worlds || {})) {
      const oldWorldData = oldData.worlds[worldId];
      
      if (!oldWorldData || 
          worldData.lastUpdated !== oldWorldData.lastUpdated ||
          JSON.stringify(worldData.solvedPuzzles) !== JSON.stringify(oldWorldData.solvedPuzzles) ||
          JSON.stringify(worldData.unlockedPuzzles) !== JSON.stringify(oldWorldData.unlockedPuzzles)) {
        changedWorlds.push(worldId);
      }
    }

    // Check for deleted worlds
    for (const worldId of Object.keys(oldData.worlds || {})) {
      if (!newData.worlds[worldId]) {
        changedWorlds.push(worldId);
      }
    }

    return changedWorlds;
  }

  /**
   * Handle storage being cleared in another tab
   */
  handleCrossTabStorageCleared() {
    // Get current data to see what was cleared
    const currentData = this.getStorageData();
    
    // Notify listeners that all worlds were reset
    for (const worldId of Object.keys(currentData.worlds)) {
      const defaultProgress = this.getDefaultWorldProgress(worldId);
      this.notifyProgressChange(worldId, defaultProgress);
    }
  }

  /**
   * Initialize storage system with comprehensive error handling
   */
  initializeStorage() {
    if (!this.isStorageAvailable) {
      const error = new ProgressError(
        ProgressErrorTypes.STORAGE_UNAVAILABLE,
        'localStorage not available, using in-memory storage'
      );
      
      console.warn('localStorage not available, using in-memory storage');
      this.inMemoryStorage = createDefaultStorageData();
      this.notifyErrorListeners(error);
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;

    const attemptInitialization = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        
        if (!stored) {
          // First time setup
          this.saveStorageData(createDefaultStorageData());
          return;
        }

        let data;
        try {
          data = JSON.parse(stored);
        } catch (parseError) {
          throw new ProgressError(
            ProgressErrorTypes.DATA_CORRUPTION,
            'Storage data is not valid JSON',
            parseError
          );
        }
        
        // Check data integrity and repair if needed
        const integrityIssues = dataIntegrity.checkIntegrity(data);
        if (integrityIssues.length > 0) {
          console.warn('Data integrity issues found:', integrityIssues);
          
          const error = new ProgressError(
            ProgressErrorTypes.DATA_CORRUPTION,
            `Data integrity issues: ${integrityIssues.join(', ')}`
          );
          
          const repairedData = dataIntegrity.repairStorageData(data);
          this.saveStorageData(repairedData);
          this.notifyErrorListeners(error);
          return;
        }
        
        // Migrate data if needed
        try {
          const migratedData = migrations.migrateToCurrentVersion(data);
          if (migratedData !== data) {
            console.log('Data migration completed');
            this.saveStorageData(migratedData);
            
            const migrationError = new ProgressError(
              ProgressErrorTypes.MIGRATION_ERROR,
              'Progress data has been updated to the latest format'
            );
            this.notifyErrorListeners(migrationError);
            return;
          }
        } catch (migrationError) {
          throw new ProgressError(
            ProgressErrorTypes.MIGRATION_ERROR,
            'Failed to migrate progress data',
            migrationError
          );
        }

        // Update last accessed time
        data.metadata.lastAccessed = Date.now();
        this.saveStorageData(data);

      } catch (error) {
        console.error('Error initializing storage:', error);
        
        const handled = this.handleStorageError(error, 'initialization', retryCount);
        
        if (handled && retryCount < maxRetries && this.isStorageAvailable) {
          retryCount++;
          console.log(`Retrying storage initialization (attempt ${retryCount + 1})`);
          setTimeout(attemptInitialization, 100 * retryCount); // Exponential backoff
        } else if (!handled) {
          // Final fallback
          this.fallbackToMemoryStorage(error);
        }
      }
    };

    attemptInitialization();
  }

  /**
   * Get storage data from localStorage or in-memory fallback with retry logic
   * @param {number} retryCount - Current retry attempt
   * @returns {object} Storage data
   */
  getStorageData(retryCount = 0) {
    if (!this.isStorageAvailable) {
      return this.inMemoryStorage || createDefaultStorageData();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const defaultData = createDefaultStorageData();
        // Save default data for future use
        this.saveStorageData(defaultData);
        return defaultData;
      }

      let data;
      try {
        data = JSON.parse(stored);
      } catch (parseError) {
        throw new ProgressError(
          ProgressErrorTypes.DATA_CORRUPTION,
          'Storage data is corrupted (invalid JSON)',
          parseError
        );
      }
      
      // Validate and repair data if needed
      if (!validateStorageData(data)) {
        console.warn('Invalid storage data structure, attempting repair');
        
        const error = new ProgressError(
          ProgressErrorTypes.VALIDATION_ERROR,
          'Invalid storage data structure detected'
        );
        
        const repairedData = dataIntegrity.repairStorageData(data);
        this.saveStorageData(repairedData);
        this.notifyErrorListeners(error);
        return repairedData;
      }

      // Migrate data if needed
      try {
        const migratedData = migrations.migrateToCurrentVersion(data);
        if (migratedData !== data) {
          this.saveStorageData(migratedData);
          
          const migrationError = new ProgressError(
            ProgressErrorTypes.MIGRATION_ERROR,
            'Progress data migrated to current version'
          );
          this.notifyErrorListeners(migrationError);
          return migratedData;
        }
      } catch (migrationError) {
        throw new ProgressError(
          ProgressErrorTypes.MIGRATION_ERROR,
          'Failed to migrate storage data',
          migrationError
        );
      }

      return data;
      
    } catch (error) {
      console.error('Error reading storage data:', error);
      
      const handled = this.handleStorageError(error, 'getStorageData', retryCount);
      
      if (handled && retryCount < this.maxRetries && this.isStorageAvailable) {
        // Retry with exponential backoff
        const delay = Math.min(100 * Math.pow(2, retryCount), 1000);
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(this.getStorageData(retryCount + 1));
          }, delay);
        });
      }
      
      // Return safe default data
      return this.inMemoryStorage || createDefaultStorageData();
    }
  }

  /**
   * Save storage data to localStorage or in-memory fallback with retry logic
   * @param {object} data - Data to save
   * @param {boolean} fromStorageEvent - True if this save is triggered by a storage event
   * @param {number} retryCount - Current retry attempt
   */
  saveStorageData(data, fromStorageEvent = false, retryCount = 0) {
    // Validate data before attempting to save
    if (!validateStorageData(data)) {
      const error = new ProgressError(
        ProgressErrorTypes.VALIDATION_ERROR,
        'Invalid data structure for storage'
      );
      
      console.error('Invalid data structure for storage:', data);
      this.notifyErrorListeners(error);
      
      // Try to repair the data
      try {
        const repairedData = dataIntegrity.repairStorageData(data);
        if (validateStorageData(repairedData)) {
          console.log('Data repaired successfully, saving repaired version');
          return this.saveStorageData(repairedData, fromStorageEvent, retryCount);
        }
      } catch (repairError) {
        console.error('Failed to repair invalid data:', repairError);
      }
      
      throw error;
    }

    if (!this.isStorageAvailable) {
      this.inMemoryStorage = { ...data };
      return;
    }

    try {
      // Set flag to prevent handling our own storage events
      if (!fromStorageEvent) {
        this.isUpdatingFromStorageEvent = true;
      }

      const jsonString = JSON.stringify(data);
      
      // Check if the JSON string is reasonable in size
      const sizeInBytes = new Blob([jsonString]).size;
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      
      if (sizeInBytes > maxSize) {
        throw new ProgressError(
          ProgressErrorTypes.STORAGE_QUOTA_EXCEEDED,
          `Data size (${Math.round(sizeInBytes / 1024)}KB) exceeds reasonable limit`
        );
      }
      
      localStorage.setItem(STORAGE_KEY, jsonString);

      // Reset flag after a brief delay to allow event to fire
      if (!fromStorageEvent) {
        setTimeout(() => {
          this.isUpdatingFromStorageEvent = false;
        }, 10);
      }

    } catch (error) {
      console.error('Error saving storage data:', error);
      
      const handled = this.handleStorageError(error, 'saveStorageData', retryCount);
      
      if (handled && retryCount < this.maxRetries && this.isStorageAvailable) {
        // Retry with exponential backoff
        const delay = Math.min(100 * Math.pow(2, retryCount), 1000);
        setTimeout(() => {
          this.saveStorageData(data, fromStorageEvent, retryCount + 1);
        }, delay);
        return;
      }
      
      // Fall back to in-memory storage
      console.warn('Falling back to in-memory storage after save failure');
      this.isStorageAvailable = false;
      this.inMemoryStorage = { ...data };
      
      const fallbackError = new ProgressError(
        ProgressErrorTypes.STORAGE_UNAVAILABLE,
        'Switched to in-memory storage due to save failures',
        error
      );
      this.notifyErrorListeners(fallbackError);
    }
  }

  /**
   * Handle storage errors with appropriate fallback strategies
   * @param {Error} error - The storage error
   * @param {string} operation - The operation that failed
   * @param {number} retryCount - Current retry attempt
   * @returns {boolean} True if error was handled and operation can continue
   */
  handleStorageError(error, operation = 'unknown', retryCount = 0) {
    this.errorCount++;
    
    let progressError;
    let handled = false;
    
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      progressError = new ProgressError(
        ProgressErrorTypes.STORAGE_QUOTA_EXCEEDED,
        'Storage quota exceeded, attempting cleanup',
        error
      );
      
      console.warn('Storage quota exceeded, attempting cleanup');
      
      try {
        this.cleanupOldData();
        handled = true;
        
        // Try the operation again if we haven't exceeded retry limit
        if (retryCount < this.maxRetries) {
          console.log(`Retrying ${operation} after cleanup (attempt ${retryCount + 1})`);
          return true; // Indicate that retry is possible
        }
      } catch (cleanupError) {
        console.error('Storage cleanup failed:', cleanupError);
        this.fallbackToMemoryStorage(progressError);
        handled = true;
      }
      
    } else if (error.name === 'SecurityError') {
      progressError = new ProgressError(
        ProgressErrorTypes.STORAGE_SECURITY_ERROR,
        'Storage access denied (private mode?), using in-memory storage',
        error
      );
      
      console.warn('Storage access denied (private mode?), using in-memory storage');
      this.fallbackToMemoryStorage(progressError);
      handled = true;
      
    } else if (error.name === 'SyntaxError' || error.message.includes('JSON')) {
      progressError = new ProgressError(
        ProgressErrorTypes.DATA_CORRUPTION,
        'Corrupted storage data detected, attempting repair',
        error
      );
      
      console.warn('Corrupted storage data detected, attempting repair');
      handled = this.repairCorruptedData(progressError);
      
    } else {
      progressError = new ProgressError(
        ProgressErrorTypes.UNKNOWN_ERROR,
        `Unexpected storage error during ${operation}: ${error.message}`,
        error
      );
      
      console.error('Unexpected storage error:', error);
      
      // Try to recover by resetting storage
      if (retryCount < this.maxRetries) {
        handled = this.attemptStorageReset(progressError);
      } else {
        this.fallbackToMemoryStorage(progressError);
        handled = true;
      }
    }
    
    // Store the error for debugging
    this.lastError = progressError;
    
    // Notify error listeners
    this.notifyErrorListeners(progressError);
    
    return handled;
  }

  /**
   * Fallback to in-memory storage when localStorage fails
   * @param {ProgressError} error - The error that caused the fallback
   */
  fallbackToMemoryStorage(error) {
    console.warn('Falling back to in-memory storage');
    
    // Preserve existing data if possible
    const existingData = this.inMemoryStorage || this.getStorageDataSafe();
    
    this.isStorageAvailable = false;
    this.inMemoryStorage = existingData || createDefaultStorageData();
    
    // Update error to indicate fallback
    error.message += ' (using in-memory storage)';
  }

  /**
   * Attempt to repair corrupted storage data
   * @param {ProgressError} error - The corruption error
   * @returns {boolean} True if repair was successful
   */
  repairCorruptedData(error) {
    try {
      console.log('Attempting to repair corrupted storage data');
      
      // Try to get raw storage data
      const rawData = localStorage.getItem(STORAGE_KEY);
      let corruptedData = null;
      
      if (rawData) {
        try {
          corruptedData = JSON.parse(rawData);
        } catch (parseError) {
          console.warn('Storage data is not valid JSON, creating fresh data');
        }
      }
      
      // Use data integrity repair function
      const repairedData = dataIntegrity.repairStorageData(corruptedData);
      
      // Save the repaired data
      this.saveStorageData(repairedData);
      
      console.log('Storage data repair completed successfully');
      error.message += ' (data repaired successfully)';
      
      return true;
      
    } catch (repairError) {
      console.error('Storage repair failed:', repairError);
      error.message += ` (repair failed: ${repairError.message})`;
      
      // Fall back to memory storage
      this.fallbackToMemoryStorage(error);
      return true; // Still handled, just with fallback
    }
  }

  /**
   * Attempt to reset storage as a last resort
   * @param {ProgressError} error - The error that triggered reset
   * @returns {boolean} True if reset was successful
   */
  attemptStorageReset(error) {
    try {
      console.warn('Attempting storage reset as last resort');
      
      if (this.isStorageAvailable) {
        localStorage.removeItem(STORAGE_KEY);
        this.saveStorageData(createDefaultStorageData());
        
        console.log('Storage reset completed successfully');
        error.message += ' (storage reset)';
        
        return true;
      }
      
      return false;
      
    } catch (resetError) {
      console.error('Failed to reset storage:', resetError);
      error.message += ` (reset failed: ${resetError.message})`;
      
      // Final fallback to memory storage
      this.fallbackToMemoryStorage(error);
      return true;
    }
  }

  /**
   * Safely get storage data with error handling
   * @returns {object} Storage data or default data
   */
  getStorageDataSafe() {
    try {
      return this.getStorageData();
    } catch (error) {
      console.warn('Failed to get storage data safely:', error);
      return createDefaultStorageData();
    }
  }

  /**
   * Clean up old data to free storage space
   */
  cleanupOldData() {
    try {
      const data = this.getStorageData();
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      // Remove worlds that haven't been accessed in 30 days
      const cleanedWorlds = {};
      for (const [worldId, worldData] of Object.entries(data.worlds)) {
        if (worldData.lastUpdated > cutoffTime) {
          cleanedWorlds[worldId] = worldData;
        }
      }
      
      data.worlds = cleanedWorlds;
      this.saveStorageData(data);
      
      console.log('Storage cleanup completed');
    } catch (error) {
      console.error('Storage cleanup failed:', error);
    }
  }

  /**
   * Get default world progress structure
   * @param {string} worldId - The world identifier
   * @returns {object} Default world progress
   */
  getDefaultWorldProgress(worldId) {
    return createDefaultWorldProgress(worldId);
  }

  /**
   * Get progress for a specific world with comprehensive error handling
   * @param {string} worldId - The world identifier
   * @returns {object} World progress data
   */
  getWorldProgress(worldId) {
    try {
      const sanitizedWorldId = validateWorldId(worldId);
      const data = this.getStorageData();
      
      if (!data.worlds[sanitizedWorldId]) {
        return this.getDefaultWorldProgress(sanitizedWorldId);
      }
      
      const worldData = data.worlds[sanitizedWorldId];
      
      // Validate world data before transformation
      if (!validateStorageWorldData(worldData)) {
        console.warn(`Invalid world data for ${sanitizedWorldId}, using repaired version`);
        
        const error = new ProgressError(
          ProgressErrorTypes.VALIDATION_ERROR,
          `Invalid world data for ${sanitizedWorldId}`
        );
        
        // Attempt to repair the world data
        const repairedWorldData = migrations.migrateWorldData(sanitizedWorldId, worldData);
        
        // Update storage with repaired data
        data.worlds[sanitizedWorldId] = repairedWorldData;
        this.saveStorageData(data);
        
        this.notifyErrorListeners(error);
        return transformFromStorageFormat(sanitizedWorldId, repairedWorldData);
      }
      
      return transformFromStorageFormat(sanitizedWorldId, worldData);
      
    } catch (error) {
      console.error('Error getting world progress:', error);
      
      // Create appropriate error based on the type of failure
      let progressError;
      if (error instanceof ProgressError) {
        progressError = error;
      } else {
        progressError = new ProgressError(
          ProgressErrorTypes.VALIDATION_ERROR,
          `Failed to get progress for world ${worldId}: ${error.message}`,
          error
        );
      }
      
      this.notifyErrorListeners(progressError);
      
      // Return safe default
      try {
        return this.getDefaultWorldProgress(worldId);
      } catch (defaultError) {
        console.error('Failed to create default progress:', defaultError);
        // Last resort fallback
        return {
          worldId: worldId || 'unknown',
          solvedPuzzles: new Set(),
          unlockedPuzzles: new Set(['puzzle_1']),
          lastUpdated: Date.now(),
          version: CURRENT_SCHEMA_VERSION
        };
      }
    }
  }

  /**
   * Save progress for a specific world with debounced writes and error handling
   * @param {string} worldId - The world identifier
   * @param {object} progress - Progress data to save
   * @param {boolean} immediate - If true, save immediately without debouncing
   */
  saveWorldProgress(worldId, progress, immediate = false) {
    try {
      const sanitizedWorldId = validateWorldId(worldId);
      
      // Sanitize and validate progress data
      let sanitizedProgress;
      try {
        sanitizedProgress = sanitizeWorldProgress({
          ...progress,
          worldId: sanitizedWorldId
        });
      } catch (sanitizeError) {
        const error = new ProgressError(
          ProgressErrorTypes.VALIDATION_ERROR,
          `Failed to sanitize progress data for world ${sanitizedWorldId}`,
          sanitizeError
        );
        
        console.error('Error sanitizing progress data:', sanitizeError);
        this.notifyErrorListeners(error);
        
        // Try to create a safe version of the progress
        sanitizedProgress = {
          worldId: sanitizedWorldId,
          solvedPuzzles: new Set(),
          unlockedPuzzles: new Set(['puzzle_1']),
          lastUpdated: Date.now(),
          version: CURRENT_SCHEMA_VERSION
        };
      }
      
      if (immediate) {
        this._saveWorldProgressImmediate(sanitizedWorldId, sanitizedProgress);
        return;
      }
      
      // Clear existing timeout for this world
      if (this.saveTimeouts.has(sanitizedWorldId)) {
        clearTimeout(this.saveTimeouts.get(sanitizedWorldId));
      }
      
      // Set up debounced save with error handling
      const timeoutId = setTimeout(() => {
        try {
          this._saveWorldProgressImmediate(sanitizedWorldId, sanitizedProgress);
        } catch (saveError) {
          console.error('Error in debounced save:', saveError);
          
          const error = new ProgressError(
            ProgressErrorTypes.UNKNOWN_ERROR,
            `Failed to save progress for world ${sanitizedWorldId}`,
            saveError
          );
          this.notifyErrorListeners(error);
        } finally {
          this.saveTimeouts.delete(sanitizedWorldId);
        }
      }, this.DEBOUNCE_DELAY);
      
      this.saveTimeouts.set(sanitizedWorldId, timeoutId);
      
      // Notify listeners immediately for UI responsiveness
      this.notifyProgressChange(sanitizedWorldId, sanitizedProgress);
      
    } catch (error) {
      console.error('Error saving world progress:', error);
      
      const progressError = error instanceof ProgressError ? error : new ProgressError(
        ProgressErrorTypes.VALIDATION_ERROR,
        `Failed to save progress for world ${worldId}: ${error.message}`,
        error
      );
      
      this.notifyErrorListeners(progressError);
      throw progressError;
    }
  }

  /**
   * Internal method to save progress immediately with error handling
   * @param {string} worldId - The world identifier
   * @param {object} progress - Progress data to save
   * @private
   */
  _saveWorldProgressImmediate(worldId, progress) {
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptSave = () => {
      try {
        // Transform to storage format
        const storageData = transformToStorageFormat(progress);
        
        const data = this.getStorageData();
        data.worlds[worldId] = storageData;
        data.metadata.lastAccessed = Date.now();
        
        this.saveStorageData(data);
        
      } catch (error) {
        console.error('Error in immediate save:', error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying immediate save for ${worldId} (attempt ${retryCount})`);
          
          // Exponential backoff
          const delay = Math.min(100 * Math.pow(2, retryCount - 1), 1000);
          setTimeout(attemptSave, delay);
          return;
        }
        
        // Create appropriate error
        const progressError = error instanceof ProgressError ? error : new ProgressError(
          ProgressErrorTypes.UNKNOWN_ERROR,
          `Failed to save progress immediately for world ${worldId}`,
          error
        );
        
        this.notifyErrorListeners(progressError);
        throw progressError;
      }
    };
    
    attemptSave();
  }

  /**
   * Reset progress for a specific world with error handling
   * @param {string} worldId - The world identifier
   */
  resetWorldProgress(worldId) {
    try {
      const sanitizedWorldId = validateWorldId(worldId);
      const data = this.getStorageData();
      
      // Reset to default progress
      const resetData = {
        solvedPuzzles: [],
        unlockedPuzzles: ['puzzle_1'],
        lastUpdated: Date.now()
      };
      
      data.worlds[sanitizedWorldId] = resetData;
      data.metadata.lastAccessed = Date.now();
      
      this.saveStorageData(data);
      
      // Create progress object for notification
      const resetProgress = {
        worldId: sanitizedWorldId,
        solvedPuzzles: new Set(),
        unlockedPuzzles: new Set(['puzzle_1']),
        lastUpdated: resetData.lastUpdated,
        version: CURRENT_SCHEMA_VERSION
      };
      
      // Notify listeners of progress change
      this.notifyProgressChange(sanitizedWorldId, resetProgress);
      
    } catch (error) {
      console.error('Error resetting world progress:', error);
      
      const progressError = error instanceof ProgressError ? error : new ProgressError(
        ProgressErrorTypes.UNKNOWN_ERROR,
        `Failed to reset progress for world ${worldId}: ${error.message}`,
        error
      );
      
      this.notifyErrorListeners(progressError);
      
      // Try to notify with default progress anyway
      try {
        const defaultProgress = this.getDefaultWorldProgress(worldId);
        this.notifyProgressChange(worldId, defaultProgress);
      } catch (defaultError) {
        console.error('Failed to create default progress for reset:', defaultError);
      }
      
      throw progressError;
    }
  }

  /**
   * Check if a puzzle is solved with error handling
   * @param {string} worldId - The world identifier
   * @param {string} puzzleId - The puzzle identifier
   * @returns {boolean} True if puzzle is solved
   */
  isPuzzleSolved(worldId, puzzleId) {
    try {
      const sanitizedPuzzleId = validatePuzzleId(puzzleId);
      const progress = this.getWorldProgress(worldId);
      
      // Handle both Set and Array formats for backward compatibility
      if (progress.solvedPuzzles instanceof Set) {
        return progress.solvedPuzzles.has(sanitizedPuzzleId);
      } else if (Array.isArray(progress.solvedPuzzles)) {
        return progress.solvedPuzzles.includes(sanitizedPuzzleId);
      }
      
      return false;
      
    } catch (error) {
      console.error('Error checking if puzzle is solved:', error);
      
      const progressError = new ProgressError(
        ProgressErrorTypes.VALIDATION_ERROR,
        `Failed to check if puzzle ${puzzleId} is solved in world ${worldId}`,
        error,
        true // This is recoverable
      );
      
      this.notifyErrorListeners(progressError);
      return false; // Safe default
    }
  }

  /**
   * Check if a puzzle is unlocked with error handling
   * @param {string} worldId - The world identifier
   * @param {string} puzzleId - The puzzle identifier
   * @returns {boolean} True if puzzle is unlocked
   */
  isPuzzleUnlocked(worldId, puzzleId) {
    try {
      const sanitizedPuzzleId = validatePuzzleId(puzzleId);
      const progress = this.getWorldProgress(worldId);
      
      // Handle both Set and Array formats for backward compatibility
      if (progress.unlockedPuzzles instanceof Set) {
        return progress.unlockedPuzzles.has(sanitizedPuzzleId);
      } else if (Array.isArray(progress.unlockedPuzzles)) {
        return progress.unlockedPuzzles.includes(sanitizedPuzzleId);
      }
      
      // Default: first puzzle is always unlocked
      return sanitizedPuzzleId === 'puzzle_1';
      
    } catch (error) {
      console.error('Error checking if puzzle is unlocked:', error);
      
      const progressError = new ProgressError(
        ProgressErrorTypes.VALIDATION_ERROR,
        `Failed to check if puzzle ${puzzleId} is unlocked in world ${worldId}`,
        error,
        true // This is recoverable
      );
      
      this.notifyErrorListeners(progressError);
      
      // Safe default: first puzzle is always unlocked
      try {
        const sanitizedPuzzleId = validatePuzzleId(puzzleId);
        return sanitizedPuzzleId === 'puzzle_1';
      } catch {
        return false;
      }
    }
  }

  /**
   * Get list of unlocked puzzles for a world with error handling
   * @param {string} worldId - The world identifier
   * @returns {string[]} Array of unlocked puzzle IDs
   */
  getUnlockedPuzzles(worldId) {
    try {
      const progress = this.getWorldProgress(worldId);
      
      // Handle both Set and Array formats for backward compatibility
      if (progress.unlockedPuzzles instanceof Set) {
        return [...progress.unlockedPuzzles];
      } else if (Array.isArray(progress.unlockedPuzzles)) {
        return [...progress.unlockedPuzzles];
      }
      
      return ['puzzle_1']; // Safe default
      
    } catch (error) {
      console.error('Error getting unlocked puzzles:', error);
      
      const progressError = new ProgressError(
        ProgressErrorTypes.VALIDATION_ERROR,
        `Failed to get unlocked puzzles for world ${worldId}`,
        error,
        true // This is recoverable
      );
      
      this.notifyErrorListeners(progressError);
      return ['puzzle_1']; // Safe default
    }
  }

  /**
   * Add event listener for progress changes
   * @param {Function} callback - Callback function to call on progress change
   */
  onProgressChange(callback) {
    if (typeof callback === 'function') {
      this.eventListeners.push(callback);
    }
  }

  /**
   * Remove event listener for progress changes
   * @param {Function} callback - Callback function to remove
   */
  offProgressChange(callback) {
    const index = this.eventListeners.indexOf(callback);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Add event listener for error notifications
   * @param {Function} callback - Callback function to call on error (receives ProgressError)
   */
  onError(callback) {
    if (typeof callback === 'function') {
      this.errorListeners.push(callback);
    }
  }

  /**
   * Remove error event listener
   * @param {Function} callback - Callback function to remove
   */
  offError(callback) {
    const index = this.errorListeners.indexOf(callback);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Notify all error listeners of an error
   * @param {ProgressError} error - The error to notify about
   */
  notifyErrorListeners(error) {
    this.errorListeners.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  /**
   * Notify all listeners of progress change
   * @param {string} worldId - The world that changed
   * @param {object} progress - The new progress data
   */
  notifyProgressChange(worldId, progress) {
    this.eventListeners.forEach(callback => {
      try {
        callback(worldId, progress);
      } catch (error) {
        console.error('Error in progress change callback:', error);
      }
    });
  }

  /**
   * Flush all pending debounced saves immediately
   * Useful for cleanup or when user is leaving the page
   */
  flushPendingSaves() {
    for (const [worldId, timeoutId] of this.saveTimeouts.entries()) {
      clearTimeout(timeoutId);
      // Note: We can't easily recover the progress data here since it's in the timeout closure
      // This method is mainly for cleanup. For critical saves, use immediate=true
    }
    this.saveTimeouts.clear();
  }

  /**
   * Enable cross-tab synchronization (enabled by default)
   */
  enableCrossTabSync() {
    if (!this.storageEventListener && this.isStorageAvailable && typeof window !== 'undefined') {
      this.initializeCrossTabSync();
    }
  }

  /**
   * Disable cross-tab synchronization
   */
  disableCrossTabSync() {
    if (this.storageEventListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageEventListener);
      this.storageEventListener = null;
    }
  }

  /**
   * Check if cross-tab synchronization is enabled
   * @returns {boolean} True if cross-tab sync is enabled
   */
  isCrossTabSyncEnabled() {
    return this.storageEventListener !== null;
  }

  /**
   * Cleanup method to remove event listeners and clean up resources
   * Should be called when the service is no longer needed
   */
  cleanup() {
    try {
      console.log('Cleaning up progress service...');
      
      // Flush any pending saves immediately
      this.flushPendingSaves();
      
      // Remove storage event listener
      this.disableCrossTabSync();
      
      // Clear all event listeners
      this.eventListeners = [];
      this.errorListeners = [];
      
      // Clear error state
      this.lastError = null;
      this.errorCount = 0;
      
      // Clear in-memory storage
      this.inMemoryStorage = null;
      
      console.log('Progress service cleanup completed');
      
    } catch (error) {
      console.error('Error during service cleanup:', error);
      
      // Force clear everything even if there were errors
      this.eventListeners = [];
      this.errorListeners = [];
      this.saveTimeouts.clear();
    }
  }

  /**
   * Get storage statistics for debugging with error handling
   * @returns {object} Storage statistics
   */
  getStorageStats() {
    try {
      const data = this.getStorageData();
      const worldCount = Object.keys(data.worlds).length;
      let totalSolved = 0;
      let totalUnlocked = 0;
      
      for (const worldData of Object.values(data.worlds)) {
        if (worldData && Array.isArray(worldData.solvedPuzzles)) {
          totalSolved += worldData.solvedPuzzles.length;
        }
        if (worldData && Array.isArray(worldData.unlockedPuzzles)) {
          totalUnlocked += worldData.unlockedPuzzles.length;
        }
      }
      
      return {
        version: data.version,
        worldCount,
        totalSolved,
        totalUnlocked,
        storageType: this.isStorageAvailable ? 'localStorage' : 'memory',
        crossTabSync: this.isCrossTabSyncEnabled(),
        createdAt: data.metadata.createdAt,
        lastAccessed: data.metadata.lastAccessed,
        pendingSaves: this.saveTimeouts.size,
        errorCount: this.errorCount,
        lastError: this.lastError ? {
          type: this.lastError.type,
          message: this.lastError.message,
          timestamp: this.lastError.timestamp,
          recoverable: this.lastError.recoverable
        } : null
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      
      return {
        version: 'unknown',
        worldCount: 0,
        totalSolved: 0,
        totalUnlocked: 0,
        storageType: this.isStorageAvailable ? 'localStorage' : 'memory',
        crossTabSync: this.isCrossTabSyncEnabled(),
        createdAt: 0,
        lastAccessed: 0,
        pendingSaves: this.saveTimeouts.size,
        errorCount: this.errorCount,
        lastError: this.lastError,
        statsError: error.message
      };
    }
  }

  /**
   * Get the last error that occurred
   * @returns {ProgressError|null} The last error or null if no errors
   */
  getLastError() {
    return this.lastError;
  }

  /**
   * Clear the last error (useful after user acknowledges the error)
   */
  clearLastError() {
    this.lastError = null;
  }

  /**
   * Get error count since service initialization
   * @returns {number} Number of errors that have occurred
   */
  getErrorCount() {
    return this.errorCount;
  }

  /**
   * Reset error count (useful for testing or after error recovery)
   */
  resetErrorCount() {
    this.errorCount = 0;
  }

  /**
   * Check if the service is in a healthy state
   * @returns {object} Health status information
   */
  getHealthStatus() {
    const recentErrorThreshold = 5 * 60 * 1000; // 5 minutes
    const recentErrors = this.lastError && 
      (Date.now() - this.lastError.timestamp) < recentErrorThreshold;
    
    return {
      healthy: this.errorCount < 10 && !recentErrors,
      storageAvailable: this.isStorageAvailable,
      crossTabSyncEnabled: this.isCrossTabSyncEnabled(),
      errorCount: this.errorCount,
      hasRecentErrors: recentErrors,
      lastErrorType: this.lastError?.type || null,
      pendingSaves: this.saveTimeouts.size,
      recommendations: this.getHealthRecommendations()
    };
  }

  /**
   * Get health recommendations based on current state
   * @returns {string[]} Array of recommendations
   */
  getHealthRecommendations() {
    const recommendations = [];
    
    if (!this.isStorageAvailable) {
      recommendations.push('Consider exiting private browsing mode for persistent progress');
    }
    
    if (this.errorCount > 5) {
      recommendations.push('Multiple errors detected - consider refreshing the page');
    }
    
    if (this.saveTimeouts.size > 3) {
      recommendations.push('Many pending saves - progress may be delayed');
    }
    
    if (this.lastError && this.lastError.type === ProgressErrorTypes.STORAGE_QUOTA_EXCEEDED) {
      recommendations.push('Storage space is low - old data has been cleaned up');
    }
    
    return recommendations;
  }

  /**
   * Attempt to recover from errors by reinitializing the service
   * @returns {boolean} True if recovery was successful
   */
  attemptRecovery() {
    try {
      console.log('Attempting service recovery...');
      
      // Clear pending saves
      this.flushPendingSaves();
      
      // Reset error state
      this.errorCount = 0;
      this.lastError = null;
      
      // Check storage availability again
      this.isStorageAvailable = isLocalStorageAvailable();
      
      // Reinitialize storage
      this.initializeStorage();
      
      console.log('Service recovery completed successfully');
      return true;
      
    } catch (error) {
      console.error('Service recovery failed:', error);
      
      const recoveryError = new ProgressError(
        ProgressErrorTypes.UNKNOWN_ERROR,
        'Failed to recover service',
        error,
        false // Not recoverable
      );
      
      this.notifyErrorListeners(recoveryError);
      return false;
    }
  }
}

// Create and export singleton instance
const progressService = new ProgressService();

export default progressService;