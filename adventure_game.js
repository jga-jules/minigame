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
let selectedInventoryItems = []; // Changed from selectedInventoryItem to support multi-select
const itemCombinations = []; // MOVED TO GLOBAL SCOPE
let lastTime = 0; // Declare lastTime globally

let latestLogMessage = "Welcome to Detective Polyspace!"; // For displaying game messages to the user
let currentInteractionMode = 'normal'; // Possible values: 'normal', 'usingItem', 'exploring'
let cursorCurrentlyOverHotspot = false; // Tracks if the cursor is currently set to a hotspot-specific style

// Double-click tracking variables
let lastSceneClickTime = 0;
let lastSceneClickX = -1;
let lastSceneClickY = -1;
const DOUBLE_CLICK_THRESHOLD = 400; // milliseconds
const CLICK_AREA_TOLERANCE = 10;  // pixels

// Parchment Modal State Variables
let isParchmentVisible = false;
let parchmentTitle = "";
let parchmentContent = "";
let pendingClueToAdd = null; // Stores a Bug object to be added to inventory after parchment dismissal

const GENERIC_EXPLORE_MESSAGES = [
    "The digital hum of the datasphere is strong here.",
    "Loose data packets drift by like digital tumbleweeds.",
    "This area seems stable, for now.",
    "You sense a faint anomaly nearby, or is it just your compiler acting up?",
    "A lingering echo of forgotten code whispers in the silence.",
    "It's quiet... too quiet?",
    "The structure of this code is fascinatingly complex.",
    "You find a commented-out block: /* TODO: Add more interesting things here */"
];

// Inventory area parameters
const INVENTORY_WIDTH = 200;
const INVENTORY_X = canvas.width - INVENTORY_WIDTH;
const INVENTORY_Y = 0;
const INVENTORY_HEIGHT = canvas.height;

// Combine Button parameters
const COMBINE_BUTTON_HEIGHT = 40;
const COMBINE_BUTTON_MARGIN = 10;
const COMBINE_BUTTON_X = INVENTORY_X + COMBINE_BUTTON_MARGIN;
const COMBINE_BUTTON_Y = INVENTORY_HEIGHT - COMBINE_BUTTON_HEIGHT - COMBINE_BUTTON_MARGIN;
const COMBINE_BUTTON_WIDTH = INVENTORY_WIDTH - 2 * COMBINE_BUTTON_MARGIN;

// Log Area parameters
const LOG_AREA_HEIGHT = 30; // Height of the log message bar
const LOG_AREA_Y = canvas.height - LOG_AREA_HEIGHT; // Position it at the very bottom
const LOG_AREA_X = 0; // Start from the left edge
const LOG_AREA_WIDTH = canvas.width - INVENTORY_WIDTH; // Span game area, not inventory
const LOG_TEXT_MARGIN = 5; // Padding for text inside the log area
const LOG_FONT_SIZE = 14;

// Action Button Layout (Explore, Use, Combine)
const ACTION_BUTTON_HEIGHT = 30; // Height for Use and Explore buttons
const ACTION_BUTTON_MARGIN = 8;  // Vertical margin between action buttons
// Horizontal margin for all action buttons to align them and give padding from inventory edge
const ACTION_BUTTON_SIDE_MARGIN = COMBINE_BUTTON_MARGIN; // Use same as Combine button's original side margin
const ACTION_BUTTON_WIDTH = INVENTORY_WIDTH - 2 * ACTION_BUTTON_SIDE_MARGIN;

// COMBINE button is the lowest of the three main action buttons
// Its X, Y, Width, Height are already defined:
// const COMBINE_BUTTON_X, COMBINE_BUTTON_Y, COMBINE_BUTTON_WIDTH, COMBINE_BUTTON_HEIGHT

// USE button sits above COMBINE
const USE_BUTTON_X = INVENTORY_X + ACTION_BUTTON_SIDE_MARGIN;
const USE_BUTTON_Y = COMBINE_BUTTON_Y - ACTION_BUTTON_HEIGHT - ACTION_BUTTON_MARGIN;

// EXPLORE button sits above USE
const EXPLORE_BUTTON_X = INVENTORY_X + ACTION_BUTTON_SIDE_MARGIN;
const EXPLORE_BUTTON_Y = USE_BUTTON_Y - ACTION_BUTTON_HEIGHT - ACTION_BUTTON_MARGIN;

// INSPECT button sits above EXPLORE (making it the topmost action button)
const INSPECT_BUTTON_X = INVENTORY_X + ACTION_BUTTON_SIDE_MARGIN;
const INSPECT_BUTTON_Y = EXPLORE_BUTTON_Y - ACTION_BUTTON_HEIGHT - ACTION_BUTTON_MARGIN;


