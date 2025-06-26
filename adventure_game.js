const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let currentScene = null;
let detective = null;
const gameScenes = {}; // Collection of all scenes

let score = 0;
let winnableItemsInInventoryCount = 0;
const winnableItemNames = [];
let totalWinnableItems = 0;
let gameWon = false;
let foundBugsInventory = [];
let selectedInventoryItems = [];
const itemCombinations = [];
let lastTime = 0;

let latestLogMessage = "Welcome to Detective Polyspace!";
let currentInteractionMode = 'normal';
let cursorCurrentlyOverHotspot = false;

let lastSceneClickTime = 0;
let lastSceneClickX = -1;
let lastSceneClickY = -1;
const DOUBLE_CLICK_THRESHOLD = 400;
const CLICK_AREA_TOLERANCE = 10;

let isParchmentVisible = false;
let parchmentTitle = "";
let parchmentContent = "";
let pendingClueToAdd = null;

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

const INVENTORY_WIDTH = 200;
const INVENTORY_X = canvas.width - INVENTORY_WIDTH;
const INVENTORY_Y = 0;
const INVENTORY_HEIGHT = canvas.height;

const COMBINE_BUTTON_HEIGHT = 40;
const COMBINE_BUTTON_MARGIN = 10;
const COMBINE_BUTTON_X = INVENTORY_X + COMBINE_BUTTON_MARGIN;
const COMBINE_BUTTON_Y = INVENTORY_HEIGHT - COMBINE_BUTTON_HEIGHT - COMBINE_BUTTON_MARGIN;
const COMBINE_BUTTON_WIDTH = INVENTORY_WIDTH - 2 * COMBINE_BUTTON_MARGIN;

const LOG_AREA_HEIGHT = 30;
const LOG_AREA_Y = canvas.height - LOG_AREA_HEIGHT;
const LOG_AREA_X = 0;
const LOG_AREA_WIDTH = canvas.width - INVENTORY_WIDTH;
const LOG_TEXT_MARGIN = 5;
const LOG_FONT_SIZE = 14;

const ACTION_BUTTON_HEIGHT = 30;
const ACTION_BUTTON_MARGIN = 8;
const ACTION_BUTTON_SIDE_MARGIN = COMBINE_BUTTON_MARGIN;
const ACTION_BUTTON_WIDTH = INVENTORY_WIDTH - 2 * ACTION_BUTTON_SIDE_MARGIN;

const USE_BUTTON_X = INVENTORY_X + ACTION_BUTTON_SIDE_MARGIN;
const USE_BUTTON_Y = COMBINE_BUTTON_Y - ACTION_BUTTON_HEIGHT - ACTION_BUTTON_MARGIN;

const EXPLORE_BUTTON_X = INVENTORY_X + ACTION_BUTTON_SIDE_MARGIN;
const EXPLORE_BUTTON_Y = USE_BUTTON_Y - ACTION_BUTTON_HEIGHT - ACTION_BUTTON_MARGIN;

const INSPECT_BUTTON_X = INVENTORY_X + ACTION_BUTTON_SIDE_MARGIN;
const INSPECT_BUTTON_Y = EXPLORE_BUTTON_Y - ACTION_BUTTON_HEIGHT - ACTION_BUTTON_MARGIN;

const INV_ITEM_PADDING = 5;
const INV_LINE_HEIGHT = 18;
const INV_ITEM_START_Y = INVENTORY_Y + 45;


function gameLoop(timestamp) {
    if (lastTime === undefined || lastTime === 0) {
        lastTime = timestamp;
    }
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (detective) {
        detective.update(deltaTime);
    }

    if (currentScene) {
        currentScene.draw(ctx);
    }
    drawUI(ctx);

    requestAnimationFrame(gameLoop);
}

