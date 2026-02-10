const fs = require('fs');
const path = require('path');

class GridManager {
    constructor(size = 20, cooldownMs = 2000, lockTimeMs = 10000) {
        this.grid = new Map();
        this.users = new Map();
        this.size = size;
        this.cooldownMs = cooldownMs;
        this.lockTimeMs = lockTimeMs;

        this.savePath = path.join(__dirname, 'grid_data.json');
        this.saveTimeout = null;
        this.loadState();
    }

    loadState() {
        try {
            if (fs.existsSync(this.savePath)) {
                const data = fs.readFileSync(this.savePath, 'utf8');
                const parsed = JSON.parse(data);
                this.grid = new Map(parsed);
                console.log(`✅ Loaded ${this.grid.size} blocks from disk.`);
            }
        } catch (e) {
            console.error("Failed to load state:", e);
        }
    }

    saveState() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);

        this.saveTimeout = setTimeout(() => {
            try {
                const data = JSON.stringify(Array.from(this.grid.entries()));
                fs.writeFileSync(this.savePath, data);
            } catch (e) {
                console.error("Failed to save state:", e);
            }
        }, 1000);
    }

    addUser(socketId, name, color) {
        this.users.set(socketId, { name, color, lastMove: 0, score: 0 });
    }

    removeUser(socketId) {
        this.users.delete(socketId);
    }

    getUser(socketId) {
        return this.users.get(socketId);
    }

    getGridState() {
        return Array.from(this.grid.entries());
    }

    getLeaderboard() {
        return Array.from(this.users.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    canCapture(socketId, x, y) {
        const user = this.users.get(socketId);
        if (!user) return { allowed: false, error: "User not found" };

        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return { allowed: false, error: "Out of bounds" };
        }

        const now = Date.now();
        const timeSinceLastMove = now - user.lastMove;
        if (timeSinceLastMove < this.cooldownMs) {
            const remaining = ((this.cooldownMs - timeSinceLastMove) / 1000).toFixed(1);
            return { allowed: false, error: `Cooldown! Wait ${remaining}s` };
        }

        const key = `${x},${y}`;
        const block = this.grid.get(key);
        if (block && block.ownerId !== socketId && block.lockedUntil > now) {
            return { allowed: false, error: "Block is Locked!" };
        }

        return { allowed: true };
    }

    captureBlock(socketId, x, y) {
        const check = this.canCapture(socketId, x, y);
        if (!check.allowed) throw new Error(check.error);

        const user = this.users.get(socketId);
        const now = Date.now();

        user.lastMove = now;

        const key = `${x},${y}`;

        const blockData = {
            x,
            y,
            color: user.color,
            ownerId: socketId,
            timestamp: now,
            lockedUntil: now + this.lockTimeMs
        };

        this.grid.set(key, blockData);

        this.calculateScores();
        this.saveState();

        return blockData;
    }

    calculateScores() {
        for (const user of this.users.values()) user.score = 0;

        for (const block of this.grid.values()) {
            const user = this.users.get(block.ownerId);
            if (user) user.score++;
        }
    }
}

module.exports = GridManager;
