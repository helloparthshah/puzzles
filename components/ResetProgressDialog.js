/**
 * ResetProgressDialog - Confirmation dialog for resetting world progress
 * Provides a safe way to reset progress with user confirmation
 */

import React from 'react';
import {
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    DialogContent,
    Button,
    Text
} from "@fluentui/react-components";
import {
    Delete24Regular,
    Warning24Regular
} from "@fluentui/react-icons";

/**
 * Reset Progress Dialog Component
 * @param {object} props - Component props
 * @param {string} props.worldName - Name of the world to reset
 * @param {Function} props.onConfirmReset - Callback when reset is confirmed
 * @param {boolean} props.isResetting - Whether reset operation is in progress
 * @param {boolean} props.disabled - Whether the reset button should be disabled
 * @returns {JSX.Element} Reset dialog component
 */
export default function ResetProgressDialog({ 
    worldName, 
    onConfirmReset, 
    isResetting = false, 
    disabled = false 
}) {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleConfirmReset = async () => {
        try {
            await onConfirmReset();
            setIsOpen(false);
        } catch (error) {
            console.error('Error during reset:', error);
            // Keep dialog open on error so user can try again
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(event, data) => setIsOpen(data.open)}>
            <DialogTrigger disableButtonEnhancement>
                <Button
                    appearance="subtle"
                    icon={<Delete24Regular />}
                    disabled={disabled || isResetting}
                    title={`Reset progress for ${worldName}`}
                    style={{
                        color: '#dc3545',
                        borderColor: '#dc3545'
                    }}
                >
                    {isResetting ? 'Resetting...' : 'Reset Progress'}
                </Button>
            </DialogTrigger>
            
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Warning24Regular style={{ color: '#ff6b35' }} />
                            Reset Progress for {worldName}?
                        </div>
                    </DialogTitle>
                    
                    <DialogContent>
                        <div style={{ marginBottom: '16px' }}>
                            <Text>
                                This action will permanently delete all your progress in <strong>{worldName}</strong>, including:
                            </Text>
                            <ul style={{ marginTop: '8px', marginBottom: '16px' }}>
                                <li>All solved puzzles will be marked as unsolved</li>
                                <li>Only the first puzzle will remain unlocked</li>
                                <li>You will need to solve puzzles again to unlock subsequent ones</li>
                            </ul>
                            <Text style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                This action cannot be undone.
                            </Text>
                        </div>
                        
                        <div style={{ 
                            padding: '12px', 
                            backgroundColor: '#fff3cd', 
                            border: '1px solid #ffeaa7',
                            borderRadius: '4px',
                            marginBottom: '8px'
                        }}>
                            <Text size={200} style={{ color: '#856404' }}>
                                <strong>Note:</strong> Progress in other worlds will not be affected.
                            </Text>
                        </div>
                    </DialogContent>
                    
                    <DialogActions>
                        <DialogTrigger disableButtonEnhancement>
                            <Button 
                                appearance="secondary"
                                onClick={handleCancel}
                                disabled={isResetting}
                            >
                                Cancel
                            </Button>
                        </DialogTrigger>
                        
                        <Button
                            appearance="primary"
                            onClick={handleConfirmReset}
                            disabled={isResetting}
                            style={{
                                backgroundColor: '#dc3545',
                                borderColor: '#dc3545'
                            }}
                        >
                            {isResetting ? 'Resetting...' : 'Yes, Reset Progress'}
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}