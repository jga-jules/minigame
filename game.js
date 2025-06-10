const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state variables
let score = 0;
let totalClues = 0;
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
            score++;
            console.log('Clue collected! Score: ' + score);
            if (score === totalClues) {
                gameWon = true;
                console.log('All clues collected! You Win!');
            }
        }
    });
}

// Draw all game elements
function draw() {
    // Clear the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw environment elements
    drawPlatforms(ctx);
    drawClues(ctx);

    // Draw player
    drawPlayer(ctx);

    // Draw Score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score + ' / ' + totalClues, 10, 25);

    // Draw Win Message
    if (gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'lime';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('You Win!', canvas.width / 2, canvas.height / 2 - 30);
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
