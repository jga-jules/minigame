const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let currentScene = null;
let detective = null;
const gameScenes = {}; // Collection of all scenes

let score = 0;
// let totalBugsInGame = 0; // Removed
let winnableItemsInInventoryCount = 0; // New name for clarity
const winnableItemNames = []; // Names of items that count towards winning
let totalWinnableItems = 0;   // Length of winnableItemNames
let gameWon = false;
let foundBugsInventory = [];
let selectedInventoryItem = null; // For storing the currently selected bug from inventory
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

    let uiLineY = 10;
    const uiLineHeight = 22; // Spacing for 18px font

    ctx.fillText(`Score: ${score}`, 10, uiLineY);
    uiLineY += uiLineHeight;

    if (currentScene && currentScene.id) { // Display current scene ID for debugging
        ctx.fillText(`Scene: ${currentScene.id}`, 10, uiLineY);
        uiLineY += uiLineHeight;
    }

    ctx.fillText(`Found: ${winnableItemsInInventoryCount} / ${totalWinnableItems}`, 10, uiLineY);
    // uiLineY += uiLineHeight; // Increment if more lines follow here

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
    const itemPadding = 5; // Padding around each item text/swatch
    const lineHeight = 18; // Approx height for a line of 14px text

    foundBugsInventory.forEach((bug, index) => {
        const itemAreaX = INVENTORY_X + itemPadding / 2; // Slight inset for highlight
        const itemAreaY = inventoryItemY - (itemPadding / 2);
        const itemAreaWidth = INVENTORY_WIDTH - (itemPadding); // Adjust width for inset
        const itemAreaHeight = lineHeight + itemPadding;

        if (bug === selectedInventoryItem) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; // Yellow, semi-transparent highlight
            ctx.fillRect(itemAreaX, itemAreaY, itemAreaWidth, itemAreaHeight);
        }

        // Simple color swatch next to the text
        ctx.fillStyle = bug.color;
        ctx.fillRect(INVENTORY_X + itemPadding + 5, inventoryItemY + (lineHeight / 2) - 5, 10, 10);

        // Reset to a standard text color for bug details
        ctx.fillStyle = '#111111';
        let bugText = `${index + 1}. ${bug.name} (${bug.points} pts)`;
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

function updateWinnableItemsCount() {
    winnableItemsInInventoryCount = 0;
    for (const itemInInventory of foundBugsInventory) {
        if (winnableItemNames.includes(itemInInventory.name)) {
            winnableItemsInInventoryCount++;
        }
    }
    // Check for win condition here, after count is updated
    if (winnableItemsInInventoryCount === totalWinnableItems) {
        if (!gameWon) { // Prevent multiple win triggers
            gameWon = true;
            console.log("All winnable items acquired! Game Won! Final Score: " + score);
        }
    }
}


function initGame() {
    // Reset game state variables
    score = 0;
    winnableItemsInInventoryCount = 0;
    gameWon = false;
    foundBugsInventory = [];
    selectedInventoryItem = null;
    for (const key in gameScenes) { delete gameScenes[key]; }
    itemCombinations.length = 0;
    winnableItemNames.length = 0;

    // Define Name Constants for items
    const VIOLET_FRAGMENT_ALPHA_NAME = "Violet Fragment Alpha";
    const VIOLET_FRAGMENT_BETA_NAME = "Violet Fragment Beta";
    const SHINING_VIOLET_GEM_NAME = "Shining Violet Gem";

    // Points constants
    const pointsRed = 40, pointsGray = 30, pointsOrange = 20, pointsGreen = 10;
    const pointsViolet = 0;

    // 1. Declare bug variables (already global or higher scope in this file)
    // let v1_s1, o1_s1, g1_s1, r1_s2, v2_s2, r2_s3, g2_s3;
    // let vio1_s2, vio2_s3;

    // 2. Instantiate all Bug objects
    v1_s1 = new Bug(100, 180, 'green', pointsGreen, "Green Bug V1");
    o1_s1 = new Bug(100, 230, 'orange', pointsOrange, "Orange Bug O1");
    g1_s1 = new Bug(100, 280, 'gray', pointsGray, "Gray Bug G1");

    r1_s2 = new Bug(150, 200, 'red', pointsRed, "Red Bug R1");
    v2_s2 = new Bug(150, 250, 'green', pointsGreen, "Green Bug V2");
    vio1_s2 = new Bug(250, 150, '#8A2BE2', pointsViolet, VIOLET_FRAGMENT_ALPHA_NAME);

    r2_s3 = new Bug(200, 200, 'red', pointsRed, "Red Bug R2");
    g2_s3 = new Bug(200, 250, 'gray', pointsGray, "Gray Bug G2");
    vio2_s3 = new Bug(300, 150, '#8A2BE2', pointsViolet, VIOLET_FRAGMENT_BETA_NAME);

    // Scene Setup
    const scene1 = new Scene('scene1_id', '#E0E0E0');
    scene1.addEntryPoint('entryFromS2', 550 - (30/2), canvas.height / 2);
    const mainSceneWidthForSpawn = canvas.width - INVENTORY_WIDTH;
    const spawnX_s1 = (mainSceneWidthForSpawn / 2) - (30 / 2);
    const spawnY_s1 = (canvas.height / 2) - (50 / 2);
    scene1.addEntryPoint('initialSpawnPoint', spawnX_s1, spawnY_s1);
    scene1.addBackgroundText("class Scene1_Main {", 50, 100);
    scene1.addBackgroundText("  // Primary code editor view", 70, 150);
    scene1.addBackgroundText("  void checkSystem() {", 90, 200);
    scene1.addBackgroundText("    if (critical_bug) return;", 110, 250);
    scene1.addBackgroundText("  }", 90, 300);
    scene1.addBackgroundText("};", 50, 350);
    gameScenes['scene1_id'] = scene1;

    const scene2 = new Scene('scene2_id', '#D0E0D0');
    scene2.addEntryPoint('entryFromS1', 10 + (30/2), canvas.height / 2);
    scene2.addEntryPoint('entryFromS3', 550 - (30/2), canvas.height / 2);
    scene2.addBackgroundText("#include <header_file.h>", 50, 100, 'bold 40px monospace', '#224422');
    scene2.addBackgroundText("namespace Utilities {", 70, 150, '30px monospace', '#224422');
    scene2.addBackgroundText("  // Checksum function?", 90, 200, '30px monospace', '#224422');
    scene2.addBackgroundText("}", 70, 250, '30px monospace', '#224422');
    gameScenes['scene2_id'] = scene2;

    const scene3 = new Scene('scene3_id', '#D0D0E0');
    scene3.addEntryPoint('entryFromS2', 10 + (30/2), canvas.height / 2);
    scene3.addBackgroundText("struct LogFile {", 50, 100, 'bold 36px monospace', '#222244');
    scene3.addBackgroundText("  char timestamp[32];", 70, 150, '28px monospace', '#222244');
    scene3.addBackgroundText("  char message[256];", 70, 200, '28px monospace', '#222244');
    scene3.addBackgroundText("};", 50, 250, 'bold 36px monospace', '#222244');
    gameScenes['scene3_id'] = scene3;

    // --- SCENE 1 Content ---
    scene1.bugs = []; scene1.hotspots = [];
    scene1.addBug(v1_s1);
    scene1.addBug(o1_s1);
    scene1.addBug(g1_s1);
    const hs_v1_s1 = new Hotspot(50, 160, 100, 50, function() { findBugAction(v1_s1); }, "HS_Find_V1_S1", null, null, null, 'bugStrongbox', v1_s1);
    const hs_o1_s1 = new Hotspot(50, 210, 100, 50, function() { findBugAction(o1_s1); }, "HS_Find_O1_S1", null, null, null, 'bugStrongbox', o1_s1);
    scene1.addHotspot(hs_v1_s1);
    scene1.addHotspot(hs_o1_s1);
    const hs_puzzle_for_g1 = new Hotspot(50, 260, 100, 50,
        function() { console.log("A strange mechanism. It seems to be missing a part."); },
        "HS_Puzzle_GrayBugLocation", r1_s2.name,
        function() {
            console.log("The Red Bug R1 fits perfectly! Gray Bug G1 revealed!");
            findBugAction(g1_s1);
        },
        function(selectedItem) {
            if (selectedItem) { console.log(`Using ${selectedItem.name} on the mechanism doesn't work.`); }
            else { console.log("This looks like it needs something specific."); }
        },
        'bugStrongbox', g1_s1);
    scene1.addHotspot(hs_puzzle_for_g1);
    const navHotspot_s1_to_s2 = new Hotspot(canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2 - 25, 60, 50,
        function() { goToScene('scene2_id', 'entryFromS1'); }, "NAV_S1_to_S2", null, null, null, 'door', null);
    scene1.addHotspot(navHotspot_s1_to_s2);

    // --- SCENE 2 Content ---
    scene2.bugs = []; scene2.hotspots = [];
    scene2.addBug(r1_s2);
    scene2.addBug(v2_s2);
    scene2.addBug(vio1_s2);
    const hs_r1_s2_hotspot = new Hotspot(100, 180, 100, 50, function() { findBugAction(r1_s2); }, "HS_Find_R1_S2", null, null, null, 'bugStrongbox', r1_s2);
    const hs_v2_s2_hotspot = new Hotspot(100, 230, 100, 50, function() { findBugAction(v2_s2); }, "HS_Find_V2_S2", null, null, null, 'bugStrongbox', v2_s2);
    const hs_vio1_s2 = new Hotspot(200, 130, 100, 50, function() { findBugAction(vio1_s2); }, "HS_Find_Vio1_S2", null, null, null, 'bugStrongbox', vio1_s2);
    scene2.addHotspot(hs_r1_s2_hotspot);
    scene2.addHotspot(hs_v2_s2_hotspot);
    scene2.addHotspot(hs_vio1_s2);
    const navHotspot_s2_to_s1 = new Hotspot(10, canvas.height / 2 - 25, 60, 50, function() { goToScene('scene1_id', 'entryFromS2'); }, "NAV_S2_to_S1", null, null, null, 'door', null);
    scene2.addHotspot(navHotspot_s2_to_s1);
    const navHotspot_s2_to_s3 = new Hotspot(canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2 - 25, 60, 50, function() { goToScene('scene3_id', 'entryFromS2'); }, "NAV_S2_to_S3", null, null, null, 'door', null);
    scene2.addHotspot(navHotspot_s2_to_s3);

    // --- SCENE 3 Content ---
    scene3.bugs = []; scene3.hotspots = [];
    scene3.addBug(r2_s3);
    scene3.addBug(g2_s3);
    scene3.addBug(vio2_s3);
    const hs_r2_s3_hotspot = new Hotspot(150, 180, 100, 50, function() { findBugAction(r2_s3); }, "HS_Find_R2_S3", null, null, null, 'bugStrongbox', r2_s3);
    const hs_g2_s3_hotspot = new Hotspot(150, 230, 100, 50, function() { findBugAction(g2_s3); }, "HS_Find_G2_S3", null, null, null, 'bugStrongbox', g2_s3);
    const hs_vio2_s3 = new Hotspot(250, 130, 100, 50, function() { findBugAction(vio2_s3); }, "HS_Find_Vio2_S3", null, null, null, 'bugStrongbox', vio2_s3);
    scene3.addHotspot(hs_r2_s3_hotspot);
    scene3.addHotspot(hs_g2_s3_hotspot);
    scene3.addHotspot(hs_vio2_s3);
    const navHotspot_s3_to_s2 = new Hotspot(10, canvas.height / 2 - 25, 60, 50, function() { goToScene('scene2_id', 'entryFromS3'); }, "NAV_S3_to_S2", null, null, null, 'door', null);
    scene3.addHotspot(navHotspot_s3_to_s2);

    // Set current scene and detective AFTER all scenes are populated
    currentScene = gameScenes['scene1_id'];
    const initialEntryPoint = currentScene.getEntryPoint('initialSpawnPoint');
    if (!detective) {
        detective = new Detective(initialEntryPoint.x, initialEntryPoint.y);
    } else {
        detective.x = initialEntryPoint.x;
        detective.y = initialEntryPoint.y;
        detective.targetX = initialEntryPoint.x;
        detective.targetY = initialEntryPoint.y;
        detective.isMoving = false;
        detective.interactionTargetHotspot = null;
    }
    currentScene.setDetective(detective);

    // Populate winnableItemNames (after bug names are defined)
    winnableItemNames.length = 0;
    winnableItemNames.push("Green Bug V1", "Orange Bug O1", "Gray Bug G1",
                          "Red Bug R1", "Green Bug V2",
                          "Red Bug R2", "Gray Bug G2",
                          SHINING_VIOLET_GEM_NAME);
    totalWinnableItems = winnableItemNames.length;
    console.log("Winnable items:", winnableItemNames, "Total to win:", totalWinnableItems);

    // Initialize Item Combination Recipes
    itemCombinations.push({
        item1Name: VIOLET_FRAGMENT_ALPHA_NAME,
        item2Name: VIOLET_FRAGMENT_BETA_NAME,
        resultItem: { name: SHINING_VIOLET_GEM_NAME, color: "magenta", points: 100 }
    });
    console.log("Item combination recipes initialized:", itemCombinations);

    console.log("Adventure game initialized. Detective, scenes, and all scene-specific items created.");
    lastTime = performance.now();
    gameLoop();
}

function attemptCombination(item1, item2) {
    console.log("[DEBUG] Attempting combination...");
    if (!item1 || !item2) {
        console.error("[DEBUG] ERROR: attemptCombination called with null item(s).", "Item1:", item1, "Item2:", item2);
        selectedInventoryItem = null;
        return false;
    }
    const item1Name = item1.name || "UNKNOWN_ITEM1_NAME";
    const item2Name = item2.name || "UNKNOWN_ITEM2_NAME";

    console.log(`[DEBUG] Item 1: '${item1Name}' (Type: ${typeof item1Name})`);
    console.log(`[DEBUG] Item 2: '${item2Name}' (Type: ${typeof item2Name})`);

    const serializableRecipes = itemCombinations.map(r => ({
        item1Name: r.item1Name,
        item2Name: r.item2Name,
        resultItemName: r.resultItem ? r.resultItem.name : "UNKNOWN_RESULT_NAME"
    }));
    console.log("[DEBUG] Available recipes:", JSON.stringify(serializableRecipes));

    for (const recipe of itemCombinations) {
        const recipeItem1Name = recipe.item1Name || "UNKNOWN_RECIPE_ITEM1_NAME";
        const recipeItem2Name = recipe.item2Name || "UNKNOWN_RECIPE_ITEM2_NAME";
        console.log(`[DEBUG] Checking recipe: Needs ('${recipeItem1Name}', '${recipeItem2Name}'). Have ('${item1Name}', '${item2Name}')`);

        const match1 = (recipeItem1Name === item1Name && recipeItem2Name === item2Name);
        const match2 = (recipeItem1Name === item2Name && recipeItem2Name === item1Name);

        console.log(`[DEBUG] Match forward (A+B): ${match1}`);
        console.log(`[DEBUG] Match reverse (B+A): ${match2}`);

        if (match1 || match2) {
            console.log("[DEBUG] SUCCESS: Recipe matched!");

            foundBugsInventory = foundBugsInventory.filter(bug => bug !== item1 && bug !== item2);
            score += recipe.resultItem.points;
            const newItem = new Bug(0, 0, recipe.resultItem.color, recipe.resultItem.points, recipe.resultItem.name);
            newItem.found = true;
            foundBugsInventory.push(newItem);
            updateWinnableItemsCount();
            selectedInventoryItem = null;
            return true;
        }
    }
    console.log("[DEBUG] FAILURE: No matching recipe found for the given items.");
    selectedInventoryItem = null;
    return false;
}

// Helper function for finding bugs
function findBugAction(bugInstance) {
    if (bugInstance && bugInstance.markAsFound()) {
        score += bugInstance.points;
        // winnableItemsInInventoryCount++; // Remove, handled by updateWinnableItemsCount
        if (!foundBugsInventory.includes(bugInstance)) {
            foundBugsInventory.push(bugInstance);
        }
        updateWinnableItemsCount(); // New call
        // if (winnableItemsInInventoryCount === totalWinnableItems) { gameWon = true; ... } // Remove, handled by updateWinnableItemsCount
    }
}

function updateWinnableItemsCount() {
    winnableItemsInInventoryCount = 0;
    for (const itemInInventory of foundBugsInventory) {
        if (winnableItemNames.includes(itemInInventory.name)) {
            winnableItemsInInventoryCount++;
        }
    }
    // Check for win condition here, after count is updated
    if (winnableItemsInInventoryCount === totalWinnableItems) {
        if (!gameWon) { // Prevent multiple win triggers
            gameWon = true;
            console.log("All winnable items acquired! Game Won! Final Score: " + score);
        }
    }
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
    if (!currentScene || !detective) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // --- Check for Inventory Click ---
    // Constants for inventory layout (must match drawUI)
    const invItemStartY = INVENTORY_Y + 45; // Starting Y for items after title
    const invItemPadding = 5;
    const invLineHeight = 18;

    if (mouseX >= INVENTORY_X && mouseX <= INVENTORY_X + INVENTORY_WIDTH &&
        mouseY >= INVENTORY_Y && mouseY <= INVENTORY_Y + INVENTORY_HEIGHT) {

        // Click is within the inventory panel bounds
        let clickedInventoryItemIndex = -1;
        for (let i = 0; i < foundBugsInventory.length; i++) {
            // Adjusted itemTopY to match drawUI's itemAreaY for highlight consistency
            const itemTopY = invItemStartY + (i * (invLineHeight + invItemPadding)) - (invItemPadding / 2);
            const itemBottomY = itemTopY + invLineHeight + invItemPadding;

            const itemClickableXStart = INVENTORY_X + invItemPadding / 2;
            const itemClickableXEnd = INVENTORY_X + INVENTORY_WIDTH - invItemPadding / 2;

            if (mouseY >= itemTopY && mouseY <= itemBottomY && mouseX >= itemClickableXStart && mouseX <= itemClickableXEnd) {
                clickedInventoryItemIndex = i;
                break;
            }
        }

        if (clickedInventoryItemIndex !== -1) {
            const clickedBugInInventory = foundBugsInventory[clickedInventoryItemIndex];

            if (selectedInventoryItem === null) {
                // No item previously selected, so select this one
                selectedInventoryItem = clickedBugInInventory;
                console.log("Selected item:", selectedInventoryItem.name);
            } else {
                // An item was already selected, try to combine
                if (selectedInventoryItem === clickedBugInInventory) {
                    // Clicking the already selected item deselects it
                    selectedInventoryItem = null;
                    console.log("Deselected item:", clickedBugInInventory.name);
                } else {
                    // Attempt to combine selectedInventoryItem with clickedBugInInventory
                    attemptCombination(selectedInventoryItem, clickedBugInInventory);
                    // selectedInventoryItem is reset within attemptCombination
                }
            }
            return; // Click handled by inventory
        }
        // If click was in inventory panel but not on an item, also prevent scene interaction
        console.log("Clicked inside inventory panel, but not on an item.");
        return;
    }

    // --- Existing Main Scene Click Logic (Hotspots & Movement) ---
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
        const targetInteractionX = clickedHotspot.x + clickedHotspot.width / 2;
        const targetInteractionY = clickedHotspot.y + clickedHotspot.height / 2;

        detective.moveTo(targetInteractionX, targetInteractionY, clickedHotspot);
        console.log(`Detective moving to interact with hotspot: ${clickedHotspot.name}`);

    } else {
        // Player clicked on empty ground. Move detective there with no interaction target.
        detective.moveTo(mouseX, mouseY, null);
        console.log(`Detective moving to point: (${mouseX.toFixed(0)}, ${mouseY.toFixed(0)})`);
    }
});

// Start the game
initGame();

console.log("adventure_game.js loaded and game initialized");
