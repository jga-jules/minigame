// Player definition
const player = {
    x: 0, // Initial position will be set by resetGame or initGameElements
    y: 0,
    width: 40,
    height: 40, // Keeping size, focusing on color for this step
    color: '#8B4513', // SaddleBrown for a detective/trenchcoat look
    speed: 200, // pixels per second
    velocityY: 0,
    isGrounded: false,
    jumpStrength: -15 // Negative because Y is 0 at top
};

// Player update logic
function updatePlayer(deltaTime, keys, gravity, canvas) {
    const moveSpeed = player.speed * (deltaTime / 1000);

    // Horizontal movement
    if (keys.ArrowLeft) {
        player.x -= moveSpeed;
    }
    if (keys.ArrowRight) {
        player.x += moveSpeed;
    }

    // Vertical movement (gravity and jump)
    player.velocityY += gravity;
    player.y += player.velocityY;
    // isGrounded will be set in game.js after platform and ground collision checks
    // Jump initiation is now handled in game.js

    // Keep player within canvas horizontal bounds
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

// Player drawing logic
function drawPlayer(ctx) {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}
