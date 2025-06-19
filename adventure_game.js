const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let currentScene = null;
let detective = null;
const gameScenes = {}; // Collection of all scenes

let score = 0;
let bugsFoundCount = 0;
let totalBugsInGame = 0;  // Renamed from totalBugsInScene
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

    // Display current scene ID for debugging
    if (currentScene) {
        ctx.fillText(`Scene: ${currentScene.id}`, canvas.width - INVENTORY_X - 150, 10); // Show scene ID
    }
    ctx.fillText(`Score: ${score}`, 10, 10); // Adjusted Y for clarity
    ctx.fillText(`Bugs Found: ${bugsFoundCount} / ${totalBugsInGame}`, 10, 35); // Uses totalBugsInGame

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
    // totalBugsInGame will be calculated after scenes are populated
    gameWon = false;
    foundBugsInventory = []; // Clear inventory on game start/reset
    for (const key in gameScenes) { delete gameScenes[key]; } // Clear gameScenes object


    const scene1 = new Scene('scene1_id', '#E0E0E0');
    const scene2 = new Scene('scene2_id', '#D0E0D0');
    const scene3 = new Scene('scene3_id', '#D0D0E0');

    // Scene 1 Setup
    scene1.addEntryPoint('entryFromS2', 550 - (30/2), canvas.height / 2);

    const DETECTIVE_ICON_WIDTH = 30;
    const DETECTIVE_ICON_HEIGHT = 50;
    const mainSceneWidthForSpawn = canvas.width - INVENTORY_WIDTH;
    const spawnX_s1 = (mainSceneWidthForSpawn / 2) - (DETECTIVE_ICON_WIDTH / 2);
    const spawnY_s1 = (canvas.height / 2) - (DETECTIVE_ICON_HEIGHT / 2);
    scene1.addEntryPoint('initialSpawnPoint', spawnX_s1, spawnY_s1);

    scene1.addBackgroundText("class Scene1_Main {", 50, 100);
    scene1.addBackgroundText("  // Primary code editor view", 70, 150);
    scene1.addBackgroundText("  void checkSystem() {", 90, 200);
    scene1.addBackgroundText("    if (critical_bug) return;", 110, 250);
    scene1.addBackgroundText("  }", 90, 300);
    scene1.addBackgroundText("};", 50, 350);

    // Scene 2 Setup
    scene2.addEntryPoint('entryFromS1', 10 + (30/2), canvas.height / 2);
    scene2.addEntryPoint('entryFromS3', 550 - (30/2), canvas.height / 2);
    scene2.addBackgroundText("#include <header_file.h>", 50, 100, 'bold 40px monospace', '#224422');
    scene2.addBackgroundText("namespace Utilities {", 70, 150, '30px monospace', '#224422');
    scene2.addBackgroundText("  // Checksum function?", 90, 200, '30px monospace', '#224422');
    scene2.addBackgroundText("}", 70, 250, '30px monospace', '#224422');

    // Scene 3 Setup
    scene3.addEntryPoint('entryFromS2', 10 + (30/2), canvas.height / 2);
    scene3.addBackgroundText("struct LogFile {", 50, 100, 'bold 36px monospace', '#222244');
    scene3.addBackgroundText("  char timestamp[32];", 70, 150, '28px monospace', '#222244');
    scene3.addBackgroundText("  char message[256];", 70, 200, '28px monospace', '#222244');
    scene3.addBackgroundText("};", 50, 250, 'bold 36px monospace', '#222244');

    gameScenes['scene1_id'] = scene1;
    gameScenes['scene2_id'] = scene2;
    gameScenes['scene3_id'] = scene3;

    currentScene = gameScenes['scene1_id']; // Start in scene 1

    // Detective creation and initial placement
    const initialEntryPoint = currentScene.getEntryPoint('initialSpawnPoint');

    if (!detective) { // Create detective only if it doesn't exist (e.g. first load)
        detective = new Detective(initialEntryPoint.x, initialEntryPoint.y);
    } else { // If detective exists (e.g. from a game restart calling initGame), just move it
        detective.x = initialEntryPoint.x;
        detective.y = initialEntryPoint.y;
        detective.targetX = initialEntryPoint.x;
        detective.targetY = initialEntryPoint.y;
        detective.isMoving = false;
        detective.interactionTargetHotspot = null;
    }

    currentScene.setDetective(detective); // Associate detective with the current scene

    // Reset score and bug counts for the new game/scene structure
    score = 0;
    bugsFoundCount = 0;
    // totalBugsInGame will be calculated after scenes are populated

    // --- Scene 1 Content ---
    const bug1_s1 = new Bug(100, 200, 'green', 10, "S1 Green Bug");
    scene1.addBug(bug1_s1);
    const hotspot1_s1 = new Hotspot(50, 50, 100, 120, function() { // Adjusted hotspot size
        console.log("Hotspot 'S1 Green Bug Area' clicked!");
        if (bug1_s1 && bug1_s1.markAsFound()) {
            score += bug1_s1.points;
            bugsFoundCount++;
            if (!foundBugsInventory.includes(bug1_s1)) { foundBugsInventory.push(bug1_s1); }
            if (bugsFoundCount === totalBugsInGame) {
                gameWon = true;
                console.log("All bugs in the entire game found! Final Score: " + score);
            }
        }
    }, "HS_S1_FindGreenBug");
    scene1.addHotspot(hotspot1_s1);

    const navHotspot_s1_to_s2 = new Hotspot(
        canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2 - 25,
        60, 50,
        function() { goToScene('scene2_id', 'entryFromS1'); },
        "NAV_S1_to_S2"
    );
    scene1.addHotspot(navHotspot_s1_to_s2);


    // --- Scene 2 Content ---
    const bug1_s2 = new Bug(150, 250, 'orange', 20, "S2 Orange Bug");
    const bug2_s2 = new Bug(350, 300, 'gray', 30, "S2 Gray Bug");
    scene2.addBug(bug1_s2);
    scene2.addBug(bug2_s2);

    const hotspot1_s2 = new Hotspot(100, 220, 100, 80, function() {
        console.log("Hotspot 'S2 Orange Bug Area' clicked!");
        if (bug1_s2 && bug1_s2.markAsFound()) {
            score += bug1_s2.points;
            bugsFoundCount++;
            if (!foundBugsInventory.includes(bug1_s2)) { foundBugsInventory.push(bug1_s2); }
            if (bugsFoundCount === totalBugsInGame) { gameWon = true; console.log("All bugs in the entire game found! Final Score: " + score); }
        }
    }, "HS_S2_FindOrangeBug");
    scene2.addHotspot(hotspot1_s2);

    const hotspot2_s2 = new Hotspot(300, 270, 100, 80, function() {
        console.log("Hotspot 'S2 Gray Bug Area' clicked!");
        if (bug2_s2 && bug2_s2.markAsFound()) {
            score += bug2_s2.points;
            bugsFoundCount++;
            if (!foundBugsInventory.includes(bug2_s2)) { foundBugsInventory.push(bug2_s2); }
            if (bugsFoundCount === totalBugsInGame) { gameWon = true; console.log("All bugs in the entire game found! Final Score: " + score); }
        }
    }, "HS_S2_FindGrayBug");
    scene2.addHotspot(hotspot2_s2);

    const navHotspot_s2_to_s1 = new Hotspot(
        10, canvas.height / 2 - 25,
        60, 50,
        function() { goToScene('scene1_id', 'entryFromS2'); },
        "NAV_S2_to_S1"
    );
    scene2.addHotspot(navHotspot_s2_to_s1);

    const navHotspot_s2_to_s3 = new Hotspot(
        canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2 - 25,
        60, 50,
        function() { goToScene('scene3_id', 'entryFromS2'); },
        "NAV_S2_to_S3"
    );
    scene2.addHotspot(navHotspot_s2_to_s3);


    // --- Scene 3 Content ---
    const bug1_s3 = new Bug(200, 350, 'red', 40, "S3 Red Bug");
    scene3.addBug(bug1_s3);

    const hotspot1_s3 = new Hotspot(150, 320, 100, 80, function() {
        console.log("Hotspot 'S3 Red Bug Area' clicked!");
        if (bug1_s3 && bug1_s3.markAsFound()) {
            score += bug1_s3.points;
            bugsFoundCount++;
            if (!foundBugsInventory.includes(bug1_s3)) { foundBugsInventory.push(bug1_s3); }
            if (bugsFoundCount === totalBugsInGame) { gameWon = true; console.log("All bugs in the entire game found! Final Score: " + score); }
        }
    }, "HS_S3_FindRedBug");
    scene3.addHotspot(hotspot1_s3);

    const navHotspot_s3_to_s2 = new Hotspot(
        10, canvas.height / 2 - 25,
        60, 50,
        function() { goToScene('scene2_id', 'entryFromS3'); },
        "NAV_S3_to_S2"
    );
    scene3.addHotspot(navHotspot_s3_to_s2);

    // Calculate totalBugsInGame after all scenes and their bugs are defined
    totalBugsInGame = 0; // Reset before summing
    for (const sceneId_iter in gameScenes) {
        if (gameScenes.hasOwnProperty(sceneId_iter)) {
            totalBugsInGame += gameScenes[sceneId_iter].bugs.length;
        }
    }
    console.log("Total bugs in game: " + totalBugsInGame);

    console.log("Adventure game initialized. Detective, scenes, and all scene-specific items created.");
    lastTime = performance.now(); // Initialize lastTime before starting the loop
    gameLoop(); // Start the game loop
}

