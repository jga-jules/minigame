class Hotspot {
    constructor(x, y, width, height, onClickAction, name = 'Unnamed Hotspot') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.onClickAction = onClickAction; // This should be a function
        this.name = name;
        this.isEnabled = true; // Hotspots can be enabled/disabled
    }

    isClicked(mouseX, mouseY) {
        if (!this.isEnabled) return false;
        return mouseX >= this.x && mouseX <= this.x + this.width &&
               mouseY >= this.y && mouseY <= this.y + this.height;
    }

    trigger() {
        if (this.isEnabled && typeof this.onClickAction === 'function') {
            this.onClickAction();
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
