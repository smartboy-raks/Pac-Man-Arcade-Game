# Pac-Man Arcade Game

A modern browser-based recreation of the classic Pac-Man arcade game with smooth gameplay, colorful visuals, and intelligent ghost AI. Navigate through a glowing maze, collect pellets, avoid ghosts, and use power-ups strategically to turn the tables on your enemies.

## 🎮 Game Features

### Core Gameplay
- **Smooth Movement**: Arrow keys or WASD for responsive, instant directional turning
- **Yellow Pac-Man**: Smooth circular character with animated mouth
- **Classic Maze**: 21×21 grid-based labyrinth with bright cyan walls on black background
- **Pellet Collection**: Regular pellets (10 pts) line the paths; grab them all to complete levels
- **Progressive Difficulty**: Each level runs 10% faster, keeping the challenge escalating

### Ghost AI System
Four uniquely colored ghosts with personality-based AI:
- **Blinky (Red)**: Aggressive chaser, targets Pac-Man directly
- **Pinky (Pink)**: Interceptor, targets ahead of Pac-Man's movement
- **Inky (Cyan)**: Ambusher, calculates indirect routes
- **Clyde (Orange)**: Unpredictable, random patrol patterns

Ghosts alternate between "Scatter Mode" (patrol edges) and "Chase Mode" (hunt Pac-Man), creating dynamic, unpredictable behavior.

### Power-Ups
- **Power Pellets** (50 pts): Located in maze corners with glowing animation
  - Turns all ghosts blue and makes them flee
  - Lasts 5 seconds (300 frames)
  - Catch a ghost while powered up: +200 points
  - Ghosts respawn at ghost box when caught

- **Fruit Bonuses** (100 pts): Randomly spawns in center of maze
  - Various emoji fruits appear and disappear after 5 seconds
  - Collect for quick bonus points

### Scoring System
- Regular Pellet: **10 points**
- Power Pellet: **50 points**
- Fruit: **100 points**
- Caught Ghost: **200 points**

### Lives & Game Over
- Start with 3 lives
- Lose a life if touched by a ghost (unless in power mode)
- Game ends when all lives are lost
- Clear all pellets to advance to next level

### Visual Design
- **Black background** with contrasting colors
- **Bright cyan maze walls** with semi-transparent glow
- **Yellow pellets** with pulsing power pellet animation
- **Glowing UI panel** tracking score, level, lives, and ghost legend
- **Smooth canvas rendering** at 60 FPS

## 🎯 How to Play

### Starting the Game
1. Open `index.html` in your web browser
2. Click **"NEW GAME"** or press **SPACE** to start

### Controls
| Key | Action |
|-----|--------|
| `↑` / `W` | Move Up |
| `↓` / `S` | Move Down |
| `←` / `A` | Move Left |
| `→` / `D` | Move Right |
| `SPACE` | Start Game / Play Again |

### Strategy Tips
- **Power Pellets are Key**: Use them strategically to catch ghosts and rack up points
- **Watch the Corners**: Power pellets spawn in all four corners; plan routes to reach them
- **Ghost Patterns**: Learn each ghost's behavior to anticipate their movements
- **Escape Routes**: Keep mental note of open paths to dodge incoming ghosts
- **Fruit Hunting**: Watch for fruit spawns in the center for quick bonus points

## 🏗️ Technical Details

### Architecture
- **Single HTML File**: Complete game in one file (HTML + CSS + JavaScript)
- **Canvas Rendering**: Smooth 2D graphics using HTML5 Canvas API
- **Game Loop**: 60 FPS requestAnimationFrame for fluid animation

### Game Systems
- **Grid-Based Collision**: 20×20 pixel grid cells matching maze structure
- **Path Finding AI**: Ghosts calculate distances to targets and choose optimal moves
- **Mode System**: Ghosts switch between scatter and chase modes every ~5 seconds
- **Power Mode Countdown**: Frame-based duration tracking for power-up effects
- **Pellet Tracking**: Real-time counting of remaining pellets to detect level completion

### Performance
- Optimized for 60 FPS on modern browsers
- Minimal CPU usage with efficient collision detection
- Smooth animations using requestAnimationFrame

## 📊 Game Progression

### Level System
- **Level 1**: Base speed × 1.0
- **Level 2**: Base speed × 1.1
- **Level 3**: Base speed × 1.2
- **Level N**: Base speed × (1.0 + 0.1 × (N-1))

Speed increases apply to both Pac-Man and ghosts, maintaining balanced gameplay difficulty.

### Winning Strategy
1. Secure the corners early for power pellets
2. Build up score from regular pellets
3. Use power-ups defensively when ghosts close in
4. Collect bonus fruits when safe
5. Progress through levels as speed increases

## 🎨 Customization

The game uses CSS variables and constants that can be easily modified:

### In the `<style>` section:
- Border colors: `#00ffff` (cyan) and `#ffff00` (yellow)
- Background color: `#0a0e27` (dark blue)
- Glow effects: Adjust `box-shadow` values

### In the `<script>` section:
- **GRID_SIZE**: 20 (change maze cell size)
- **BASE_SPEED**: 1.5 (adjust game speed)
- **POWER_MODE_DURATION**: 300 frames (adjust power-up length)
- **Ghost colors**: Easily swap RGB values
- **Maze layout**: Modify the `maze` array

## 🚀 Browser Compatibility

Works on all modern browsers supporting:
- HTML5 Canvas
- ES6 JavaScript
- CSS3 Animations

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## 📝 License

Free to use and modify. Inspired by the classic Pac-Man arcade game.

---

**Enjoy the game! Collect those pellets, avoid the ghosts, and reach the highest score! 👾**