function goToScene(targetSceneId, entryPointName) {
    if (gameScenes[targetSceneId]) {
        console.log(`Attempting to go to scene: '${targetSceneId}' using entry point: '${entryPointName}'`);

        if (currentScene && currentScene.setDetective) { // Ensure currentScene is valid and has setDetective
            currentScene.setDetective(null); // Remove detective from old scene
        }

        currentScene = gameScenes[targetSceneId];

        if (detective) {
            const entryPoint = currentScene.getEntryPoint(entryPointName); // Get specific entry point

            detective.x = entryPoint.x;
            detective.y = entryPoint.y;
            detective.targetX = detective.x; // Ensure target is also updated
            detective.targetY = detective.y;
            detective.isMoving = false;      // Stop any current movement

            if (currentScene.setDetective) { // Ensure new currentScene is valid
                 currentScene.setDetective(detective); // Add detective to new scene
            }
            console.log(`Detective moved to entry point '${entryPointName}' in scene '${currentScene.id}' at (${detective.x}, ${detective.y})`);
        } else {
            console.warn("goToScene: Detective object not found.");
        }

        // Any other logic needed on scene change (e.g., playing entry music, etc.)
        // totalBugsInGame is global and does not change.
        // bugsFoundCount is also global and persists across scenes.
        // gameWon status also persists.

    } else {
        console.error(`Scene with ID '${targetSceneId}' not found!`);
    }
}


