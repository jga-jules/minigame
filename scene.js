class Scene {
    constructor(backgroundColor = '#808080') { // Default to a medium gray for the scene
        this.backgroundColor = backgroundColor;
        this.hotspots = []; // Will be used later
        this.bugs = [];     // Will be used later
        this.detective = null; // Will be set by adventure_game.js
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
