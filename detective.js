class Detective {
    constructor(x, y, width = 30, height = 50, color = '#8B4513') { // Brown color
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    moveTo(x, y) {
        const canvasWidth = 800; // Hardcoded canvas width
        const inventoryWidth = 200; // Hardcoded inventory width
        const effectiveSceneWidth = canvasWidth - inventoryWidth;
        const canvasHeight = 600; // Hardcoded canvas height

        let targetX = x - this.width / 2;
        let targetY = y - this.height / 2;

        // Clamp X position to stay out of the inventory area
        if (targetX + this.width > effectiveSceneWidth) {
            targetX = effectiveSceneWidth - this.width;
        }
        if (targetX < 0) { // Also clamp to left edge
            targetX = 0;
        }
        // Clamp Y position to stay within canvas height
        if (targetY + this.height > canvasHeight) {
            targetY = canvasHeight - this.height;
        }
        if (targetY < 0) {
            targetY = 0;
        }

        this.x = targetX;
        this.y = targetY;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

console.log("detective.js loaded");
