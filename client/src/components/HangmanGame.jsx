import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const MAX_WRONG = 6;

// SVG Hangman drawing — draws parts progressively based on wrongCount
const HangmanDrawing = ({ wrongCount }) => {
    const parts = [
        // Head
        <circle key="head" cx="140" cy="60" r="18" stroke="currentColor" strokeWidth="4" fill="none" />,
        // Body
        <line key="body" x1="140" y1="78" x2="140" y2="130" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />,
        // Left arm
        <line key="larm" x1="140" y1="95" x2="110" y2="118" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />,
        // Right arm
        <line key="rarm" x1="140" y1="95" x2="170" y2="118" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />,
        // Left leg
        <line key="lleg" x1="140" y1="130" x2="112" y2="158" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />,
        // Right leg
        <line key="rleg" x1="140" y1="130" x2="168" y2="158" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />,
    ];

    return (
        <svg viewBox="0 0 200 190" className="hangman-svg" aria-label={`Hangman drawing: ${wrongCount} of ${MAX_WRONG} wrong guesses`}>
            {/* Gallows — always visible */}
            <line x1="20" y1="180" x2="180" y2="180" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <line x1="60" y1="180" x2="60" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <line x1="60" y1="20" x2="140" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <line x1="140" y1="20" x2="140" y2="42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            {/* Body parts drawn progressively */}
            {parts.slice(0, wrongCount)}
        </svg>
    );
};

