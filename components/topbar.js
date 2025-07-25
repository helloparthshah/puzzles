import 'bootstrap/dist/css/bootstrap.min.css';
import { Container } from 'react-bootstrap';
import {
    Tab,
    TabList,
    Divider,
    ToolbarButton,
    Text,
    Link
} from "@fluentui/react-components";
import {
    ArrowLeft24Regular
} from "@fluentui/react-icons";
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useProgress } from '/hooks/useProgress';
import ResetProgressDialog from './ResetProgressDialog';
import solved from 'public/solved.svg'
import locked from 'public/lock.svg'
import Image from 'next/image';

export default function Topbar({ name, puzzles, selected, setSelected }) {
    const params = useParams();
    const {
        worldProgress,
        isReady: progressReady,
        getSolvedPuzzles,
        getUnlockedPuzzles,
        isPuzzleSolved,
        isPuzzleUnlocked,
        resetProgress
    } = useProgress(params?.world);

    // State for reset functionality
    const [isResetting, setIsResetting] = useState(false);

    /**
     * Handle tab selection with progress-aware validation
     */
    const handleTabSelect = (e, props) => {
        const selectedPuzzle = puzzles.find(p => p.id === props.value);
        
        // Only allow selection of unlocked puzzles
        if (selectedPuzzle && !selectedPuzzle.disabled) {
            setSelected(props.value);
        }
    };

    /**
     * Handle progress reset with error handling
     */
    const handleResetProgress = async () => {
        if (!params?.world || isResetting) {
            return;
        }

        try {
            setIsResetting(true);
            
            // Reset progress using the hook
            await resetProgress();
            
            // After reset, select the first puzzle (which should be unlocked)
            if (puzzles.length > 0) {
                setSelected(puzzles[0].id);
            }
            
        } catch (error) {
            console.error('Error resetting progress:', error);
            // Error handling is done in the hook, just log here
        } finally {
            setIsResetting(false);
        }
    };
    return (
        <Container className="d-flex flex-column w-25 h-100 bg-darker justify-content-between" style={{ position: "fixed" }}>
            <div>
                <ToolbarButton icon={<ArrowLeft24Regular />} as="a" href={"/"} />
                <h2>{name}</h2>
                <Divider />
                <TabList
                    className='mt-3'
                    vertical='true'
                    selectedValue={selected} 
                    onTabSelect={handleTabSelect}
                >
                    {
                        puzzles.length > 0 ? (puzzles.map((puzzle) => {
                            return (
                                <Tab
                                    value={puzzle.id}
                                    disabled={puzzle.disabled}
                                    className='mt-2'
                                    key={puzzle.id}
                                    style={{
                                        opacity: puzzle.disabled ? 0.5 : 1,
                                        cursor: puzzle.disabled ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {puzzle.name}
                                    <span style={{ marginLeft: '8px' }}>
                                        {puzzle.disabled ? (
                                            <Image
                                                src={locked}
                                                alt="Locked"
                                                width={20}
                                                height={20}
                                                style={{ filter: 'grayscale(100%)' }}
                                            />
                                        ) : puzzle.solved ? (
                                            <Image
                                                src={solved}
                                                alt="Solved"
                                                width={20}
                                                height={20}
                                                style={{ filter: 'brightness(1.1)' }}
                                            />
                                        ) : (
                                            <div 
                                                style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    border: '2px solid #666',
                                                    display: 'inline-block',
                                                    backgroundColor: 'transparent',
                                                    verticalAlign: 'bottom'
                                                }}
                                                title="Not solved"
                                            />
                                        )}
                                    </span>
                                </Tab>
                            )
                        })) : (
                            <div style={{ 
                                padding: '1rem', 
                                textAlign: 'center', 
                                color: '#666',
                                fontStyle: 'italic' 
                            }}>
                                No puzzles available
                            </div>
                        )
                    }
                </TabList>
                
                {/* Progress Summary */}
                {progressReady && puzzles.length > 0 && (
                    <div className='mt-4'>
                        <Divider className='mb-2' />
                        <div style={{ padding: '0.5rem 0' }}>
                            <Text size={300}>
                                Progress: {puzzles.filter(p => p.solved).length} / {puzzles.length} solved
                            </Text>
                            <div style={{ 
                                width: '100%', 
                                height: '4px', 
                                backgroundColor: '#e0e0e0', 
                                borderRadius: '2px',
                                marginTop: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${(puzzles.filter(p => p.solved).length / puzzles.length) * 100}%`,
                                    height: '100%',
                                    backgroundColor: '#28a745',
                                    borderRadius: '2px',
                                    transition: 'width 0.3s ease-in-out'
                                }} />
                            </div>
                        </div>
                        
                        {/* Reset Progress Button */}
                        <div style={{ marginTop: '12px' }}>
                            <ResetProgressDialog
                                worldName={name}
                                onConfirmReset={handleResetProgress}
                                isResetting={isResetting}
                                disabled={!progressReady || puzzles.filter(p => p.solved).length === 0}
                            />
                        </div>
                    </div>
                )}
            </div>
            <span className='mb-5'>
                <Divider className='mb-2' />
                <Text className='mt-3'>Made with ❤️ by <Link href="https://github.com/helloparthshah">Parth Shah</Link> and <Link href="https://github.com/kunpai">Kunal Pai</Link></Text>
            </span>
        </Container>
    );
};