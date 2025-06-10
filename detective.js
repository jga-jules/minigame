class Detective {
    constructor(x, y, width = 30, height = 50, color = '#8B4513') { // Brown color
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    moveTo(x, y) {
        // Center the detective on the click by adjusting for its width/height
        this.x = x - this.width / 2;
        this.y = y - this.height / 2;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

console.log("detective.js loaded");
