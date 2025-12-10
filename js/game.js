class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui = new UIManager();
        this.audioManager = new AudioManager();
        this.songManager = new SongManager();
        this.pianoNotes = new PianoNotes();
        
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
        this.songTime = 0; // Time in the song
        this.isRunning = false;
        this.isPaused = false;
        this.lastFrameTime = 0;
        this.songStartTime = 0;
        
        this.tapZoneHeight = 50;
        this.currentSong = null;
        this.lastSpawnedBeatTime = -1;
        
        this.setupCanvas();
        this.setupInput();
        this.audioManager.init();
        this.pianoNotes.init();
        
        // Timing judgment thresholds (in seconds)
        this.timingPerfect = 0.08; // ±80ms
        this.timingGood = 0.15; // ±150ms
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
            targetDarkTile.tapTime = this.songTime;
            
            // Calculate timing judgment
            let timingDiff = 0;
            if (targetDarkTile.beatTime !== null) {
                timingDiff = Math.abs(this.songTime - targetDarkTile.beatTime);
                
                if (timingDiff <= this.timingPerfect) {
                    targetDarkTile.timingJudgment = 'perfect';
                } else if (timingDiff <= this.timingGood) {
                    targetDarkTile.timingJudgment = 'good';
                } else {
                    targetDarkTile.timingJudgment = 'miss';
                }
            } else {
                targetDarkTile.timingJudgment = 'good'; // Default if no beat time
            }
            
            // Play piano note sound
            if (targetDarkTile.sound) {
                this.pianoNotes.playNote(targetDarkTile.sound, 0.4);
            } else {
                this.pianoNotes.playColumnNote(targetDarkTile.column, 0.4);
            }
            
            // Show timing feedback
            this.showTimingFeedback(targetDarkTile.timingJudgment, targetDarkTile.column);
            
            // Score based on timing
            let scoreMultiplier = 1.0;
            if (targetDarkTile.timingJudgment === 'perfect') {
                scoreMultiplier = 1.5;
            } else if (targetDarkTile.timingJudgment === 'good') {
                scoreMultiplier = 1.0;
            }
            
            this.correctTaps++;
            this.combo++;
            this.bestCombo = Math.max(this.bestCombo, this.combo);
            
            // Update multiplier based on combo
            this.multiplier = 1.0 + (this.combo * 0.1);
            this.multiplier = Math.min(this.multiplier, 5.0); // Cap at 5x
            
            // Calculate score
            const baseScore = 10;
            const comboBonus = this.combo * 2;
            const multiplierBonus = this.multiplier * scoreMultiplier;
            const points = Math.floor(baseScore * multiplierBonus + comboBonus);
            this.score += points;
            
            // Remove tile after short delay
            setTimeout(() => {
                const index = this.tiles.indexOf(targetDarkTile);
                if (index > -1) {
                    this.tiles.splice(index, 1);
                }
            }, 100);
        }
    }

    start(songId = null) {
        this.reset();
        
        // Load song if provided, otherwise use default
        if (songId) {
            this.currentSong = this.songManager.loadSong(songId);
        } else {
            // Use first song as default
            const songs = this.songManager.getAllSongs();
            if (songs.length > 0) {
                this.currentSong = this.songManager.loadSong(songs[0].id);
            }
        }
        
        if (this.currentSong) {
            this.songManager.resetSong();
            
            // Don't play background audio - only piano notes on tap
            // Audio loading removed - we only want piano note sounds
        }
        
        this.isRunning = true;
        this.isPaused = false;
        this.gameTime = 0;
        this.songTime = 0;
        this.songStartTime = performance.now();
        this.lastFrameTime = performance.now();
        this.lastSpawnedBeatTime = -1;
        
        this.gameLoop();
    }

    restart() {
        if (this.currentSong) {
            this.start(this.currentSong.id);
        } else {
            this.start();
        }
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

    spawnTile(column, sound = null, beatTime = null) {
        if (column < 0 || column >= this.columns) return;
        
        // Default sound based on column if not provided
        if (!sound) {
            const noteMap = ['C4', 'D4', 'E4', 'F4'];
            sound = noteMap[column];
        }
        
        // Create dark tile (needs to be tapped)
        const tile = new Tile(
            0, // x will be calculated in draw
            -50, // Start above screen
            this.columnWidth,
            80, // Tile height
            column,
            true, // isDark
            sound, // Piano note sound
            beatTime // Expected beat time
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

    // Show timing feedback (Perfect/Good/Miss)
    showTimingFeedback(judgment, column) {
        // Create visual feedback element
        const feedback = document.createElement('div');
        feedback.className = `timing-feedback timing-${judgment}`;
        feedback.textContent = judgment.toUpperCase();
        
        // Position based on column
        const columnWidth = this.canvas.width / this.columns;
        const x = column * columnWidth + columnWidth / 2;
        const y = this.canvas.height - 100;
        
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
        
        // Remove after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1000);
    }

    update(deltaTime) {
        if (!this.isRunning || this.isPaused) return;

        this.gameTime += deltaTime;
        
        // Update song time - use game time (no background audio)
        this.songTime = this.gameTime;
        
        // Calculate speed based on song BPM if available
        if (this.currentSong) {
            // Speed should allow tiles to reach tap zone at the right time
            // Distance from spawn to tap zone / time until beat should hit
            const timeToReachTapZone = 2.0; // seconds for tile to travel
            const distanceToTravel = this.canvas.height + 50; // from top to tap zone
            this.gameSpeed = distanceToTravel / timeToReachTapZone;
        } else {
            // Fallback to dynamic speed
            const speedMultiplier = 1 + (this.gameTime / 60);
            this.gameSpeed = this.baseSpeed * Math.min(speedMultiplier, 3);
        }
        
        // Spawn tiles based on song beat map
        if (this.currentSong) {
            // Calculate how far ahead to spawn tiles (so they reach tap zone when beat plays)
            // Time for tile to travel from top to tap zone
            const timeToReachTapZone = (this.canvas.height + 50) / this.gameSpeed;
            const spawnAheadTime = timeToReachTapZone;
            
            // Target time when beat should hit tap zone
            const targetBeatTime = this.songTime + spawnAheadTime;
            
            // Get all beats that should spawn now (larger window to catch beats)
            const spawnWindowStart = targetBeatTime - 0.5; // Look 0.5s before
            const spawnWindowEnd = targetBeatTime + 0.5;   // Look 0.5s ahead
            
            // Spawn all beats in this window
            let maxSpawns = 20; // Prevent infinite loop
            while (maxSpawns > 0) {
                const nextBeat = this.songManager.getNextBeat(spawnWindowStart);
                if (!nextBeat) break;
                
                // Check if beat is within spawn window
                if (nextBeat.time > spawnWindowEnd) break;
                
                // Ensure column is valid (0-3)
                const column = Math.max(0, Math.min(3, nextBeat.column));
                const sound = nextBeat.sound || null;
                const beatTime = nextBeat.time;
                
                this.spawnTile(column, sound, beatTime);
                maxSpawns--;
            }
            
            // Check if song ended
            if (this.songTime >= this.currentSong.duration) {
                // Song finished - show completion
                this.gameOver();
                return;
            }
        } else {
            // Fallback to old beat map system
            const nextBeat = this.beatMap.getNextBeat(this.gameTime);
            if (nextBeat !== null && nextBeat >= 0) {
                this.spawnTile(nextBeat);
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