const HangmanGame = ({ puzzle, onComplete, onClose }) => {
    if (!puzzle) return null;

    const puzzleId = typeof puzzle === 'string' ? puzzle : puzzle._id;
    const token = localStorage.getItem('token');

    const [activePuzzle, setActivePuzzle] = useState(typeof puzzle === 'object' ? puzzle : null);
    const [guessedLetters, setGuessedLetters] = useState(() => {
        if (typeof puzzle === 'object' && puzzle?.data?.guessedLetters) {
            return puzzle.data.guessedLetters;
        }
        return [];
    });
    const [wrongGuesses, setWrongGuesses] = useState(() => {
        if (typeof puzzle === 'object' && puzzle?.data?.wrongGuesses !== undefined) {
            return puzzle.data.wrongGuesses;
        }
        return 0;
    });
    const [gameState, setGameState] = useState(typeof puzzle === 'object' ? puzzle.status : 'pending');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [targetWord, setTargetWord] = useState('');

    // Initialize — switch puzzle type to hangman if needed
    useEffect(() => {
        const init = async () => {
            let puzz = activePuzzle;

            if (!puzz) {
                setIsLoading(true);
                try {
                    const res = await fetch(`http://127.0.0.1:5000/api/puzzle/${puzzleId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.success) {
                        puzz = data.data;
                        setActivePuzzle(puzz);
                        setGameState(puzz.status);
                    }
                } catch (err) {
                    console.error(err);
                    setMessage('Error loading puzzle.');
                } finally {
                    setIsLoading(false);
                }
            }

            if (!puzz) return;

            // Set the target word display
            const word = puzz.groceryItemName ? puzz.groceryItemName.trim().toUpperCase().replace(/[^A-Z]/g, '') : '';
            setTargetWord(word);

            // Switch type if not already hangman
            if (puzz.type !== 'hangman') {
                setIsLoading(true);
                try {
                    const res = await fetch(`http://127.0.0.1:5000/api/puzzle/${puzzleId}/type`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ type: 'hangman' })
                    });
                    const data = await res.json();
                    if (data.success) {
                        setActivePuzzle(data.data);
                        setGuessedLetters([]);
                        setWrongGuesses(0);
                        setGameState('pending');
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Restore state from existing puzzle data
                if (puzz.data?.guessedLetters) setGuessedLetters(puzz.data.guessedLetters);
                if (puzz.data?.wrongGuesses !== undefined) setWrongGuesses(puzz.data.wrongGuesses);
            }
        };

        init();
    }, [puzzleId]);

    const guessLetter = async (letter) => {
        if (gameState !== 'pending') return;
        if (guessedLetters.includes(letter)) return;

        try {
            const res = await fetch(`http://127.0.0.1:5000/api/puzzle/${puzzleId}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ guess: letter })
            });
            const data = await res.json();

            if (data.success) {
                const { guessedLetters: newGuessed, wrongGuesses: newWrong, isCorrect } = data.result;
                setGuessedLetters(newGuessed);
                setWrongGuesses(newWrong);

                if (!isCorrect) {
                    setMessage(`❌ No "${letter}" in this word!`);
                    setTimeout(() => setMessage(''), 1500);
                }

                if (data.status === 'solved') {
                    setGameState('solved');
                    setMessage('🎉 You saved him! Well done!');
                    setTimeout(() => onComplete(true, data.newTotalPoints, data.pointsReceived), 1800);
                } else if (data.status === 'failed') {
                    setGameState('failed');
                    setMessage(`💀 He's gone... The word was "${targetWord}"`);
                    setTimeout(() => onComplete(false, data.newTotalPoints, data.pointsReceived), 2200);
                }
            } else {
                setMessage(data.message || 'Error');
                setTimeout(() => setMessage(''), 2000);
            }
        } catch (err) {
            console.error(err);
            setMessage('Network error, try again.');
        }
    };

    // Keyboard support
    useEffect(() => {
        const handleKey = (e) => {
            if (gameState !== 'pending') return;
            if (/^[a-zA-Z]$/.test(e.key)) {
                guessLetter(e.key.toUpperCase());
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState, guessedLetters]);

    if (isLoading) {
        return (
            <div className="wordle-container">
                <p style={{ color: 'var(--text-dark)', padding: '2rem' }}>Preparing the gallows... 🪢</p>
            </div>
        );
    }

    const displayWord = targetWord.split('').map((letter, i) => {
        const revealed = guessedLetters.includes(letter) || gameState === 'failed';
        return (
            <div key={i} className="hangman-letter-box">
                <span className={`hangman-letter ${revealed ? 'revealed' : ''} ${gameState === 'failed' && !guessedLetters.includes(letter) ? 'missed-letter' : ''}`}>
                    {revealed ? letter : ''}
                </span>
                <div className="hangman-letter-underline" />
            </div>
        );
    });

    const keyboard = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
        const isGuessed = guessedLetters.includes(letter);
        const isCorrect = isGuessed && targetWord.includes(letter);
        const isWrong = isGuessed && !targetWord.includes(letter);
        return (
            <button
                key={letter}
                className={`hangman-key ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''} ${isGuessed ? 'used' : ''}`}
                onClick={() => guessLetter(letter)}
                disabled={isGuessed || gameState !== 'pending'}
                aria-label={`Guess letter ${letter}`}
            >
                {letter}
            </button>
        );
    });

    const remainingGuesses = MAX_WRONG - wrongGuesses;

    return (
        <div className="wordle-container hangman-container">
            <button className="close-game" onClick={onClose}><X size={24} /></button>

            <h2 className="wordle-title">Hangman</h2>
            <p className="wordle-subtitle">Guess the grocery item — letter by letter!</p>

            <div className="hangman-game-area">
                {/* Left: Drawing */}
                <div className="hangman-drawing-area">
                    <HangmanDrawing wrongCount={wrongGuesses} />
                    <div className={`hangman-lives ${remainingGuesses <= 2 ? 'danger' : remainingGuesses <= 4 ? 'warning' : 'safe'}`}>
                        {remainingGuesses} guess{remainingGuesses !== 1 ? 'es' : ''} left
                    </div>
                </div>

                {/* Right: Word + keyboard */}
                <div className="hangman-right">
                    {/* Word display */}
                    <div className="hangman-word-display">
                        {displayWord}
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`hangman-message ${gameState === 'solved' ? 'success' : gameState === 'failed' ? 'fail' : ''}`}>
                            {message}
                        </div>
                    )}

                    {/* Keyboard */}
                    <div className="hangman-keyboard">
                        {keyboard}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HangmanGame;
