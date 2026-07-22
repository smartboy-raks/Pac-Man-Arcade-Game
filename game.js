// ========================================
// PAC-MAN GAME - FRESH WORKING VERSION
// ========================================

// Game constants
const GRID_SIZE = 20;
const MOVE_SPEED = 0.25; // Frames per grid cell movement
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
    speedMultiplier: 1
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
        { x: 9, y: 9, color: '#ff0000', name: 'Blinky', scatterX: 18, scatterY: 0, mode: 'scatter', modeCounter: 0, moveProgress: 0 },
        { x: 10, y: 10, color: '#ffb8ff', name: 'Pinky', scatterX: 1, scatterY: 0, mode: 'scatter', modeCounter: 0, moveProgress: 0 },
        { x: 9, y: 10, color: '#00ffff', name: 'Inky', scatterX: 18, scatterY: 19, mode: 'scatter', modeCounter: 0, moveProgress: 0 },
        { x: 10, y: 9, color: '#ffb847', name: 'Clyde', scatterX: 1, scatterY: 19, mode: 'scatter', modeCounter: 0, moveProgress: 0 }
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

function updateGhosts() {
    ghosts.forEach((ghost, index) => {
        ghost.modeCounter++;
        if (ghost.modeCounter > 300) {
            ghost.mode = ghost.mode === 'scatter' ? 'chase' : 'scatter';
            ghost.modeCounter = 0;
        }

        ghost.moveProgress += MOVE_SPEED;

        if (ghost.moveProgress >= 1) {
            ghost.moveProgress = 0;

            let targetX = ghost.scatterX;
            let targetY = ghost.scatterY;

            if (ghost.mode === 'chase') {
                if (gameState.powerMode > 0) {
                    // Run away from Pac-Man
                    targetX = ghost.x + (ghost.x - pacman.x) * 2;
                    targetY = ghost.y + (ghost.y - pacman.y) * 2;
                } else {
                    // Chase Pac-Man
                    targetX = pacman.x;
                    targetY = pacman.y;
                }
            }

            // Find possible moves
            const directions = [
                { dx: 1, dy: 0, dir: 0 },
                { dx: 0, dy: 1, dir: 1 },
                { dx: -1, dy: 0, dir: 2 },
                { dx: 0, dy: -1, dir: 3 }
            ];

            let possibleMoves = [];
            for (let d of directions) {
                const newX = ghost.x + d.dx;
                const newY = ghost.y + d.dy;
                if (canMoveTo(newX, newY)) {
                    const dist = distance(newX, newY, targetX, targetY);
                    possibleMoves.push({ ...d, dist });
                }
            }

            if (possibleMoves.length > 0) {
                // Sort by distance to target
                possibleMoves.sort((a, b) => a.dist - b.dist);
                
                // Pick best move 80% of the time, random move 20% to make it beatable
                let chosen;
                if (Math.random() < 0.8) {
                    chosen = possibleMoves[0];
                } else {
                    chosen = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                }

                ghost.x += chosen.dx;
                ghost.y += chosen.dy;
            }

            // Handle wrapping at edges
            if (ghost.x < 0) ghost.x = COLS - 1;
            if (ghost.x >= COLS) ghost.x = 0;
        }
    });
}

function checkCollisions() {
    ghosts.forEach(ghost => {
        if (Math.abs(pacman.x - ghost.x) < 0.5 && Math.abs(pacman.y - ghost.y) < 0.5) {
            if (gameState.powerMode > 0) {
                gameState.score += 200;
                ghost.x = 10;
                ghost.y = 9;
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
    if (Math.random() < 0.003 && !fruit) {
        const fruitType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
        fruit = { x: 10, y: 9, type: fruitType, lifespan: 300 };
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

function endGame() {
    gameState.gameOver = true;
    gameState.gameRunning = false;
    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('gameOverTitle').textContent = gameState.lives < 0 ? 'GAME OVER' : 'LEVEL COMPLETE!';
    document.getElementById('gameOverScore').textContent = `Score: ${gameState.score}`;
    document.getElementById('gameOverLevel').textContent = `Level: ${gameState.level}`;
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
    ghosts.forEach(ghost => {
        if (gameState.powerMode > 0) {
            ctx.fillStyle = '#0099ff';
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
    if (gameState.gameRunning) {
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

    pacman.x = 10;
    pacman.y = 15;
    pacman.direction = 0;
    pacman.nextDirection = 0;
    pacman.moveProgress = 0;

    ghosts.forEach((g, i) => {
        g.moveProgress = 0;
        if (i === 0) { g.x = 9; g.y = 9; }
        else if (i === 1) { g.x = 10; g.y = 10; }
        else if (i === 2) { g.x = 9; g.y = 10; }
        else { g.x = 10; g.y = 9; }
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
            e.preventDefault();
            console.log("⏸️ Spacebar pressed, game running:", gameState.gameRunning);
            if (!gameState.gameRunning) {
                startNewGame();
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
