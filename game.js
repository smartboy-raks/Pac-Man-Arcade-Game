// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const GRID_SIZE = 20;
const COLS = canvas.width / GRID_SIZE;
const ROWS = canvas.height / GRID_SIZE;
const BASE_SPEED = 1.5;
const POWER_MODE_DURATION = 300; // frames

// Game State
let gameState = {
    score: 0,
    level: 1,
    lives: 3,
    gameRunning: false,
    gameOver: false,
    powerMode: 0,
    speedMultiplier: 1
};

// Maze (1 = wall, 0 = path)
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

// Pellets (0 = no pellet, 1 = regular, 2 = power)
let pellets = [];
let totalPellets = 0;

function initPellets() {
    pellets = [];
    totalPellets = 0;
    for (let row = 0; row < ROWS; row++) {
        pellets[row] = [];
        for (let col = 0; col < COLS; col++) {
            if (maze[row][col] === 0) {
                // Power pellets in corners
                if ((row === 1 && col === 1) ||
                    (row === 1 && col === 19) ||
                    (row === 19 && col === 1) ||
                    (row === 19 && col === 19)) {
                    pellets[row][col] = 2; // Power pellet
                } else {
                    pellets[row][col] = 1; // Regular pellet
                }
                totalPellets++;
            } else {
                pellets[row][col] = 0;
            }
        }
    }
}

// Pac-Man
const pacman = {
    x: 10,
    y: 15,
    direction: 0, // 0=right, 1=down, 2=left, 3=up
    nextDirection: 0,
    speed: BASE_SPEED,
    mouthOpen: true,
    mouthCounter: 0
};

// Ghosts
const ghosts = [
    { x: 9, y: 9, color: '#ff0000', name: 'Blinky', scatterX: 18, scatterY: 0, mode: 'scatter', modeCounter: 0 },
    { x: 10, y: 10, color: '#ffb8ff', name: 'Pinky', scatterX: 1, scatterY: 0, mode: 'scatter', modeCounter: 0 },
    { x: 9, y: 10, color: '#00ffff', name: 'Inky', scatterX: 18, scatterY: 19, mode: 'scatter', modeCounter: 0 },
    { x: 10, y: 9, color: '#ffb847', name: 'Clyde', scatterX: 1, scatterY: 19, mode: 'scatter', modeCounter: 0 }
];

// Fruit
let fruit = null;
const fruitTypes = ['🍓', '🍊', '🍉', '🍌', '⭐'];
let fruitSpawnCounter = 0;

function spawnFruit() {
    if (Math.random() < 0.003 && !fruit) {
        const fruitType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
        fruit = { x: 10, y: 9, type: fruitType, lifespan: 300 };
    }
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function canMoveTo(x, y) {
    const row = Math.round(y);
    const col = Math.round(x);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    return maze[row][col] === 0;
}

function updatePacman() {
    // Try to move in next direction first
    let newX = pacman.x;
    let newY = pacman.y;

    switch (pacman.nextDirection) {
        case 0: newX += pacman.speed; break; // right
        case 1: newY += pacman.speed; break; // down
        case 2: newX -= pacman.speed; break; // left
        case 3: newY -= pacman.speed; break; // up
    }

    if (canMoveTo(newX, newY)) {
        pacman.x = newX;
        pacman.y = newY;
        pacman.direction = pacman.nextDirection;
    } else {
        // Try current direction
        newX = pacman.x;
        newY = pacman.y;
        switch (pacman.direction) {
            case 0: newX += pacman.speed; break;
            case 1: newY += pacman.speed; break;
            case 2: newX -= pacman.speed; break;
            case 3: newY -= pacman.speed; break;
        }
        if (canMoveTo(newX, newY)) {
            pacman.x = newX;
            pacman.y = newY;
        }
    }

    // Wrap around edges
    if (pacman.x < 0) pacman.x = COLS - 0.5;
    if (pacman.x > COLS - 1) pacman.x = 0.5;

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

    // Update mouth animation
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

                // Slight AI variation per ghost
                if (index === 1) { // Pinky
                    const ahead = 2;
                    switch (pacman.direction) {
                        case 0: targetX += ahead; break;
                        case 1: targetY += ahead; break;
                        case 2: targetX -= ahead; break;
                        case 3: targetY -= ahead; break;
                    }
                }
            }
        }

        // Simple pathfinding toward target
        let bestDir = 0;
        let bestDist = Infinity;
        const directions = [
            { dx: ghost.speed, dy: 0, dir: 0 }, // right
            { dx: 0, dy: ghost.speed, dir: 1 }, // down
            { dx: -ghost.speed, dy: 0, dir: 2 }, // left
            { dx: 0, dy: -ghost.speed, dir: 3 } // up
        ];

        for (let d of directions) {
            const newX = ghost.x + d.dx;
            const newY = ghost.y + d.dy;
            if (canMoveTo(newX, newY)) {
                const dist = distance(newX, newY, targetX, targetY);
                if (dist < bestDist && Math.random() > 0.1) {
                    bestDist = dist;
                    bestDir = d.dir;
                }
            }
        }

        switch (bestDir) {
            case 0: ghost.x += ghost.speed; break;
            case 1: ghost.y += ghost.speed; break;
            case 2: ghost.x -= ghost.speed; break;
            case 3: ghost.y -= ghost.speed; break;
        }

        // Wrap edges
        if (ghost.x < 0) ghost.x = COLS - 0.5;
        if (ghost.x > COLS - 1) ghost.x = 0.5;
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

