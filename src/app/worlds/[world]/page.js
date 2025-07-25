'use client';

// Import necessary dependencies
import { Col } from 'react-bootstrap';
import Topbar from '/components/topbar';
import Puzzle from '/components/puzzle';
import ProgressErrorNotification from '/components/ProgressErrorNotification';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useProgress } from '/hooks/useProgress';

export default function Page() {
    const params = useParams();
    const [puzzles, setPuzzles] = useState([]);
    const [name, setName] = useState([]);
    const [selected, setSelected] = useState("");
    const [image, setImage] = useState("");
    const [isLoadingPuzzles, setIsLoadingPuzzles] = useState(true);
    const [puzzleLoadError, setPuzzleLoadError] = useState(null);

    // Use progress hook for this world
    const {
        worldProgress,
        isLoading: progressLoading,
        markPuzzleSolved,
        getSolvedPuzzles,
        getUnlockedPuzzles,
        isReady: progressReady,
        error: progressError
    } = useProgress(params.world);

    /**
     * Load puzzles from API and initialize their states based on saved progress
     */
    const loadPuzzles = useCallback(async () => {
        if (!params.world) {
            setPuzzleLoadError(new Error('World parameter is required'));
            setIsLoadingPuzzles(false);
            return;
        }

        try {
            setIsLoadingPuzzles(true);
            setPuzzleLoadError(null);

            const response = await fetch('/api/getAllPuzzlesForWorld', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ world: params.world }),
            });

            if (!response.ok) {
                throw new Error(`Failed to load puzzles: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            let dataPuzzles = data.puzzles || [];

            // Initialize puzzle states based on saved progress
            if (progressReady && worldProgress) {
                const solvedPuzzles = getSolvedPuzzles();
                const unlockedPuzzles = getUnlockedPuzzles();

                // Apply progress state to each puzzle
                dataPuzzles = dataPuzzles.map(puzzle => ({
                    ...puzzle,
                    solved: solvedPuzzles.includes(puzzle.id),
                    disabled: !unlockedPuzzles.includes(puzzle.id)
                }));

                // Set initial selected puzzle to first unlocked unsolved puzzle, or first unlocked
                const firstUnlockedUnsolved = dataPuzzles.find(p =>
                    unlockedPuzzles.includes(p.id) && !solvedPuzzles.includes(p.id)
                );
                const firstUnlocked = dataPuzzles.find(p => unlockedPuzzles.includes(p.id));
                const selectedPuzzleId = firstUnlockedUnsolved?.id || firstUnlocked?.id || dataPuzzles[0]?.id || "";
                setSelected(selectedPuzzleId);

            } else {
                // Fallback to default behavior if progress not ready
                dataPuzzles = dataPuzzles.map((puzzle, index) => ({
                    ...puzzle,
                    solved: false,
                    disabled: index !== 0 // Only first puzzle unlocked by default
                }));

                setSelected(dataPuzzles[0]?.id || "");
            }

            setPuzzles(dataPuzzles);
            setName(data.name || 'Unknown World');
            setImage(data.image || '');
            setIsLoadingPuzzles(false);

        } catch (error) {
            console.error('Error loading puzzles:', error);
            setPuzzleLoadError(error);
            setIsLoadingPuzzles(false);

            // Set minimal fallback state
            setPuzzles([]);
            setName('Error Loading World');
            setImage('');
            setSelected('');
        }
    }, [params.world, progressReady, worldProgress, getSolvedPuzzles, getUnlockedPuzzles]);

    // Load puzzles when component mounts or when progress becomes ready
    useEffect(() => {
        if (progressReady || (!progressLoading && progressError)) {
            loadPuzzles();
        }
    }, [loadPuzzles, progressReady, progressLoading, progressError]);

    /**
     * Update puzzle states when progress changes (cross-tab sync, etc.)
     */
    useEffect(() => {
        if (progressReady && worldProgress && puzzles.length > 0) {
            const solvedPuzzles = getSolvedPuzzles();
            const unlockedPuzzles = getUnlockedPuzzles();

            const updatedPuzzles = puzzles.map(puzzle => ({
                ...puzzle,
                solved: solvedPuzzles.includes(puzzle.id),
                disabled: !unlockedPuzzles.includes(puzzle.id)
            }));

            // Only update if there are actual changes to prevent unnecessary re-renders
            const hasChanges = puzzles.some((puzzle, index) =>
                puzzle.solved !== updatedPuzzles[index].solved ||
                puzzle.disabled !== updatedPuzzles[index].disabled
            );

            if (hasChanges) {
                setPuzzles(updatedPuzzles);

                // If currently selected puzzle becomes disabled, switch to first unlocked
                const currentPuzzle = updatedPuzzles.find(p => p.id === selected);
                if (currentPuzzle && currentPuzzle.disabled) {
                    const firstUnlocked = updatedPuzzles.find(p => !p.disabled);
                    if (firstUnlocked) {
                        setSelected(firstUnlocked.id);
                    }
                }
            }
        }
    }, [worldProgress, progressReady, getSolvedPuzzles, getUnlockedPuzzles, puzzles, selected]);

    /**
     * Handle puzzle submission and progress saving
     */
    const onSubmit = useCallback(async (answer) => {
        if (!selected || !params.world) {
            console.error('Missing selected puzzle or world parameter');
            return false;
        }

        try {
            // Check answer with API
            const response = await fetch('/api/checkAnswer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answer: answer,
                    id: selected,
                    world: params.world
                }),
            });

            if (!response.ok) {
                throw new Error(`Answer check failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const isCorrect = result === true || result.correct === true;

            if (isCorrect) {
                // Update local puzzle state immediately for UI responsiveness
                const updatedPuzzles = puzzles.map(puzzle => {
                    if (puzzle.id === selected) {
                        return { ...puzzle, solved: true };
                    }
                    return puzzle;
                });
                setPuzzles(updatedPuzzles);

                try {
                    // Save progress using the progress service - this handles auto-unlocking
                    await markPuzzleSolved(selected);

                    // Apply unlocked states based on updated progress after successful save
                    const unlockedPuzzles = getUnlockedPuzzles();
                    const finalPuzzles = updatedPuzzles.map(puzzle => ({
                        ...puzzle,
                        disabled: !unlockedPuzzles.includes(puzzle.id)
                    }));

                    setPuzzles(finalPuzzles);

                    // Auto-select next unlocked unsolved puzzle if available
                    const nextUnsolvedUnlocked = finalPuzzles.find(p =>
                        !p.solved && !p.disabled && p.id !== selected
                    );
                    if (nextUnsolvedUnlocked) {
                        setSelected(nextUnsolvedUnlocked.id);
                    }

                } catch (progressError) {
                    console.error('Error saving progress:', progressError);

                    // Fallback: unlock next puzzle in sequence even if progress save fails
                    const currentIndex = updatedPuzzles.findIndex(p => p.id === selected);
                    if (currentIndex >= 0 && currentIndex + 1 < updatedPuzzles.length) {
                        const fallbackPuzzles = updatedPuzzles.map((puzzle, index) => {
                            if (index === currentIndex + 1) {
                                return { ...puzzle, disabled: false };
                            }
                            return puzzle;
                        });
                        setPuzzles(fallbackPuzzles);

                        // Auto-select next puzzle
                        const nextPuzzle = fallbackPuzzles[currentIndex + 1];
                        if (nextPuzzle && !nextPuzzle.solved) {
                            setSelected(nextPuzzle.id);
                        }
                    }

                    // Don't throw error - graceful degradation
                }
            }

            return isCorrect;

        } catch (error) {
            console.error('Error in puzzle submission:', error);
            return false;
        }
    }, [selected, params.world, puzzles, markPuzzleSolved, getUnlockedPuzzles]);

    // Show loading state while puzzles or progress are loading
    if (isLoadingPuzzles || progressLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem'
            }}>
                Loading world...
            </div>
        );
    }

    // Show error state if there are critical errors
    if (puzzleLoadError && !puzzles.length) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem',
                color: '#dc3545'
            }}>
                <div>Error loading world: {puzzleLoadError.message}</div>
                <button
                    onClick={loadPuzzles}
                    style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // Show warning if progress service has errors but continue with fallback
    const showProgressWarning = progressError && !progressLoading;

    return (
        <>
            <ProgressErrorNotification />
            {showProgressWarning && (
                <div style={{
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    padding: '0.5rem 1rem',
                    borderBottom: '1px solid #ffeaa7',
                    textAlign: 'center',
                    fontSize: '0.9rem'
                }}>
                    Progress saving is temporarily unavailable. Your progress may not be saved.
                </div>
            )}
            <Topbar
                name={name}
                puzzles={puzzles}
                selected={selected}
                setSelected={setSelected}
            />
            <Col className="w-75" style={{
                marginLeft: "25%",
                backgroundImage: `url("${image}")`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
            }}>
                <Puzzle
                    puzzle={puzzles.find((p) => p.id === selected) ?? {}}
                    onSubmit={onSubmit}
                />
            </Col>
        </>
    );
}