class Tile {
    constructor(x, y, width, height, column, isDark = false, sound = null, beatTime = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.column = column;
        this.isDark = isDark;
        this.tapped = false;
        this.missed = false;
        this.speed = 0;
        this.alpha = 1;
        this.sound = sound; // Piano note to play (e.g., 'C4', 'E4')
        this.beatTime = beatTime; // Expected time when this beat should be hit
        this.tapTime = null; // Actual time when user tapped
        this.timingJudgment = null; // 'perfect', 'good', 'miss'
    }

    update(deltaTime, gameSpeed) {
        // Update position based on speed
        this.speed = gameSpeed;
        this.y += this.speed * deltaTime;
        
        // Fade out if missed
        if (this.missed) {
            this.alpha -= 0.02;
            if (this.alpha <= 0) {
                this.alpha = 0;
            }
        }
    }

    draw(ctx, columnWidth, canvasHeight) {
        // Only draw if visible and not faded out
        if (this.alpha <= 0) return;
        
        // Calculate actual x position based on column
        const x = this.column * columnWidth;
        
        // Draw tile
        if (this.isDark) {
            // Dark tile - needs to be tapped (SOLID BLACK with bright cyan glow)
            // Fill with solid black
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = this.alpha;
            ctx.fillRect(x, this.y, columnWidth, this.height);
            
            // Add bright cyan glow border
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00f5ff';
            ctx.strokeStyle = '#00f5ff';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, this.y, columnWidth, this.height);
            ctx.shadowBlur = 0;
            
            // Add inner glow effect
            const innerGradient = ctx.createLinearGradient(x, this.y, x, this.y + this.height);
            innerGradient.addColorStop(0, 'rgba(0, 245, 255, 0.2)');
            innerGradient.addColorStop(0.5, 'rgba(0, 245, 255, 0.05)');
            innerGradient.addColorStop(1, 'rgba(0, 245, 255, 0.2)');
            ctx.fillStyle = innerGradient;
            ctx.fillRect(x + 2, this.y + 2, columnWidth - 4, this.height - 4);
        } else {
            // Light tile - should NOT be tapped (GRAY with red/orange warning)
            // Fill with dark gray (clearly visible but different from dark tiles)
            const grayGradient = ctx.createLinearGradient(x, this.y, x, this.y + this.height);
            grayGradient.addColorStop(0, 'rgba(60, 60, 60, 0.8)');
            grayGradient.addColorStop(0.5, 'rgba(40, 40, 40, 0.8)');
            grayGradient.addColorStop(1, 'rgba(60, 60, 60, 0.8)');
            
            ctx.fillStyle = grayGradient;
            ctx.globalAlpha = this.alpha;
            ctx.fillRect(x, this.y, columnWidth, this.height);
            
            // Add red/orange warning border to distinguish from dark tiles
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, this.y, columnWidth, this.height);
            
            // Add diagonal warning lines pattern
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            // Diagonal lines from top-left to bottom-right
            for (let i = 0; i < 3; i++) {
                const offset = (i - 1) * (columnWidth / 3);
                ctx.moveTo(x + offset, this.y);
                ctx.lineTo(x + offset + columnWidth, this.y + this.height);
            }
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        
        // Draw tap effect if tapped
        if (this.tapped) {
            ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
            ctx.fillRect(x, this.y, columnWidth, this.height);
            
            // Success particle effect
            ctx.fillStyle = '#00ff88';
            ctx.beginPath();
            ctx.arc(x + columnWidth / 2, this.y + this.height / 2, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw miss effect if missed
        if (this.missed && !this.isDark) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(x, this.y, columnWidth, this.height);
        }
    }

    isOffScreen(canvasHeight) {
        return this.y > canvasHeight;
    }

    isInTapZone(canvasHeight, tapZoneHeight = 50) {
        const tapZoneY = canvasHeight - tapZoneHeight;
        return this.y + this.height >= tapZoneY && this.y <= canvasHeight;
    }

    checkTap(tapX, tapY, columnWidth, canvasHeight) {
        const x = this.column * columnWidth;
        const tapZoneY = canvasHeight - 50;
        const tapZoneBuffer = 30; // More forgiving buffer
        
        // Check if tap is within tile's column (x bounds)
        if (tapX >= x && tapX <= x + columnWidth) {
            // Check if tile is in or near the tap zone (bottom area of screen)
            const tileBottom = this.y + this.height;
            const tileTop = this.y;
            
            // Tile is tappable if it's in the bottom portion of the screen
            if (tileBottom >= tapZoneY - tapZoneBuffer && tileTop <= canvasHeight + tapZoneBuffer) {
                // Tap is valid if it's anywhere in the bottom area of the screen
                if (tapY >= tapZoneY - tapZoneBuffer && tapY <= canvasHeight + tapZoneBuffer) {
                    return true;
                }
            }
        }
        return false;
    }
}

