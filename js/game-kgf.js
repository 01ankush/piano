// KGF Theme Game - Simplified implementation
class KGFGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui = new UIManager();
        
        this.tiles = [];
        this.columns = 4;
        this.columnWidth = 0;
        
        this.score = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.correctTaps = 0;
        this.misses = 0;
        
        // Game timing
        this.gameTime = 0;
        this.lastFrameTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        
        // Tile spawning
        this.spawnedIndex = 0;
        this.FALL_TIME = 1.6; // seconds from spawn to hit line
        this.HIT_LINE_Y = 0;
        this.TILE_HEIGHT = 80;
        
        // Game speed
        this.gameSpeed = 200;
        
        this.setupCanvas();
        this.setupInput();
        loadAudio();
    }

    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.columnWidth = this.canvas.width / this.columns;
            this.HIT_LINE_Y = this.canvas.height - 120;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }

    setupInput() {
        const handleTap = (e, isTouch = false) => {
            if (!this.isRunning || this.isPaused) return;
            
            const rect = this.canvas.getBoundingClientRect();
            let x, y;
            
            if (isTouch) {
                if (e.touches && e.touches.length > 0) {
                    x = e.touches[0].clientX - rect.left;
                    y = e.touches[0].clientY - rect.top;
                } else if (e.changedTouches && e.changedTouches.length > 0) {
                    x = e.changedTouches[0].clientX - rect.left;
                    y = e.changedTouches[0].clientY - rect.top;
                } else {
                    return;
                }
            } else {
                x = e.clientX - rect.left;
                y = e.clientY - rect.top;
            }
            
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            x *= scaleX;
            y *= scaleY;
            
            this.handleTap(x, y);
        };

        this.canvas.addEventListener('click', (e) => {
            e.preventDefault();
            handleTap(e, false);
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleTap(e, true);
        }, { passive: false });
    }

    start() {
        this.reset();
        this.isRunning = true;
        this.isPaused = false;
        this.gameTime = 0;
        this.lastFrameTime = performance.now();
        this.spawnedIndex = 0;
        this.gameLoop();
    }

    reset() {
        this.tiles = [];
        this.score = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.correctTaps = 0;
        this.misses = 0;
        this.gameTime = 0;
        this.spawnedIndex = 0;
        this.ui.updateScore(0);
        this.ui.updateCombo(0);
        this.ui.updateMultiplier(1.0);
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.tiles = [];
    }

    gameOver() {
        this.isRunning = false;
        const totalAttempts = this.correctTaps + this.misses;
        const accuracy = totalAttempts > 0 ? (this.correctTaps / totalAttempts) * 100 : 0;
        this.ui.showGameOver(this.score, this.bestCombo, accuracy);
    }

    spawnTileFromBeat(beat) {
        this.tiles.push({
            lane: beat.lane,
            note: beat.note,
            targetTime: beat.t,
            y: -this.TILE_HEIGHT,
            hit: false,
            missed: false,
        });
    }

    update(deltaTime) {
        if (!this.isRunning || this.isPaused) return;

        this.gameTime += deltaTime;

        // Calculate game speed
        const timeToReachTapZone = this.FALL_TIME;
        const distanceToTravel = this.canvas.height + this.TILE_HEIGHT;
        this.gameSpeed = distanceToTravel / timeToReachTapZone;

        // Spawn upcoming beats
        if (window.KGF_BEATMAP) {
            while (this.spawnedIndex < window.KGF_BEATMAP.length) {
                const beat = window.KGF_BEATMAP[this.spawnedIndex];
                const spawnTime = beat.t - this.FALL_TIME;
                
                if (this.gameTime >= spawnTime) {
                    this.spawnTileFromBeat(beat);
                    this.spawnedIndex++;
                } else {
                    break;
                }
            }
        }

        // Move tiles
        this.tiles.forEach(tile => {
            const timeToHit = tile.targetTime - this.gameTime;
            const progress = 1 - (timeToHit / this.FALL_TIME);
            tile.y = -this.TILE_HEIGHT + progress * (this.HIT_LINE_Y + this.TILE_HEIGHT);
        });

        // Mark missed tiles
        this.tiles.forEach(tile => {
            if (!tile.hit && !tile.missed && this.gameTime - tile.targetTime > 0.16) {
                tile.missed = true;
                this.misses++;
                this.combo = 0;
                this.gameOver();
            }
        });

        // Remove off-screen or hit tiles
        this.tiles = this.tiles.filter(t => 
            t.y < this.canvas.height + this.TILE_HEIGHT && !t.missed && !t.hit
        );

        // Check if song ended
        if (window.KGF_BEATMAP && this.gameTime >= window.KGF_BEATMAP[window.KGF_BEATMAP.length - 1].t + 1) {
            this.gameOver();
            return;
        }

        // Update UI
        this.ui.updateScore(this.score);
        this.ui.updateCombo(this.combo);
        this.ui.updateMultiplier(1.0 + (this.combo * 0.1));
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw columns
        const laneWidth = this.canvas.width / this.columns;
        for (let i = 0; i < this.columns; i++) {
            this.ctx.fillStyle = (i % 2 === 0) ? '#1b1b1b' : '#111';
            this.ctx.fillRect(i * laneWidth, 0, laneWidth, this.canvas.height);
        }

        // Draw hit line
        this.ctx.fillStyle = 'rgba(0, 245, 255, 0.5)';
        this.ctx.fillRect(0, this.HIT_LINE_Y + this.TILE_HEIGHT - 5, this.canvas.width, 5);

        // Draw tiles
        this.tiles.forEach(tile => {
            const x = tile.lane * laneWidth;
            
            if (tile.hit) {
                // Hit tile - green
                this.ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
            } else if (tile.missed) {
                // Missed tile - red
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            } else {
                // Active tile - white/black with glow
                this.ctx.fillStyle = '#000';
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = '#00f5ff';
            }
            
            this.ctx.fillRect(x + 4, tile.y, laneWidth - 8, this.TILE_HEIGHT - 4);
            this.ctx.shadowBlur = 0;
            
            // Draw border
            this.ctx.strokeStyle = tile.hit ? '#00ff88' : '#00f5ff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 4, tile.y, laneWidth - 8, this.TILE_HEIGHT - 4);
        });
    }

    handleTap(x, y) {
        const laneWidth = this.canvas.width / this.columns;
        const lane = Math.floor(x / laneWidth);
        
        if (lane < 0 || lane >= this.columns) return;

        // Find closest hittable tile in this lane near hit line
        let bestTile = null;
        let bestDiff = 999;

        this.tiles.forEach(tile => {
            if (tile.lane !== lane || tile.hit || tile.missed) return;

            const diff = Math.abs(this.gameTime - tile.targetTime);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestTile = tile;
            }
        });

        if (!bestTile) {
            // Tapped empty lane
            this.combo = 0;
            return;
        }

        // Timing judgment
        let judgment = 'miss';
        if (bestDiff <= 0.10) {
            judgment = 'perfect';
        } else if (bestDiff <= 0.18) {
            judgment = 'good';
        } else {
            this.combo = 0;
            bestTile.missed = true;
            this.misses++;
            this.gameOver();
            return;
        }

        // Hit the tile
        bestTile.hit = true;
        playNote(bestTile.note);
        
        // Show timing feedback
        this.showTimingFeedback(judgment, bestTile.lane);

        // Score
        if (judgment === 'perfect') {
            this.score += 100 + this.combo * 2;
            this.combo++;
        } else if (judgment === 'good') {
            this.score += 70 + this.combo;
            this.combo++;
        }
        
        this.bestCombo = Math.max(this.bestCombo, this.combo);
        this.correctTaps++;

        // Remove tile after delay
        setTimeout(() => {
            const index = this.tiles.indexOf(bestTile);
            if (index > -1) {
                this.tiles.splice(index, 1);
            }
        }, 100);
    }

    showTimingFeedback(judgment, lane) {
        const feedback = document.createElement('div');
        feedback.className = `timing-feedback timing-${judgment}`;
        feedback.textContent = judgment.toUpperCase();
        
        const laneWidth = this.canvas.width / this.columns;
        const x = lane * laneWidth + laneWidth / 2;
        const y = this.HIT_LINE_Y;
        
        feedback.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            font-size: 24px;
            font-weight: bold;
            color: ${judgment === 'perfect' ? '#00ff88' : judgment === 'good' ? '#00f5ff' : '#ff0000'};
            text-shadow: 0 0 20px ${judgment === 'perfect' ? 'rgba(0, 255, 136, 0.8)' : judgment === 'good' ? 'rgba(0, 245, 255, 0.8)' : 'rgba(255, 0, 0, 0.8)'};
            pointer-events: none;
            z-index: 1000;
            animation: fadeUp 1s ease-out forwards;
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1000);
    }

    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        if (this.isPaused) {
            requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }
        
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        const cappedDelta = Math.min(deltaTime, 0.1);
        
        this.update(cappedDelta);
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new KGFGame();
});

