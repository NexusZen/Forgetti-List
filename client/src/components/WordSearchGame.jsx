import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const WordSearchGame = ({ puzzle, onComplete, onClose }) => {
    if (!puzzle) return null;

    const [currentPuzzle, setCurrentPuzzle] = useState(puzzle);
    const [grid, setGrid] = useState(puzzle.data?.grid || []);
    const [solution, setSolution] = useState(puzzle.data?.solution || []);
    const [clickedSequence, setClickedSequence] = useState([]);
    const [gameState, setGameState] = useState(puzzle.status || 'pending');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const token = localStorage.getItem('token');

    // Fetch or Initialize the Word Grid if data is missing
    useEffect(() => {
        const initGame = async () => {
            if (!puzzle.data?.grid || puzzle.type !== 'word_grid') {
                setIsLoading(true);
                try {
                    // Update type to word_grid first
                    const res = await fetch(`http://127.0.0.1:5000/api/puzzle/${puzzle._id}/type`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ type: 'word_grid' })
                    });
                    const data = await res.json();
                    if (data.success) {
                        setGrid(data.data.data.grid);
                        setSolution(data.data.data.solution);
                        setCurrentPuzzle(data.data);
                        setGameState('pending'); // Reset if re-initializing
                    }
                } catch (err) {
                    console.error("Failed to init word grid", err);
                    setMessage("Failed to load game");
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (puzzle._id) {
            initGame();
        }
    }, [puzzle._id]);

    const targetWord = puzzle.groceryItemName ? puzzle.groceryItemName.toUpperCase().replace(/[^A-Z]/g, '') : "UNKNOWN";

    const handleCellClick = (r, c, char) => {
        if (gameState !== 'pending') return;

        // Find next expected step
        const nextIndex = clickedSequence.length;
        if (nextIndex >= solution.length) return; // Already done

        const expected = solution[nextIndex];

        // Validate
        if (expected.row === r && expected.col === c) {
            // Correct click
            const newSeq = [...clickedSequence, { row: r, col: c }];
            setClickedSequence(newSeq);

            // Check win
            if (newSeq.length === solution.length) {
                handleWin();
            }
        } else {
            // Wrong click -> Fail immediately
            setMessage("Sequence broken!");
            handleFail();
        }
    };

    const handleWin = async () => {
        setGameState('solved');
        setMessage('You found it!');

        try {
            await fetch(`http://127.0.0.1:5000/api/puzzle/${puzzle._id}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'solved' })
            });

            setTimeout(() => {
                onComplete(true);
            }, 1500);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFail = async () => {
        setGameState('failed');

        try {
            await fetch(`http://127.0.0.1:5000/api/puzzle/${puzzle._id}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'failed' })
            });

            setTimeout(() => {
                onComplete(false);
            }, 2000);
        } catch (err) {
            console.error(err);
        }
    };

    const getCellStatus = (r, c) => {
        // Is it in clicked sequence?
        const inSequence = clickedSequence.some(s => s.row === r && s.col === c);
        if (inSequence) return 'correct';

        // If solved/failed, maybe show the full solution in a different color?
        if (gameState === 'failed' && solution.some(s => s.row === r && s.col === c)) {
            return 'missed'; // Show what they missed
        }

        return '';
    };

    if (isLoading) {
        return <div className="word-search-container"><p>Generating Grid...</p></div>;
    }

    if (!grid || grid.length === 0) {
        return <div className="word-search-container"><p>Error loading grid.</p></div>;
    }

    return (
        <div className="word-search-container">
            <button className="close-game" onClick={onClose}><X size={24} /></button>
            <h2 className="wordle-title">Word Grid</h2>
            <p className="wordle-subtitle">Find <strong>{targetWord}</strong> in sequence!</p>

            <div className="word-grid-board">
                {grid.map((row, rIndex) => (
                    <div key={rIndex} className="grid-row">
                        {row.map((char, cIndex) => {
                            const status = getCellStatus(rIndex, cIndex);
                            return (
                                <div
                                    key={`${rIndex}-${cIndex}`}
                                    className={`grid-cell ${status}`}
                                    onClick={() => handleCellClick(rIndex, cIndex, char)}
                                >
                                    {char}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {message && <div className="game-message" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>{message}</div>}
        </div>
    );
};

export default WordSearchGame;