// Inventory Item Layout Constants (moved to global scope)
const INV_ITEM_PADDING = 5; // Renamed from itemPadding to avoid potential future global conflicts
const INV_LINE_HEIGHT = 18; // Renamed from lineHeight
const INV_ITEM_START_Y = INVENTORY_Y + 45; // Calculated once, previously invItemStartY or inventoryItemY (partially)


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

    let currentItemY = INV_ITEM_START_Y; // Use global constant for starting Y

    // Log selectedInventoryItems before drawing items to check its state for highlighting
    console.log("[drawUI] selectedInventoryItems before item loop:", JSON.stringify(selectedInventoryItems.map(item => item.name)));

    foundBugsInventory.forEach((bug, index) => {
        // Basic check to prevent drawing too many items if inventory is very full
        // A more robust solution would involve a scrollable inventory
        // Items should stop drawing before the INSPECT_BUTTON_Y minus its top margin
        if (currentItemY + INV_LINE_HEIGHT + INV_ITEM_PADDING > INSPECT_BUTTON_Y - ACTION_BUTTON_MARGIN) {
            return;
        }
        const itemAreaX = INVENTORY_X + INV_ITEM_PADDING / 2;
        const itemAreaY = currentItemY - (INV_ITEM_PADDING / 2);
        const itemAreaWidth = INVENTORY_WIDTH - (INV_ITEM_PADDING);
        const itemAreaHeight = INV_LINE_HEIGHT + INV_ITEM_PADDING;

        // Check if the current bug is in the selectedInventoryItems array
        if (selectedInventoryItems.includes(bug)) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; // Yellow, semi-transparent highlight
            ctx.fillRect(itemAreaX, itemAreaY, itemAreaWidth, itemAreaHeight);
        }

        // Simple color swatch next to the text
        ctx.fillStyle = bug.color;
        ctx.fillRect(INVENTORY_X + INV_ITEM_PADDING + 5, currentItemY + (INV_LINE_HEIGHT / 2) - 5, 10, 10);

        // Reset to a standard text color for bug details
        ctx.fillStyle = '#111111';
        let bugText = `${index + 1}. ${bug.name} (${bug.points} pts)`;
        ctx.fillText(bugText, INVENTORY_X + INV_ITEM_PADDING + 20, currentItemY);

        currentItemY += INV_LINE_HEIGHT + INV_ITEM_PADDING;
    });

    // --- Draw Combine Button ---
    console.log("Attempting to draw Combine Button. Canvas:", canvas.width, "x", canvas.height);
    console.log("Inventory Panel: X:", INVENTORY_X, "Y:", INVENTORY_Y, "W:", INVENTORY_WIDTH, "H:", INVENTORY_HEIGHT);
    console.log("Combine Button Params: X:", COMBINE_BUTTON_X, "Y:", COMBINE_BUTTON_Y, "W:", COMBINE_BUTTON_WIDTH, "H:", COMBINE_BUTTON_HEIGHT, "Margin:", COMBINE_BUTTON_MARGIN);
    console.log("Selected items for button color:", selectedInventoryItems.length);

    // --- Draw INSPECT Button ---
    const canInspect = currentInteractionMode === 'normal' && selectedInventoryItems.length === 1;
    ctx.fillStyle = canInspect ? '#6f42c1' : '#6c757d'; // Indigo for enabled, gray for disabled
    ctx.fillRect(INSPECT_BUTTON_X, INSPECT_BUTTON_Y, ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    ctx.strokeStyle = canInspect ? '#5a2aa0' : '#545b62';
    ctx.lineWidth = 2;
    ctx.strokeRect(INSPECT_BUTTON_X, INSPECT_BUTTON_Y, ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("Inspect Item", INSPECT_BUTTON_X + ACTION_BUTTON_WIDTH / 2, INSPECT_BUTTON_Y + ACTION_BUTTON_HEIGHT / 2);

    // --- Draw EXPLORE Button ---
    let exploreButtonText = "Explore";
    ctx.fillStyle = (currentInteractionMode === 'exploring') ? '#0056b3' : (currentInteractionMode === 'normal' ? '#007bff' : '#6c757d'); // Blue, dark blue (active), gray (disabled)
    ctx.fillRect(EXPLORE_BUTTON_X, EXPLORE_BUTTON_Y, ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    ctx.strokeStyle = (currentInteractionMode === 'exploring') ? '#003f80' : '#0056b3';
    ctx.lineWidth = 2;
    ctx.strokeRect(EXPLORE_BUTTON_X, EXPLORE_BUTTON_Y, ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial'; // Slightly smaller font for these buttons
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (currentInteractionMode === 'exploring') exploreButtonText = "Cancel Explore";
    ctx.fillText(exploreButtonText, EXPLORE_BUTTON_X + ACTION_BUTTON_WIDTH / 2, EXPLORE_BUTTON_Y + ACTION_BUTTON_HEIGHT / 2);

    // --- Draw USE Button ---
    let useButtonText = "Use Item";
    const canUse = selectedInventoryItems.length === 1;
    ctx.fillStyle = (currentInteractionMode === 'usingItem') ? '#1e7e34' : (currentInteractionMode === 'normal' && canUse ? '#28a745' : '#6c757d'); // Green, dark green (active), gray (disabled)
    ctx.fillRect(USE_BUTTON_X, USE_BUTTON_Y, ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    ctx.strokeStyle = (currentInteractionMode === 'usingItem') ? '#155724' : (currentInteractionMode === 'normal' && canUse ? '#1e7e34' : '#545b62');
    ctx.strokeRect(USE_BUTTON_X, USE_BUTTON_Y, ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    ctx.fillStyle = '#FFFFFF';
    // Font, textAlign, textBaseline already set from Explore button
    if (currentInteractionMode === 'usingItem') useButtonText = "Cancel Use";
    ctx.fillText(useButtonText, USE_BUTTON_X + ACTION_BUTTON_WIDTH / 2, USE_BUTTON_Y + ACTION_BUTTON_HEIGHT / 2);

    // --- Draw COMBINE Button (existing logic, with slight adjustment for consistency if needed) ---
    // Ensure it's disabled visually if not in 'normal' mode or wrong item count
    const canCombine = selectedInventoryItems.length === 2;
    ctx.fillStyle = (currentInteractionMode === 'normal' && canCombine) ? '#388E3C' : (currentInteractionMode === 'normal' && selectedInventoryItems.length !==0 && !canCombine ? '#FFC107' : (currentInteractionMode === 'normal' ? '#4CAF50' : '#6c757d'));
    ctx.fillRect(COMBINE_BUTTON_X, COMBINE_BUTTON_Y, COMBINE_BUTTON_WIDTH, COMBINE_BUTTON_HEIGHT);
    ctx.strokeStyle = (currentInteractionMode === 'normal' && canCombine) ? '#2E7D32' : '#545b62';
    ctx.strokeRect(COMBINE_BUTTON_X, COMBINE_BUTTON_Y, COMBINE_BUTTON_WIDTH, COMBINE_BUTTON_HEIGHT);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial'; // Keep Combine button font slightly larger
    // textAlign, textBaseline already set
    ctx.fillText('Combine', COMBINE_BUTTON_X + COMBINE_BUTTON_WIDTH / 2, COMBINE_BUTTON_Y + COMBINE_BUTTON_HEIGHT / 2);

    // --- Draw Log Message Area ---
    // Background for log area (semi-transparent)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
    ctx.fillRect(LOG_AREA_X, LOG_AREA_Y, LOG_AREA_WIDTH, LOG_AREA_HEIGHT);

    // Log message text
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.font = `${LOG_FONT_SIZE}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    // Simple truncation if message is too long (a more complex solution would wrap text)
    const maxTextWidth = LOG_AREA_WIDTH - (2 * LOG_TEXT_MARGIN);
    let textToDraw = latestLogMessage;
    if (ctx.measureText(textToDraw).width > maxTextWidth) {
        while (ctx.measureText(textToDraw + "...").width > maxTextWidth && textToDraw.length > 0) {
            textToDraw = textToDraw.substring(0, textToDraw.length - 1);
        }
        textToDraw += "...";
    }
    ctx.fillText(textToDraw, LOG_AREA_X + LOG_TEXT_MARGIN, LOG_AREA_Y + LOG_AREA_HEIGHT / 2);


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

    // --- Draw Parchment Modal (If Visible) ---
    // This should be drawn on top of most other UI, but potentially below a game menu if one existed.
    // The parchment modal itself handles dimming the full screen.
    if (isParchmentVisible) {
        drawParchmentModal(ctx);
    }
}

function drawParchmentModal(ctx) {
    // if (!isParchmentVisible) return; // This check is now done by the caller in drawUI for clarity

    // Modal dimensions and positioning (centered in game view)
    const gameViewWidth = canvas.width - INVENTORY_WIDTH;
    const modalWidth = gameViewWidth * 0.7;
    const modalHeight = canvas.height * 0.6;
    const modalX = (gameViewWidth - modalWidth) / 2;
    const modalY = (canvas.height - modalHeight) / 2;

    // Semi-transparent overlay for the background (optional, to dim the game)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Cover full canvas

    // Parchment background
    ctx.fillStyle = '#F5F5DC'; // Beige parchment color
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    ctx.strokeStyle = '#8B4513'; // SaddleBrown border
    ctx.lineWidth = 3;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    // Title
    ctx.fillStyle = '#5D4037'; // Dark brown text
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(parchmentTitle, modalX + modalWidth / 2, modalY + 20);

    // Content (with basic text wrapping)
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    const contentX = modalX + 20;
    const contentYStart = modalY + 60;
    const contentWidth = modalWidth - 40;
    const lineHeight = 20;
    let currentContentY = contentYStart;

    const words = parchmentContent.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > contentWidth && n > 0) {
            ctx.fillText(line, contentX, currentContentY);
            line = words[n] + ' ';
            currentContentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, contentX, currentContentY); // Draw the last line

    // "Click to close" hint
    ctx.font = 'italic 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("(Click anywhere to close)", modalX + modalWidth / 2, modalY + modalHeight - 20);
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
    selectedInventoryItems = []; // Reset to empty array
    for (const key in gameScenes) { delete gameScenes[key]; }
    itemCombinations.length = 0;
    winnableItemNames.length = 0;

    // Define Name Constants for items
    const VIOLET_FRAGMENT_ALPHA_NAME = "Violet Fragment Alpha";
    const VIOLET_FRAGMENT_BETA_NAME = "Violet Fragment Beta";
    const SHINING_VIOLET_GEM_NAME = "Shining Violet Gem";

    // Item Name Constants for Breachable Wall tools
    const NAME_HAMMER = "Hammer";
    const NAME_CROWBAR = "Crowbar";
    const NAME_EXPLOSIVE_DEVICE = "Explosive Device";


    // Points constants
    const pointsRed = 40, pointsGray = 30, pointsOrange = 20, pointsGreen = 10;
    const pointsViolet = 0;

    // 1. Declare bug variables (already global or higher scope in this file)
    // let v1_s1, o1_s1, g1_s1, r1_s2, v2_s2, r2_s3, g2_s3;
    // let vio1_s2, vio2_s3;
    let rustyKey, goldenKey;
    let hammer, crowbar, gasBottle, cottonWick, lighter, primedGasBottle, explosiveDevice; // New utility items

    // 2. Instantiate all Bug objects
    // Existing items
    v1_s1 = new Bug(100, 180, 'green', pointsGreen, "Green Bug V1", false, false, '', '',
                  "A common, yet elusive green data-bug. Often found nesting in older code structures.");
    o1_s1 = new Bug(100, 230, 'orange', pointsOrange, "Orange Bug O1"); // No specific description/hint yet
    g1_s1 = new Bug(100, 280, 'gray', pointsGray, "Gray Bug G1", false, false, '', '',
                  "This gray bug seems to pulse with a faint, rhythmic energy.");

    r1_s2 = new Bug(150, 200, 'red', pointsRed, "Red Bug R1", false, false, '', '',
                  "A fiery red bug, surprisingly warm to the digital touch. It looks sturdy enough to be a key of sorts.");
    v2_s2 = new Bug(150, 250, 'green', pointsGreen, "Green Bug V2");
    vio1_s2 = new Bug(250, 150, '#8A2BE2', pointsViolet, VIOLET_FRAGMENT_ALPHA_NAME, false, false, '', '',
                    "A shimmering violet fragment. It feels incomplete, humming softly.",
                    "Perhaps it could be combined with another similar fragment?");

    r2_s3 = new Bug(200, 200, 'red', pointsRed, "Red Bug R2");
    g2_s3 = new Bug(200, 250, 'gray', pointsGray, "Gray Bug G2");
    vio2_s3 = new Bug(300, 150, '#8A2BE2', pointsViolet, VIOLET_FRAGMENT_BETA_NAME, false, false, '', '',
                    "Another piece of the violet puzzle. This one resonates with a slightly different frequency.",
                    "It seems to yearn for its counterpart.");

    rustyKey = new Bug(0, 0, '#A0A0A0', 0, "Rusty Key", false, false, '', '', // x,y,color,pts,name,found (now false),isReadable,msgTitle,msgContent
                     "An old, very rusty key. It looks like it might fit a simple lock.", ""); // description, combineHint
    // foundBugsInventory.push(rustyKey); // Removed from starting inventory

    goldenKey = new Bug(0, 0, 'gold', 10, "Golden Key", false, false, '', '', // x,y,color,pts,name,found,isReadable,msgTitle,msgContent
                      "A shiny golden key. It feels important and fits no ordinary lock.", ""); // description, combineHint

    // New Utility Items
    hammer = new Bug(0,0, 'dimgray', 0, "Hammer", false, false, '', '',
                   "A sturdy hammer. Might be useful for forceful persuasion of inanimate objects.", "");
    crowbar = new Bug(0,0, 'darkslategray', 0, "Crowbar", false, false, '', '',
                    "A long crowbar. Good for prying things open or apart.", "");
    gasBottle = new Bug(0,0, 'firebrick', 0, "Gas Bottle", false, false, '', '',
                      "A small bottle containing flammable gas.", "Seems like it could be combined with something to make it more... effective.");
    cottonWick = new Bug(0,0, 'ivory', 0, "Cotton Wick", false, false, '', '',
                       "A length of cotton wick. Looks absorbent and flammable.", "Could be used with a flammable substance.");
    lighter = new Bug(0,0, 'orangered', 0, "Lighter", false, false, '', '',
                      "A simple lighter. Produces a small flame.", "Useful for igniting things.");
    primedGasBottle = new Bug(0,0, 'crimson', 0, "Primed Gas Bottle", false, false, '', '',
                            "A gas bottle with a wick inserted. Looks ready to be lit.", "Just needs a spark!");
    explosiveDevice = new Bug(0,0, 'darkred', 0, "Explosive Device", false, false, '', '',
                            "A makeshift explosive. Handle with extreme care!", "This should be powerful enough to clear rubble... or make more.");

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
    scene2.addEntryPoint('entryFromS3_hidden', 350, 100); // New entry point for hidden area
    scene2.addBackgroundText("#include <header_file.h>", 50, 100, 'bold 40px monospace', '#224422');
    scene2.addBackgroundText("namespace Utilities {", 70, 150, '30px monospace', '#224422');
    scene2.addBackgroundText("  // Checksum function?", 90, 200, '30px monospace', '#224422');
    scene2.addBackgroundText("}", 70, 250, '30px monospace', '#224422');
    // Text for the new hidden area in Scene 2
    scene2.addBackgroundText("// SECURE SUBROUTINE //", 280, 80, 'italic 18px monospace', '#AA0000');
    scene2.addBackgroundText("/* Access Restricted */", 300, 120, '16px monospace', '#AA0000');
    gameScenes['scene2_id'] = scene2;

    const scene3 = new Scene('scene3_id', '#D0D0E0');
    scene3.addEntryPoint('entryFromS2', 10 + (30/2), canvas.height / 2);
    // Entry point for returning from Scene 4 via breached wall
    // Should align with where hs_breach_s3_to_s4 is located.
    // hs_breach_s3_to_s4 is at: canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2 + 60
    scene3.addEntryPoint('entryFromS4_breach_return', canvas.width - INVENTORY_WIDTH - 70 + 30, canvas.height / 2 + 60 + 25); // Adjusted for center
    // Entry point for returning from Scene 2's hidden alcove
    // Should align with hs_breach_s3_to_s2_hidden (50,100 in S3)
    scene3.addEntryPoint('entryFromS2_hidden_return', 50 + 25, 100 + 35); // Adjusted for center of hotspot
    scene3.addBackgroundText("struct LogFile {", 50, 100, 'bold 36px monospace', '#222244');
    scene3.addBackgroundText("  char timestamp[32];", 70, 150, '28px monospace', '#222244');
    scene3.addBackgroundText("  char message[256];", 70, 200, '28px monospace', '#222244');
    scene3.addBackgroundText("};", 50, 250, 'bold 36px monospace', '#222244');
    gameScenes['scene3_id'] = scene3;

    const scene4 = new Scene('scene4_id', '#D8D8D8'); // Light gray, slightly different from s1
    scene4.addBackgroundText("ARCHIVE HALL", canvas.width / 2 - INVENTORY_WIDTH / 2, 50, 'bold 40px Arial', '#333333', 'center');
    scene4.addBackgroundText("Rows of digital shelves stretch into the distance.", 50, 120, '20px Arial', '#444444');
    scene4.addBackgroundText("A lone terminal flickers in one corner.", 50, 150, '20px Arial', '#444444');
    scene4.addBackgroundText("DATA LOG ZXA-487", 400, 300, 'italic 18px Courier New', '#555555', 'center');
    // Entry points for Scene 4 will be added by the hotspots leading to it.
    // e.g., scene4.addEntryPoint('entryFromS3_archive', ...) was done with S3-S4 door.
    gameScenes['scene4_id'] = scene4;

    // --- SCENE 4 Content (Hotspots) ---
    scene4.bugs = []; scene4.hotspots = []; // Initialize arrays for Scene 4

    // Return Breached Wall Hotspot from Scene 4 to Scene 3
    // Name must be unique and findable for enabling it from Scene 3's breach action.
    const RETURN_BREACH_S4_TO_S3_NAME = "ReturnBreach_S4_to_S3"; // Used in hs_breach_s3_to_s4's success action
    const hs_return_breach_s4_to_s3 = new Hotspot(
        10, canvas.height / 2, 60, 50, // Positioned where old S4->S3 door was.
        function() { // onClickAction
            if (this.isEnabled) {
                goToScene('scene3_id', 'entryFromS4_breach_return');
            } else {
                latestLogMessage = "A solid wall. No obvious way through from here.";
            }
        },
        RETURN_BREACH_S4_TO_S3_NAME,
        null, null, null,
        'debugRect', // Initial icon, changed upon enabling
        null,
        "The wall seems solid here.", // Initial explore text
        false, // isEnabled: initially false
        true   // isBreached: true (it's an opening once enabled)
    );
    scene4.addHotspot(hs_return_breach_s4_to_s3);

    // Old S4-S3 Door - This should be removed as its functionality is replaced by the breachable wall.
    // const navHotspot_s4_to_s3 = new Hotspot(
    //     10, canvas.height / 2, 60, 50,
    //     function() { goToScene('scene3_id', 'entryFromS4_archive'); },
    //     "Door to Scene 3", // This name might conflict if not unique, but it's being removed.
    //     null, null, null, 'door', null,
    //     "A door leading back to Scene 3."
    // );
    // scene4.addHotspot(navHotspot_s4_to_s3); // Ensure this is not added.

    // Create S4-S1 Door (Archive to Scene 1 - Unlocked)
    // Entry point in S1 for this return path is 'entryFromS4_archive_return'
    const navHotspot_s4_to_s1 = new Hotspot(
        canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2, 60, 50, // Positioned right-middle in Scene 4
        function() { goToScene('scene1_id', 'entryFromS4_archive_return'); },
        "Door to Mainframe Sector", // Name for Scene 1
        null, null, null, 'door', null,
        "A door leading back to the Mainframe Sector (Scene 1)."
    );
    scene4.addHotspot(navHotspot_s4_to_s1);

    // Add Golden Key to Scene 4's bug list (for consistency)
    if (goldenKey) scene4.addBug(goldenKey);

    // Create Chest Hotspot in Scene 4
    const hs_archive_chest = new Hotspot(
        250, 280, 70, 50, // x, y, width, height - Positioned in Scene 4
        function() { // onClickAction
            findBugAction(goldenKey);
            latestLogMessage = "You open the ornate chest and find a Golden Key!";
            // 'this' will not refer to hs_archive_chest here. Need to reference directly.
            hs_archive_chest.isEnabled = false;
            hs_archive_chest.exploreText = "An empty, open ornate chest.";
        },
        "Ornate Chest", // name
        null, // requiredItemName - chest is not locked
        null, // onUseItemSuccessAction
        null, // onUseItemFailureAction
        'bugStrongbox', // iconType - can reuse, or make a new 'chest' icon
        goldenKey, // associatedBug - can link the key for potential visual hints
        "An ornate chest sits in the corner. It doesn't appear to be locked." // exploreText
    );
    scene4.addHotspot(hs_archive_chest);


    // --- SCENE 1 Content ---
    scene1.bugs = []; scene1.hotspots = [];
    scene1.addBug(v1_s1);
    scene1.addBug(o1_s1);
    scene1.addBug(g1_s1);
    if (rustyKey) scene1.addBug(rustyKey); // Add rustyKey to scene's bug list for reference

    const hs_v1_s1 = new Hotspot(50, 160, 100, 50, function() { findBugAction(v1_s1); }, "HS_Find_V1_S1", null, null, null, 'bugStrongbox', v1_s1);
    const hs_o1_s1 = new Hotspot(50, 210, 100, 50, function() { findBugAction(o1_s1); }, "HS_Find_O1_S1", null, null, null, 'bugStrongbox', o1_s1);
    scene1.addHotspot(hs_v1_s1);
    scene1.addHotspot(hs_o1_s1);
    const hs_puzzle_for_g1 = new Hotspot(50, 260, 100, 50,
        function() {
            latestLogMessage = "A strange mechanism. It seems to be missing a part.";
            console.log("A strange mechanism. It seems to be missing a part.");
        },
        "HS_Puzzle_GrayBugLocation", r1_s2.name,
        function() { // Success action
            latestLogMessage = `The Red Bug R1 fits perfectly! ${g1_s1.name} revealed!`;
            console.log("The Red Bug R1 fits perfectly! Gray Bug G1 revealed!");
            findBugAction(g1_s1); // findBugAction will set its own "Found..." message after this one.
        },
        function(selectedItem, failureReason) { // Failure action
            if (failureReason === "Too many items selected") {
                latestLogMessage = "Too many items selected. Try using one item.";
            } else if (selectedItem) {
                latestLogMessage = `Using ${selectedItem.name} on the mechanism doesn't work.`;
                console.log(`Using ${selectedItem.name} on the mechanism doesn't work.`);
            } else {
                latestLogMessage = "This looks like it needs something specific.";
                console.log("This looks like it needs something specific.");
            }
        },
        'bugStrongbox', g1_s1);
    scene1.addHotspot(hs_puzzle_for_g1);

    // Hotspot to find the Rusty Key in Scene 1
    const hs_find_rusty_key = new Hotspot(
        200, 100, 50, 40, // x, y, width, height - Position it somewhere visible in Scene 1
        function() { // onClickAction
            findBugAction(rustyKey); // Assumes rustyKey is defined in the scope of initGame
            latestLogMessage = "You found an Old Rusty Key!";
            this.isEnabled = false; // Disable hotspot after key is taken
            this.exploreText = "An empty spot where a key used to be.";
            // No 'this' context issue here if Hotspot class calls onClickAction with .call(this) or similar.
            // For safety, if 'this' is not the hotspot, we'd reference hs_find_rusty_key directly.
            // Let's assume Hotspot class handles 'this' correctly for its own actions.
            // Correction: Hotspot class does NOT bind 'this' for these simple function callbacks.
            // We must refer to hs_find_rusty_key directly.
            hs_find_rusty_key.isEnabled = false;
            hs_find_rusty_key.exploreText = "An empty spot where a key used to be.";
        },
        "Old Key", // name
        null, // requiredItemName
        null, // onUseItemSuccessAction
        null, // onUseItemFailureAction
         'key', // iconType - using debugRect for now, can be a specific key icon later
        rustyKey, // associatedBug - link the key item for potential visual cues if iconType supported it
        "A small, old rusty key lies here, glinting faintly." // exploreText
    );
    scene1.addHotspot(hs_find_rusty_key);

    // Hotspot for Cotton Wick in Scene 1
    if (cottonWick) scene1.addBug(cottonWick); // Add to scene's bug list for reference
    const hs_find_cotton_wick = new Hotspot(
        300, 250, 40, 30, // x, y, width, height
        function() {
            findBugAction(cottonWick);
            latestLogMessage = "You found a Cotton Wick!";
            hs_find_cotton_wick.isEnabled = false;
            hs_find_cotton_wick.exploreText = "An empty nook where some wick was.";
        },
        "Cotton Wick Spot", null, null, null, 'wickIcon', cottonWick,
        "A piece of soft cotton wick is tucked away here."
    );
    scene1.addHotspot(hs_find_cotton_wick);

    // Define the door from Scene 1 to Scene 2 (now UNLOCKED)
    const navHotspot_s1_to_s2 = new Hotspot(
        canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2 - 25, 60, 50, // x, y, width, height
        function() { // onClickAction: navigate
            goToScene('scene2_id', 'entryFromS1');
        },
        "Door to Scene 2", // name
        null, // requiredItemName - null means unlocked
        null, // onUseItemSuccessAction - not needed for an unlocked door
        null, // onUseItemFailureAction - not needed for an unlocked door
        'door', // iconType
        null, // associatedBug
        "A door leading to Scene 2." // exploreText
    );
    scene1.addHotspot(navHotspot_s1_to_s2);

    // Create S1-S4 Door (Scene 1 to Archive - Locked)
    scene4.addEntryPoint('entryFromS1_archive', canvas.width - INVENTORY_WIDTH - 70 - 30, canvas.height / 2); // Entry point in S4 (e.g., right side)
    scene1.addEntryPoint('entryFromS4_archive_return', 100, canvas.height - 80); // Entry point in S1 for return from S4

    const navHotspot_s1_to_s4 = new Hotspot(
        100, canvas.height - 80, 80, 50, // Positioned somewhere in Scene 1, e.g., lower-left
        function() { // onClickAction: navigate if unlocked
            goToScene('scene4_id', 'entryFromS1_archive');
        },
        "Heavy Door to Archive", // name
        "Rusty Key", // requiredItemName
        function() { // onUseItemSuccessAction
            latestLogMessage = "The Rusty Key unlocks the heavy door to The Archive!";
            navHotspot_s1_to_s4.requiredItemName = null;
            navHotspot_s1_to_s4.exploreText = "An unlocked heavy door to The Archive.";
            if(typeof navHotspot_s1_to_s4.onClickAction === 'function') {
                navHotspot_s1_to_s4.onClickAction();
            }
        },
        function(selectedItem, failureReason) { // onUseItemFailureAction
             if (failureReason && (failureReason.includes("Too many items") || failureReason.includes("No item selected"))) {
                latestLogMessage = "Select the Rusty Key, click 'Use Item', then click the heavy door.";
            } else if (selectedItem) {
                latestLogMessage = `The ${selectedItem.name} doesn't fit this heavy lock.`;
            } else {
                latestLogMessage = "This heavy door is securely locked.";
            }
        },
        'door', // iconType
        null, // associatedBug
        "A heavy, reinforced door. It's securely locked and marked 'Archives - Restricted'." // exploreText
    );
    scene1.addHotspot(navHotspot_s1_to_s4);


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

    // Hotspot for Lighter in Scene 2
    if (lighter) scene2.addBug(lighter); // Add to scene's bug list
    const hs_find_lighter = new Hotspot(
        200, 280, 30, 40, // x, y, width, height
        function() {
            findBugAction(lighter);
            latestLogMessage = "You picked up a Lighter.";
            hs_find_lighter.isEnabled = false;
            hs_find_lighter.exploreText = "The spot where a lighter used to be.";
        },
        "Discarded Lighter", null, null, null, 'lighterIcon', lighter,
        "A discarded lighter lies in the dust."
    );
    scene2.addHotspot(hs_find_lighter);

    // Return Breached Wall Hotspot from Scene 2 (Hidden Alcove) to Scene 3
    const RETURN_BREACH_S2_TO_S3_NAME = "ReturnBreach_S2_Hidden_to_S3";
    const entryPointS2Hidden = scene2.getEntryPoint('entryFromS3_hidden'); // Get coords for positioning
    const hs_return_breach_s2_to_s3 = new Hotspot(
        entryPointS2Hidden.x - 25, entryPointS2Hidden.y - 25, 50, 50, // Centered around entry point
        function() { // onClickAction
            if (this.isEnabled) {
                goToScene('scene3_id', 'entryFromS2_hidden_return');
            } else {
                latestLogMessage = "The wall here is smooth and unbroken."; // Should not be clickable if disabled
            }
        },
        RETURN_BREACH_S2_TO_S3_NAME, // name
        null, null, null,
        'debugRect', // iconType - will be 'breachedWallOpening'
        null,
        "A solid wall section.", // exploreText - will be updated
        false, // isEnabled initially false
        true   // isBreached conceptually true
    );
    scene2.addHotspot(hs_return_breach_s2_to_s3);

    const navHotspot_s2_to_s1 = new Hotspot(10, canvas.height / 2 - 25, 60, 50, function() { goToScene('scene1_id', 'entryFromS2'); }, "NAV_S2_to_S1", null, null, null, 'door', null);
    scene2.addHotspot(navHotspot_s2_to_s1);
    const navHotspot_s2_to_s3 = new Hotspot(canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2 - 25, 60, 50, function() { goToScene('scene3_id', 'entryFromS2'); }, "NAV_S2_to_S3", null, null, null, 'door', null);
    scene2.addHotspot(navHotspot_s2_to_s3);


    // --- SCENE 3 Content ("Toolbox") ---
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

    // Add utility item hotspots to Scene 3 ("Toolbox")
    if (hammer) scene3.addBug(hammer);
    const hs_find_hammer = new Hotspot(
        100, 100, 50, 40, function() {
            findBugAction(hammer); latestLogMessage = "You found a Hammer.";
            hs_find_hammer.isEnabled = false; hs_find_hammer.exploreText = "An indentation where a hammer was.";
        }, "Hammer Spot", null, null, null, 'hammerIcon', hammer, "A heavy hammer is propped against a console."
    );
    scene3.addHotspot(hs_find_hammer);

    if (crowbar) scene3.addBug(crowbar);
    const hs_find_crowbar = new Hotspot(
        100, 150, 60, 30, function() {
            findBugAction(crowbar); latestLogMessage = "You found a Crowbar.";
            hs_find_crowbar.isEnabled = false; hs_find_crowbar.exploreText = "Scuff marks where a crowbar leaned.";
        }, "Crowbar Spot", null, null, null, 'crowbarIcon', crowbar, "A crowbar leans in the corner."
    );
    scene3.addHotspot(hs_find_crowbar);

    if (gasBottle) scene3.addBug(gasBottle);
    const hs_find_gas_bottle = new Hotspot(
        100, 200, 30, 40, function() {
            findBugAction(gasBottle); latestLogMessage = "You found a Gas Bottle.";
            hs_find_gas_bottle.isEnabled = false; hs_find_gas_bottle.exploreText = "A clean spot on a dusty shelf.";
        }, "Gas Bottle Spot", null, null, null, 'gasBottleIcon', gasBottle, "A small gas bottle is on a shelf."
    );
    scene3.addHotspot(hs_find_gas_bottle);


    // Note: The navHotspot_s3_to_s2 was already defined earlier in this scene's content.

    // Add S3-S4 Door (Unlocked) to Scene 3
    scene4.addEntryPoint('entryFromS3_archive', 10 + (30/2), canvas.height / 2); // Entry point in S4 when coming from S3
    // const navHotspot_s3_to_s4 = new Hotspot( // This door will be replaced by a breachable wall
    //     canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2 + 60, 60, 50, // Positioned lower right in Scene 3
    //     function() { goToScene('scene4_id', 'entryFromS3_archive'); },
    //     "Door to The Archive", // Name
    //     null, // requiredItemName - unlocked
    //     null, // onUseItemSuccessAction
    //     null, // onUseItemFailureAction
    //     'door', // iconType
    //     null, // associatedBug
    //     "A plain door, labeled 'Archive Access'." // exploreText
    // );
    // scene3.addHotspot(navHotspot_s3_to_s4); // Do not add the old door

    // Breachable Wall from Scene 3 to Scene 4
    const hs_breach_s3_to_s4 = new Hotspot(
        canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2 + 60, 60, 50, // Approx. old door location
        function() { // onClickAction
            if (this.isBreached) {
                goToScene('scene4_id', 'entryFromS3_archive');
            } else {
                latestLogMessage = "This wall looks weak. It might be breachable with the right tool.";
            }
        },
        "Weak Wall to Archive", // name
        [NAME_HAMMER, NAME_CROWBAR, NAME_EXPLOSIVE_DEVICE], // requiredItemName (array)
        function() { // onUseItemSuccessAction
            let toolUsed = selectedInventoryItems[0] ? selectedInventoryItems[0].name : "a tool";
            if (toolUsed === NAME_EXPLOSIVE_DEVICE) {
                latestLogMessage = `The ${toolUsed} blasts a hole in the wall! You can now reach The Archive.`;
            } else {
                latestLogMessage = `Using the ${toolUsed}, you manage to break through the wall to The Archive!`;
            }
            //goToScene('scene4_id', 'entryFromS3_archive'); // Navigation now handled by onClickAction after breach
            this.isBreached = true;
            this.iconType = 'breachedWallOpening';
            this.exploreText = "A gaping hole leads to The Archive. Click to enter.";
            this.requiredItemName = null; // No longer needs an item once breached

            // Enable the return hotspot in Scene 4
            const scene4Hotspots = gameScenes['scene4_id'] ? gameScenes['scene4_id'].hotspots : [];
            const returnHotspotS4 = scene4Hotspots.find(h => h.name === RETURN_BREACH_S4_TO_S3_NAME);
            if (returnHotspotS4) {
                returnHotspotS4.isEnabled = true;
                returnHotspotS4.iconType = 'breachedWallOpening';
                returnHotspotS4.exploreText = "The opening leads back to the Toolbox area (Scene 3). Click to return.";
            } else {
                console.error("Could not find return hotspot " + RETURN_BREACH_S4_TO_S3_NAME + " in Scene 4 to enable.");
            }
        },
        function(selectedItem, failureReason) { // onUseItemFailureAction
            if (this.isBreached) { // Should not happen if requiredItemName is nullified
                latestLogMessage = "The way is already open."; return;
            }
            if (failureReason && (failureReason.includes("Too many items") || failureReason.includes("No item selected"))) {
                 latestLogMessage = "Select a single tool (Hammer, Crowbar, or Explosive Device), click 'Use Item', then click the wall.";
            } else if (selectedItem) {
                latestLogMessage = `The ${selectedItem.name} isn't strong enough or suitable for this wall.`;
            } else {
                latestLogMessage = "This wall is weak, but you need a tool to breach it.";
            }
        },
        'crackedWall', // Initial iconType
        null, // associatedBug
        "A structurally weak section of the wall. It looks like it could be breached." // exploreText
    );
    scene3.addHotspot(hs_breach_s3_to_s4);

    // Add the new "Ancient Cache" strongbox to Scene 3
    const ancientCache = new Hotspot(
        canvas.width - INVENTORY_WIDTH - 100, 100, 80, 60, // x, y, width, height (position in top-right of scene3)
        function() {
            // This onClickAction is less likely to be triggered if requiredItemName is set,
            // as interaction will primarily go through 'Use' mode.
            latestLogMessage = "This ancient cache seems tightly sealed.";
        },
        "Ancient Cache", // name
        SHINING_VIOLET_GEM_NAME, // requiredItemName
        function() { // onUseItemSuccessAction
            parchmentTitle = "Ancient Cache Opened"; // Title for the parchment
            parchmentContent = "The Shining Violet Gem fits perfectly! The strongbox clicks open... it reveals a message: 'To be continued...'";
            isParchmentVisible = true;

            // Define the clue item to be added to inventory after parchment is dismissed
            // Name, color, points, actual name, found status, isReadable, messageTitle, messageContent
            pendingClueToAdd = new Bug(0, 0, '#E0D6B3', 0, 'Ancient Cache Note', true, true, parchmentTitle, parchmentContent);

            ancientCache.isEnabled = false; // Disable hotspot after successful use
            latestLogMessage = "The Ancient Cache opens!"; // Brief log message, parchment will show details
        },
        function(selectedItem, failureReason) { // onUseItemFailureAction
            if (failureReason === "Too many items selected while using" || failureReason === "No item selected while using") {
                 latestLogMessage = "Select the Shining Violet Gem, click 'Use Item', then click the cache.";
            } else if (selectedItem) {
                latestLogMessage = `The ${selectedItem.name} doesn't seem to fit the cache's indentation.`;
            } else {
                // This specific 'else' might be less reached if Hotspot.trigger handles "not in use mode" first
                latestLogMessage = "The cache has a peculiar gem-shaped indentation. It might require a specific item used on it.";
            }
        },
        'bugStrongbox', // iconType
        null, // associatedBug
        "An ancient, heavily sealed cache. It has a vibrant, gem-shaped indentation." // exploreText
    );
    scene3.addHotspot(ancientCache);

    // Breachable Wall from Scene 3 to Hidden part of Scene 2
    const hs_breach_s3_to_s2_hidden = new Hotspot(
        50, 100, 50, 70, // Position in Scene 3, e.g., left side
        function() { // onClickAction
            if (this.isBreached) {
                goToScene('scene2_id', 'entryFromS3_hidden');
            } else {
                latestLogMessage = "This wall has some strange markings and sounds hollow.";
            }
        },
        "Hollow Wall to Scene 2 Alcove", // name
        [NAME_HAMMER, NAME_CROWBAR, NAME_EXPLOSIVE_DEVICE], // requiredItemName (array)
        function() { // onUseItemSuccessAction
            let toolUsed = selectedInventoryItems[0] ? selectedInventoryItems[0].name : "a tool";
            latestLogMessage = `With the ${toolUsed}, you break into a hidden alcove in Scene 2!`;
            //goToScene('scene2_id', 'entryFromS3_hidden'); // Navigation now handled by onClickAction
            this.isBreached = true;
            this.iconType = 'breachedWallOpening';
            this.exploreText = "A newly made passage leads to a hidden alcove in Scene 2. Click to enter.";
            this.requiredItemName = null; // No longer needs an item once breached

            // Enable the return hotspot in Scene 2's hidden area
            const scene2Hotspots = gameScenes['scene2_id'] ? gameScenes['scene2_id'].hotspots : [];
            const returnHotspotS2 = scene2Hotspots.find(h => h.name === RETURN_BREACH_S2_TO_S3_NAME);
            if (returnHotspotS2) {
                returnHotspotS2.isEnabled = true;
                returnHotspotS2.iconType = 'breachedWallOpening';
                returnHotspotS2.exploreText = "The passage leads back to the Toolbox area (Scene 3). Click to return.";
            } else {
                console.error("Could not find return hotspot " + RETURN_BREACH_S2_TO_S3_NAME + " in Scene 2 to enable.");
            }
        },
        function(selectedItem, failureReason) { // onUseItemFailureAction
            if (this.isBreached) {
                latestLogMessage = "The passage is already open."; return;
            }
            if (failureReason && (failureReason.includes("Too many items") || failureReason.includes("No item selected"))) {
                 latestLogMessage = "Select a single tool (Hammer, Crowbar, or Explosive Device), click 'Use Item', then click the wall.";
            } else if (selectedItem) {
                latestLogMessage = `The ${selectedItem.name} doesn't seem to affect this strange wall.`;
            } else {
                latestLogMessage = "This wall is definitely suspicious. A tool might reveal something.";
            }
        },
        'crackedWall', // Initial iconType
        null, // associatedBug
        "This part of the wall sounds hollow and has unusual markings." // exploreText
    );
    scene3.addHotspot(hs_breach_s3_to_s2_hidden);

    const navHotspot_s3_to_s2 = new Hotspot(10, canvas.height / 2 - 25, 60, 50, function() { goToScene('scene2_id', 'entryFromS3'); }, "NAV_S3_to_S2", null, null, null, 'door', null);
    scene3.addHotspot(navHotspot_s3_to_s2);


    // Set current scene and detective AFTER all scenes are populated
    currentScene = gameScenes['scene1_id'];
    const initialEntryPoint = currentScene.getEntryPoint('initialSpawnPoint');

    // Define the callback for detective arrival messages
    const detectiveOnArrivalCallback = (message) => {
        latestLogMessage = message;
    };

    if (!detective) {
        detective = new Detective(
            initialEntryPoint.x,
            initialEntryPoint.y,
            detectiveOnArrivalCallback,
            () => currentInteractionMode // Pass a getter for currentInteractionMode
        );
    } else {
        // If detective already exists, ensure its callbacks are updated if necessary (though typically only set on init)
        // For simplicity, we assume callbacks are set once. If re-init needed different ones, more logic here.
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
    // Recipes for Explosive Device
    itemCombinations.push({
        item1Name: gasBottle.name, // Assuming gasBottle refers to the Bug instance
        item2Name: cottonWick.name, // Assuming cottonWick refers to the Bug instance
        resultItem: { name: primedGasBottle.name, color: primedGasBottle.color, points: 0 }
    });
    itemCombinations.push({
        item1Name: primedGasBottle.name, // Assuming primedGasBottle refers to the Bug instance
        item2Name: lighter.name,       // Assuming lighter refers to the Bug instance
        resultItem: { name: explosiveDevice.name, color: explosiveDevice.color, points: 0 }
    });
    console.log("Item combination recipes initialized:", itemCombinations);

    console.log("Adventure game initialized. Detective, scenes, and all scene-specific items created.");
    lastTime = performance.now();
    gameLoop();
}

function attemptCombination() { // Removed item1, item2 from parameters
    // This function is now primarily called by the Combine button click.
    // It expects selectedInventoryItems to be populated.
    console.log("[DEBUG] Attempting combination with selected items:", selectedInventoryItems);

    if (selectedInventoryItems.length !== 2) {
        console.log("[DEBUG] Combination failed: Exactly 2 items must be selected.");
        latestLogMessage = "Select exactly 2 items to combine.";
        // Do not clear selection here, user might want to adjust selection.
        return false;
    }

    const item1 = selectedInventoryItems[0];
    const item2 = selectedInventoryItems[1];

    // Ensure item1 and item2 are valid objects with names
    if (!item1 || !item1.name || !item2 || !item2.name) {
        console.error("[DEBUG] ERROR: One or both selected items are invalid or missing a name property.");
        selectedInventoryItems = []; // Clear selection due to invalid item data
        return false;
    }

    const item1Name = item1.name;
    const item2Name = item2.name;

    console.log(`[DEBUG] Trying to combine: '${item1Name}' and '${item2Name}'`);

    const serializableRecipes = itemCombinations.map(r => ({
        item1Name: r.item1Name,
        item2Name: r.item2Name,
        resultItemName: r.resultItem ? r.resultItem.name : "UNKNOWN_RESULT_NAME"
    }));
    console.log("[DEBUG] Available recipes:", JSON.stringify(serializableRecipes));

    for (const recipe of itemCombinations) {
        const recipeItem1Name = recipe.item1Name || "UNKNOWN_RECIPE_ITEM1_NAME";
        const recipeItem2Name = recipe.item2Name || "UNKNOWN_RECIPE_ITEM2_NAME";

        const match1 = (recipeItem1Name === item1Name && recipeItem2Name === item2Name);
        const match2 = (recipeItem1Name === item2Name && recipeItem2Name === item1Name);

        if (match1 || match2) {
            console.log("[DEBUG] SUCCESS: Recipe matched!");

            // Remove source items from inventory
            foundBugsInventory = foundBugsInventory.filter(bug => bug !== item1 && bug !== item2);

            // Add result item to inventory
            score += recipe.resultItem.points; // Add points from the new item
            const newItem = new Bug(0, 0, recipe.resultItem.color, recipe.resultItem.points, recipe.resultItem.name);
            newItem.found = true; // Mark as found since it's created
            foundBugsInventory.push(newItem);

            updateWinnableItemsCount(); // Update counts for win condition etc.
            selectedInventoryItems = []; // Clear selection after successful combination
            latestLogMessage = `Combined ${item1.name} & ${item2.name} into: ${newItem.name}!`;
            console.log(`[DEBUG] Items combined successfully into: ${newItem.name}`);
            return true;
        }
    }

    console.log("[DEBUG] FAILURE: No matching recipe found for the selected items.");
    latestLogMessage = `Cannot combine ${item1Name} and ${item2Name}.`;
    // Do not clear selection here, user might want to try combining with something else or deselect manually.
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
        latestLogMessage = `Found: ${bugInstance.name}!`;
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
        latestLogMessage = `Traveling to ${targetSceneId.replace('_id', '')}...`;

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
    } else {
        latestLogMessage = `Error: Scene '${targetSceneId}' not found!`;
        console.error(`Scene with ID '${targetSceneId}' not found!`);
    }
}


// Canvas click event listener
canvas.addEventListener('click', function(event) {
    if (isParchmentVisible) {
        isParchmentVisible = false;
        if (pendingClueToAdd) {
            // Avoid adding duplicate notes if something unexpected happens
            if (!foundBugsInventory.some(item => item.name === pendingClueToAdd.name)) {
                foundBugsInventory.push(pendingClueToAdd);
                latestLogMessage = `Added '${pendingClueToAdd.name}' to inventory.`;
                // updateWinnableItemsCount(); // Only if notes contribute to win condition
            }
            pendingClueToAdd = null; // Clear it regardless
        }
        // Consider redrawing immediately if input was truly blocked:
        // if (currentScene) currentScene.draw(ctx);
        // drawUI(ctx);
        return; // Consume the click, do nothing else.
    }

    if (!currentScene || !detective) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // --- Check for Inventory Click ---
    // Note: INV_ITEM_START_Y, INV_ITEM_PADDING, and INV_LINE_HEIGHT are now global constants

    if (mouseX >= INVENTORY_X && mouseX <= INVENTORY_X + INVENTORY_WIDTH &&
        mouseY >= INVENTORY_Y && mouseY <= INVENTORY_Y + INVENTORY_HEIGHT) {

        // Check if Inspect Item button was clicked
        if (mouseX >= INSPECT_BUTTON_X && mouseX <= INSPECT_BUTTON_X + ACTION_BUTTON_WIDTH &&
            mouseY >= INSPECT_BUTTON_Y && mouseY <= INSPECT_BUTTON_Y + ACTION_BUTTON_HEIGHT) {
            if (currentInteractionMode === 'normal' && selectedInventoryItems.length === 1) {
                const itemToInspect = selectedInventoryItems[0];
                pendingClueToAdd = null; // Ensure we don't add a new item from a previous action

                if (itemToInspect.isReadable && itemToInspect.messageContent) {
                    parchmentTitle = itemToInspect.messageTitle || itemToInspect.name;
                    parchmentContent = itemToInspect.messageContent;
                    isParchmentVisible = true;
                    latestLogMessage = `Inspecting: ${itemToInspect.name}`;
                } else {
                    // Item is not 'isReadable', so show its details
                    let inspectionDetails = `Name: ${itemToInspect.name}\nPoints: ${itemToInspect.points}`;
                    // Color is visually represented by swatch, so might not be needed here unless desired.
                    // inspectionDetails += `\nColor: ${itemToInspect.color}`;

                    if (itemToInspect.description && itemToInspect.description.trim() !== "") {
                        inspectionDetails += `\n\n${itemToInspect.description}`;
                    }
                    if (itemToInspect.combineHint && itemToInspect.combineHint.trim() !== "") {
                        inspectionDetails += `\n\nHint: ${itemToInspect.combineHint}`;
                    }

                    // Fallback generic detail if no specific description/hint
                    if ((!itemToInspect.description || itemToInspect.description.trim() === "") &&
                        (!itemToInspect.combineHint || itemToInspect.combineHint.trim() === "")) {
                        inspectionDetails += "\n\nIt appears to be a standard data-bug or fragment.";
                    }

                    parchmentTitle = `Details: ${itemToInspect.name}`;
                    parchmentContent = inspectionDetails;
                    isParchmentVisible = true;
                    latestLogMessage = `Inspecting: ${itemToInspect.name}`;
                }
            } else if (currentInteractionMode !== 'normal') {
                latestLogMessage = "Cannot inspect items while in another mode.";
            } else {
                latestLogMessage = "Select a single item to inspect.";
            }
            console.log("Inspect Item button clicked.");
            return; // Click handled
        }

        // Check if Explore button was clicked
        if (mouseX >= EXPLORE_BUTTON_X && mouseX <= EXPLORE_BUTTON_X + ACTION_BUTTON_WIDTH &&
            mouseY >= EXPLORE_BUTTON_Y && mouseY <= EXPLORE_BUTTON_Y + ACTION_BUTTON_HEIGHT) {
            if (currentInteractionMode === 'exploring') {
                currentInteractionMode = 'normal';
                latestLogMessage = "Explore mode cancelled.";
            } else if (currentInteractionMode === 'normal') {
                currentInteractionMode = 'exploring';
                latestLogMessage = "Explore mode: Click on an object or area in the scene.";
            }
            // If in 'usingItem' mode, clicking Explore does nothing
            console.log("Explore button clicked. Mode:", currentInteractionMode);
            return; // Click handled
        }

        // Check if Use button was clicked
        if (mouseX >= USE_BUTTON_X && mouseX <= USE_BUTTON_X + ACTION_BUTTON_WIDTH &&
            mouseY >= USE_BUTTON_Y && mouseY <= USE_BUTTON_Y + ACTION_BUTTON_HEIGHT) {
            if (currentInteractionMode === 'usingItem') {
                currentInteractionMode = 'normal';
                latestLogMessage = "Use cancelled.";
                // selectedInventoryItems = []; // Optional: clear selection on cancel
            } else if (currentInteractionMode === 'normal' && selectedInventoryItems.length === 1) {
                currentInteractionMode = 'usingItem';
                latestLogMessage = `Using ${selectedInventoryItems[0].name}. Click a hotspot to use it, or 'Cancel Use'.`;
            } else if (currentInteractionMode === 'normal' && selectedInventoryItems.length !== 1) {
                latestLogMessage = "Select exactly one item to use.";
            }
            // If in 'exploring' mode, clicking Use does nothing
            console.log("Use button clicked. Mode:", currentInteractionMode);
            return; // Click handled
        }

        // Check if Combine button was clicked
        if (mouseX >= COMBINE_BUTTON_X && mouseX <= COMBINE_BUTTON_X + COMBINE_BUTTON_WIDTH &&
            mouseY >= COMBINE_BUTTON_Y && mouseY <= COMBINE_BUTTON_Y + COMBINE_BUTTON_HEIGHT) {
            if (currentInteractionMode === 'normal') { // Only allow combine in normal mode
                console.log("Combine button clicked");
                attemptCombination();
            } else {
                latestLogMessage = "Cannot combine items while in another mode.";
            }
            return; // Click handled by Combine button
        }

        // Click is within the inventory panel bounds (but not the action buttons)
        let clickedInventoryItemIndex = -1;
        for (let i = 0; i < foundBugsInventory.length; i++) {
            // Use global constants for item layout calculations
            const itemTopY = INV_ITEM_START_Y + (i * (INV_LINE_HEIGHT + INV_ITEM_PADDING)) - (INV_ITEM_PADDING / 2);
            const itemBottomY = itemTopY + INV_LINE_HEIGHT + INV_ITEM_PADDING;

            const itemClickableXStart = INVENTORY_X + INV_ITEM_PADDING / 2;
            const itemClickableXEnd = INVENTORY_X + INVENTORY_WIDTH - INV_ITEM_PADDING / 2;

            // Ensure the click is not overlapping where the combine button might be,
            // even if items list is short. This check is mostly for items ABOVE the button.
            if (mouseY < COMBINE_BUTTON_Y - COMBINE_BUTTON_MARGIN) { // Ensure click is above combine button area
                if (mouseY >= itemTopY && mouseY <= itemBottomY && mouseX >= itemClickableXStart && mouseX <= itemClickableXEnd) {
                    clickedInventoryItemIndex = i;
                    break;
                }
            }
        }

        if (clickedInventoryItemIndex !== -1) {
            const clickedBugInInventory = foundBugsInventory[clickedInventoryItemIndex];
            const itemIndexInSelected = selectedInventoryItems.indexOf(clickedBugInInventory);

            if (itemIndexInSelected > -1) {
                selectedInventoryItems.splice(itemIndexInSelected, 1);
                console.log("Deselected item:", clickedBugInInventory.name);
            } else {
                selectedInventoryItems.push(clickedBugInInventory);
                console.log("Selected item:", clickedBugInInventory.name);
            }
            // Log the state of selectedInventoryItems after modification
            console.log("[Click Handler] selectedInventoryItems after update:", JSON.stringify(selectedInventoryItems.map(item => item.name)));
            return; // Click handled by inventory item selection
        }

        // Click was in inventory panel but not on an item or the combine button
        console.log("Clicked inside inventory panel (not on item/button).");
        return;
    }

    // --- Main Scene Click Logic (Hotspots & Movement) based on Interaction Mode ---

    // First, determine if a hotspot was clicked, regardless of mode (needed for all modes)
    let clickedHotspot = null;
    if (currentScene.hotspots) {
        for (let i = currentScene.hotspots.length - 1; i >= 0; i--) {
            const hotspot = currentScene.hotspots[i];
            if (hotspot.isClicked(mouseX, mouseY)) {
                clickedHotspot = hotspot;
                break;
            }
        }
    }

    if (currentInteractionMode === 'usingItem') {
        if (clickedHotspot) {
            // Attempt to use the selected item on this hotspot
            latestLogMessage = `Using ${selectedInventoryItems[0].name} on ${clickedHotspot.name}...`;
            // Detective moves to hotspot, and upon arrival, Hotspot.trigger() is called.
            // Hotspot.trigger() will use the mode passed by detective.moveTo.
            const targetInteractionX = clickedHotspot.x + clickedHotspot.width / 2;
            const targetInteractionY = clickedHotspot.y + clickedHotspot.height / 2;
            detective.moveTo(targetInteractionX, targetInteractionY, clickedHotspot, 'usingItem'); // Pass 'usingItem' mode
        } else {
            // Clicked on empty ground while in 'usingItem' mode
            latestLogMessage = "Use cancelled. Clicked on empty ground.";
            currentInteractionMode = 'normal'; // Reset global mode only if not interacting with hotspot
        }
        // If a hotspot was clicked, global currentInteractionMode is reset AFTER the interaction attempt
        // by the logic within Detective.update() implicitly (as latched mode is used) or explicitly if needed.
        // For now, resetting it here for clicks on empty ground is correct.
        // If hotspot clicked, it remains 'usingItem' until detective acts & clears its latched mode.
        // The global mode should be reset after the action. Let's adjust this:
        // Global mode is reset to 'normal' if empty ground is clicked.
        // If hotspot is clicked, the 'usingItem' mode is latched by detective.moveTo,
        // and global mode can be reset.
        if (!clickedHotspot) { // If we clicked empty ground
             currentInteractionMode = 'normal';
        } else {
            // If we clicked a hotspot, the global mode can also be reset here,
            // as the 'usingItem' intent is now latched with the detective's move.
            currentInteractionMode = 'normal';
        }


    } else if (currentInteractionMode === 'exploring') {
        if (clickedHotspot) {
            latestLogMessage = clickedHotspot.exploreText || `You examine the ${clickedHotspot.name}. Nothing more to note.`;
        } else {
            // Select a random generic message for empty ground
            latestLogMessage = GENERIC_EXPLORE_MESSAGES[Math.floor(Math.random() * GENERIC_EXPLORE_MESSAGES.length)];
        }
        currentInteractionMode = 'normal'; // Exit 'exploring' mode after one click

    } else { // currentInteractionMode === 'normal'
        const clickTime = performance.now();
        const timeSinceLastClick = clickTime - lastSceneClickTime;
        let isBoosted = false;

        if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD &&
            Math.abs(mouseX - lastSceneClickX) < CLICK_AREA_TOLERANCE &&
            Math.abs(mouseY - lastSceneClickY) < CLICK_AREA_TOLERANCE) {
            isBoosted = true;
            lastSceneClickTime = 0; // Reset to prevent third click being double
        } else {
            lastSceneClickTime = clickTime;
            lastSceneClickX = mouseX;
            lastSceneClickY = mouseY;
        }

        if (clickedHotspot) {
            const targetInteractionX = clickedHotspot.x + clickedHotspot.width / 2;
            const targetInteractionY = clickedHotspot.y + clickedHotspot.height / 2;
            detective.moveTo(targetInteractionX, targetInteractionY, clickedHotspot, null, isBoosted);
            latestLogMessage = `${isBoosted ? "Quickly moving" : "Moving"} to interact with ${clickedHotspot.name}...`;
            console.log(`${isBoosted ? "Quickly moving" : "Moving"} to interact with hotspot: ${clickedHotspot.name}`);
        } else { // Clicked on empty ground
            detective.moveTo(mouseX, mouseY, null, null, isBoosted);
            latestLogMessage = `${isBoosted ? "Quickly moving" : "Moving"} to point (${mouseX.toFixed(0)}, ${mouseY.toFixed(0)})...`;
            console.log(`${isBoosted ? "Quickly moving" : "Moving"} to point: (${mouseX.toFixed(0)}, ${mouseY.toFixed(0)})`);
        }
    }
});

// Reset cursor when mouse leaves the canvas
canvas.addEventListener('mouseleave', function() {
    canvas.style.cursor = 'default'; // Always reset to default on mouse leave
    cursorCurrentlyOverHotspot = false; // Ensure flag is reset
});

// Mousemove listener for cursor changes over hotspots
canvas.addEventListener('mousemove', function(event) {
    if (!currentScene) return; // Only process if a scene is active

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let desiredCursor = 'default';
    let isOverActiveHotspot = false;

    if (currentScene.hotspots) {
        for (let i = currentScene.hotspots.length - 1; i >= 0; i--) {
            const hotspot = currentScene.hotspots[i];
            if (hotspot.isClicked(mouseX, mouseY)) { // isClicked also checks isEnabled
                isOverActiveHotspot = true;
                if (hotspot.requiredItemName) {
                    if (currentInteractionMode === 'usingItem' &&
                        selectedInventoryItems.length === 1 &&
                        selectedInventoryItems[0].name === hotspot.requiredItemName) {
                        desiredCursor = 'copy'; // Correct item selected in 'use' mode
                    } else {
                        desiredCursor = 'help'; // Needs an item, but not correctly prepared
                    }
                } else {
                    desiredCursor = 'pointer'; // Standard interactive hotspot
                }
                break;
            }
        }
    }

    if (canvas.style.cursor !== desiredCursor) {
        canvas.style.cursor = desiredCursor;
    }
    cursorCurrentlyOverHotspot = isOverActiveHotspot; // Update global flag
});


// Start the game
initGame();

console.log("adventure_game.js loaded and game initialized");
