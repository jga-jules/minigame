class Hotspot {
    constructor(x, y, width, height, onClickAction, name = 'Unnamed Hotspot', requiredItemName = null, onUseItemSuccessAction = null, onUseItemFailureAction = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.onClickAction = onClickAction; // Action for direct click if no item required / item use fails without specific failure action
        this.name = name;
        this.isEnabled = true;

        this.requiredItemName = requiredItemName;           // Name of the item needed
        this.onUseItemSuccessAction = onUseItemSuccessAction; // Action if correct item is used
        this.onUseItemFailureAction = onUseItemFailureAction; // Action if item is used but it's wrong
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
        if (!this.isEnabled) return; // Don't draw if disabled (optional)
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Red, semi-transparent
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        // Optionally, draw the name
        // ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        // ctx.font = '10px Arial';
        // ctx.fillText(this.name, this.x, this.y - 5);
    }
}

console.log("hotspot.js loaded");
