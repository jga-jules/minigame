class Hotspot {
    constructor(x, y, width, height,
                onClickAction,
                name = 'Unnamed Hotspot',
                requiredItemName = null,
                onUseItemSuccessAction = null,
                onUseItemFailureAction = null,
                iconType = 'debugRect', // Default to debugRect for existing/unspecified
                associatedBug = null,
                exploreText = `This is a ${name || 'hotspot'}. It looks interactive.`, // Default explore text
                isBreached = false // New property for breachable walls
                ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.onClickAction = onClickAction;
        this.name = name;
        this.isEnabled = true;

        this.requiredItemName = requiredItemName;
        this.onUseItemSuccessAction = onUseItemSuccessAction;
        this.onUseItemFailureAction = onUseItemFailureAction;

        this.iconType = iconType;
        this.associatedBug = associatedBug;
        this.exploreText = exploreText; // Store the explore text
        this.isBreached = isBreached; // Initialize isBreached status
    }

    isClicked(mouseX, mouseY) {
        if (!this.isEnabled) return false;
        return mouseX >= this.x && mouseX <= this.x + this.width &&
               mouseY >= this.y && mouseY <= this.y + this.height;
    }

    trigger(setMessageCallback = (msg) => { console.log("Log (from Hotspot default callback):", msg); }, currentInteractionMode = 'normal') {
        // Diagnostic log at the very beginning
        console.log(`Hotspot.trigger: '${this.name}' | Mode: '${currentInteractionMode}' | Requires: '${this.requiredItemName || "N/A"}' | Selected: '${selectedInventoryItems.map(i=>i.name).join(', ') || "None"}' | Enabled: ${this.isEnabled}`);

        if (!this.isEnabled) return;

        if (this.requiredItemName) {
            // Specific log for Ancient Cache before detailed checks
            if (this.name === "Ancient Cache") {
                console.log(`Ancient Cache Check: Required: '${this.requiredItemName}' | Current Mode: '${currentInteractionMode}' | Selected Item for Use: ${(currentInteractionMode === 'usingItem' && selectedInventoryItems.length === 1 ? selectedInventoryItems[0].name : "Not in use mode or wrong selection count")}`);
            }

            if (currentInteractionMode !== 'usingItem') {
                setMessageCallback("You need to be in 'Use' mode. Select an item, then 'Use Item', then click the hotspot.");
                return;
            }

            let itemToUse = null;
            if (selectedInventoryItems && selectedInventoryItems.length === 1) {
                itemToUse = selectedInventoryItems[0];
            } else {
                // Handles both multiple items selected or no items selected while in 'useItem' mode.
                const Rreason = selectedInventoryItems.length > 1 ? "multiple items selected" : "no item selected";
                const message = `Hotspot '${this.name}': 'Use' mode active, but ${Rreason}. Select only one item to use.`;
                setMessageCallback(message);
                console.log(message);
                if (typeof this.onUseItemFailureAction === 'function') {
                    this.onUseItemFailureAction(null, selectedInventoryItems.length > 1 ? "Too many items selected while using" : "No item selected while using");
                }
                return;
            }

            // Now itemToUse is guaranteed to be the single selected item.
            let itemIsCorrect = false;
            if (Array.isArray(this.requiredItemName)) {
                // If requiredItemName is an array, check if itemToUse.name is in the array
                if (this.requiredItemName.includes(itemToUse.name)) {
                    itemIsCorrect = true;
                }
            } else {
                // If requiredItemName is a single string, compare directly
                if (itemToUse.name === this.requiredItemName) {
                    itemIsCorrect = true;
                }
            }

            if (itemIsCorrect) {
                if (typeof this.onUseItemSuccessAction === 'function') {
                    this.onUseItemSuccessAction(); // Pass itemToUse if needed by action
                } else {
                    const message = `${this.name}: Used ${itemToUse.name} successfully, but no specific success action defined.`;
                    setMessageCallback(message);
                    console.log(message);
                }
            } else { // Wrong item selected for use
                if (typeof this.onUseItemFailureAction === 'function') {
                    this.onUseItemFailureAction(itemToUse); // Pass itemToUse for context
                } else {
                     setMessageCallback(`Cannot use ${itemToUse.name} on ${this.name}. It's not the right item.`);
                }
            }
        } else if (typeof this.onClickAction === 'function') {
            this.onClickAction();
        } else {
            const message = `${this.name}: Clicked, but has no defined action.`;
            setMessageCallback(message);
            console.log(message);
        }
    }

    draw(ctx) {
        if (!this.isEnabled) return;

        // If iconType is 'debugRect', draw it using the full hotspot area and return.
        if (this.iconType === 'debugRect') {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.restore();
            return;
        }

        const margin = 3;
        const iconX = this.x + margin;
        const iconY = this.y + margin;
        const iconWidth = this.width - 2 * margin;
        const iconHeight = this.height - 2 * margin;

        if (iconWidth <= 0 || iconHeight <= 0) return;

        ctx.save();
        ctx.lineWidth = 2; // Default lineWidth for icons

        if (this.iconType === 'bugStrongbox') {
            const boxColor = '#8B4513';
            const metalColor = '#C0C0C0';
            const darkDetailColor = '#5D4037';

            ctx.fillStyle = boxColor;
            ctx.fillRect(iconX, iconY, iconWidth, iconHeight);

            const lidHeight = iconHeight * 0.3;
            ctx.strokeStyle = darkDetailColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.rect(iconX, iconY, iconWidth, lidHeight);
            ctx.stroke();

            ctx.fillStyle = metalColor;
            ctx.fillRect(iconX + iconWidth * 0.4, iconY + iconHeight * 0.35, iconWidth * 0.2, iconHeight * 0.2); // Lock plate

            const keyholeX = iconX + iconWidth * 0.5;
            const keyholeY = iconY + iconHeight * 0.45;

            if (this.associatedBug && this.associatedBug.found) {
                ctx.fillStyle = '#3A2F2F';
                const interiorMargin = iconWidth * 0.1;
                const interiorVisibleHeight = iconHeight * 0.6;
                ctx.fillRect(
                    iconX + interiorMargin / 2,
                    iconY + lidHeight * 0.5,
                    iconWidth - interiorMargin,
                    interiorVisibleHeight
                );

                ctx.fillStyle = boxColor;
                ctx.strokeStyle = darkDetailColor;
                ctx.lineWidth = 2;

                const lidOpenAngleOffsetY = -lidHeight * 0.7;
                const lidDepthPerspective = iconWidth * 0.1;

                ctx.beginPath();
                ctx.moveTo(iconX + lidDepthPerspective / 2, iconY + lidHeight * 0.2);
                ctx.lineTo(iconX + iconWidth - lidDepthPerspective / 2, iconY + lidHeight * 0.2);
                ctx.lineTo(iconX + iconWidth, iconY + lidOpenAngleOffsetY + lidHeight * 0.3);
                ctx.lineTo(iconX, iconY + lidOpenAngleOffsetY + lidHeight * 0.3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#444444';
                ctx.fillRect(iconX + iconWidth * 0.4, iconY + iconHeight * 0.35, iconWidth * 0.2, iconHeight * 0.2);
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.moveTo(keyholeX - 3, keyholeY - 2);
                ctx.lineTo(keyholeX + 2, keyholeY - 3);
                ctx.lineTo(keyholeX, keyholeY + 3);
                ctx.lineTo(keyholeX + 3, keyholeY + 2);
                ctx.lineTo(keyholeX - 2, keyholeY + 3);
                ctx.closePath();
                ctx.fill();

            } else {
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(keyholeX, keyholeY, 3, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (this.iconType === 'door') {
            const doorColor = '#A0522D';
            const frameColor = '#704214';
            const knobColor = '#FFD700';

            ctx.fillStyle = doorColor;
            ctx.fillRect(iconX, iconY, iconWidth, iconHeight);
            ctx.strokeStyle = frameColor;
            ctx.lineWidth = 2; // Ensure consistent line width for door outline
            ctx.strokeRect(iconX, iconY, iconWidth, iconHeight);

            const knobRadius = Math.min(iconWidth, iconHeight) * 0.08;
            ctx.fillStyle = knobColor;
            ctx.beginPath();
            ctx.arc(iconX + iconWidth * 0.8, iconY + iconHeight * 0.5, knobRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#DAA520';
            ctx.lineWidth = 1; // Thinner line for knob outline
            ctx.stroke();
        } else if (this.iconType === 'key') {
            // Draw a simple key shape
            // Colors
            const keyColor = this.associatedBug && this.associatedBug.color ? this.associatedBug.color : '#A0A0A0'; // Use bug color or default gray
            const keyOutlineColor = '#333333'; // Dark outline

            ctx.fillStyle = keyColor;
            ctx.strokeStyle = keyOutlineColor;
            ctx.lineWidth = 1; // Thin outline for the key

            // Proportions based on iconWidth and iconHeight
            const headRadius = Math.min(iconWidth, iconHeight) * 0.25;
            const headCenterX = iconX + headRadius;
            const headCenterY = iconY + headRadius;

            const shaftX = iconX + headRadius * 1.8; // Start shaft slightly overlapping/touching head
            const shaftY = iconY + headRadius - (iconHeight * 0.1); // Center shaft vertically with head
            const shaftWidth = iconWidth * 0.5;
            const shaftHeight = iconHeight * 0.2;

            const teethWidth = iconWidth * 0.15;
            const teethHeight = iconHeight * 0.1;
            const tooth1X = shaftX + shaftWidth * 0.3;
            const tooth1Y = shaftY + shaftHeight;
            const tooth2X = shaftX + shaftWidth * 0.7;
            const tooth2Y = shaftY + shaftHeight;

            // Draw Key Head (Circle)
            ctx.beginPath();
            ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw Key Shaft (Rectangle)
            ctx.fillRect(shaftX, shaftY, shaftWidth, shaftHeight);
            ctx.strokeRect(shaftX, shaftY, shaftWidth, shaftHeight);

            // Draw Key Teeth (Small Rectangles)
            ctx.fillRect(tooth1X, tooth1Y, teethWidth, teethHeight);
            ctx.strokeRect(tooth1X, tooth1Y, teethWidth, teethHeight);
            ctx.fillRect(tooth2X, tooth2Y, teethWidth, teethHeight);
            ctx.strokeRect(tooth2X, tooth2Y, teethWidth, teethHeight);

        } else if (this.iconType === 'crackedWall') {
            // Wall background
            ctx.fillStyle = '#B0B0B0'; // Light gray for wall
            ctx.fillRect(iconX, iconY, iconWidth, iconHeight);
            // Cracks
            ctx.strokeStyle = '#555555'; // Dark gray for cracks
            ctx.lineWidth = Math.max(1, Math.min(iconWidth, iconHeight) * 0.05); // Responsive crack size
            ctx.beginPath();
            ctx.moveTo(iconX + iconWidth * 0.2, iconY + iconHeight * 0.2);
            ctx.lineTo(iconX + iconWidth * 0.8, iconY + iconHeight * 0.8);
            ctx.moveTo(iconX + iconWidth * 0.8, iconY + iconHeight * 0.2);
            ctx.lineTo(iconX + iconWidth * 0.5, iconY + iconHeight * 0.5);
            ctx.lineTo(iconX + iconWidth * 0.6, iconY + iconHeight * 0.9);
            ctx.stroke();
        } else if (this.iconType === 'breachedWallOpening') {
            // Outer wall remnants
            ctx.fillStyle = '#B0B0B0';
            ctx.fillRect(iconX, iconY, iconWidth, iconHeight * 0.2); // Top remnant
            ctx.fillRect(iconX, iconY + iconHeight * 0.8, iconWidth, iconHeight * 0.2); // Bottom remnant
            ctx.fillRect(iconX, iconY + iconHeight * 0.2, iconWidth * 0.2, iconHeight * 0.6); // Left remnant
            ctx.fillRect(iconX + iconWidth * 0.8, iconY + iconHeight * 0.2, iconWidth * 0.2, iconHeight * 0.6); // Right remnant
            // Dark opening
            ctx.fillStyle = '#333333'; // Dark gray for opening
            ctx.fillRect(iconX + iconWidth * 0.2, iconY + iconHeight * 0.2, iconWidth * 0.6, iconHeight * 0.6);
            // Jagged edges for opening (subtle)
            ctx.strokeStyle = '#555555';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(iconX + iconWidth * 0.2, iconY + iconHeight * 0.2);
            ctx.lineTo(iconX + iconWidth * 0.15, iconY + iconHeight * 0.25);
            ctx.lineTo(iconX + iconWidth * 0.2, iconY + iconHeight * 0.3);
            // ... more jagged lines around the opening border
            ctx.stroke();
        } else if (this.iconType === 'hammerIcon') {
            ctx.fillStyle = 'darkgray'; // Handle
            ctx.fillRect(iconX + iconWidth * 0.4, iconY + iconHeight * 0.3, iconWidth * 0.2, iconHeight * 0.7);
            ctx.fillStyle = 'gray'; // Head
            ctx.fillRect(iconX + iconWidth * 0.2, iconY, iconWidth * 0.6, iconHeight * 0.4);
            ctx.strokeStyle = 'black';
            ctx.strokeRect(iconX + iconWidth * 0.4, iconY + iconHeight * 0.3, iconWidth * 0.2, iconHeight * 0.7);
            ctx.strokeRect(iconX + iconWidth * 0.2, iconY, iconWidth * 0.6, iconHeight * 0.4);
        } else if (this.iconType === 'crowbarIcon') {
            ctx.fillStyle = 'dimgray';
            ctx.fillRect(iconX + iconWidth * 0.45, iconY, iconWidth * 0.1, iconHeight * 0.9); // Shaft
            ctx.beginPath(); // Hook
            ctx.moveTo(iconX + iconWidth * 0.5, iconY + iconHeight * 0.9);
            ctx.lineTo(iconX + iconWidth * 0.3, iconY + iconHeight);
            ctx.strokeStyle = 'dimgray';
            ctx.lineWidth = Math.max(2, iconWidth * 0.1);
            ctx.stroke();
        } else if (this.iconType === 'gasBottleIcon') {
            ctx.fillStyle = 'firebrick';
            ctx.fillRect(iconX + iconWidth * 0.2, iconY + iconHeight * 0.2, iconWidth * 0.6, iconHeight * 0.8); // Body
            ctx.fillStyle = 'gray';
            ctx.fillRect(iconX + iconWidth * 0.4, iconY, iconWidth * 0.2, iconHeight * 0.2); // Nozzle
            ctx.strokeStyle = 'black';
            ctx.strokeRect(iconX + iconWidth * 0.2, iconY + iconHeight * 0.2, iconWidth * 0.6, iconHeight * 0.8);
        } else if (this.iconType === 'wickIcon') {
            ctx.strokeStyle = 'ivory';
            ctx.lineWidth = Math.max(2, iconHeight * 0.15);
            ctx.beginPath();
            ctx.moveTo(iconX + iconWidth * 0.2, iconY + iconHeight * 0.8);
            ctx.bezierCurveTo(
                iconX + iconWidth * 0.4, iconY + iconHeight * 0.2, // control point 1
                iconX + iconWidth * 0.6, iconY + iconHeight * 1.2, // control point 2 (exaggerated for curve)
                iconX + iconWidth * 0.8, iconY + iconHeight * 0.7  // end point
            );
            ctx.stroke();
        } else if (this.iconType === 'lighterIcon') {
            ctx.fillStyle = 'orangered'; // Lighter body
            ctx.fillRect(iconX + iconWidth * 0.2, iconY, iconWidth * 0.6, iconHeight);
            ctx.fillStyle = 'silver'; // Flint wheel part
            ctx.fillRect(iconX + iconWidth * 0.3, iconY, iconWidth * 0.4, iconHeight * 0.2);
            ctx.strokeStyle = 'black';
            ctx.strokeRect(iconX + iconWidth * 0.2, iconY, iconWidth * 0.6, iconHeight);
        }
        ctx.restore();
    }
}

console.log("hotspot.js loaded");
