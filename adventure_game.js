const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let currentScene = null;
let detective = null;
let score = 0;
let bugsFoundCount = 0;
let totalBugsInScene = 0;
let gameWon = false;

function gameLoop(timestamp) {
    // Clear canvas (done by scene.draw now)
    // ctx.clearRect(0, 0, canvas.width, canvas.height); // Or fill with a general bg if scene bg is transparent

    if (currentScene) {
        currentScene.draw(ctx);
    }
    drawUI(ctx); // Call after drawing the scene

    requestAnimationFrame(gameLoop);
}

// Add this function in adventure_game.js
function drawUI(ctx) {
    ctx.fillStyle = '#000000'; // Black text
    ctx.font = '18px Arial';
    ctx.textAlign = 'left'; // Reset alignment

    ctx.fillText(`Score: ${score}`, 10, 25);
    ctx.fillText(`Bugs Found: ${bugsFoundCount} / ${totalBugsInScene}`, 10, 50);

    if (gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Dark overlay

        ctx.fillStyle = 'lime';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        const centerX = canvas.width / 2;
        ctx.fillText('All Bugs Found!', centerX, canvas.height / 2 - 30);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${score}`, centerX, canvas.height / 2 + 20);
        // Add restart message later if needed
    }
}


function initGame() {
    // Reset game state variables
    score = 0;
    bugsFoundCount = 0;
    totalBugsInScene = 0;
    gameWon = false;

    detective = new Detective(canvas.width / 2, canvas.height / 2); // Start in center
    currentScene = new Scene('#E0E0E0'); // Light gray for the code editor background feel
    currentScene.setDetective(detective);

    // Create sample Bugs
    const bug1 = new Bug(100, 200, 'green', 10, "Green Bug Alpha");
    const bug2 = new Bug(canvas.width - 100, canvas.height - 200, 'red', 40, "Red Bug Beta");

    currentScene.addBug(bug1);
    currentScene.addBug(bug2);
    totalBugsInScene = currentScene.bugs.length; // Set totalBugsInScene

    // Create/Modify sample Hotspots to find bugs
    const hotspot1 = new Hotspot(50, 50, 100, 100, function() {
        console.log("Hotspot 1 (Top-Left) clicked!");
        if (bug1 && bug1.markAsFound()) { // bug.markAsFound() now returns true if newly found
            score += bug1.points;
            bugsFoundCount++;
            // No need to disable hotspot, markAsFound handles not re-adding points

            if (bugsFoundCount === totalBugsInScene) {
                gameWon = true;
                console.log("Game Won! Final Score: " + score);
            }
        }
    }, "HS1:FindGreenBug");

    const hotspot2 = new Hotspot(canvas.width - 150, canvas.height - 150, 100, 100, function() {
        console.log("Hotspot 2 (Bottom-Right) clicked!");
        if (bug2 && bug2.markAsFound()) {
            score += bug2.points;
            bugsFoundCount++;
            if (bugsFoundCount === totalBugsInScene) {
                gameWon = true;
                console.log("Game Won! Final Score: " + score);
            }
        }
    }, "HS2:FindRedBug");

    currentScene.addHotspot(hotspot1);
    currentScene.addHotspot(hotspot2);

    console.log("Adventure game initialized. Detective, scene, hotspots, and bugs created.");
    gameLoop(); // Start the game loop
}

// Canvas click event listener
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let hotspotClicked = false;
    if (currentScene && currentScene.hotspots) {
        for (const hotspot of currentScene.hotspots) {
            if (hotspot.isClicked(mouseX, mouseY)) {
                hotspot.trigger(); // Use the trigger method
                hotspotClicked = true;
                break;
            }
        }
    }

    // Move detective regardless of hotspot click for now
    if (detective) {
        detective.moveTo(mouseX, mouseY);
    }
});

// Start the game
initGame();

console.log("adventure_game.js loaded and game initialized");
