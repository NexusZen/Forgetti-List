// Utility to generate puzzles for grocery items

const generatePuzzleData = (itemName, type) => {
    const normalize = (str) => str.trim().toUpperCase();
    const target = normalize(itemName);

    if (type === 'jumble') {
        // Simple shuffle
        const shuffled = target.split('').sort(() => 0.5 - Math.random()).join('');
        // Ensure it's not the same as original (simple check, recursive if needed but kept simple here)
        return {
            scrambledWord: shuffled === target ? target.split('').reverse().join('') : shuffled
        };
    } else if (type === 'wordle') {
        return {
            guesses: []
        };
    }
    return {};
};

const assignPuzzleType = () => {
    const types = ['wordle', 'jumble'];
    return types[Math.floor(Math.random() * types.length)];
};

module.exports = {
    generatePuzzleData,
    assignPuzzleType
};
