import { useState, useEffect, useCallback, useRef } from 'react';
import { X, RotateCcw } from 'lucide-react';

const WordleGame = ({ puzzle, onComplete, onClose }) => {
    const puzzleId = puzzle ? (typeof puzzle === 'string' ? puzzle : puzzle._id) : null;

    const [guesses, setGuesses] = useState(() => {
        if (typeof puzzle === 'object' && puzzle?.data?.guesses && Array.isArray(puzzle.data.guesses)) {
            return puzzle.data.guesses;
        }
        return [];
    });
    const [feedback, setFeedback] = useState([]);
    const [gameState, setGameState] = useState(typeof puzzle === 'object' ? puzzle.status : 'loading');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [solution, setSolution] = useState('');
    const [currentGuess, setCurrentGuess] = useState('');
    const [activePuzzle, setActivePuzzle] = useState(typeof puzzle === 'object' ? puzzle : null);

    // Use refs for values needed inside the keyboard useEffect
    // so the effect doesn't need to re-register on every keystroke
    const currentGuessRef = useRef(currentGuess);
    const gameStateRef = useRef(gameState);
    const solutionRef = useRef(solution);
    currentGuessRef.current = currentGuess;
    gameStateRef.current = gameState;
    solutionRef.current = solution;

    // Helper to calculate feedback locally
    const calculateFeedback = useCallback((guess, target) => {
        if (!guess || !target) return [];

        const result = new Array(target.length).fill(null).map((_, i) => ({ letter: guess[i], status: 'absent' }));
        const targetCount = {};
        for (let char of target) targetCount[char] = (targetCount[char] || 0) + 1;

        for (let i = 0; i < target.length; i++) {
            if (guess[i] === target[i]) {
                result[i].status = 'correct';
                targetCount[guess[i]]--;
            }
        }
        for (let i = 0; i < target.length; i++) {
            if (result[i].status === 'correct') continue;
            if (targetCount[guess[i]] > 0) {
                result[i].status = 'present';
                targetCount[guess[i]]--;
            }
        }
        return result;
    }, []);

    // === useEffect 1: Initialize game ===
    useEffect(() => {
        if (!puzzleId) return;

        const switchType = async (id) => {
            try {
                const res = await fetch(`http://127.0.0.1:5000/api/puzzle/${id}/type`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ type: 'wordle' })
                });
                const data = await res.json();
                if (data.success) {
                    setActivePuzzle(data.data);
                    setGuesses([]);
                    setFeedback([]);
                    setGameState('pending');
                    setMessage('');
                    setCurrentGuess('');
                } else {
                    setMessage(data.message || "Failed to initialize game type.");
                }
            } catch (err) {
                console.error("Type switch error", err);
                setMessage("Error switching game type");
            }
        };

        const initGame = async () => {
            const ap = typeof puzzle === 'object' ? puzzle : null;
            const needFetch = !ap || !ap.data || (typeof puzzle === 'string');

            if (needFetch) {
                setIsLoading(true);
                try {
                    const res = await fetch(`http://127.0.0.1:5000/api/puzzle/${puzzleId}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    const data = await res.json();
                    if (data.success) {
                        const fetchedPuzzle = data.data;
                        setActivePuzzle(fetchedPuzzle);
                        setGameState(fetchedPuzzle.status);

                        let sol = '';
                        if (fetchedPuzzle.groceryItemName) {
                            sol = fetchedPuzzle.groceryItemName.trim().toUpperCase();
                            setSolution(sol);
                        }

                        if (fetchedPuzzle.type !== 'wordle') {
                            await switchType(puzzleId);
                        } else {
                            const existingGuesses = fetchedPuzzle.data?.guesses || [];
                            setGuesses(existingGuesses);
                            if (sol && existingGuesses.length > 0) {
                                setFeedback(existingGuesses.map(g => calculateFeedback(g, sol)));
                            }
                        }
                    } else {
                        throw new Error(data.message || "Failed to load puzzle");
                    }
                } catch (err) {
                    console.error("Game init error:", err);
                    setMessage("Error loading game. Please try again.");
                } finally {
                    setIsLoading(false);
                }
            } else {
                let sol = '';
                if (ap.groceryItemName) {
                    sol = ap.groceryItemName.trim().toUpperCase();
                    setSolution(sol);
                }

                if (ap.type !== 'wordle') {
                    setIsLoading(true);
                    await switchType(puzzleId);
                    setIsLoading(false);
                } else {
                    const existingGuesses = ap.data?.guesses || [];
                    if (existingGuesses.length > 0 && sol) {
                        setFeedback(existingGuesses.map(g => calculateFeedback(g, sol)));
                    }
                }
            }
        };

        initGame();
    }, [puzzleId, calculateFeedback]);

    // === useEffect 2: Keyboard listener — MUST be at top level, never after a conditional return ===
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameStateRef.current !== 'pending') return;
            const sol = solutionRef.current;
            const wordLen = sol ? sol.length : 5;

            if (e.key === 'Enter') {
                // Dispatch a custom event that the component will handle
                window.dispatchEvent(new CustomEvent('wordle-submit'));
            } else if (e.key === 'Backspace') {
                setCurrentGuess(prev => prev.slice(0, -1));
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                setCurrentGuess(prev => {
                    if (prev.length < wordLen) return prev + e.key.toUpperCase();
                    return prev;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // Stable — uses refs, no deps needed

    // === useEffect 3: Handle Enter key submissions via custom event ===
    useEffect(() => {
        const handleSubmitEvent = () => {
            submitGuessRef.current?.();
        };
        window.addEventListener('wordle-submit', handleSubmitEvent);
        return () => window.removeEventListener('wordle-submit', handleSubmitEvent);
    }, []);

    // submitGuess as a ref so the custom event always has the latest version
    const submitGuessRef = useRef(null);

    // Now safe to do conditional rendering (all hooks are above)
    if (!puzzle) return null;

    const currentActivePuzzle = activePuzzle || (typeof puzzle === 'object' ? puzzle : {});
    const WORD_LENGTH = solution ? solution.length : 5;
    const MAX_ATTEMPTS = currentActivePuzzle.maxAttempts || 6;
    const token = localStorage.getItem('token');

    const submitGuess = async () => {
        if (currentGuess.length !== WORD_LENGTH) {
            setMessage(`Word must be ${WORD_LENGTH} letters long`);
            setTimeout(() => setMessage(''), 2000);
            return;
        }

        const url = `http://127.0.0.1:5000/api/puzzle/${puzzleId}/verify`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ guess: currentGuess })
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("Non-JSON response:", text);
                throw new Error("Server returned an invalid response.");
            }

            const data = await res.json();

            if (data.success) {
                const newFeedback = data.result;
                setGuesses(prev => [...prev, currentGuess]);
                setFeedback(prev => [...prev, newFeedback]);
                setCurrentGuess('');

                if (data.status !== 'pending') {
                    setGameState(data.status);
                    if (data.status === 'solved') {
                        setMessage('You got it!');
                        setTimeout(() => onComplete(true, data.newTotalPoints, data.pointsReceived), 1500);
                    } else {
                        setMessage(`Game Over! The word was ${data.solution}`);
                        setSolution(data.solution);
                        setTimeout(() => onComplete(false, data.newTotalPoints, data.pointsReceived), 2000);
                    }
                }
            } else {
                setMessage(data.message || 'Error from server');
                if (data.status === 'failed') {
                    setGameState('failed');
                    setTimeout(() => onComplete(false), 2000);
                }
            }
        } catch (err) {
            console.error("Wordle submission error:", err);
            setMessage(`Error: ${err.message}`);
        }
    };

    // Keep ref in sync so keyboard events can call the latest submitGuess
    submitGuessRef.current = submitGuess;

    if (isLoading) return <div className="wordle-container"><p>Loading Game...</p></div>;

    const handleKeyClick = (key) => {
        if (key === 'ENTER') submitGuess();
        else if (key === 'BACKSPACE') setCurrentGuess(prev => prev.slice(0, -1));
        else if (currentGuess.length < WORD_LENGTH) setCurrentGuess(prev => prev + key);
    };

    const renderGrid = () => {
        const rows = [];
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            const isCurrentRow = i === guesses.length;
            const guess = guesses[i] || (isCurrentRow ? currentGuess : '');
            const rowFeedback = feedback[i];

            const cells = [];
            for (let j = 0; j < WORD_LENGTH; j++) {
                const letter = guess[j] || '';
                let statusClass = 'empty';
                if (rowFeedback && rowFeedback[j]) {
                    statusClass = rowFeedback[j].status;
                }
                cells.push(
                    <div key={j} className={`wordle-cell ${statusClass} ${letter ? 'filled' : ''}`}>
                        {letter}
                    </div>
                );
            }
            rows.push(<div key={i} className="wordle-row">{cells}</div>);
        }
        return rows;
    };

    return (
        <div className="wordle-container">
            <button className="close-game" onClick={onClose}><X size={24} /></button>
            <h2 className="wordle-title">Guess the Item</h2>
            <p className="wordle-subtitle">Wait for the grocery list item to be revealed!</p>
            <div className="wordle-grid">{renderGrid()}</div>
            {message && <div className="game-message" style={{ maxHeight: '100px', overflowY: 'auto' }}>{message}</div>}
            <div className="virtual-keyboard">
                <div className="keyboard-row">{'QWERTYUIOP'.split('').map(key => <button key={key} onClick={() => handleKeyClick(key)} className="key">{key}</button>)}</div>
                <div className="keyboard-row">{'ASDFGHJKL'.split('').map(key => <button key={key} onClick={() => handleKeyClick(key)} className="key">{key}</button>)}</div>
                <div className="keyboard-row">
                    <button className="key wide" onClick={() => handleKeyClick('ENTER')}>ENTER</button>
                    {'ZXCVBNM'.split('').map(key => <button key={key} onClick={() => handleKeyClick(key)} className="key">{key}</button>)}
                    <button className="key wide" onClick={() => handleKeyClick('BACKSPACE')}><RotateCcw size={16} /></button>
                </div>
            </div>
        </div>
    );
};

export default WordleGame;
