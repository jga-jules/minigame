class Scene {
    constructor(id, backgroundColor = '#808080') {
        this.id = id;
        this.backgroundColor = backgroundColor;
        this.hotspots = [];
        this.bugs = [];
        this.detective = null;
        this.defaultStartX = 0;
        this.defaultStartY = 0;
        this.backgroundTextLines = []; // For unique text per scene
    }

    addBackgroundText(text, x, y, font = 'bold 48px monospace', color = '#C0C0C0', textAlign = 'left') {
        this.backgroundTextLines.push({ text, x, y, font, color, textAlign });
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

        // Static background code-like text
        ctx.fillStyle = '#C0C0C0'; // Silver or a very light, subtle gray
        ctx.font = 'bold 48px monospace'; // Monospace font for code feel
        ctx.textAlign = 'left';

        ctx.fillText("class BugHunter {", 50, 100);
        ctx.fillText("  public:", 70, 150);
        ctx.fillText("    void findBugs() {", 90, 200);
        ctx.fillText("      // TODO: Check all lines...", 110, 250);
        ctx.fillText("    }", 90, 300);
        ctx.fillText("};", 50, 350);

        ctx.fillText("std::vector<Bug> bugs;", 400, 450);
        ctx.fillText("for(auto& bug : bugs) {", 420, 500);
        ctx.fillText("  fix(bug);", 440, 550);

        // 2. Draw found bugs - This section is now removed/commented out.
        //    Bugs will be drawn in the inventory UI, not directly on the scene.
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
