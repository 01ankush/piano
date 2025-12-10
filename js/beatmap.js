class BeatMap {
    constructor(bpm = 120, pattern = []) {
        this.bpm = bpm;
        this.pattern = pattern; // Array of column indices (0-3) or -1 for no tile
        this.beatInterval = 60 / bpm; // Time between beats in seconds
        this.currentBeatIndex = 0;
        this.lastBeatTime = 0;
    }

    // Generate a random pattern for endless mode
    generateRandomPattern(length = 20) {
        const pattern = [];
        for (let i = 0; i < length; i++) {
            // Randomly decide if there's a tile (70% chance)
            if (Math.random() > 0.3) {
                // Random column (0-3)
                pattern.push(Math.floor(Math.random() * 4));
            } else {
                // No tile this beat
                pattern.push(-1);
            }
        }
        return pattern;
    }

    // Generate pattern based on difficulty
    generateDifficultyPattern(gameTime, baseBPM = 120) {
        const pattern = [];
        const beatsToGenerate = 50; // Generate 50 beats ahead
        
        // Adjust BPM based on game time
        let currentBPM = baseBPM;
        if (gameTime > 60) {
            currentBPM = baseBPM * 1.5; // 50% faster after 60 seconds
        } else if (gameTime > 30) {
            currentBPM = baseBPM * 1.25; // 25% faster after 30 seconds
        }
        
        this.bpm = currentBPM;
        this.beatInterval = 60 / currentBPM;
        
        // Generate pattern with increasing complexity
        for (let i = 0; i < beatsToGenerate; i++) {
            const beatIndex = this.currentBeatIndex + i;
            
            // Early game: single tiles
            if (gameTime < 20) {
                if (Math.random() > 0.4) {
                    pattern.push(Math.floor(Math.random() * 4));
                } else {
                    pattern.push(-1);
                }
            }
            // Mid game: more tiles, occasional combos
            else if (gameTime < 60) {
                if (Math.random() > 0.2) {
                    pattern.push(Math.floor(Math.random() * 4));
                    // 20% chance of double tile
                    if (Math.random() < 0.2 && i < beatsToGenerate - 1) {
                        i++;
                        const secondColumn = Math.floor(Math.random() * 4);
                        pattern.push(secondColumn);
                    }
                } else {
                    pattern.push(-1);
                }
            }
            // Late game: fast and complex
            else {
                // 80% chance of tile
                if (Math.random() > 0.2) {
                    pattern.push(Math.floor(Math.random() * 4));
                    // 30% chance of double tile
                    if (Math.random() < 0.3 && i < beatsToGenerate - 1) {
                        i++;
                        const secondColumn = Math.floor(Math.random() * 4);
                        pattern.push(secondColumn);
                    }
                } else {
                    pattern.push(-1);
                }
            }
        }
        
        return pattern;
    }

    // Get next beat column based on current time
    getNextBeat(gameTime) {
        const timeSinceLastBeat = gameTime - this.lastBeatTime;
        
        if (timeSinceLastBeat >= this.beatInterval) {
            this.lastBeatTime = gameTime;
            
            if (this.currentBeatIndex < this.pattern.length) {
                const column = this.pattern[this.currentBeatIndex];
                this.currentBeatIndex++;
                return column;
            } else {
                // Pattern ended, generate new one
                this.pattern = this.generateDifficultyPattern(gameTime);
                this.currentBeatIndex = 0;
                const column = this.pattern[0];
                this.currentBeatIndex++;
                return column;
            }
        }
        
        return null; // No beat yet
    }

    // Reset beat map
    reset() {
        this.currentBeatIndex = 0;
        this.lastBeatTime = 0;
        this.pattern = this.generateRandomPattern(20);
    }

    // Set custom pattern
    setPattern(pattern, bpm = 120) {
        this.pattern = pattern;
        this.bpm = bpm;
        this.beatInterval = 60 / bpm;
        this.currentBeatIndex = 0;
        this.lastBeatTime = 0;
    }
}

