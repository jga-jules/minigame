const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state variables
let score = 0;
let totalClues = 0;
let collectedCluesCount = 0; // Made global for access in draw()
let gameWon = false;
let lastTime = 0;

// Constants (gravity could also be in character.js if preferred)
const gravity = 0.7;

// Input handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false
};

// Main Game Loop
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
    if (gameWon) return; // Stop updates if game is won, except for restart logic

    updatePlayer(deltaTime, keys, gravity, canvas); // Pass necessary globals/constants

    player.isGrounded = false; // Assume not grounded, check collisions below

    // Platform collision
    platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y + player.height - player.velocityY <= platform.y + 1) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isGrounded = true;
        }
    });

    // Ground collision (canvas bottom)
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isGrounded = true;
    }

    // Update jump initiation here as it depends on player.isGrounded status
    // which is determined after collision checks in this file.
    // The actual velocity change is in updatePlayer.
    // This re-check ensures jump only happens if truly grounded.
    if (keys.ArrowUp && player.isGrounded && player.velocityY === 0) { // ensure not already jumping
        player.velocityY = player.jumpStrength;
        player.isGrounded = false;
    }


    // Check for clue collection
    clues.forEach(clue => {
        if (!clue.collected &&
            player.x < clue.x + clue.width &&
            player.x + player.width > clue.x &&
            player.y < clue.y + clue.height &&
            player.y + player.height > clue.y) {
            clue.collected = true;
            score += clue.points;
            console.log('Clue collected! Points: ' + clue.points + ' Total Score: ' + score);
            // Win condition is still based on collecting ALL clues, not reaching a certain score.
            // To check this, we count collected clues.
            collectedCluesCount = 0; // Update global variable
            clues.forEach(c => { if (c.collected) collectedCluesCount++; });

            if (collectedCluesCount === totalClues) {
                gameWon = true;
                console.log('All clues collected! You Win! Final Score: ' + score);
            }
        }
    });
}

// Draw all game elements
function draw() {
    // Clear the canvas - New background color
    ctx.fillStyle = '#D3D3D3'; // Light Gray
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Experimental: Background text (C++ keywords)
    ctx.fillStyle = '#E0E0E0'; // Very light gray, slightly darker than background
    ctx.font = 'bold 72px Arial';
    ctx.fillText('class', canvas.width * 0.1, canvas.height * 0.3);
    ctx.fillText('void', canvas.width * 0.6, canvas.height * 0.5);
    ctx.fillText('int', canvas.width * 0.3, canvas.height * 0.8);
    // Ensure text is drawn before other elements if it should be "behind" them.

    // Experimental: Background lines
    ctx.strokeStyle = '#C0C0C0'; // Silver
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5); // +0.5 for sharper lines
        ctx.lineTo(canvas.width, y + 0.5);
        ctx.stroke();
    }

    // Draw environment elements
    drawPlatforms(ctx);
    drawClues(ctx);

    // Draw player
    drawPlayer(ctx);

    // Draw Score and Bug Count
    ctx.fillStyle = '#000000'; // Black for better contrast on light gray background
    ctx.font = '18px Arial'; // Slightly smaller font
    ctx.fillText('Score: ' + score, 10, 25);
    ctx.fillText('Bugs Left: ' + (totalClues - collectedCluesCount) + ' / ' + totalClues, 10, 50);


    // Draw Win Message
    if (gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'lime';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('You Win! Score: ' + score, canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '24px Arial';
        ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 20);
        ctx.textAlign = 'left'; // Reset alignment
    }
}

// Reset game state
function resetGame() {
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 100 - player.height; // Initial Y before first ground check
    player.velocityY = 0;
    player.isGrounded = false; // Will be set true by ground collision in first update

    score = 0;
    collectedCluesCount = 0; // Reset collected clues count
    gameWon = false;

    // Reset clues (environment.js's clues array is modified directly)
    clues.forEach(clue => clue.collected = false);

    // Reset keys to prevent sticky jumps or movements
    for (let key in keys) {
        keys[key] = false;
    }
    console.log("Game Reset");
}

// Initialize all game elements and start
function initializeGame() {
    initEnvironmentElements(canvas); // Creates platforms and clues
    totalClues = clues.length;       // Set totalClues based on populated clues array

    resetGame(); // Sets player initial state, score, etc.

    console.log("Game initialized with " + totalClues + " clues.");
    lastTime = performance.now(); // Reset lastTime before starting the loop
    requestAnimationFrame(gameLoop); // Start the game loop
}

// Event Listeners for keyboard input
window.addEventListener('keydown', function(e) {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
    if (gameWon && (e.key === 'r' || e.key === 'R')) {
        initializeGame(); // Re-initialize all elements and reset state
    }
});

window.addEventListener('keyup', function(e) {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// Start the game
initializeGame();
