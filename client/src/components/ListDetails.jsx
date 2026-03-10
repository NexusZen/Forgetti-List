import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Layout, Info, X } from 'lucide-react';
import WordleGame from './WordleGame';
import WordSearchGame from './WordSearchGame';
import HangmanGame from './HangmanGame';

const ListDetails = ({ list, onBack, onUpdatePoints, theme }) => {
    // Local state to track item statuses immediately
    const [localList, setLocalList] = useState(list);

    // Sync if parent updates the list prop
    useEffect(() => {
        setLocalList(list);
    }, [list]);

    const [selectedPuzzleItem, setSelectedPuzzleItem] = useState(null);
    const [showPuzzleSelector, setShowPuzzleSelector] = useState(false);
    const [activeGame, setActiveGame] = useState(null);
    const [hoveredGame, setHoveredGame] = useState(null);

    // Score Modal State
    const [showScoreModal, setShowScoreModal] = useState(false);
    const [scoreStats, setScoreStats] = useState({ total: 0, solved: 0, failed: 0 });

    const handleItemClick = (item) => {
        // Find latest status from localList
        const currentItem = localList.items.find(i =>
            (i._id && i._id === item._id) || (i === item)
        );

        if (!currentItem || typeof currentItem !== 'object') return;

        // Ensure puzzle data exists
        if (!currentItem.puzzle) {
            console.warn("No puzzle data for item:", currentItem);
            alert("This item's puzzle data is missing. Please try refreshing the page or creating a new list.");
            return;
        }

        // Check status
        if (currentItem.puzzle.status === 'solved' || currentItem.puzzle.status === 'failed') return;

        setSelectedPuzzleItem(currentItem);
        setShowPuzzleSelector(true);
    };

    const startPuzzle = (type) => {
        setShowPuzzleSelector(false);
        setActiveGame(type);
    };

    const handleGameComplete = (success, newPoints, pointsEarned = false) => {
        // Close game modal
        setActiveGame(null);

        // Update local list state
        const updatedStatus = success ? 'solved' : 'failed';

        const updatedItems = localList.items.map(item => {
            if (item === selectedPuzzleItem || (item._id && item._id === selectedPuzzleItem._id)) {
                return {
                    ...item,
                    puzzle: { ...item.puzzle, status: updatedStatus }
                };
            }
            return item;
        });

        const newList = { ...localList, items: updatedItems };
        setLocalList(newList);
        setSelectedPuzzleItem(null);

        // Check for List Completion
        checkCompletion(updatedItems, pointsEarned);

        // Update Points if backend returned them
        if (newPoints !== undefined && newPoints !== null && onUpdatePoints) {
            onUpdatePoints(newPoints);
        }
    };

    const checkCompletion = (items, pointsEarned) => {
        const total = items.length;
        let solved = 0;
        let failed = 0;

        items.forEach(item => {
            if (typeof item === 'object' && item.puzzle) {
                if (item.puzzle.status === 'solved') solved++;
                if (item.puzzle.status === 'failed') failed++;
            }
        });

        const validItems = items.filter(i => typeof i === 'object' && i.puzzle);
        const processed = solved + failed;

        if (validItems.length > 0 && processed === validItems.length) {
            setScoreStats({ total: validItems.length, solved, failed, pointsEarned });
            setTimeout(() => {
                setShowScoreModal(true);
            }, 500); // Small delay for effect
        }
    };

    const handleGameClose = async () => {
        // If user closes, mark as failed automatically
        if (selectedPuzzleItem?.puzzle?._id) {
            try {
                // Determine API URL based on environment or hardcode for now
                const baseUrl = 'http://127.0.0.1:5000';
                await fetch(`${baseUrl}/api/puzzle/${selectedPuzzleItem.puzzle._id}/fail`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
            } catch (err) {
                console.error("Error failing puzzle:", err);
            }
        }
        handleGameComplete(false);
    };

    // Gauge Component Helper
    const ScoreGauge = ({ percentage }) => {
        const radius = 40;
        const circumference = Math.PI * radius; // Semi-circle length
        const offset = circumference * (1 - percentage / 100);

        // Color based on score
        let strokeColor = '#10B981'; // Green
        if (percentage < 40) strokeColor = '#EF4444'; // Red
        else if (percentage < 70) strokeColor = '#F59E0B'; // Yellow

        return (
            <div className="gauge-container">
                <svg viewBox="0 0 100 55" className="gauge-svg">
                    {/* Background Arc */}
                    <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="var(--score-gauge-track, #E5E7EB)"
                        strokeWidth="10"
                        strokeLinecap="round"
                    />
                    {/* Fill Arc */}
                    <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                </svg>
                <div className="gauge-percentage">{Math.round(percentage)}%</div>
            </div>
        );
    };

    const hasPerfectCompletion = scoreStats.total > 0 && scoreStats.failed === 0 && scoreStats.solved === scoreStats.total;
    const scoreArtwork = hasPerfectCompletion
        ? (theme === 'dark' ? '/successdark.png' : '/successlight.png')
        : (theme === 'dark' ? '/faildark.png' : '/faillight.png');
    const completionPercentage = scoreStats.total ? (scoreStats.solved / scoreStats.total) * 100 : 0;

    return (
        <div className="list-details-view">
            <button onClick={onBack} className="btn-back">
                <ArrowLeft size={20} />
                Back to Lists
            </button>

            <div className="details-header-card">
                <div className="header-content">
                    <h2 className="details-title">{localList.name}</h2>
                    <div className="details-meta">
                        <div className="meta-item">
                            <Calendar size={18} />
                            <span>{new Date(localList.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="meta-divider">•</div>
                        <div className="meta-item">
                            <Layout size={18} />
                            <span>{localList.items.length} Items</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="items-card">
                {localList.items.length > 0 ? (
                    localList.items.map((item, index) => {
                        const isObject = typeof item === 'object' && item !== null;
                        const name = isObject ? (item.name || "Legacy Item") : item;

                        // Check local status first (from localList)
                        const status = isObject && item.puzzle ? item.puzzle.status : 'pending';
                        const isSolved = status === 'solved';
                        const isFailed = status === 'failed';
                        const isRevealed = isSolved || isFailed;
                        const hasImage = isObject && item.imageUrl;

                        return (
                            <div key={index} className="detail-item" onClick={() => !isRevealed && handleItemClick(item)}>
                                {/* Item image circle: blurred placeholder when pending, real image when solved */}
                                <div className={`item-image-circle ${hasImage ? (isRevealed ? 'img-revealed' : 'img-hidden') : 'img-none'}`}>
                                    {hasImage && isRevealed ? (
                                        <img src={item.imageUrl} alt={name} className="item-circle-img" />
                                    ) : (
                                        <span className="item-circle-placeholder">{hasImage ? '🔒' : '📷'}</span>
                                    )}
                                </div>
                                <div className="custom-checkbox">
                                    <div className={`checkmark ${isSolved ? 'checked' : ''}`}></div>
                                </div>
                                <span
                                    className={`item-text ${!isRevealed ? 'blurred-text' : ''}`}
                                    data-hover={
                                        !isRevealed ? ["Take a guess XD", "Forgot already?", "Good luck!"].sort(() => 0.5 - Math.random())[0] : ''
                                    }
                                >
                                    {name}
                                </span>
                                {isSolved && <span style={{ marginLeft: 'auto', color: '#10B981', fontSize: '0.8rem', fontWeight: 'bold' }}>SOLVED</span>}
                                {isFailed && <span style={{ marginLeft: 'auto', color: '#EF4444', fontSize: '0.8rem', fontWeight: 'bold' }}>WRONG</span>}
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state-small">
                        <p>No items in this list.</p>
                    </div>
                )}
            </div>

            {/* Puzzle Selector Modal */}
            {showPuzzleSelector && (
                <div className="modal-overlay">
                    <div className="modal-content puzzle-selector-modal">
                        <div className="modal-header">
                            <h3 className="modal-title">Unlock Item</h3>
                            <button className="close-modal-btn" onClick={() => setShowPuzzleSelector(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="puzzle-selector-body">
                            <div className="puzzle-options">
                                <p className="selector-subtitle">Choose a challenge to reveal this item:</p>

                                <button
                                    className={`puzzle-option-btn ${hoveredGame === 'wordle' ? 'hovered' : ''}`}
                                    onMouseEnter={() => setHoveredGame('wordle')}
                                    onMouseLeave={() => setHoveredGame(null)}
                                    onClick={() => startPuzzle('wordle')}
                                >
                                    <div className="option-icon">🧩</div>
                                    <div className="option-info">
                                        <span className="option-title">Wordle</span>
                                        <span className="option-desc">Guess the word in 6 tries</span>
                                    </div>
                                    <div className="option-arrow">→</div>
                                </button>

                                <button
                                    className={`puzzle-option-btn ${hoveredGame === 'word_grid' ? 'hovered' : ''}`}
                                    onMouseEnter={() => setHoveredGame('word_grid')}
                                    onMouseLeave={() => setHoveredGame(null)}
                                    onClick={() => startPuzzle('word_grid')}
                                >
                                    <div className="option-icon">🔠</div>
                                    <div className="option-info">
                                        <span className="option-title">Word Grid</span>
                                        <span className="option-desc">Find the word in the grid</span>
                                    </div>
                                    <div className="option-arrow">→</div>
                                </button>

                                <button
                                    className={`puzzle-option-btn ${hoveredGame === 'hangman' ? 'hovered' : ''}`}
                                    onMouseEnter={() => setHoveredGame('hangman')}
                                    onMouseLeave={() => setHoveredGame(null)}
                                    onClick={() => startPuzzle('hangman')}
                                >
                                    <div className="option-icon">🪢</div>
                                    <div className="option-info">
                                        <span className="option-title">Hangman</span>
                                        <span className="option-desc">Guess letters before he drops</span>
                                    </div>
                                    <div className="option-arrow">→</div>
                                </button>
                            </div>

                            <div className="puzzle-preview-area">
                                <div className={`preview-card ${hoveredGame === 'wordle' ? 'active' : ''}`}>
                                    <img src={theme === 'dark' ? "/wordle_preview_dark.png" : "/wordle_preview.png"} alt="Wordle Preview" className="preview-image" />
                                    <div className="preview-overlay">
                                        <span>Wordle Gameplay</span>
                                    </div>
                                </div>
                                <div className={`preview-card ${hoveredGame === 'word_grid' ? 'active' : ''}`}>
                                    <img src={theme === 'dark' ? "/grid_dark.png" : "/grid.png"} alt="Word Grid Preview" className="preview-image" />
                                    <div className="preview-overlay">
                                        <span>Word Grid Gameplay</span>
                                    </div>
                                </div>
                                <div className={`preview-card hangman-preview-card ${hoveredGame === 'hangman' ? 'active' : ''}`}>
                                    <div className="hangman-preview-content">
                                        <svg viewBox="0 0 200 190" style={{ width: '130px', color: 'var(--primary)' }}>
                                            <line x1="20" y1="180" x2="180" y2="180" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                            <line x1="60" y1="180" x2="60" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                            <line x1="60" y1="20" x2="140" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                            <line x1="140" y1="20" x2="140" y2="42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                            <circle cx="140" cy="60" r="18" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <line x1="140" y1="78" x2="140" y2="130" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                            <line x1="140" y1="95" x2="110" y2="118" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                        </svg>
                                        <p style={{ color: 'var(--text-dark)', fontWeight: 600, margin: '0.5rem 0 0' }}>Hangman</p>
                                        <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>Guess letters before he drops!</p>
                                    </div>
                                    <div className="preview-overlay">
                                        <span>Hangman Gameplay</span>
                                    </div>
                                </div>
                                <div className={`preview-placeholder ${!hoveredGame ? 'active' : ''}`}>
                                    <div className="placeholder-content">
                                        <Info size={48} className="placeholder-icon" />
                                        <p>Hover over a game option to see a preview</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Modal */}
            {activeGame === 'hangman' && selectedPuzzleItem && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '700px', padding: '1rem' }}>
                        <HangmanGame
                            puzzle={selectedPuzzleItem.puzzle}
                            onComplete={handleGameComplete}
                            onClose={handleGameClose}
                        />
                    </div>
                </div>
            )}

            {activeGame === 'wordle' && selectedPuzzleItem && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px', padding: '1rem' }}>
                        <WordleGame
                            puzzle={selectedPuzzleItem.puzzle}
                            onComplete={handleGameComplete}
                            onClose={handleGameClose}
                        />
                    </div>
                </div>
            )}

            {activeGame === 'word_grid' && selectedPuzzleItem && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', padding: '1rem' }}>
                        <WordSearchGame
                            puzzle={selectedPuzzleItem.puzzle}
                            onComplete={handleGameComplete}
                            onClose={handleGameClose}
                        />
                    </div>
                </div>
            )}

            {/* Score / Completion Modal — Artwork Card */}
            {showScoreModal && (
                <div className="score-overlay">
                    <div className={`score-card ${theme === 'dark' ? 'score-card--dark' : 'score-card--light'}`}>
                        {/* Artwork image (success or fail variant) */}
                        <div className="score-artwork-wrap">
                            <img
                                src={scoreArtwork}
                                alt={hasPerfectCompletion ? 'Success!' : 'Failed'}
                                className="score-artwork"
                            />
                        </div>

                        {/* Content body */}
                        <div className="score-body">
                            {/* Gauge */}
                            <ScoreGauge percentage={completionPercentage} />

                            {/* Solved / Failed stats */}
                            <div className="score-stats-row">
                                <div className="score-stat">
                                    <span className="score-stat-value" style={{ color: '#10B981' }}>{scoreStats.solved}</span>
                                    <span className="score-stat-label">Solved</span>
                                </div>
                                <div className="score-stat">
                                    <span className="score-stat-value" style={{ color: '#EF4444' }}>{scoreStats.failed}</span>
                                    <span className="score-stat-label">Failed</span>
                                </div>
                            </div>

                            {/* Points earned */}
                            {scoreStats.pointsEarned && scoreStats.pointsEarned > 0 && (
                                <div className="score-points-badge">
                                    <span className="score-points-plus">+</span>
                                    {scoreStats.pointsEarned} Points
                                </div>
                            )}

                            {/* Go back button */}
                            <button className="score-go-back-btn" onClick={onBack}>
                                Go back
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ListDetails;