function drawUI(ctx) {
    ctx.fillStyle = '#000000';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let uiLineY = 10;
    const uiLineHeight = 22;

    ctx.fillText(`Score: ${score}`, 10, uiLineY);
    uiLineY += uiLineHeight;

    if (currentScene && currentScene.id) {
        ctx.fillText(`Scene: ${currentScene.id}`, 10, uiLineY);
        uiLineY += uiLineHeight;
    }

    ctx.fillText(`Found: ${winnableItemsInInventoryCount} / ${totalWinnableItems}`, 10, uiLineY);

    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(INVENTORY_X, INVENTORY_Y, INVENTORY_WIDTH, INVENTORY_HEIGHT);

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(INVENTORY_X, INVENTORY_Y, INVENTORY_WIDTH, INVENTORY_HEIGHT);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Found Bugs', INVENTORY_X + INVENTORY_WIDTH / 2, INVENTORY_Y + 15);

    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let currentItemY = INV_ITEM_START_Y;

    foundBugsInventory.forEach((bug, index) => {
        if (currentItemY + INV_LINE_HEIGHT + INV_ITEM_PADDING > INSPECT_BUTTON_Y - ACTION_BUTTON_MARGIN) {
            return;
        }
        const itemAreaX = INVENTORY_X + INV_ITEM_PADDING / 2;
        const itemAreaY = currentItemY - (INV_ITEM_PADDING / 2);
        const itemAreaWidth = INVENTORY_WIDTH - (INV_ITEM_PADDING);
        const itemAreaHeight = INV_LINE_HEIGHT + INV_ITEM_PADDING;

        if (selectedInventoryItems.includes(bug)) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(itemAreaX, itemAreaY, itemAreaWidth, itemAreaHeight);
        }

        ctx.fillStyle = bug.color;
        ctx.fillRect(INVENTORY_X + INV_ITEM_PADDING + 5, currentItemY + (INV_LINE_HEIGHT / 2) - 5, 10, 10);

        ctx.fillStyle = '#111111';
        let bugText = `${index + 1}. ${bug.name} (${bug.points} pts)`;
        ctx.fillText(bugText, INVENTORY_X + INV_ITEM_PADDING + 20, currentItemY);

        currentItemY += INV_LINE_HEIGHT + INV_ITEM_PADDING;
    });

    const canInspect = currentInteractionMode === 'normal' && selectedInventoryItems.length === 1;
    ctx.fillStyle = canInspect ? '#6f42c1' : '#6c757d';
    ctx.fillRect(INSPECT_BUTTON_X, INSPECT_BUTTON_Y, ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    ctx.strokeStyle = canInspect ? '#5a2aa0' : '#545b62';
    ctx.lineWidth = 2;
    ctx.strokeRect(INSPECT_BUTTON_X, INSPECT_BUTTON_Y, ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("Inspect Item", INSPECT_BUTTON_X + ACTION_BUTTON_WIDTH / 2, INSPECT_BUTTON_Y + ACTION_BUTTON_HEIGHT / 2);

    let exploreButtonText = "Explore";
    ctx.fillStyle = (currentInteractionMode === 'exploring') ? '#0056b3' : (currentInteractionMode === 'normal' ? '#007bff' : '#6c757d');
    ctx.fillRect(EXPLORE_BUTTON_X, EXPLORE_BUTTON_Y, ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    ctx.strokeStyle = (currentInteractionMode === 'exploring') ? '#003f80' : '#0056b3';
    ctx.lineWidth = 2;
    ctx.strokeRect(EXPLORE_BUTTON_X, EXPLORE_BUTTON_Y, ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (currentInteractionMode === 'exploring') exploreButtonText = "Cancel Explore";
    ctx.fillText(exploreButtonText, EXPLORE_BUTTON_X + ACTION_BUTTON_WIDTH / 2, EXPLORE_BUTTON_Y + ACTION_BUTTON_HEIGHT / 2);

    let useButtonText = "Use Item";
    const canUse = selectedInventoryItems.length === 1;
    ctx.fillStyle = (currentInteractionMode === 'usingItem') ? '#1e7e34' : (currentInteractionMode === 'normal' && canUse ? '#28a745' : '#6c757d');
    ctx.fillRect(USE_BUTTON_X, USE_BUTTON_Y, ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    ctx.strokeStyle = (currentInteractionMode === 'usingItem') ? '#155724' : (currentInteractionMode === 'normal' && canUse ? '#1e7e34' : '#545b62');
    ctx.strokeRect(USE_BUTTON_X, USE_BUTTON_Y, ACTION_BUTTON_WIDTH, ACTION_BUTTON_HEIGHT);
    ctx.fillStyle = '#FFFFFF';
    if (currentInteractionMode === 'usingItem') useButtonText = "Cancel Use";
    ctx.fillText(useButtonText, USE_BUTTON_X + ACTION_BUTTON_WIDTH / 2, USE_BUTTON_Y + ACTION_BUTTON_HEIGHT / 2);

    const canCombine = selectedInventoryItems.length === 2;
    ctx.fillStyle = (currentInteractionMode === 'normal' && canCombine) ? '#388E3C' : (currentInteractionMode === 'normal' && selectedInventoryItems.length !==0 && !canCombine ? '#FFC107' : (currentInteractionMode === 'normal' ? '#4CAF50' : '#6c757d'));
    ctx.fillRect(COMBINE_BUTTON_X, COMBINE_BUTTON_Y, COMBINE_BUTTON_WIDTH, COMBINE_BUTTON_HEIGHT);
    ctx.strokeStyle = (currentInteractionMode === 'normal' && canCombine) ? '#2E7D32' : '#545b62';
    ctx.strokeRect(COMBINE_BUTTON_X, COMBINE_BUTTON_Y, COMBINE_BUTTON_WIDTH, COMBINE_BUTTON_HEIGHT);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Combine', COMBINE_BUTTON_X + COMBINE_BUTTON_WIDTH / 2, COMBINE_BUTTON_Y + COMBINE_BUTTON_HEIGHT / 2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(LOG_AREA_X, LOG_AREA_Y, LOG_AREA_WIDTH, LOG_AREA_HEIGHT);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${LOG_FONT_SIZE}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const maxTextWidth = LOG_AREA_WIDTH - (2 * LOG_TEXT_MARGIN);
    let textToDraw = latestLogMessage;
    if (ctx.measureText(textToDraw).width > maxTextWidth) {
        while (ctx.measureText(textToDraw + "...").width > maxTextWidth && textToDraw.length > 0) {
            textToDraw = textToDraw.substring(0, textToDraw.length - 1);
        }
        textToDraw += "...";
    }
    ctx.fillText(textToDraw, LOG_AREA_X + LOG_TEXT_MARGIN, LOG_AREA_Y + LOG_AREA_HEIGHT / 2);

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

    if (isParchmentVisible) {
        drawParchmentModal(ctx);
    }
}

function drawParchmentModal(ctx) {
    const gameViewWidth = canvas.width - INVENTORY_WIDTH;
    const modalWidth = gameViewWidth * 0.7;
    const modalHeight = canvas.height * 0.6;
    const modalX = (gameViewWidth - modalWidth) / 2;
    const modalY = (canvas.height - modalHeight) / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    ctx.fillStyle = '#5D4037';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(parchmentTitle, modalX + modalWidth / 2, modalY + 20);

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
    ctx.fillText(line, contentX, currentContentY);

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
    if (winnableItemsInInventoryCount === totalWinnableItems) {
        if (!gameWon) {
            gameWon = true;
        }
    }
}

function initGame() {
    score = 0;
    winnableItemsInInventoryCount = 0;
    gameWon = false;
    foundBugsInventory = [];
    selectedInventoryItems = [];
    for (const key in gameScenes) { delete gameScenes[key]; }
    itemCombinations.length = 0;
    winnableItemNames.length = 0;

    const VIOLET_FRAGMENT_ALPHA_NAME = "Violet Fragment Alpha";
    const VIOLET_FRAGMENT_BETA_NAME = "Violet Fragment Beta";
    const SHINING_VIOLET_GEM_NAME = "Shining Violet Gem";

    const NAME_HAMMER = "Hammer";
    const NAME_CROWBAR = "Crowbar";
    const NAME_EXPLOSIVE_DEVICE = "Explosive Device";

    const pointsRed = 40, pointsGray = 30, pointsOrange = 20, pointsGreen = 10;
    const pointsViolet = 0;

    let rustyKey, goldenKey;
    let hammer, crowbar, gasBottle, cottonWick, lighter, primedGasBottle, explosiveDevice;

    v1_s1 = new Bug(100, 180, 'green', pointsGreen, "Green Bug V1", false, false, '', '',
                  "A common, yet elusive green data-bug. Often found nesting in older code structures.");
    o1_s1 = new Bug(100, 230, 'orange', pointsOrange, "Orange Bug O1");
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

    rustyKey = new Bug(0, 0, '#A0A0A0', 0, "Rusty Key", false, false, '', '',
                     "An old, very rusty key. It looks like it might fit a simple lock.", "");
    goldenKey = new Bug(0, 0, 'gold', 10, "Golden Key", false, false, '', '',
                      "A shiny golden key. It feels important and fits no ordinary lock.", "");

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
    scene2.addEntryPoint('entryFromS3_passage_return', canvas.width - INVENTORY_WIDTH - 70 + 30, 100 + 25);
    scene2.addBackgroundText("#include <header_file.h>", 50, 100, 'bold 40px monospace', '#224422');
    scene2.addBackgroundText("namespace Utilities {", 70, 150, '30px monospace', '#224422');
    scene2.addBackgroundText("  // Checksum function?", 90, 200, '30px monospace', '#224422');
    scene2.addBackgroundText("}", 70, 250, '30px monospace', '#224422');
    gameScenes['scene2_id'] = scene2;

    const scene3 = new Scene('scene3_id', '#D0D0E0');
    scene3.addEntryPoint('entryFromS2', 10 + (30/2), canvas.height / 2); // Original door entry, now unused by player nav
    scene3.addEntryPoint('entryFromS4_breach_return', canvas.width - INVENTORY_WIDTH - 70 + 30, canvas.height / 2 + 60 + 25);
    scene3.addEntryPoint('entryFromS2_passage', 10 + (30/2), 100 + 25);
    scene3.addBackgroundText("struct LogFile {", 50, 100, 'bold 36px monospace', '#222244');
    scene3.addBackgroundText("  char timestamp[32];", 70, 150, '28px monospace', '#222244');
    scene3.addBackgroundText("  char message[256];", 70, 200, '28px monospace', '#222244');
    scene3.addBackgroundText("};", 50, 250, 'bold 36px monospace', '#222244');
    gameScenes['scene3_id'] = scene3;

    const scene4 = new Scene('scene4_id', '#D8D8D8');
    scene4.addBackgroundText("ARCHIVE HALL", canvas.width / 2 - INVENTORY_WIDTH / 2, 50, 'bold 40px Arial', '#333333', 'center');
    scene4.addBackgroundText("Rows of digital shelves stretch into the distance.", 50, 120, '20px Arial', '#444444');
    scene4.addBackgroundText("A lone terminal flickers in one corner.", 50, 150, '20px Arial', '#444444');
    scene4.addBackgroundText("DATA LOG ZXA-487", 400, 300, 'italic 18px Courier New', '#555555', 'center');
    gameScenes['scene4_id'] = scene4;

    scene4.bugs = []; scene4.hotspots = [];

    const RETURN_BREACH_S4_TO_S3_NAME = "ReturnFireplace_S4_to_S3";
    const hs_return_breach_s4_to_s3 = new Hotspot(
        10, canvas.height / 2, 60, 50,
        function() {
            if (this.isEnabled) {
                goToScene('scene3_id', 'entryFromS4_breach_return');
            } else {
                latestLogMessage = "A solid wall. No obvious way through from here.";
            }
        },
        RETURN_BREACH_S4_TO_S3_NAME,
        null, null, null,
        'debugRect',
        null,
        "The wall seems solid here.",
        false,
        true
    );
    scene4.addHotspot(hs_return_breach_s4_to_s3);

    const navHotspot_s4_to_s1 = new Hotspot(
        canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2, 60, 50,
        function() { goToScene('scene1_id', 'entryFromS4_archive_return'); },
        "Door to Mainframe Sector",
        null, null, null, 'door', null,
        "A door leading back to the Mainframe Sector (Scene 1)."
    );
    scene4.addHotspot(navHotspot_s4_to_s1);

    if (goldenKey) scene4.addBug(goldenKey);

    const hs_archive_chest = new Hotspot(
        250, 280, 70, 50,
        function() {
            findBugAction(goldenKey);
            latestLogMessage = "You open the ornate chest and find a Golden Key!";
            hs_archive_chest.isEnabled = false;
            hs_archive_chest.exploreText = "An empty, open ornate chest.";
        },
        "Ornate Chest",
        null,
        null,
        null,
        'bugStrongbox',
        goldenKey,
        "An ornate chest sits in the corner. It doesn't appear to be locked."
    );
    scene4.addHotspot(hs_archive_chest);

    scene1.bugs = []; scene1.hotspots = [];
    scene1.addBug(v1_s1);
    scene1.addBug(o1_s1);
    scene1.addBug(g1_s1);
    if (rustyKey) scene1.addBug(rustyKey);

    const hs_v1_s1 = new Hotspot(50, 160, 100, 50, function() { findBugAction(v1_s1); }, "HS_Find_V1_S1", null, null, null, 'bugStrongbox', v1_s1);
    const hs_o1_s1 = new Hotspot(50, 210, 100, 50, function() { findBugAction(o1_s1); }, "HS_Find_O1_S1", null, null, null, 'bugStrongbox', o1_s1);
    scene1.addHotspot(hs_v1_s1);
    scene1.addHotspot(hs_o1_s1);
    const hs_puzzle_for_g1 = new Hotspot(50, 260, 100, 50,
        function() {
            latestLogMessage = "A strange mechanism. It seems to be missing a part.";
        },
        "HS_Puzzle_GrayBugLocation", r1_s2.name,
        function() {
            latestLogMessage = `The Red Bug R1 fits perfectly! ${g1_s1.name} revealed!`;
            findBugAction(g1_s1);
        },
        function(selectedItem, failureReason) {
            if (failureReason === "Too many items selected") {
                latestLogMessage = "Too many items selected. Try using one item.";
            } else if (selectedItem) {
                latestLogMessage = `Using ${selectedItem.name} on the mechanism doesn't work.`;
            } else {
                latestLogMessage = "This looks like it needs something specific.";
            }
        },
        'bugStrongbox', g1_s1);
    scene1.addHotspot(hs_puzzle_for_g1);

    const hs_find_rusty_key = new Hotspot(
        200, 100, 50, 40,
        function() {
            findBugAction(rustyKey);
            latestLogMessage = "You found an Old Rusty Key!";
            hs_find_rusty_key.isEnabled = false;
            hs_find_rusty_key.exploreText = "An empty spot where a key used to be.";
        },
        "Old Key",
        null,
        null,
        null,
         'key',
        rustyKey,
        "A small, old rusty key lies here, glinting faintly."
    );
    scene1.addHotspot(hs_find_rusty_key);

    if (cottonWick) scene1.addBug(cottonWick);
    const hs_find_cotton_wick = new Hotspot(
        300, 250, 40, 30,
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

    const navHotspot_s1_to_s2 = new Hotspot(
        canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2 - 25, 60, 50,
        function() {
            goToScene('scene2_id', 'entryFromS1');
        },
        "Door to Scene 2",
        null,
        null,
        null,
        'door',
        null,
        "A door leading to Scene 2."
    );
    scene1.addHotspot(navHotspot_s1_to_s2);

    scene4.addEntryPoint('entryFromS1_archive', canvas.width - INVENTORY_WIDTH - 70 - 30, canvas.height / 2);
    scene1.addEntryPoint('entryFromS4_archive_return', 100, canvas.height - 80);

    const navHotspot_s1_to_s4 = new Hotspot(
        100, canvas.height - 80, 80, 50,
        function() {
            goToScene('scene4_id', 'entryFromS1_archive');
        },
        "Heavy Door to Archive",
        "Rusty Key",
        function() {
            latestLogMessage = "The Rusty Key unlocks the heavy door to The Archive!";
            navHotspot_s1_to_s4.requiredItemName = null;
            navHotspot_s1_to_s4.exploreText = "An unlocked heavy door to The Archive.";
            if(typeof navHotspot_s1_to_s4.onClickAction === 'function') {
                navHotspot_s1_to_s4.onClickAction();
            }
        },
        function(selectedItem, failureReason) {
             if (failureReason && (failureReason.includes("Too many items") || failureReason.includes("No item selected"))) {
                latestLogMessage = "Select the Rusty Key, click 'Use Item', then click the heavy door.";
            } else if (selectedItem) {
                latestLogMessage = `The ${selectedItem.name} doesn't fit this heavy lock.`;
            } else {
                latestLogMessage = "This heavy door is securely locked.";
            }
        },
        'door',
        null,
        "A heavy, reinforced door. It's securely locked and marked 'Archives - Restricted'."
    );
    scene1.addHotspot(navHotspot_s1_to_s4);

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

    if (lighter) scene2.addBug(lighter);
    const hs_find_lighter = new Hotspot(
        200, 280, 30, 40,
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

    const RETURN_PASSAGE_S2_TO_S3_NAME = "ReturnFireplace_S2_to_S3";
    const hs_fireplace_s2_to_s3 = new Hotspot(
        canvas.width - INVENTORY_WIDTH - 70, 100, 60, 50,
        function() {
            if (this.isEnabled) {
                goToScene('scene3_id', 'entryFromS2_passage');
            } else {
                latestLogMessage = "A section of wall. Nothing remarkable.";
            }
        },
        RETURN_PASSAGE_S2_TO_S3_NAME,
        null, null, null,
        'debugRect',
        null,
        "A plain wall section.",
        false,
        true
    );
    scene2.addHotspot(hs_fireplace_s2_to_s3);

    const navHotspot_s2_to_s1 = new Hotspot(10, canvas.height / 2 - 25, 60, 50, function() { goToScene('scene1_id', 'entryFromS2'); }, "NAV_S2_to_S1", null, null, null, 'door', null);
    scene2.addHotspot(navHotspot_s2_to_s1);

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

    scene4.addEntryPoint('entryFromS3_archive', 10 + (30/2), canvas.height / 2);
    const hs_breach_s3_to_s4 = new Hotspot(
        canvas.width - INVENTORY_WIDTH - 70, canvas.height / 2 + 60, 60, 50,
        function() {
            if (this.isBreached) {
                goToScene('scene4_id', 'entryFromS3_archive');
            } else {
                latestLogMessage = "This wall looks weak. It might be breachable with the right tool.";
            }
        },
        "Weak Wall to Archive",
        [NAME_HAMMER, NAME_CROWBAR, NAME_EXPLOSIVE_DEVICE],
        function() {
            let toolUsed = selectedInventoryItems[0] ? selectedInventoryItems[0].name : "a tool";
            if (toolUsed === NAME_EXPLOSIVE_DEVICE) {
                latestLogMessage = `The ${toolUsed} blasts a hole in the wall! You can now reach The Archive.`;
            } else {
                latestLogMessage = `Using the ${toolUsed}, you manage to break through the wall to The Archive!`;
            }
            this.isBreached = true;
            this.iconType = 'breachedWallOpening';
            this.exploreText = "A gaping hole leads to The Archive. Click to enter.";
            this.requiredItemName = null;

            const scene4Hotspots = gameScenes['scene4_id'] ? gameScenes['scene4_id'].hotspots : [];
            const returnHotspotS4 = scene4Hotspots.find(h => h.name === RETURN_BREACH_S4_TO_S3_NAME);
            if (returnHotspotS4) {
                returnHotspotS4.isEnabled = true;
                returnHotspotS4.iconType = 'fireplaceIcon';
                returnHotspotS4.exploreText = "A surprisingly intact fireplace. It seems to lead back to the Toolbox area (Scene 3).";
            } else {
                console.error("Could not find return hotspot " + RETURN_BREACH_S4_TO_S3_NAME + " in Scene 4 to enable.");
            }
        },
        function(selectedItem, failureReason) {
            if (this.isBreached) {
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
        'crackedWall',
        null,
        "A structurally weak section of the wall. It looks like it could be breached."
    );
    scene3.addHotspot(hs_breach_s3_to_s4);

    const hs_breach_s3_to_s2_passage = new Hotspot(
        10, 100, 60, 50,
        function() {
            if (this.isBreached) {
                goToScene('scene2_id', 'entryFromS3_passage_return');
            } else {
                latestLogMessage = "This wall near the old door connection seems brittle.";
            }
        },
        "Brittle Wall to Utilities",
        [NAME_HAMMER, NAME_CROWBAR, NAME_EXPLOSIVE_DEVICE],
        function() {
            let toolUsed = selectedInventoryItems[0] ? selectedInventoryItems[0].name : "a tool";
            if (toolUsed === NAME_EXPLOSIVE_DEVICE) {
                latestLogMessage = `The ${toolUsed} shatters the brittle wall! You can now reach the Utilities area (Scene 2).`;
            } else {
                latestLogMessage = `With the ${toolUsed}, you break through the brittle wall to the Utilities area (Scene 2)!`;
            }
            this.isBreached = true;
            this.iconType = 'breachedWallOpening';
            this.exploreText = "A jagged opening leads to the Utilities area. Click to enter.";
            this.requiredItemName = null;

            const scene2Hotspots = gameScenes['scene2_id'] ? gameScenes['scene2_id'].hotspots : [];
            const returnHotspotS2 = scene2Hotspots.find(h => h.name === RETURN_PASSAGE_S2_TO_S3_NAME);
            if (returnHotspotS2) {
                returnHotspotS2.isEnabled = true;
                returnHotspotS2.iconType = 'fireplaceIcon';
                returnHotspotS2.exploreText = "A newly revealed fireplace. It seems to lead back to the Toolbox area (Scene 3).";
            } else {
                console.error("Could not find return hotspot " + RETURN_PASSAGE_S2_TO_S3_NAME + " in Scene 2 to enable.");
            }
        },
        function(selectedItem, failureReason) {
            if (this.isBreached) {
                latestLogMessage = "The way is already open."; return;
            }
            if (failureReason && (failureReason.includes("Too many items") || failureReason.includes("No item selected"))) {
                 latestLogMessage = "Select a single tool (Hammer, Crowbar, or Explosive Device), click 'Use Item', then click the wall.";
            } else if (selectedItem) {
                latestLogMessage = `The ${selectedItem.name} isn't strong enough or suitable for this wall.`;
            } else {
                latestLogMessage = "This wall feels brittle, but you need a tool to breach it.";
            }
        },
        'crackedWall',
        null,
        "A section of the wall near the old door frame looks particularly brittle."
    );
    scene3.addHotspot(hs_breach_s3_to_s2_passage);


    const ancientCache = new Hotspot(
        canvas.width - INVENTORY_WIDTH - 100, 100, 80, 60,
        function() {
            latestLogMessage = "This ancient cache seems tightly sealed.";
        },
        "Ancient Cache",
        SHINING_VIOLET_GEM_NAME,
        function() {
            parchmentTitle = "Ancient Cache Opened";
            parchmentContent = "The Shining Violet Gem fits perfectly! The strongbox clicks open... it reveals a message: 'To be continued...'";
            isParchmentVisible = true;

            pendingClueToAdd = new Bug(0, 0, '#E0D6B3', 0, 'Ancient Cache Note', true, true, parchmentTitle, parchmentContent);

            ancientCache.isEnabled = false;
            latestLogMessage = "The Ancient Cache opens!";
        },
        function(selectedItem, failureReason) {
            if (failureReason === "Too many items selected while using" || failureReason === "No item selected while using") {
                 latestLogMessage = "Select the Shining Violet Gem, click 'Use Item', then click the cache.";
            } else if (selectedItem) {
                latestLogMessage = `The ${selectedItem.name} doesn't seem to fit the cache's indentation.`;
            } else {
                latestLogMessage = "The cache has a peculiar gem-shaped indentation. It might require a specific item used on it.";
            }
        },
        'bugStrongbox',
        null,
        "An ancient, heavily sealed cache. It has a vibrant, gem-shaped indentation."
    );
    scene3.addHotspot(ancientCache);

    currentScene = gameScenes['scene1_id'];
    const initialEntryPoint = currentScene.getEntryPoint('initialSpawnPoint');

    const detectiveOnArrivalCallback = (message) => {
        latestLogMessage = message;
    };

    if (!detective) {
        detective = new Detective(
            initialEntryPoint.x,
            initialEntryPoint.y,
            detectiveOnArrivalCallback,
            () => currentInteractionMode
        );
    } else {
        detective.x = initialEntryPoint.x;
        detective.y = initialEntryPoint.y;
        detective.targetX = initialEntryPoint.x;
        detective.targetY = initialEntryPoint.y;
        detective.isMoving = false;
        detective.interactionTargetHotspot = null;
    }
    currentScene.setDetective(detective);

    winnableItemNames.length = 0;
    winnableItemNames.push("Green Bug V1", "Orange Bug O1", "Gray Bug G1",
                          "Red Bug R1", "Green Bug V2",
                          "Red Bug R2", "Gray Bug G2",
                          SHINING_VIOLET_GEM_NAME);
    totalWinnableItems = winnableItemNames.length;

    itemCombinations.push({
        item1Name: VIOLET_FRAGMENT_ALPHA_NAME,
        item2Name: VIOLET_FRAGMENT_BETA_NAME,
        resultItem: { name: SHINING_VIOLET_GEM_NAME, color: "magenta", points: 100 }
    });
    itemCombinations.push({
        item1Name: gasBottle.name,
        item2Name: cottonWick.name,
        resultItem: { name: primedGasBottle.name, color: primedGasBottle.color, points: 0 }
    });
    itemCombinations.push({
        item1Name: primedGasBottle.name,
        item2Name: lighter.name,
        resultItem: { name: explosiveDevice.name, color: explosiveDevice.color, points: 0 }
    });
    lastTime = performance.now();
    gameLoop();
}

function attemptCombination() {
    if (selectedInventoryItems.length !== 2) {
        latestLogMessage = "Select exactly 2 items to combine.";
        return false;
    }

    const item1 = selectedInventoryItems[0];
    const item2 = selectedInventoryItems[1];

    if (!item1 || !item1.name || !item2 || !item2.name) {
        selectedInventoryItems = [];
        return false;
    }

    const item1Name = item1.name;
    const item2Name = item2.name;

    for (const recipe of itemCombinations) {
        const recipeItem1Name = recipe.item1Name || "UNKNOWN_RECIPE_ITEM1_NAME";
        const recipeItem2Name = recipe.item2Name || "UNKNOWN_RECIPE_ITEM2_NAME";

        const match1 = (recipeItem1Name === item1Name && recipeItem2Name === item2Name);
        const match2 = (recipeItem1Name === item2Name && recipeItem2Name === item1Name);

        if (match1 || match2) {
            foundBugsInventory = foundBugsInventory.filter(bug => bug !== item1 && bug !== item2);

            score += recipe.resultItem.points;
            const newItem = new Bug(0, 0, recipe.resultItem.color, recipe.resultItem.points, recipe.resultItem.name);
            newItem.found = true;
            foundBugsInventory.push(newItem);

            updateWinnableItemsCount();
            selectedInventoryItems = [];
            latestLogMessage = `Combined ${item1.name} & ${item2.name} into: ${newItem.name}!`;
            return true;
        }
    }
    latestLogMessage = `Cannot combine ${item1Name} and ${item2Name}.`;
    return false;
}

function findBugAction(bugInstance) {
    if (bugInstance && bugInstance.markAsFound()) {
        score += bugInstance.points;
        if (!foundBugsInventory.includes(bugInstance)) {
            foundBugsInventory.push(bugInstance);
        }
        latestLogMessage = `Found: ${bugInstance.name}!`;
        updateWinnableItemsCount();
    }
}

function updateWinnableItemsCount() {
    winnableItemsInInventoryCount = 0;
    for (const itemInInventory of foundBugsInventory) {
        if (winnableItemNames.includes(itemInInventory.name)) {
            winnableItemsInInventoryCount++;
        }
    }
    if (winnableItemsInInventoryCount === totalWinnableItems) {
        if (!gameWon) {
            gameWon = true;
        }
    }
}

function goToScene(targetSceneId, entryPointName) {
    if (gameScenes[targetSceneId]) {
        latestLogMessage = `Traveling to ${targetSceneId.replace('_id', '')}...`;

        if (currentScene && currentScene.setDetective) {
            currentScene.setDetective(null);
        }

        currentScene = gameScenes[targetSceneId];

        if (detective) {
            const entryPoint = currentScene.getEntryPoint(entryPointName);

            detective.x = entryPoint.x;
            detective.y = entryPoint.y;
            detective.targetX = detective.x;
            detective.targetY = detective.y;
            detective.isMoving = false;

            if (currentScene.setDetective) {
                 currentScene.setDetective(detective);
            }
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
            if (!foundBugsInventory.some(item => item.name === pendingClueToAdd.name)) {
                foundBugsInventory.push(pendingClueToAdd);
                latestLogMessage = `Added '${pendingClueToAdd.name}' to inventory.`;
            }
            pendingClueToAdd = null;
        }
        return;
    }

    if (!currentScene || !detective) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (mouseX >= INVENTORY_X && mouseX <= INVENTORY_X + INVENTORY_WIDTH &&
        mouseY >= INVENTORY_Y && mouseY <= INVENTORY_Y + INVENTORY_HEIGHT) {

        if (mouseX >= INSPECT_BUTTON_X && mouseX <= INSPECT_BUTTON_X + ACTION_BUTTON_WIDTH &&
            mouseY >= INSPECT_BUTTON_Y && mouseY <= INSPECT_BUTTON_Y + ACTION_BUTTON_HEIGHT) {
            if (currentInteractionMode === 'normal' && selectedInventoryItems.length === 1) {
                const itemToInspect = selectedInventoryItems[0];
                pendingClueToAdd = null;

                if (itemToInspect.isReadable && itemToInspect.messageContent) {
                    parchmentTitle = itemToInspect.messageTitle || itemToInspect.name;
                    parchmentContent = itemToInspect.messageContent;
                    isParchmentVisible = true;
                    latestLogMessage = `Inspecting: ${itemToInspect.name}`;
                } else {
                    let inspectionDetails = `Name: ${itemToInspect.name}\nPoints: ${itemToInspect.points}`;
                    if (itemToInspect.description && itemToInspect.description.trim() !== "") {
                        inspectionDetails += `\n\n${itemToInspect.description}`;
                    }
                    if (itemToInspect.combineHint && itemToInspect.combineHint.trim() !== "") {
                        inspectionDetails += `\n\nHint: ${itemToInspect.combineHint}`;
                    }
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
            return;
        }

        if (mouseX >= EXPLORE_BUTTON_X && mouseX <= EXPLORE_BUTTON_X + ACTION_BUTTON_WIDTH &&
            mouseY >= EXPLORE_BUTTON_Y && mouseY <= EXPLORE_BUTTON_Y + ACTION_BUTTON_HEIGHT) {
            if (currentInteractionMode === 'exploring') {
                currentInteractionMode = 'normal';
                latestLogMessage = "Explore mode cancelled.";
            } else if (currentInteractionMode === 'normal') {
                currentInteractionMode = 'exploring';
                latestLogMessage = "Explore mode: Click on an object or area in the scene.";
            }
            return;
        }

        if (mouseX >= USE_BUTTON_X && mouseX <= USE_BUTTON_X + ACTION_BUTTON_WIDTH &&
            mouseY >= USE_BUTTON_Y && mouseY <= USE_BUTTON_Y + ACTION_BUTTON_HEIGHT) {
            if (currentInteractionMode === 'usingItem') {
                currentInteractionMode = 'normal';
                latestLogMessage = "Use cancelled.";
            } else if (currentInteractionMode === 'normal' && selectedInventoryItems.length === 1) {
                currentInteractionMode = 'usingItem';
                latestLogMessage = `Using ${selectedInventoryItems[0].name}. Click a hotspot to use it, or 'Cancel Use'.`;
            } else if (currentInteractionMode === 'normal' && selectedInventoryItems.length !== 1) {
                latestLogMessage = "Select exactly one item to use.";
            }
            return;
        }

        if (mouseX >= COMBINE_BUTTON_X && mouseX <= COMBINE_BUTTON_X + COMBINE_BUTTON_WIDTH &&
            mouseY >= COMBINE_BUTTON_Y && mouseY <= COMBINE_BUTTON_Y + COMBINE_BUTTON_HEIGHT) {
            if (currentInteractionMode === 'normal') {
                attemptCombination();
            } else {
                latestLogMessage = "Cannot combine items while in another mode.";
            }
            return;
        }

        let clickedInventoryItemIndex = -1;
        for (let i = 0; i < foundBugsInventory.length; i++) {
            const itemTopY = INV_ITEM_START_Y + (i * (INV_LINE_HEIGHT + INV_ITEM_PADDING)) - (INV_ITEM_PADDING / 2);
            const itemBottomY = itemTopY + INV_LINE_HEIGHT + INV_ITEM_PADDING;

            const itemClickableXStart = INVENTORY_X + INV_ITEM_PADDING / 2;
            const itemClickableXEnd = INVENTORY_X + INVENTORY_WIDTH - INV_ITEM_PADDING / 2;

            if (mouseY < COMBINE_BUTTON_Y - COMBINE_BUTTON_MARGIN) {
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
            } else {
                selectedInventoryItems.push(clickedBugInInventory);
            }
            return;
        }
        return;
    }

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
            latestLogMessage = `Using ${selectedInventoryItems[0].name} on ${clickedHotspot.name}...`;
            const targetInteractionX = clickedHotspot.x + clickedHotspot.width / 2;
            const targetInteractionY = clickedHotspot.y + clickedHotspot.height / 2;
            detective.moveTo(targetInteractionX, targetInteractionY, clickedHotspot, 'usingItem');
        } else {
            latestLogMessage = "Use cancelled. Clicked on empty ground.";
        }
        currentInteractionMode = 'normal';

    } else if (currentInteractionMode === 'exploring') {
        if (clickedHotspot) {
            latestLogMessage = clickedHotspot.exploreText || `You examine the ${clickedHotspot.name}. Nothing more to note.`;
        } else {
            latestLogMessage = GENERIC_EXPLORE_MESSAGES[Math.floor(Math.random() * GENERIC_EXPLORE_MESSAGES.length)];
        }
        currentInteractionMode = 'normal';

    } else { // currentInteractionMode === 'normal'
        const clickTime = performance.now();
        const timeSinceLastClick = clickTime - lastSceneClickTime;
        let isBoosted = false;

        if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD &&
            Math.abs(mouseX - lastSceneClickX) < CLICK_AREA_TOLERANCE &&
            Math.abs(mouseY - lastSceneClickY) < CLICK_AREA_TOLERANCE) {
            isBoosted = true;
            lastSceneClickTime = 0;
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
        } else {
            detective.moveTo(mouseX, mouseY, null, null, isBoosted);
            latestLogMessage = `${isBoosted ? "Quickly moving" : "Moving"} to point (${mouseX.toFixed(0)}, ${mouseY.toFixed(0)})...`;
        }
    }
});

canvas.addEventListener('mouseleave', function() {
    canvas.style.cursor = 'default';
    cursorCurrentlyOverHotspot = false;
});

canvas.addEventListener('mousemove', function(event) {
    if (!currentScene) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let desiredCursor = 'default';
    let isOverActiveHotspot = false;

    if (currentScene.hotspots) {
        for (let i = currentScene.hotspots.length - 1; i >= 0; i--) {
            const hotspot = currentScene.hotspots[i];
            if (hotspot.isClicked(mouseX, mouseY)) {
                isOverActiveHotspot = true;
                if (hotspot.requiredItemName) {
                    if (currentInteractionMode === 'usingItem' &&
                        selectedInventoryItems.length === 1 &&
                        selectedInventoryItems[0].name === hotspot.requiredItemName) {
                        desiredCursor = 'copy';
                    } else if (Array.isArray(hotspot.requiredItemName) && currentInteractionMode === 'usingItem' && selectedInventoryItems.length === 1 && hotspot.requiredItemName.includes(selectedInventoryItems[0].name) ){
                        desiredCursor = 'copy';
                    }
                    else {
                        desiredCursor = 'help';
                    }
                } else {
                    desiredCursor = 'pointer';
                }
                break;
            }
        }
    }

    if (canvas.style.cursor !== desiredCursor) {
        canvas.style.cursor = desiredCursor;
    }
    cursorCurrentlyOverHotspot = isOverActiveHotspot;
});


// Start the game
initGame();
