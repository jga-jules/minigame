class Detective {
    constructor(x, y, width = 30, height = 50, color = '#8B4513') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;

        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        this.movementSpeed = 150; // Pixels per second, adjust as needed
    }

    moveTo(x, y) {
        // Centering logic for target
        let intendedTargetX = x - this.width / 2;
        let intendedTargetY = y - this.height / 2;

        // Clamping logic (assuming canvas is 800x600, inventory 200px wide)
        const canvasWidth = 800;
        const inventoryWidth = 200;
        const effectiveSceneWidth = canvasWidth - inventoryWidth;
        const canvasHeight = 600;

        if (intendedTargetX + this.width > effectiveSceneWidth) {
            intendedTargetX = effectiveSceneWidth - this.width;
        }
        if (intendedTargetX < 0) {
            intendedTargetX = 0;
        }
        if (intendedTargetY + this.height > canvasHeight) {
            intendedTargetY = canvasHeight - this.height;
        }
        if (intendedTargetY < 0) {
            intendedTargetY = 0;
        }

        this.targetX = intendedTargetX;
        this.targetY = intendedTargetY;
        this.isMoving = true;
    }

    update(deltaTime) {
        if (!this.isMoving) {
            return;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const moveAmount = this.movementSpeed * deltaTime;

        if (distance <= moveAmount || distance < 1) { // Use a small threshold like 1 pixel
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
        } else {
            // Move towards target
            this.x += (dx / distance) * moveAmount;
            this.y += (dy / distance) * moveAmount;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

console.log("detective.js loaded");