// Canvas click event listener
canvas.addEventListener('click', function(event) {
    if (!currentScene || !detective) return; // Basic safety check

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let clickedHotspot = null;
    if (currentScene.hotspots) {
        // Iterate in reverse to prioritize top-most hotspots if they overlap
        for (let i = currentScene.hotspots.length - 1; i >= 0; i--) {
            const hotspot = currentScene.hotspots[i];
            if (hotspot.isClicked(mouseX, mouseY)) {
                clickedHotspot = hotspot;
                break;
            }
        }
    }

    if (clickedHotspot) {
        // Player clicked on a hotspot.
        // Move detective to the center of the hotspot, and set it as interaction target.
        // The detective's width/height are taken into account by its moveTo method for final placement.
        const targetInteractionX = clickedHotspot.x + clickedHotspot.width / 2;
        const targetInteractionY = clickedHotspot.y + clickedHotspot.height / 2;

        detective.moveTo(targetInteractionX, targetInteractionY, clickedHotspot);
        console.log(`Detective moving to interact with hotspot: ${clickedHotspot.name}`);

    } else {
        // Player clicked on empty ground. Move detective there with no interaction target.
        // The detective's moveTo method will center the detective graphic on mouseX, mouseY.
        detective.moveTo(mouseX, mouseY, null);
        console.log(`Detective moving to point: (${mouseX.toFixed(0)}, ${mouseY.toFixed(0)})`);
    }
});

// Start the game
initGame();

console.log("adventure_game.js loaded and game initialized");
