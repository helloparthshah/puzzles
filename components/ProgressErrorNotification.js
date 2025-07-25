/**
 * Progress Error Notification Component
 * Displays user-friendly error messages and recovery options for progress service errors
 */

import { useState, useEffect } from 'react';
import progressService, { ProgressErrorTypes } from '../utils/progressService.js';

export default function ProgressErrorNotification() {
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleError = (progressError) => {
      // Only show errors that are user-facing
      if (progressError.recoverable) {
        setError(progressError);
        setDismissed(false);
      }
    };

    // Listen for errors
    progressService.onError(handleError);

    // Check for existing error on mount
    const lastError = progressService.getLastError();
    if (lastError && lastError.recoverable) {
      setError(lastError);
    }

    return () => {
      progressService.offError(handleError);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    progressService.clearLastError();
  };

  const handleRetry = () => {
    const success = progressService.attemptRecovery();
    if (success) {
      setError(null);
      setDismissed(true);
    }
  };

  // Don't render if no error or dismissed
  if (!error || dismissed) {
    return null;
  }

  const getErrorIcon = (errorType) => {
    switch (errorType) {
      case ProgressErrorTypes.STORAGE_UNAVAILABLE:
      case ProgressErrorTypes.STORAGE_SECURITY_ERROR:
        return '⚠️';
      case ProgressErrorTypes.STORAGE_QUOTA_EXCEEDED:
        return '💾';
      case ProgressErrorTypes.DATA_CORRUPTION:
      case ProgressErrorTypes.VALIDATION_ERROR:
        return '🔧';
      case ProgressErrorTypes.MIGRATION_ERROR:
        return '🔄';
      default:
        return 'ℹ️';
    }
  };

  const getErrorColor = (errorType) => {
    switch (errorType) {
      case ProgressErrorTypes.STORAGE_UNAVAILABLE:
      case ProgressErrorTypes.STORAGE_SECURITY_ERROR:
        return '#f59e0b'; // amber
      case ProgressErrorTypes.STORAGE_QUOTA_EXCEEDED:
        return '#3b82f6'; // blue
      case ProgressErrorTypes.DATA_CORRUPTION:
      case ProgressErrorTypes.VALIDATION_ERROR:
        return '#10b981'; // emerald
      case ProgressErrorTypes.MIGRATION_ERROR:
        return '#8b5cf6'; // violet
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        maxWidth: '400px',
        backgroundColor: 'white',
        border: `2px solid ${getErrorColor(error.type)}`,
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '20px', flexShrink: 0 }}>
          {getErrorIcon(error.type)}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: getErrorColor(error.type)
          }}>
            Progress Notice
          </div>
          
          <div style={{ 
            marginBottom: '12px', 
            lineHeight: '1.4',
            color: '#374151'
          }}>
            {error.getUserMessage()}
          </div>
          
          {error.getRecoverySuggestions().length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                fontWeight: '500', 
                marginBottom: '4px',
                color: '#4b5563'
              }}>
                Suggestions:
              </div>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '16px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                {error.getRecoverySuggestions().map((suggestion, index) => (
                  <li key={index} style={{ marginBottom: '2px' }}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {error.recoverable && (
              <button
                onClick={handleRetry}
                style={{
                  padding: '6px 12px',
                  backgroundColor: getErrorColor(error.type),
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => {
                  e.target.style.opacity = '0.9';
                }}
                onMouseOut={(e) => {
                  e.target.style.opacity = '1';
                }}
              >
                Retry
              </button>
            )}
            
            <button
              onClick={handleDismiss}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#e5e7eb';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to get progress service health status
 * @returns {object} Health status and error information
 */
export function useProgressHealth() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [lastError, setLastError] = useState(null);

  useEffect(() => {
    const updateHealth = () => {
      setHealthStatus(progressService.getHealthStatus());
      setLastError(progressService.getLastError());
    };

    const handleError = () => {
      updateHealth();
    };

    // Initial update
    updateHealth();

    // Listen for errors to update health status
    progressService.onError(handleError);

    // Update health status periodically
    const interval = setInterval(updateHealth, 30000); // Every 30 seconds

    return () => {
      progressService.offError(handleError);
      clearInterval(interval);
    };
  }, []);

  return {
    healthStatus,
    lastError,
    isHealthy: healthStatus?.healthy ?? true,
    errorCount: healthStatus?.errorCount ?? 0,
    recommendations: healthStatus?.recommendations ?? []
  };
}