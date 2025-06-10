// Platform variables and functions
let platforms = [];
const platformColor = '#A9A9A9'; // DarkGray for platforms

function createPlatform(x, y, width, height, color = platformColor) {
    platforms.push({ x, y, width, height, color });
}

function drawPlatforms(ctx) {
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Add border to top and bottom
        ctx.strokeStyle = '#696969'; // DimGray
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(platform.x, platform.y + 0.5); // +0.5 for sharper lines
        ctx.lineTo(platform.x + platform.width, platform.y + 0.5);
        ctx.moveTo(platform.x, platform.y + platform.height - 0.5);
        ctx.lineTo(platform.x + platform.width, platform.y + platform.height - 0.5);
        ctx.stroke();
    });
}

// Clue variables and functions
let clues = [];
const clueWidth = 20; // This will be the bounding box width
const clueHeight = 20; // This will be the bounding box height
const clueColor = 'yellow'; // Default clue color for any unassigned

function createClue(x, y, width = clueWidth, height = clueHeight, color = clueColor, points = 0) {
    clues.push({ x, y, width, height, color, collected: false, points: points });
    // totalClues will be updated in game.js
}

function drawClues(ctx) {
    clues.forEach(clue => {
        if (!clue.collected) {
            ctx.fillStyle = clue.color;
            const centerX = clue.x + clue.width / 2;
            const centerY = clue.y + clue.height / 2;

            if (clue.color === 'green') { // Circle
                ctx.beginPath();
                ctx.arc(centerX, centerY, clue.width / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (clue.color === 'orange') { // Square
                ctx.fillRect(clue.x, clue.y, clue.width, clue.height);
            } else if (clue.color === 'gray') { // Diamond
                ctx.beginPath();
                ctx.moveTo(centerX, clue.y); // Top point
                ctx.lineTo(clue.x + clue.width, centerY); // Right point
                ctx.lineTo(centerX, clue.y + clue.height); // Bottom point
                ctx.lineTo(clue.x, centerY); // Left point
                ctx.closePath();
                ctx.fill();
            } else if (clue.color === 'red') { // Triangle
                ctx.beginPath();
                ctx.moveTo(centerX, clue.y); // Top point
                ctx.lineTo(clue.x + clue.width, clue.y + clue.height); // Bottom-right
                ctx.lineTo(clue.x, clue.y + clue.height); // Bottom-left
                ctx.closePath();
                ctx.fill();
            } else { // Default square for any other color
                ctx.fillRect(clue.x, clue.y, clue.width, clue.height);
            }
        }
    });
}

// Initialize environment elements (platforms and clues)
function initEnvironmentElements(canvas) { // Pass canvas for positioning if needed
    clues = []; // Clear previous clues
    platforms = []; // Clear previous platforms

    // Define point values for different colors
    const pointsRed = 40;
    const pointsGray = 30;
    const pointsOrange = 20;
    const pointsGreen = 10;

    // Create Clues with specific colors and points
    // Assuming player object is available globally for player.height reference, or pass it if not.
    // For now, we'll assume player.height is a known fixed value or can be passed if needed.
    // Let's use a placeholder if player is not directly accessible: const tempPlayerHeight = 40;
    const tempPlayerHeight = 40; // Placeholder for player.height if player not accessible here

    createClue(100, canvas.height - tempPlayerHeight - clueHeight - 5, clueWidth, clueHeight, 'green', pointsGreen); // Ground level
    createClue(300, 450 - clueHeight, clueWidth, clueHeight, 'orange', pointsOrange); // On platform
    createClue(550, canvas.height - tempPlayerHeight - clueHeight - 5, clueWidth, clueHeight, 'green', pointsGreen); // Ground level
    createClue(canvas.width - 120, 350 - clueHeight, clueWidth, clueHeight, 'gray', pointsGray);
    createClue(450, 200 - clueHeight, clueWidth, clueHeight, 'red', pointsRed); // Higher clue


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
