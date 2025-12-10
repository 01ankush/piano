class UIManager {
    constructor() {
        this.screens = {
            menu: document.getElementById('menu-screen'),
            game: document.getElementById('game-screen'),
            gameover: document.getElementById('gameover-screen'),
            leaderboard: document.getElementById('leaderboard-screen'),
            pause: document.getElementById('pause-screen')
        };
        
        this.currentScreen = 'menu';
        this.initEventListeners();
        this.loadHighScore();
    }

    initEventListeners() {
        // Menu screen buttons
        document.getElementById('start-btn').addEventListener('click', () => {
            this.showScreen('game');
            if (window.game) {
                window.game.start();
            }
        });

        document.getElementById('leaderboard-btn').addEventListener('click', () => {
            this.showScreen('leaderboard');
            this.updateLeaderboard();
        });

        // Game screen buttons
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.showScreen('pause');
            if (window.game) {
                window.game.pause();
            }
        });

        // Pause screen buttons
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.showScreen('game');
            if (window.game) {
                window.game.resume();
            }
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.showScreen('menu');
            if (window.game) {
                window.game.stop();
            }
        });

        // Game over screen buttons
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.showScreen('game');
            if (window.game) {
                window.game.restart();
            }
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.showScreen('menu');
            if (window.game) {
                window.game.stop();
            }
        });

        // Leaderboard screen buttons
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showScreen('menu');
        });
    }

    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        // Show requested screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
    }

    updateScore(score) {
        document.getElementById('current-score').textContent = score.toLocaleString();
    }

    updateCombo(combo) {
        document.getElementById('combo-count').textContent = combo;
        
        // Add visual effect for high combos
        const comboElement = document.getElementById('combo-count');
        if (combo > 10) {
            comboElement.style.color = '#00ff88';
            comboElement.style.textShadow = '0 0 20px rgba(0, 255, 136, 0.8)';
        } else if (combo > 5) {
            comboElement.style.color = '#00f5ff';
            comboElement.style.textShadow = '0 0 15px rgba(0, 245, 255, 0.6)';
        } else {
            comboElement.style.color = '#fff';
            comboElement.style.textShadow = '0 0 10px rgba(0, 245, 255, 0.5)';
        }
    }

    updateMultiplier(multiplier) {
        document.getElementById('multiplier').textContent = multiplier.toFixed(1) + 'x';
        
        // Add visual effect for high multipliers
        const multiplierElement = document.getElementById('multiplier');
        if (multiplier >= 3) {
            multiplierElement.style.color = '#ff00ff';
            multiplierElement.style.textShadow = '0 0 20px rgba(255, 0, 255, 0.8)';
        } else if (multiplier >= 2) {
            multiplierElement.style.color = '#00ff88';
            multiplierElement.style.textShadow = '0 0 15px rgba(0, 255, 136, 0.6)';
        } else {
            multiplierElement.style.color = '#00f5ff';
            multiplierElement.style.textShadow = '0 0 10px rgba(0, 245, 255, 0.5)';
        }
    }

    showGameOver(finalScore, bestCombo, accuracy) {
        document.getElementById('final-score').textContent = finalScore.toLocaleString();
        document.getElementById('best-combo').textContent = bestCombo;
        document.getElementById('accuracy').textContent = accuracy.toFixed(1) + '%';
        
        this.showScreen('gameover');
        this.saveHighScore(finalScore);
        this.updateHighScoreDisplay();
    }

    updateHighScoreDisplay() {
        const highScore = this.getHighScore();
        document.getElementById('high-score-value').textContent = highScore.toLocaleString();
    }

    saveHighScore(score) {
        const currentHigh = this.getHighScore();
        if (score > currentHigh) {
            localStorage.setItem('magicBeatsHighScore', score.toString());
            this.updateHighScoreDisplay();
        }
        
        // Save to leaderboard
        this.addToLeaderboard(score);
    }

    getHighScore() {
        const saved = localStorage.getItem('magicBeatsHighScore');
        return saved ? parseInt(saved, 10) : 0;
    }

    addToLeaderboard(score) {
        let leaderboard = this.getLeaderboard();
        leaderboard.push({
            score: score,
            date: new Date().toISOString()
        });
        
        // Sort by score (descending) and keep top 10
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10);
        
        localStorage.setItem('magicBeatsLeaderboard', JSON.stringify(leaderboard));
    }

    getLeaderboard() {
        const saved = localStorage.getItem('magicBeatsLeaderboard');
        return saved ? JSON.parse(saved) : [];
    }

    updateLeaderboard() {
        const leaderboard = this.getLeaderboard();
        const listElement = document.getElementById('leaderboard-list');
        
        if (leaderboard.length === 0) {
            listElement.innerHTML = '<p style="text-align: center; color: #00f5ff; padding: 20px;">No scores yet. Be the first!</p>';
            return;
        }
        
        listElement.innerHTML = leaderboard.map((entry, index) => {
            const date = new Date(entry.date);
            const dateStr = date.toLocaleDateString();
            return `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank">#${index + 1}</span>
                    <span class="leaderboard-score">${entry.score.toLocaleString()}</span>
                    <span style="color: #888; font-size: 0.9rem;">${dateStr}</span>
                </div>
            `;
        }).join('');
    }

    loadHighScore() {
        this.updateHighScoreDisplay();
    }
}