function resetPositions() {
    pacman.x = 10;
    pacman.y = 15;
    ghosts.forEach(ghost => {
        if (ghost.name === 'Blinky') { ghost.x = 9; ghost.y = 9; }
        else if (ghost.name === 'Pinky') { ghost.x = 10; ghost.y = 10; }
        else if (ghost.name === 'Inky') { ghost.x = 9; ghost.y = 10; }
        else if (ghost.name === 'Clyde') { ghost.x = 10; ghost.y = 9; }
    });
    gameState.powerMode = 0;
}

function checkLevelComplete() {
    if (totalPellets === 0) {
        nextLevel();
    }
}

function nextLevel() {
    gameState.level++;
    gameState.speedMultiplier = 1 + (gameState.level - 1) * 0.1;
    pacman.speed = BASE_SPEED * gameState.speedMultiplier;
    ghosts.forEach(g => g.speed = BASE_SPEED * 0.8 * gameState.speedMultiplier);

    pacman.x = 10;
    pacman.y = 15;
    gameState.powerMode = 0;

    ghosts.forEach(ghost => {
        if (ghost.name === 'Blinky') { ghost.x = 9; ghost.y = 9; }
        else if (ghost.name === 'Pinky') { ghost.x = 10; ghost.y = 10; }
        else if (ghost.name === 'Inky') { ghost.x = 9; ghost.y = 10; }
        else if (ghost.name === 'Clyde') { ghost.x = 10; ghost.y = 9; }
    });

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

function draw() {
    // Clear canvas
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
            if (pellets[row][col] === 1) {
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(col * GRID_SIZE + GRID_SIZE / 2, row * GRID_SIZE + GRID_SIZE / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (pellets[row][col] === 2) {
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

        // Ghost body
        ctx.beginPath();
        ctx.arc(x, y - 2, size, Math.PI, 0);
        ctx.lineTo(x + size, y + 2);
        ctx.lineTo(x + size * 0.5, y + size * 0.8);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size * 0.5, y + size * 0.8);
        ctx.lineTo(x - size, y + 2);
        ctx.fill();

        // Ghost eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - size / 2, y - 1, 2, 0, Math.PI * 2);
        ctx.arc(x + size / 2, y - 1, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    });

    // Draw power mode indicator
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

        // Increase ghost speed based on level
        ghosts.forEach(g => g.speed = BASE_SPEED * 0.8 * gameState.speedMultiplier);
    }

    draw();
    updateUI();
    requestAnimationFrame(gameLoop);
}

function startNewGame() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';

    gameState.score = 0;
    gameState.level = 1;
    gameState.lives = 3;
    gameState.gameRunning = true;
    gameState.gameOver = false;
    gameState.powerMode = 0;
    gameState.speedMultiplier = 1;

    pacman.speed = BASE_SPEED;
    pacman.x = 10;
    pacman.y = 15;
    pacman.direction = 0;

    ghosts.forEach((g, i) => {
        g.speed = BASE_SPEED * 0.8;
        if (i === 0) { g.x = 9; g.y = 9; }
        else if (i === 1) { g.x = 10; g.y = 10; }
        else if (i === 2) { g.x = 9; g.y = 10; }
        else { g.x = 10; g.y = 9; }
    });

    fruit = null;
    initPellets();
    gameLoop();
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (!gameState.gameRunning && !gameState.gameOver && e.code !== 'Space') return;

    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameState.gameRunning && !gameState.gameOver) {
            startNewGame();
        } else if (gameState.gameOver) {
            startNewGame();
        }
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
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

// Initial draw
draw();
updateUI();
