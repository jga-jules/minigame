class Detective {
    constructor(x, y, onArrivalCallback, getInteractionModeCallback, width = 30, height = 50, color = '#8B4513') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.onArrivalCallback = onArrivalCallback; // Store the callback for arrival messages
        this.getInteractionModeCallback = getInteractionModeCallback; // Store callback to get current mode

        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        this.movementSpeed = 150;
        this.interactionTargetHotspot = null;
        this.latchedInteractionMode = null; // Initialize property here
    }

    moveTo(x, y, targetHotspot = null, interactionModeForThisMove = null) {
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
        this.interactionTargetHotspot = targetHotspot;

        if (targetHotspot) {
            this.latchedInteractionMode = interactionModeForThisMove;
        } else {
            this.latchedInteractionMode = null; // Clear latched mode if just moving to a point
        }
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

            let arrivalMessage = "Arrived at destination.";
            if (this.interactionTargetHotspot) {
                if (this.interactionTargetHotspot.isEnabled) {
                    // Message for arrival at hotspot before triggering, trigger might set its own message.
                    arrivalMessage = `Arrived at ${this.interactionTargetHotspot.name}.`;
                    if (typeof this.onArrivalCallback === 'function') {
                        this.onArrivalCallback(arrivalMessage);
                    }
                    // The trigger function will need the setMessageCallback
                    // This will be passed from adventure_game.js when creating the detective instance,
                    // and then the detective needs to pass it to the hotspot trigger.
                    // For now, let's assume adventure_game.js's callback handles latestLogMessage.
                    // We'll need to pass a setMessageCallback to trigger.
                    // This part is complex as trigger is called here.
                    // The onArrivalCallback is for the detective's arrival itself,
                    // but we can reuse it as the setMessageCallback for the hotspot.

                    // Prioritize latched mode for this specific interaction, fallback to global current mode
                    const modeForHotspotTrigger = this.latchedInteractionMode ||
                                                 (typeof this.getInteractionModeCallback === 'function' ?
                                                  this.getInteractionModeCallback() : 'normal');

                    if (typeof this.onArrivalCallback === 'function') {
                        this.interactionTargetHotspot.trigger(this.onArrivalCallback, modeForHotspotTrigger);
                    } else {
                        this.interactionTargetHotspot.trigger(undefined, modeForHotspotTrigger);
                    }
                    this.latchedInteractionMode = null; // Clear the latched mode after the trigger
                } else {
                    arrivalMessage = `Arrived at ${this.interactionTargetHotspot.name}, but it's no longer active.`;
                    if (typeof this.onArrivalCallback === 'function') {
                        this.onArrivalCallback(arrivalMessage);
                    }
                }
                this.interactionTargetHotspot = null;
            } else {
                 // Standard arrival message if no hotspot interaction
                 if (typeof this.onArrivalCallback === 'function') {
                    this.onArrivalCallback(arrivalMessage); // "Arrived at destination."
                }
            }
        } else {
            // Move towards target
            this.x += (dx / distance) * moveAmount;
            this.y += (dy / distance) * moveAmount;
        }
    }

    draw(ctx) {
        // Icon colors
        const hatColor = this.color; // Should be #8B4513 SaddleBrown
        const magnifierRimColor = '#5A5A5A';
        const magnifierLensColor = '#E0E0E0';
        const pointerColor = '#000000';

        // Base coordinates for drawing relative to this.x, this.y
        const baseX = this.x;
        const baseY = this.y;

        // Hat (Fedora style) - Approx top 25px of height
        // All hat parts will use hatColor
        ctx.fillStyle = hatColor;
        ctx.strokeStyle = '#000000'; // Optional: thin black outline for hat parts
        ctx.lineWidth = 1;

        // Crown (top part of hat)
        ctx.beginPath();
        ctx.moveTo(baseX + 5, baseY + 20); // Bottom-left of crown
        ctx.lineTo(baseX + 3, baseY + 10); // Slant in
        ctx.quadraticCurveTo(baseX + 15, baseY - 5, baseX + 27, baseY + 10); // Rounded top with pinch
        ctx.lineTo(baseX + 25, baseY + 20); // Bottom-right of crown
        ctx.closePath();
        ctx.fill();
        // ctx.stroke(); // Optional outline

        // Brim (ellipse or wide arc)
        ctx.beginPath();
        // Use ellipse: ctx.ellipse(centerX, centerY, radiusX, radiusY, rotation, startAngle, endAngle);
        // Centered at baseX + 15, y at baseY + 20 (bottom of crown), width 30 (radiusX 15), height 8 (radiusY 4)
        ctx.ellipse(baseX + 15, baseY + 21, 14, 5, 0, 0, 2 * Math.PI);
        ctx.fill();
        // ctx.stroke(); // Optional outline

        // Hatband (optional simple rectangle)
        ctx.fillStyle = '#000000'; // Black hatband
        ctx.fillRect(baseX + 4, baseY + 18, 22, 3);


        // Magnifier - Positioned below hat, slightly to the left
        const magnifierCenterX = baseX + 10;
        const magnifierCenterY = baseY + 35; // y-center of the lens
        const magnifierRadius = 7;

        // Magnifier Lens
        ctx.fillStyle = magnifierLensColor;
        ctx.beginPath();
        ctx.arc(magnifierCenterX, magnifierCenterY, magnifierRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Magnifier Rim
        ctx.strokeStyle = magnifierRimColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(magnifierCenterX, magnifierCenterY, magnifierRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // Magnifier Handle
        ctx.fillStyle = magnifierRimColor; // Use rim color for handle too for consistency
        ctx.beginPath();
        // A small rectangle attached to the bottom-left of the lens rim
        // Start from approx: magnifierCenterX - radius * 0.7, magnifierCenterY + radius * 0.7
        // Angled handle would be better, but for simplicity:
        ctx.fillRect(magnifierCenterX - 2, magnifierCenterY + magnifierRadius -1 , 4, 10); // simple vertical handle extending from bottom


        // Pointer (Arrow) - To the right of magnifier, pointing right
        const arrowTipX = baseX + 28; // Point further right (original was +28)
        const arrowYCenter = baseY + 35; // Align with magnifier center Y

        ctx.fillStyle = pointerColor;
        ctx.beginPath();
        ctx.moveTo(arrowTipX, arrowYCenter); // Tip
        ctx.lineTo(baseX + 22, arrowYCenter - 4); // Top-base (original was +22)
        ctx.lineTo(baseX + 22, arrowYCenter + 4); // Bottom-base (original was +22)
        ctx.closePath();
        ctx.fill();
    }
}

console.log("detective.js loaded");
