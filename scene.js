class Scene {
    constructor(id, backgroundColor = '#808080') {
        this.id = id;
        this.backgroundColor = backgroundColor;
        this.backgroundTextLines = [];
        this.hotspots = [];
        this.bugs = [];
        this.detective = null;
        this.entryPoints = {}; // New: To store named {x, y} entry coordinates
        this.defaultEntryPoint = { x: 100, y: 100 }; // Example default
    }

    addBackgroundText(text, x, y, font = 'bold 48px monospace', color = '#C0C0C0', textAlign = 'left') {
        this.backgroundTextLines.push({ text, x, y, font, color, textAlign });
    }

    addEntryPoint(name, x, y) {
        this.entryPoints[name] = { x: x, y: y };
        console.log(`Entry point '${name}' added to scene '${this.id}' at (${x},${y})`);
    }

    getEntryPoint(name) {
        if (this.entryPoints[name]) {
            return this.entryPoints[name];
        } else {
            console.warn(`Entry point '${name}' not found in scene '${this.id}'. Using default entry point.`);
            return this.defaultEntryPoint;
        }
    }

    addHotspot(hotspot) {
        this.hotspots.push(hotspot);
    }

    addBug(bug) {
        this.bugs.push(bug);
    }

    setDetective(detective) {
        this.detective = detective;
    }

    draw(ctx) {
        // 1. Draw background color
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 2. Draw scene-specific background text
        this.backgroundTextLines.forEach(line => {
            ctx.fillStyle = line.color;
            ctx.font = line.font;
            ctx.textAlign = line.textAlign;
            ctx.fillText(line.text, line.x, line.y);
        });

        // 3. Draw found bugs (should still be commented out or removed from here)
        /*
        this.bugs.forEach(bug => {
            // The bug.draw method itself checks if it's found
            bug.draw(ctx);
        });
        */

        // 3. Draw detective (for later)
        if (this.detective) {
            this.detective.draw(ctx); // Call detective's draw method
        }

        // 4. Draw hotspots (for debugging, for later)
        this.hotspots.forEach(hotspot => {
            hotspot.draw(ctx); // Call hotspot's draw method
        });
    }
}

console.log("scene.js loaded");
