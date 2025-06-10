// Platform variables and functions
let platforms = [];
const platformColor = 'grey';

function createPlatform(x, y, width, height, color = platformColor) {
    platforms.push({ x, y, width, height, color });
}

function drawPlatforms(ctx) {
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
}

// Clue variables and functions
let clues = [];
const clueWidth = 20;
const clueHeight = 20;
const clueColor = 'yellow'; // Default clue color

function createClue(x, y, width = clueWidth, height = clueHeight, color = clueColor) {
    clues.push({ x, y, width, height, color, collected: false });
    // totalClues will be updated in game.js
}

function drawClues(ctx) {
    clues.forEach(clue => {
        if (!clue.collected) {
            ctx.fillStyle = clue.color;
            ctx.fillRect(clue.x, clue.y, clue.width, clue.height);
        }
    });
}

// Initialize environment elements (platforms and clues)
function initEnvironmentElements(canvas) { // Pass canvas for positioning if needed
    clues = []; // Clear previous clues
    platforms = []; // Clear previous platforms

    // Create Clues
    createClue(100, canvas.height - player.height - clueHeight - 5); // Ground level
    createClue(300, 450 - clueHeight); // On platform
    createClue(550, canvas.height - player.height - clueHeight - 5); // Ground level
    createClue(canvas.width - 120, 350 - clueHeight, clueWidth, clueHeight, 'orange');
    createClue(450, 200 - clueHeight); // Higher clue

    // Create Platforms
    createPlatform(250, 450, 150, 20);
    createPlatform(canvas.width - 180, 350, 100, 20);
    createPlatform(400, 200, 120, 20); // For higher clue
    createPlatform(100, 250, 100, 20); // Adjusted
    createPlatform(600, 150, 80, 20); // New challenging platform

    console.log("Environment elements (clues, platforms) initialized.");
    // The global 'clues' and 'platforms' arrays are now populated.
    // 'totalClues' should be set in game.js after calling this.
}
