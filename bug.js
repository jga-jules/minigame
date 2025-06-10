class Bug {
    constructor(x, y, color = 'red', points = 10, name = 'Unnamed Bug') {
        this.x = x; // Position where it appears when found
        this.y = y;
        this.width = 20; // Standard size for drawing shapes
        this.height = 20;
        this.color = color;
        this.points = points;
        this.name = name;
        this.found = false;
    }

    markAsFound() {
        if (this.found) return false; // Already found, do nothing, return false

        this.found = true;
        console.log(`${this.name} (${this.color}) has been found! Points: ${this.points}`);
        return true; // Indicate that the bug was successfully marked as found now
    }

    draw(ctx) {
        if (!this.found) return;

        ctx.fillStyle = this.color;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Using shapes from previous platformer theme
        if (this.color === 'green') { // Circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.color === 'orange') { // Square
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.color === 'gray') { // Diamond
            ctx.beginPath();
            ctx.moveTo(centerX, this.y);
            ctx.lineTo(this.x + this.width, centerY);
            ctx.lineTo(centerX, this.y + this.height);
            ctx.lineTo(this.x, centerY);
            ctx.closePath();
            ctx.fill();
        } else if (this.color === 'red') { // Triangle
            ctx.beginPath();
            ctx.moveTo(centerX, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        } else { // Default: Square if color not recognized for a shape
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

console.log("bug.js loaded");
