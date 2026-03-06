// Utility to generate puzzles for grocery items

const generatePuzzleData = (itemName, type) => {
    const normalize = (str) => str.trim().toUpperCase();
    const target = normalize(itemName);

    if (type === 'jumble') {
        const shuffled = target.split('').sort(() => 0.5 - Math.random()).join('');
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
