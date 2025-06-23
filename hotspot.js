class Hotspot {
    constructor(x, y, width, height,
                onClickAction,
                name = 'Unnamed Hotspot',
                requiredItemName = null,
                onUseItemSuccessAction = null,
                onUseItemFailureAction = null,
                iconType = 'debugRect', // Default to debugRect for existing/unspecified
                associatedBug = null,
                exploreText = `This is a ${name || 'hotspot'}. It looks interactive.` // Default explore text
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
    }

    isClicked(mouseX, mouseY) {
        if (!this.isEnabled) return false;
        return mouseX >= this.x && mouseX <= this.x + this.width &&
               mouseY >= this.y && mouseY <= this.y + this.height;
    }

    trigger(setMessageCallback = (msg) => { console.log("Log (from Hotspot):", msg); }, currentInteractionMode = 'normal') {
        if (!this.isEnabled) return;

        // If the hotspot requires an item, first check if player is in 'usingItem' mode.
        if (this.requiredItemName) {
            if (currentInteractionMode !== 'usingItem') {
                setMessageCallback("You need to be in 'Use' mode. Select an item, click 'Use Item', then click the hotspot.");
                return;
            }

            // Proceed with item check only if in 'usingItem' mode
            let itemToUse = null;
            if (selectedInventoryItems && selectedInventoryItems.length === 1) {
                itemToUse = selectedInventoryItems[0];
            } else if (selectedInventoryItems && selectedInventoryItems.length > 1) {
                // This case should ideally be prevented by 'Use' button logic, but as a fallback:
                const message = `Hotspot ${this.name}: 'Use' mode active, but multiple items selected. Select only one.`;
                setMessageCallback(message);
                console.log(message);
                if (typeof this.onUseItemFailureAction === 'function') {
                    // Pass a specific reason if the callback supports it
                    this.onUseItemFailureAction(null, "Too many items selected while using");
                }
                return;
            } else { // No item selected, though in 'usingItem' mode (e.g. item consumed by previous action)
                 const message = `Hotspot ${this.name}: 'Use' mode active, but no item is selected.`;
                setMessageCallback(message);
                console.log(message);
                if (typeof this.onUseItemFailureAction === 'function') {
                     this.onUseItemFailureAction(null, "No item selected while using");
                }
                return;
            }

            // At this point, in 'usingItem' mode and exactly one item is selected.
            if (itemToUse && itemToUse.name === this.requiredItemName) {
                if (typeof this.onUseItemSuccessAction === 'function') {
                    this.onUseItemSuccessAction();
                } else {
                    const message = `${this.name}: Used ${itemToUse.name}, but no specific success action defined.`;
                    setMessageCallback(message);
                    console.log(message);
                }
            } else { // Wrong item selected for use
                if (typeof this.onUseItemFailureAction === 'function') {
                    this.onUseItemFailureAction(itemToUse);
                } else {
                    if (itemToUse) { // Should always be true here if we passed the selection checks
                        setMessageCallback(`Cannot use ${itemToUse.name} on ${this.name}.`);
                    } else { // Should not be reached if logic above is correct
                        setMessageCallback(`${this.name}: An unknown item error occurred during use.`);
                    }
                }
                return;
            }
        } else if (typeof this.onClickAction === 'function') {
            // Hotspot does not require an item, standard click action
            // (Can still be triggered even if in 'usingItem' mode if user clicks a non-item hotspot)
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
        }
        ctx.restore();
    }
}

console.log("hotspot.js loaded");
