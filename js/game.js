class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui = new UIManager();
        this.audioManager = new AudioManager();
        this.beatMap = new BeatMap();
        
        this.tiles = [];
        this.columns = 4;
        this.columnWidth = 0;
        
        this.score = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.multiplier = 1.0;
        this.taps = 0;
        this.correctTaps = 0;
        this.misses = 0;
        
        this.gameSpeed = 200; // pixels per second
        this.baseSpeed = 200;
        this.gameTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.lastFrameTime = 0;
        
        this.tapZoneHeight = 50;
        
        this.setupCanvas();
        this.setupInput();
        this.audioManager.init();
    }

    setupCanvas() {
        // Set canvas size to match window
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.columnWidth = this.canvas.width / this.columns;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }

    setupInput() {
        // Use both canvas and window for better compatibility
        const handleTapEvent = (e, isTouch = false) => {
            if (!this.isRunning || this.isPaused) {
                return;
            }
            
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
            
            // Scale coordinates if canvas is scaled
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            x *= scaleX;
            y *= scaleY;
            
            this.handleTap(x, y);
        };

        // Mouse input
        this.canvas.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTapEvent(e, false);
        });

        // Touch input
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTapEvent(e, true);
        });

        // Also listen on window for better mobile support
        window.addEventListener('touchstart', (e) => {
            if (this.isRunning && !this.isPaused && e.target === this.canvas) {
                e.preventDefault();
                handleTapEvent(e, true);
            }
        }, { passive: false });

        // Prevent default touch behaviors
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    handleTap(x, y) {
        if (!this.isRunning || this.isPaused) {
            return;
        }
        
        this.taps++;
        
        // Determine which column was tapped
        const tappedColumn = Math.floor(x / this.columnWidth);
        if (tappedColumn < 0 || tappedColumn >= this.columns) {
            return;
        }
        
        // Calculate column boundaries
        const columnLeft = tappedColumn * this.columnWidth;
        const columnRight = columnLeft + this.columnWidth;
        
        // Check if tap is within column bounds
        if (x < columnLeft || x > columnRight) {
            return;
        }
        
        // Find all tiles in the tapped column that the tap hits
        let targetDarkTile = null;
        let targetLightTile = null;
        let closestDarkDistance = Infinity;
        let closestLightDistance = Infinity;
        
        for (const tile of this.tiles) {
            if (tile.column === tappedColumn && !tile.tapped && !tile.missed) {
                const tileLeft = tile.column * this.columnWidth;
                const tileRight = tileLeft + this.columnWidth;
                const tileTop = tile.y;
                const tileBottom = tile.y + tile.height;
                
                // Check if tap is directly on this tile (anywhere on the tile)
                const tapOnTile = x >= tileLeft && x <= tileRight && 
                                 y >= tileTop && y <= tileBottom;
                
                // Also check if tile is in the bottom area (for tiles approaching tap zone)
                const bottomAreaStart = this.canvas.height - 200;
                const tileInBottomArea = tileBottom >= bottomAreaStart && tileTop <= this.canvas.height;
                
                if (tapOnTile || tileInBottomArea) {
                    if (tile.isDark) {
                        // For dark tiles, prioritize direct hits, then closest to bottom
                        const distance = tapOnTile ? 0 : Math.abs(tileBottom - (this.canvas.height - 50));
                        if (distance < closestDarkDistance) {
                            closestDarkDistance = distance;
                            targetDarkTile = tile;
                        }
                    } else {
                        // For light tiles (wrong tap), prioritize direct hits
                        const distance = tapOnTile ? 0 : Math.abs(tileBottom - (this.canvas.height - 50));
                        if (distance < closestLightDistance) {
                            closestLightDistance = distance;
                            targetLightTile = tile;
                        }
                    }
                }
            }
        }
        
        // Handle wrong tap on light tile first (has priority if directly tapped)
        if (targetLightTile && (!targetDarkTile || closestLightDistance < closestDarkDistance)) {
            targetLightTile.missed = true;
            this.misses++;
            this.combo = 0;
            this.multiplier = 1.0;
            this.audioManager.playMissSound();
            this.gameOver();
            return;
        }
        
        // Handle correct tap on dark tile
        if (targetDarkTile) {
            targetDarkTile.tapped = true;
            this.correctTaps++;
            this.combo++;
            this.bestCombo = Math.max(this.bestCombo, this.combo);
            
            // Update multiplier based on combo
            this.multiplier = 1.0 + (this.combo * 0.1);
            this.multiplier = Math.min(this.multiplier, 5.0); // Cap at 5x
            
            // Calculate score
            const baseScore = 10;
            const comboBonus = this.combo * 2;
            const multiplierBonus = this.multiplier;
            const points = Math.floor(baseScore * multiplierBonus + comboBonus);
            this.score += points;
            
            this.audioManager.playTapSound();
            
            // Remove tile after short delay
            setTimeout(() => {
                const index = this.tiles.indexOf(targetDarkTile);
                if (index > -1) {
                    this.tiles.splice(index, 1);
                }
            }, 100);
        }
    }

    start() {
        this.reset();
        this.isRunning = true;
        this.isPaused = false;
        this.gameTime = 0;
        this.lastFrameTime = performance.now();
        this.beatMap.reset();
        this.beatMap.pattern = this.beatMap.generateDifficultyPattern(0);
        this.gameLoop();
    }

    restart() {
        this.start();
    }

    pause() {
        this.isPaused = true;
        this.audioManager.pause();
    }

    resume() {
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        this.audioManager.play();
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.audioManager.stop();
        this.tiles = [];
    }

    reset() {
        this.tiles = [];
        this.score = 0;
        this.combo = 0;
        this.bestCombo = 0;
        this.multiplier = 1.0;
        this.taps = 0;
        this.correctTaps = 0;
        this.misses = 0;
        this.gameSpeed = this.baseSpeed;
        this.gameTime = 0;
        this.ui.updateScore(0);
        this.ui.updateCombo(0);
        this.ui.updateMultiplier(1.0);
    }

    gameOver() {
        this.isRunning = false;
        this.audioManager.stop();
        
        // Calculate accuracy
        const totalAttempts = this.correctTaps + this.misses;
        const accuracy = totalAttempts > 0 ? (this.correctTaps / totalAttempts) * 100 : 0;
        
        // Show game over screen
        this.ui.showGameOver(this.score, this.bestCombo, accuracy);
    }

    spawnTile(column) {
        if (column < 0 || column >= this.columns) return;
        
        // Create dark tile (needs to be tapped)
        const tile = new Tile(
            0, // x will be calculated in draw
            -50, // Start above screen
            this.columnWidth,
            80, // Tile height
            column,
            true // isDark
        );
        
        this.tiles.push(tile);
    }

    spawnLightTile(column) {
        if (column < 0 || column >= this.columns) return;
        
        // Create light tile (should not be tapped)
        const tile = new Tile(
            0,
            -50,
            this.columnWidth,
            80,
            column,
            false // isDark
        );
        
        this.tiles.push(tile);
    }

    update(deltaTime) {
        if (!this.isRunning || this.isPaused) return;

        this.gameTime += deltaTime;
        
        // Increase difficulty over time
        const speedMultiplier = 1 + (this.gameTime / 60); // Gradually increase speed
        this.gameSpeed = this.baseSpeed * Math.min(speedMultiplier, 3); // Cap at 3x speed
        
        // Generate tiles based on beat map
        const nextBeat = this.beatMap.getNextBeat(this.gameTime);
        if (nextBeat !== null) {
            if (nextBeat >= 0) {
                this.spawnTile(nextBeat);
            }
            // Occasionally spawn light tiles as decoys (10% chance)
            if (Math.random() < 0.1) {
                const decoyColumn = Math.floor(Math.random() * this.columns);
                if (decoyColumn !== nextBeat) {
                    this.spawnLightTile(decoyColumn);
                }
            }
        }
        
        // Update all tiles
        for (let i = this.tiles.length - 1; i >= 0; i--) {
            const tile = this.tiles[i];
            tile.update(deltaTime, this.gameSpeed);
            
            // Check if dark tile passed tap zone without being tapped
            if (tile.isDark && !tile.tapped && !tile.missed) {
                if (tile.isOffScreen(this.canvas.height)) {
                    // Dark tile missed
                    this.misses++;
                    this.combo = 0;
                    this.multiplier = 1.0;
                    this.gameOver();
                    return;
                }
            }
            
            // Remove tiles that are off screen
            if (tile.isOffScreen(this.canvas.height + 100)) {
                this.tiles.splice(i, 1);
            }
        }
        
        // Update UI
        this.ui.updateScore(this.score);
        this.ui.updateCombo(this.combo);
        this.ui.updateMultiplier(this.multiplier);
    }

    draw() {
        // Clear canvas with dark background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw column dividers
        this.ctx.strokeStyle = 'rgba(0, 245, 255, 0.2)';
        this.ctx.lineWidth = 2;
        for (let i = 1; i < this.columns; i++) {
            const x = i * this.columnWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw tap zone indicator (larger, more visible)
        const tapZoneY = this.canvas.height - this.tapZoneHeight;
        const gradient = this.ctx.createLinearGradient(0, tapZoneY - 100, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(0, 245, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 245, 255, 0.4)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, tapZoneY - 100, this.canvas.width, this.tapZoneHeight + 100);
        
        // Draw tap zone line (more prominent)
        this.ctx.strokeStyle = 'rgba(0, 245, 255, 0.8)';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, tapZoneY);
        this.ctx.lineTo(this.canvas.width, tapZoneY);
        this.ctx.stroke();
        
        // Draw column numbers at bottom for debugging
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        for (let i = 0; i < this.columns; i++) {
            const x = i * this.columnWidth + this.columnWidth / 2;
            this.ctx.fillText((i + 1).toString(), x, this.canvas.height - 10);
        }
        
        // Draw all tiles
        for (const tile of this.tiles) {
            tile.draw(this.ctx, this.columnWidth, this.canvas.height);
        }
        
        // Draw tile count for debugging
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Tiles: ${this.tiles.length}`, 10, 30);
        
        // Draw combo effect if high combo
        if (this.combo > 10) {
            this.ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        if (this.isPaused) {
            requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }
        
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = currentTime;
        
        // Cap deltaTime to prevent large jumps
        const cappedDelta = Math.min(deltaTime, 0.1);
        
        this.update(cappedDelta);
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

