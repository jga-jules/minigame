const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let currentScene = null;
let detective = null;
let score = 0;
let bugsFoundCount = 0;
let totalBugsInScene = 0;
let gameWon = false;
let foundBugsInventory = [];
let lastTime = 0; // Declare lastTime globally

// Inventory area parameters
const INVENTORY_WIDTH = 200;
const INVENTORY_X = canvas.width - INVENTORY_WIDTH;
const INVENTORY_Y = 0;
const INVENTORY_HEIGHT = canvas.height;


function gameLoop(timestamp) {
    if (lastTime === undefined || lastTime === 0) { // Handle first frame initialization or reset robustly
        lastTime = timestamp;
    }
    const deltaTime = (timestamp - lastTime) / 1000; // deltaTime in seconds
    lastTime = timestamp;

    // --- Game Logic Updates ---
    if (detective) {
        detective.update(deltaTime); // Call detective's update method
    }
    // (Other game logic updates could go here in the future)

    // --- Drawing ---
    // Clear canvas (done by scene.draw now)
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentScene) {
        currentScene.draw(ctx);
    }
    drawUI(ctx); // Call after drawing the scene

    requestAnimationFrame(gameLoop);
}

// Add this function in adventure_game.js
function drawUI(ctx) {
    // --- Existing Score and Bug Count UI (Top-Left) ---
    ctx.fillStyle = '#000000'; // Black text
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top'; // Ensure text draws predictably from top

    ctx.fillText(`Score: ${score}`, 10, 10); // Adjusted Y for clarity
    ctx.fillText(`Bugs Found: ${bugsFoundCount} / ${totalBugsInScene}`, 10, 35); // Adjusted Y

    // --- Inventory Panel (Right Side) ---
    // Background for inventory
    ctx.fillStyle = '#A0A0A0'; // Medium-gray for inventory background
    ctx.fillRect(INVENTORY_X, INVENTORY_Y, INVENTORY_WIDTH, INVENTORY_HEIGHT);

    // Border for inventory
    ctx.strokeStyle = '#333333'; // Darker border
    ctx.lineWidth = 2;
    ctx.strokeRect(INVENTORY_X, INVENTORY_Y, INVENTORY_WIDTH, INVENTORY_HEIGHT);

    // Inventory Title
    ctx.fillStyle = '#FFFFFF'; // White text for title
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Found Bugs', INVENTORY_X + INVENTORY_WIDTH / 2, INVENTORY_Y + 15);

    // List Found Bugs
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let inventoryItemY = INVENTORY_Y + 45; // Starting Y for items
    const itemPadding = 5;
    const lineHeight = 18; // Approx height for a line of 14px text

    foundBugsInventory.forEach((bug, index) => {
        // Reset to a standard text color for bug details for now
        ctx.fillStyle = '#111111'; // Dark gray text for items

        // Display bug name and points.
        let bugText = `${index + 1}. ${bug.name} (${bug.points} pts)`;

        // Simple color swatch next to the text
        ctx.fillStyle = bug.color;
        ctx.fillRect(INVENTORY_X + itemPadding + 5, inventoryItemY + (lineHeight / 2) - 5, 10, 10); // Center swatch with text line

        ctx.fillStyle = '#111111'; // Back to dark gray for text
        ctx.fillText(bugText, INVENTORY_X + itemPadding + 20, inventoryItemY);

        inventoryItemY += lineHeight + itemPadding;
    });


    // --- Existing Win Condition Message (Overlay) ---
    if (gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'lime';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        const centerX = canvas.width / 2;
        ctx.fillText('All Bugs Found!', centerX, canvas.height / 2 - 30);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${score}`, centerX, canvas.height / 2 + 20);
    }
}


function initGame() {
    // Reset game state variables
    score = 0;
    bugsFoundCount = 0;
    totalBugsInScene = 0;
    gameWon = false;
    foundBugsInventory = []; // Clear inventory on game start/reset

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

            // Add to inventory if not already there (double check, though markAsFound should prevent reprocessing)
            if (!foundBugsInventory.includes(bug1)) {
                foundBugsInventory.push(bug1);
            }

            if (bugsFoundCount === totalBugsInScene) {
                gameWon = true;
                console.log("Game Won! Final Score: " + score);
            }
        }
    }, "HS1:FindGreenBug");

    const hotspot2 = new Hotspot(450, canvas.height - 150, 100, 100, function() { // MOVED X from canvas.width - 150
        console.log("Hotspot 2 (Now at 450,450) clicked!");
        if (bug2 && bug2.markAsFound()) {
            score += bug2.points;
            bugsFoundCount++;

            if (!foundBugsInventory.includes(bug2)) {
                foundBugsInventory.push(bug2);
            }

            if (bugsFoundCount === totalBugsInScene) {
                gameWon = true;
                console.log("Game Won! Final Score: " + score);
            }
        }
    }, "HS2:FindRedBug");

    currentScene.addHotspot(hotspot1);
    currentScene.addHotspot(hotspot2);

    console.log("Adventure game initialized. Detective, scene, hotspots, and bugs created.");
    lastTime = performance.now(); // Initialize lastTime before starting the loop
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
