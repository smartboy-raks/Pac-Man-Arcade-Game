// ========================================
// PAC-MAN GAME - FRESH WORKING VERSION
// ========================================

console.log("📜 game.js loaded!");

// Game constants
const GRID_SIZE = 20;
const MOVE_SPEED = 0.25; // Pac-Man speed
const GHOST_SPEED = 0.10; // Ghosts are significantly slower than Pac-Man
const BASE_SPEED = 0.8;
const POWER_MODE_DURATION = 400;
const COLLISION_RADIUS = 0.35;

// Game variables (will be initialized after DOM ready)
let canvas, ctx, COLS, ROWS;
let gameState = {
    score: 0,
    level: 1,
    lives: 3,
    gameRunning: false,
    gameOver: false,
    powerMode: 0,
    speedMultiplier: 1,
    ghostsKilledThisPower: 0,
    paused: false,
    resumeCountdown: 0
};

// Maze (21x21 grid)
const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,1,0,1,0,1,1,1,1,0,1,1,0,1],
    [1,0,1,1,0,1,1,1,1,0,1,0,1,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,0,1],
    [1,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1],
    [1,1,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1],
    [1,1,1,1,0,1,0,1,1,0,1,1,0,0,1,0,1,1,1,1,1],
    [0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,0,1,0,1,1,1,1,1,0,0,1,0,1,1,1,1,1],
    [1,1,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1],
    [1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,1,0,1,0,1,1,1,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Pellets array
let pellets = [];
let totalPellets = 0;

// Pac-Man
let pacman = {
    x: 10,
    y: 15,
    direction: 0,
    nextDirection: 0,
    moveProgress: 0,
    mouthOpen: true,
    mouthCounter: 0
};

// Ghosts
let ghosts = [];

// Fruit
let fruit = null;
const fruitTypes = ['🍓', '🍊', '🍉', '🍌', '⭐'];

// ====== UTILITY FUNCTIONS ======
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function canMoveTo(x, y) {
    const checkPoints = [
        [x, y],
        [x + COLLISION_RADIUS, y],
        [x - COLLISION_RADIUS, y],
        [x, y + COLLISION_RADIUS],
        [x, y - COLLISION_RADIUS]
    ];
    
    for (let [px, py] of checkPoints) {
        const row = Math.floor(py + 0.5);
        const col = Math.floor(px + 0.5);
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
        if (maze[row][col] === 1) return false;
    }
    return true;
}

// ====== INITIALIZATION FUNCTIONS ======
function initPellets() {
    pellets = [];
    totalPellets = 0;
    for (let row = 0; row < ROWS; row++) {
        pellets[row] = [];
        for (let col = 0; col < COLS; col++) {
            if (maze[row][col] === 0) {
                if ((row === 1 && col === 1) || (row === 1 && col === 19) ||
                    (row === 19 && col === 1) || (row === 19 && col === 19)) {
                    pellets[row][col] = 2;
                } else {
                    pellets[row][col] = 1;
                }
                totalPellets++;
            } else {
                pellets[row][col] = 0;
            }
        }
    }
}

function initGhosts() {
    ghosts = [
        // All 4 start in valid open cells inside the ghost house area (row 8, cols 8-11)
        { x: 8,  y: 8, color: '#ff0000', name: 'Blinky', mode: 'scatter', modeCounter: 0,   moveProgress: 0, lastDir: -1, respawnTimer: 0, visited: new Set() },
        { x: 9,  y: 8, color: '#ffb8ff', name: 'Pinky',  mode: 'scatter', modeCounter: 75,  moveProgress: 0, lastDir: -1, respawnTimer: 0, visited: new Set() },
        { x: 10, y: 8, color: '#00ffff', name: 'Inky',   mode: 'scatter', modeCounter: 150, moveProgress: 0, lastDir: -1, respawnTimer: 0, visited: new Set() },
        { x: 11, y: 8, color: '#ffb847', name: 'Clyde',  mode: 'scatter', modeCounter: 225, moveProgress: 0, lastDir: -1, respawnTimer: 0, visited: new Set() }
    ];
}

// ====== UPDATE FUNCTIONS ======
function updatePacman() {
    pacman.moveProgress += MOVE_SPEED;

    if (pacman.moveProgress >= 1) {
        pacman.moveProgress = 0;
        
        let newX = pacman.x;
        let newY = pacman.y;

        // Try to move in next direction first
        switch (pacman.nextDirection) {
            case 0: newX += 1; break;
            case 1: newY += 1; break;
            case 2: newX -= 1; break;
            case 3: newY -= 1; break;
        }

        if (canMoveTo(newX, newY)) {
            pacman.x = newX;
            pacman.y = newY;
            pacman.direction = pacman.nextDirection;
        } else {
            // Try to continue in current direction
            newX = pacman.x;
            newY = pacman.y;
            switch (pacman.direction) {
                case 0: newX += 1; break;
                case 1: newY += 1; break;
                case 2: newX -= 1; break;
                case 3: newY -= 1; break;
            }
            if (canMoveTo(newX, newY)) {
                pacman.x = newX;
                pacman.y = newY;
            }
        }

        // Handle wrapping at edges
        if (pacman.x < 0) pacman.x = COLS - 1;
        if (pacman.x >= COLS) pacman.x = 0;

        // Collect pellets
        const row = Math.round(pacman.y);
        const col = Math.round(pacman.x);

        if (pellets[row] && pellets[row][col] > 0) {
            if (pellets[row][col] === 1) {
                gameState.score += 10;
            } else if (pellets[row][col] === 2) {
                gameState.score += 50;
                gameState.powerMode = POWER_MODE_DURATION;
                gameState.ghostsKilledThisPower = 0; // reset kill chain
            }
            pellets[row][col] = 0;
            totalPellets--;
        }

        // Collect fruit
        if (fruit && Math.abs(pacman.x - fruit.x) < 0.5 && Math.abs(pacman.y - fruit.y) < 0.5) {
            gameState.score += 100;
            fruit = null;
        }
    }

    // Mouth animation
    pacman.mouthCounter++;
    if (pacman.mouthCounter > 8) {
        pacman.mouthOpen = !pacman.mouthOpen;
        pacman.mouthCounter = 0;
    }
}

// How strongly each ghost chases — kept very low so they mostly roam
const GHOST_CHASE_WEIGHTS = [0.12, 0.08, 0.05, 0.02];

function updateGhosts() {
    ghosts.forEach((ghost, index) => {
        ghost.modeCounter++;
        // Stay in roam/scatter mode for ~8 seconds, chase mode briefly
        if (ghost.modeCounter > 480) {
            ghost.mode = ghost.mode === 'scatter' ? 'chase' : 'scatter';
            ghost.modeCounter = 0;
        }

        // Ghosts freeze during power mode — lock them completely in place
        if (gameState.powerMode > 0) {
            ghost.moveProgress = 0;
            ghost.x = Math.round(ghost.x);
            ghost.y = Math.round(ghost.y);
            ghost.modeCounter--; // cancel the increment above so mode doesn't change mid-freeze
            return;
        }

        // Count down respawn timer; ghost is inactive until it hits 0
        if (ghost.respawnTimer > 0) {
            ghost.respawnTimer--;
            if (ghost.respawnTimer === 0) {
                // Return to ghost house
                ghost.x = 8 + index;
                ghost.y = 8;
                ghost.lastDir = -1;
                ghost.moveProgress = 0;
                ghost.visited.clear();
            }
            return;
        }

        ghost.moveProgress += GHOST_SPEED;

        if (ghost.moveProgress >= 1) {
            ghost.moveProgress = 0;

            const directions = [
                { dx: 1, dy: 0, dir: 0 },
                { dx: 0, dy: 1, dir: 1 },
                { dx: -1, dy: 0, dir: 2 },
                { dx: 0, dy: -1, dir: 3 }
            ];

            // Reverse of last direction (ghosts cannot reverse unless forced)
            const reverseDir = ghost.lastDir >= 0 ? (ghost.lastDir + 2) % 4 : -1;

            // Valid moves excluding reversal
            let possibleMoves = directions.filter(d =>
                d.dir !== reverseDir && canMoveTo(ghost.x + d.dx, ghost.y + d.dy)
            );

            // If completely stuck, allow reversing
            if (possibleMoves.length === 0) {
                possibleMoves = directions.filter(d => canMoveTo(ghost.x + d.dx, ghost.y + d.dy));
            }

            if (possibleMoves.length === 0) return;

            // Prefer cells the ghost hasn't visited yet;
            // if all neighbours are visited, reset and start a fresh patrol
            const unvisited = possibleMoves.filter(d => !ghost.visited.has(`${ghost.x + d.dx},${ghost.y + d.dy}`));
            if (unvisited.length === 0) ghost.visited.clear();
            const candidates = unvisited.length > 0 ? unvisited : possibleMoves;

            let chosen;
            const chaseWeight = GHOST_CHASE_WEIGHTS[index];

            if (ghost.mode === 'chase' && Math.random() < chaseWeight) {
                // Chase: pick the move that gets closest to Pac-Man
                candidates.sort((a, b) =>
                    distance(ghost.x + a.dx, ghost.y + a.dy, pacman.x, pacman.y) -
                    distance(ghost.x + b.dx, ghost.y + b.dy, pacman.x, pacman.y)
                );
                chosen = candidates[0];
            } else {
                // Roam: pick a random valid direction from unvisited candidates
                chosen = candidates[Math.floor(Math.random() * candidates.length)];
            }

            ghost.x += chosen.dx;
            ghost.y += chosen.dy;
            ghost.lastDir = chosen.dir;

            // Mark this cell as visited so the ghost won't return until forced
            ghost.visited.add(`${ghost.x},${ghost.y}`);

            // Handle wrapping at edges
            if (ghost.x < 0) ghost.x = COLS - 1;
            if (ghost.x >= COLS) ghost.x = 0;
        }
    });
}

function checkCollisions() {
    ghosts.forEach(ghost => {
        if (ghost.respawnTimer > 0) return; // ghost is in cooldown, skip
        if (Math.abs(pacman.x - ghost.x) < 0.5 && Math.abs(pacman.y - ghost.y) < 0.5) {
            if (gameState.powerMode > 0) {
                // Escalating points: 200 → 400 → 800 → 1600
                const points = 200 * Math.pow(2, gameState.ghostsKilledThisPower);
                gameState.score += points;
                gameState.ghostsKilledThisPower++;
                ghost.respawnTimer = 600; // 10 seconds at 60fps
                ghost.x = -999; // move off-screen while waiting
                ghost.y = -999;
            } else {
                gameState.lives--;
                if (gameState.lives <= 0) {
                    endGame();
                } else {
                    resetPositions();
                }
            }
        }
    });
}

function spawnFruit() {
    if (gameState.fruitDelay > 0) {
        gameState.fruitDelay--;
        return;
    }
    if (Math.random() < 0.003 && !fruit) {
        // Pick a random open (non-wall) cell to spawn fruit
        let fx, fy, attempts = 0;
        do {
            fx = 1 + Math.floor(Math.random() * (COLS - 2));
            fy = 1 + Math.floor(Math.random() * (ROWS - 2));
            attempts++;
        } while (maze[fy][fx] === 1 && attempts < 200);
        if (maze[fy][fx] === 0) {
            const fruitType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
            fruit = { x: fx, y: fy, type: fruitType, lifespan: 300 };
        }
    }
}

function checkLevelComplete() {
    if (totalPellets === 0) {
        nextLevel();
    }
}

function resetPositions() {
    pacman.x = 10;
    pacman.y = 15;
    ghosts[0].x = 9; ghosts[0].y = 9;
    ghosts[1].x = 10; ghosts[1].y = 10;
    ghosts[2].x = 9; ghosts[2].y = 10;
    ghosts[3].x = 10; ghosts[3].y = 9;
    gameState.powerMode = 0;
}

function nextLevel() {
    gameState.level++;
    gameState.speedMultiplier = 1 + (gameState.level - 1) * 0.08;
    pacman.x = 10;
    pacman.y = 15;
    pacman.moveProgress = 0;
    gameState.powerMode = 0;
    resetPositions();
    initPellets();
}

// ====== DRAW FUNCTIONS ======
function draw() {
    if (!ctx) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (maze[row][col] === 1) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.fillRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
                ctx.strokeRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }

    // Draw pellets
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (pellets[row] && pellets[row][col] === 1) {
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(col * GRID_SIZE + GRID_SIZE / 2, row * GRID_SIZE + GRID_SIZE / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (pellets[row] && pellets[row][col] === 2) {
                ctx.fillStyle = '#ffff00';
                const pulse = Math.sin(Date.now() / 100) * 2 + 3;
                ctx.beginPath();
                ctx.arc(col * GRID_SIZE + GRID_SIZE / 2, row * GRID_SIZE + GRID_SIZE / 2, pulse, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Draw fruit
    if (fruit) {
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fruit.type, fruit.x * GRID_SIZE + GRID_SIZE / 2, fruit.y * GRID_SIZE + GRID_SIZE / 2);
        fruit.lifespan--;
        if (fruit.lifespan <= 0) {
            fruit = null;
        }
    }

    // Draw Pac-Man
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    const mouthAngle = pacman.mouthOpen ? 0.2 : 0;
    const startAngle = (pacman.direction * Math.PI / 2) + mouthAngle;
    const endAngle = startAngle + (Math.PI * 2 - mouthAngle * 2);
    ctx.arc(pacman.x * GRID_SIZE + GRID_SIZE / 2, pacman.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2 - 1, startAngle, endAngle);
    ctx.lineTo(pacman.x * GRID_SIZE + GRID_SIZE / 2, pacman.y * GRID_SIZE + GRID_SIZE / 2);
    ctx.fill();

    // Draw ghosts
    const powerWarning = gameState.powerMode > 0 && gameState.powerMode < 150;
    ghosts.forEach(ghost => {
        if (ghost.respawnTimer > 0) return; // hidden during cooldown
        if (gameState.powerMode > 0) {
            // Rapid red/white flash as warning; steady blue otherwise
            const flash = powerWarning && Math.floor(Date.now() / 150) % 2 === 0;
            ctx.fillStyle = flash ? '#ff4444' : '#0099ff';
            ctx.globalAlpha = 0.8;
        } else {
            ctx.fillStyle = ghost.color;
            ctx.globalAlpha = 1;
        }

        const x = ghost.x * GRID_SIZE + GRID_SIZE / 2;
        const y = ghost.y * GRID_SIZE + GRID_SIZE / 2;
        const size = GRID_SIZE / 2 - 1;

        ctx.beginPath();
        ctx.arc(x, y - 2, size, Math.PI, 0);
        ctx.lineTo(x + size, y + 2);
        ctx.lineTo(x + size * 0.5, y + size * 0.8);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size * 0.5, y + size * 0.8);
        ctx.lineTo(x - size, y + 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - size / 2, y - 1, 2, 0, Math.PI * 2);
        ctx.arc(x + size / 2, y - 1, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    });

    if (gameState.powerMode > 0) {
        ctx.fillStyle = `rgba(255, 255, 0, ${gameState.powerMode / POWER_MODE_DURATION * 0.5})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw pause / countdown overlay
    if (gameState.paused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (gameState.resumeCountdown > 0) {
            const secs = Math.ceil(gameState.resumeCountdown / 60);
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 90px Arial';
            ctx.fillText(secs, canvas.width / 2, canvas.height / 2);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 52px Arial';
            ctx.fillText('⏸', canvas.width / 2, canvas.height / 2 - 24);
            ctx.font = 'bold 22px Arial';
            ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 + 32);
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '14px Arial';
            ctx.fillText('Press SPACE to resume', canvas.width / 2, canvas.height / 2 + 60);
        }
    }
}

function updateUI() {
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('livesDisplay').textContent = gameState.lives;
    document.getElementById('pelletsDisplay').textContent = totalPellets;

    const uiPanel = document.getElementById('uiPanel');
    if (gameState.powerMode > 0) {
        uiPanel.classList.add('powerMode');
    } else {
        uiPanel.classList.remove('powerMode');
    }
}

// ====== GAME LOOP ======
function gameLoop() {
    // Tick countdown independently of the paused state check below
    if (gameState.resumeCountdown > 0) {
        gameState.resumeCountdown--;
        if (gameState.resumeCountdown === 0) {
            gameState.paused = false;
        }
    }

    // Only update game logic when running and not paused
    if (gameState.gameRunning && !gameState.paused && gameState.resumeCountdown === 0) {
        updatePacman();
        updateGhosts();
        checkCollisions();
        spawnFruit();
        checkLevelComplete();

        if (gameState.powerMode > 0) {
            gameState.powerMode--;
        }
    }

    draw();
    updateUI();
    requestAnimationFrame(gameLoop);
}

// ====== START GAME FUNCTION ======
function startNewGame() {
    console.log("🎮 startNewGame() CALLED");
    console.log("Canvas:", canvas, "CTX:", ctx);
    
    if (!canvas || !ctx) {
        console.error("❌ Canvas not ready! Call setupGame() first.");
        return;
    }
    
    console.log("🎮 Starting new game...");
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';

    gameState.score = 0;
    gameState.level = 1;
    gameState.lives = 3;
    gameState.gameRunning = true;
    gameState.gameOver = false;
    gameState.powerMode = 0;
    gameState.speedMultiplier = 1;
    gameState.fruitDelay = 900;
    gameState.ghostsKilledThisPower = 0;
    gameState.paused = false;
    gameState.resumeCountdown = 0;

    pacman.x = 10;
    pacman.y = 15;
    pacman.direction = 0;
    pacman.nextDirection = 0;
    pacman.moveProgress = 0;

    ghosts.forEach((g, i) => {
        g.moveProgress = 0;
        g.lastDir = -1;
        g.mode = 'scatter';
        g.respawnTimer = 0;
        g.visited = new Set();
        if (i === 0) { g.x = 8;  g.y = 8; g.modeCounter = 0;   }
        else if (i === 1) { g.x = 9;  g.y = 8; g.modeCounter = 75;  }
        else if (i === 2) { g.x = 10; g.y = 8; g.modeCounter = 150; }
        else              { g.x = 11; g.y = 8; g.modeCounter = 225; }
    });

    fruit = null;
    initPellets();
    console.log("✅ Game started!");
}

// ====== SETUP ON DOM READY ======
function setupGame() {
    console.log("🔧 Setting up game...");

    // Get canvas
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('❌ Canvas not found!');
        return;
    }

    ctx = canvas.getContext('2d');
    COLS = canvas.width / GRID_SIZE;
    ROWS = canvas.height / GRID_SIZE;

    console.log(`Canvas: ${canvas.width}x${canvas.height}, Grid: ${COLS}x${ROWS}`);

    // Initialize game objects
    initGhosts();
    initPellets();

    // Register spacebar listener
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ') {
            if (e.repeat) return;
            e.preventDefault();
            
            console.log("🎮 SPACE | gameRunning:", gameState.gameRunning, "paused:", gameState.paused, "countdown:", gameState.resumeCountdown);

            if (!gameState.gameRunning) {
                // Start game from menu or game over
                console.log("→ Starting game");
                startNewGame();
            } else if (gameState.paused && gameState.resumeCountdown === 0) {
                // Paused and not counting down — start countdown
                console.log("→ Starting 3-sec countdown");
                gameState.resumeCountdown = 180;
            } else if (!gameState.paused && gameState.resumeCountdown === 0) {
                // Playing — pause now
                console.log("→ PAUSED");
                gameState.paused = true;
            }
        }

        if (!gameState.gameRunning) return;

        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            pacman.nextDirection = 3;
            e.preventDefault();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            pacman.nextDirection = 1;
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            pacman.nextDirection = 2;
            e.preventDefault();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            pacman.nextDirection = 0;
            e.preventDefault();
        }
    });

    // Make startNewGame global for button clicks
    window.startNewGame = startNewGame;

    // Start the game loop
    console.log("▶️ Starting game loop...");
    gameLoop();
    console.log("✅ Game setup complete!");
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    console.log("⏳ Waiting for DOM...");
    document.addEventListener('DOMContentLoaded', setupGame);
} else {
    console.log("⏳ DOM ready, setting up now...");
    setupGame();
}
