# 🎹 Magic Beats - Piano Tiles Game

A modern, music-synced falling piano tiles game built with HTML5 Canvas and vanilla JavaScript. Features a neon cyber theme, combo system, and progressive difficulty.

## 🎮 Features

- **4-Column Falling Tiles**: Classic piano tiles gameplay
- **Music Beat Sync**: Tiles spawn in sync with BPM-based beat patterns
- **Combo & Multiplier System**: Build combos for higher scores (up to 5x multiplier)
- **Progressive Difficulty**: Speed and complexity increase over time
- **Neon Cyber Theme**: Beautiful glowing neon visuals
- **Touch & Mouse Support**: Works on desktop and mobile
- **Local Leaderboard**: Track your high scores
- **Responsive Design**: Adapts to any screen size

## 🚀 Getting Started

1. **Open the game**: Simply open `index.html` in a modern web browser
2. **No build required**: The game runs directly in the browser
3. **Start playing**: Click "START GAME" and tap the dark tiles as they fall!

## 🎯 How to Play

- **Dark tiles** (black with glow) must be tapped when they reach the bottom tap zone
- **Light tiles** (transparent) should NOT be tapped
- Tap dark tiles to build combos and increase your multiplier
- Missing a dark tile or tapping a light tile ends the game
- Score increases with combos and multipliers

## 📁 Project Structure

```
pianoplay/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styling and theme
├── js/
│   ├── game.js         # Main game engine
│   ├── tile.js         # Tile class and rendering
│   ├── audio.js        # Audio management
│   ├── beatmap.js      # Beat mapping and pattern generation
│   └── ui.js           # UI screens and management
└── README.md           # This file
```

## 🎵 Game Mechanics

### Scoring System
- Base score: 10 points per tile
- Combo bonus: +2 points per combo level
- Multiplier: 1.0x to 5.0x based on combo (1.0 + combo × 0.1)

### Difficulty Progression
- **0-20 seconds**: Slow speed, single tiles
- **20-60 seconds**: Faster speed, occasional double tiles
- **60+ seconds**: Very fast, complex patterns

### Beat Mapping
- Dynamic BPM-based tile generation
- Patterns adapt to game time
- Automatic difficulty scaling

## 🛠️ Customization

### Change Theme Colors
Edit `css/style.css` and modify the gradient colors:
- Primary: `#00f5ff` (cyan)
- Secondary: `#ff00ff` (magenta)
- Accent: `#00ff88` (green)

### Adjust Game Speed
In `js/game.js`, modify:
```javascript
this.baseSpeed = 200; // pixels per second
```

### Change Number of Columns
In `js/game.js`, modify:
```javascript
this.columns = 4; // Change to 3 or 5
```

### Add Custom Beat Patterns
In `js/beatmap.js`, use the `setPattern()` method:
```javascript
beatMap.setPattern([0, 1, 2, 3, 0, 1, 2, 3], 120); // Pattern and BPM
```

## 📱 Mobile Support

- Fully responsive design
- Touch-optimized controls
- Prevents default touch behaviors
- Works on iOS and Android

## 🔮 Future Enhancements

- [ ] Facebook Instant Games integration
- [ ] Rewarded video ads
- [ ] Multiple song tracks
- [ ] Theme customization
- [ ] Multiplayer battle mode
- [ ] Daily challenges
- [ ] Achievement system

## 📄 License

Free to use and modify for your projects.

## 🎨 Credits

Built with HTML5 Canvas, vanilla JavaScript, and lots of neon glow effects!

---

**Enjoy playing Magic Beats! 🎹✨**

