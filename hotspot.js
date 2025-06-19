class Hotspot {
    constructor(x, y, width, height,
                onClickAction,
                name = 'Unnamed Hotspot',
                requiredItemName = null,
                onUseItemSuccessAction = null,
                onUseItemFailureAction = null,
                iconType = 'debugRect', // Default to debugRect for existing/unspecified
                associatedBug = null) {
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

        this.iconType = iconType;         // New: e.g., 'bugStrongbox', 'door'
        this.associatedBug = associatedBug; // New: Link to a bug object for status check
    }

    isClicked(mouseX, mouseY) {
        if (!this.isEnabled) return false;
        return mouseX >= this.x && mouseX <= this.x + this.width &&
               mouseY >= this.y && mouseY <= this.y + this.height;
    }

    trigger() { // No selectedItem parameter, uses global selectedInventoryItem
        if (!this.isEnabled) return;

        // Assumes selectedInventoryItem is a global variable from adventure_game.js
        if (this.requiredItemName) {
            // This hotspot requires an item
            if (selectedInventoryItem && selectedInventoryItem.name === this.requiredItemName) {
                // Correct item is selected
                if (typeof this.onUseItemSuccessAction === 'function') {
                    this.onUseItemSuccessAction();
                    // Optional: adventure_game.js logic might deselect selectedInventoryItem here if item is "consumed"
                    return; // Success action executed
                } else {
                    console.log(`Hotspot ${this.name} was used with correct item ${selectedInventoryItem.name}, but no success action defined.`);
                }
            } else {
                // Wrong item or no item selected for a hotspot that requires one
                if (typeof this.onUseItemFailureAction === 'function') {
                    this.onUseItemFailureAction(selectedInventoryItem); // Pass item to failure action
                } else {
                    // Default failure:
                    if (selectedInventoryItem) {
                         console.log(`Using ${selectedInventoryItem.name} on ${this.name} doesn't seem to work.`);
                    } else {
                         console.log(`${this.name} might need a specific item.`);
                    }
                }
                return; // Failure action (or default) executed or message logged
            }
        } else if (typeof this.onClickAction === 'function') {
            // No item required, just a direct interaction hotspot
            this.onClickAction();
        } else {
            console.log(`Hotspot ${this.name} clicked, but has no defined action.`);
        }
    }

    // For debugging purposes
    draw(ctx) {
        if (!this.isEnabled) return;

        ctx.save(); // Save context state

        // Common styles
        ctx.lineWidth = 2;

        if (this.iconType === 'bugStrongbox') {
            const boxColor = '#8B4513'; // SaddleBrown for the box
            const metalColor = '#C0C0C0'; // Silver for fittings
            const darkDetailColor = '#5D4037'; // Darker brown for details

            ctx.fillStyle = boxColor;
            ctx.fillRect(this.x, this.y, this.width, this.height); // Main box

            // Lid outline
            ctx.strokeStyle = darkDetailColor;
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height * 0.3); // Top 30% is lid
            ctx.stroke();

            // Lock plate
            ctx.fillStyle = metalColor;
            ctx.fillRect(this.x + this.width * 0.4, this.y + this.height * 0.35, this.width * 0.2, this.height * 0.2);
            // Keyhole (simple circle)
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.45, 3, 0, Math.PI * 2);
            ctx.fill();

            if (this.associatedBug && this.associatedBug.found) {
                // Draw "Open" state - e.g., lid slightly ajar, or a broken lock
                ctx.strokeStyle = darkDetailColor;
                ctx.lineWidth = 3; // Thicker line for "breach"
                ctx.beginPath();
                ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.25);
                ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.35);
                ctx.stroke(); // A crack or open line

                // Change lock to look open/broken
                ctx.fillStyle = darkDetailColor; // Darker, as if hole
                ctx.beginPath();
                ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.45, 4, 0, Math.PI * 2);
                ctx.fill();

            } else {
                // Closed state is already drawn mostly by default box + lock plate
            }

        } else if (this.iconType === 'door') {
            const doorColor = '#A0522D'; // Sienna - a woody door color
            const frameColor = '#704214'; // Darker brown for frame
            const knobColor = '#FFD700';  // Gold for doorknob

            // Door
            ctx.fillStyle = doorColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = frameColor;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // Doorknob (a circle on one side)
            const knobRadius = Math.min(this.width, this.height) * 0.08;
            ctx.fillStyle = knobColor;
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.8, this.y + this.height * 0.5, knobRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#DAA520'; // Goldenrod for outline
            ctx.stroke();

        } else if (this.iconType === 'debugRect') {
            // Original debug rectangle
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
        // No default drawing if iconType is 'none' or unrecognised and not 'debugRect'

        ctx.restore(); // Restore context state
    }
}

console.log("hotspot.js loaded");
