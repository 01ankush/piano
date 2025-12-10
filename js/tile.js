class Tile {
    constructor(x, y, width, height, column, isDark = false) {
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
            // Dark tile - needs to be tapped
            const gradient = ctx.createLinearGradient(x, 0, x + columnWidth, 0);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
            gradient.addColorStop(0.5, 'rgba(20, 20, 20, 0.9)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            
            ctx.fillStyle = gradient;
            ctx.globalAlpha = this.alpha;
            ctx.fillRect(x, this.y, columnWidth, this.height);
            
            // Add glow effect for dark tiles
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(0, 245, 255, 0.5)';
            ctx.strokeStyle = 'rgba(0, 245, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, this.y, columnWidth, this.height);
            ctx.shadowBlur = 0;
        } else {
            // Light tile - should not be tapped
            const gradient = ctx.createLinearGradient(x, 0, x + columnWidth, 0);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.globalAlpha = this.alpha;
            ctx.fillRect(x, this.y, columnWidth, this.height);
            
            // Subtle border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, this.y, columnWidth, this.height);
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

