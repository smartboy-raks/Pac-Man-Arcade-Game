// ========================================
// PAC-MAN GAME - FRESH WORKING VERSION
// ========================================

// Game constants
const GRID_SIZE = 15;
const MOVE_SPEED = 0.25; // Pac-Man speed
const GHOST_SPEED = 0.075; // Ghosts are about 30% of Pac-Man speed
const BASE_SPEED = 0.8;
const POWER_MODE_DURATION = 340; // ~5.7s at 60fps (about 1 second shorter than original)
const TOTAL_LEVELS = 3;
const GHOST_RESPAWN_FRAMES = 1500; // 25 seconds at 60fps
const SPECIAL_PELLET_COUNT = 6;
const HIGH_SCORE_KEY = 'pacmanHighScore';
const BEST_TIME_KEY = 'pacmanBestTime';
const TUNNEL_ROW = 10;
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
    highScore: 0,
    bestTime: 0,
    elapsedTime: 0,
    gameStartTime: 0,
    levelIntroCountdown: 0,
    paused: false,
    resumeCountdown: 0,
    gameOverReason: ''
};

// Maze (21x21 grid)
const BASE_MAZE = [
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

let maze = [];

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

// Retro background music
let musicContext = null;
let musicTimer = null;
let musicStep = 0;
const MUSIC_PATTERN = [392, 523, 659, 523, 392, 523, 784, 659, 523, 659, 880, 784];

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

function isTunnelRow(y) {
    return Math.round(y) === TUNNEL_ROW;
}

function wrapThroughTunnel(entity) {
    if (entity.x < 0) {
        entity.x = COLS - 1;
    } else if (entity.x >= COLS) {
        entity.x = 0;
    }
}

function cloneMazeLayout(layout) {
    return layout.map(row => [...row]);
}

function mirrorMazeHoriz(layout) {
    return layout.map(row => [...row].reverse());
}

function buildMazeForLevel(level) {
    if (level === 1) return cloneMazeLayout(BASE_MAZE);

    if (level === 2) return mirrorMazeHoriz(BASE_MAZE);

    const levelThreeMaze = mirrorMazeHoriz(BASE_MAZE);
    // Carve extra passages so level 3 feels distinctly different.
    const carveCells = [
        [2, 2], [2, 18], [3, 8], [3, 12], [5, 10], [6, 6], [6, 14],
        [8, 2], [8, 18], [9, 10], [11, 10], [12, 6], [12, 14],
        [14, 10], [15, 2], [15, 18], [16, 8], [16, 12], [18, 10]
    ];
    carveCells.forEach(([r, c]) => {
        if (levelThreeMaze[r] && levelThreeMaze[r][c] === 1) {
            levelThreeMaze[r][c] = 0;
        }
    });
    return levelThreeMaze;
}

function setMazeForLevel(level) {
    maze = buildMazeForLevel(level);
}

function playMusicNote(freq, durationMs) {
    if (!musicContext) return;
    const osc = musicContext.createOscillator();
    const gain = musicContext.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;

    const now = musicContext.currentTime;
    const duration = durationMs / 1000;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(musicContext.destination);
    osc.start(now);
    osc.stop(now + duration);
}

function startMusic() {
    if (musicTimer) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!musicContext) musicContext = new AudioCtx();
    if (musicContext.state === 'suspended') musicContext.resume();

    musicTimer = setInterval(() => {
        const note = MUSIC_PATTERN[musicStep % MUSIC_PATTERN.length];
        playMusicNote(note, 140);
        musicStep++;
    }, 170);
}

function stopMusic() {
    if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
    }
}

// ====== INITIALIZATION FUNCTIONS ======
function initPellets() {
    pellets = [];
    totalPellets = 0;
    const openCells = [];

    for (let row = 0; row < ROWS; row++) {
        pellets[row] = [];
        for (let col = 0; col < COLS; col++) {
            if (maze[row][col] === 0) {
                pellets[row][col] = 1;
                openCells.push({ row, col });
                totalPellets++;
            } else {
                pellets[row][col] = 0;
            }
        }
    }

    for (let i = openCells.length - 1; i > 0; i--) {
        const swapIndex = Math.floor(Math.random() * (i + 1));
        [openCells[i], openCells[swapIndex]] = [openCells[swapIndex], openCells[i]];
    }

    const specialPelletCount = Math.min(SPECIAL_PELLET_COUNT, openCells.length);
    for (let i = 0; i < specialPelletCount; i++) {
        const cell = openCells[i];
        pellets[cell.row][cell.col] = 2;
    }
}

function initGhosts() {
    ghosts = [
        // All 4 start in valid open cells inside the ghost house area (row 8, cols 8-11)
        { x: 8,  y: 8, color: '#ff0000', name: 'Blinky', mode: 'scatter', modeCounter: 0,   moveProgress: 0, lastDir: -1, respawnTimer: 0, visited: new Set(), active: true },
        { x: 9,  y: 8, color: '#ffb8ff', name: 'Pinky',  mode: 'scatter', modeCounter: 75,  moveProgress: 0, lastDir: -1, respawnTimer: 0, visited: new Set(), active: true },
        { x: 10, y: 8, color: '#00ffff', name: 'Inky',   mode: 'scatter', modeCounter: 150, moveProgress: 0, lastDir: -1, respawnTimer: 0, visited: new Set(), active: true },
        { x: 11, y: 8, color: '#ffb847', name: 'Clyde',  mode: 'scatter', modeCounter: 225, moveProgress: 0, lastDir: -1, respawnTimer: 0, visited: new Set(), active: true },
        { x: 12, y: 8, color: '#ff66cc', name: 'Sue',    mode: 'scatter', modeCounter: 300, moveProgress: 0, lastDir: -1, respawnTimer: 0, visited: new Set(), active: false },
        { x: 13, y: 8, color: '#66ff99', name: 'Dinky',  mode: 'scatter', modeCounter: 375, moveProgress: 0, lastDir: -1, respawnTimer: 0, visited: new Set(), active: false }
    ];
}

function updateGhostActivation() {
    const activeGhostCount = Math.min(3 + gameState.level, ghosts.length);
    ghosts.forEach((ghost, index) => {
        ghost.active = index < activeGhostCount;
    });
}

function getMazeTheme() {
    const themes = [
        { wallFill: 'rgba(0, 255, 255, 0.30)', wallStroke: '#00ffff', tunnelFill: 'rgba(0, 255, 255, 0.28)', accent: '#ffff00' },
        { wallFill: 'rgba(255, 140, 0, 0.28)', wallStroke: '#ff8c00', tunnelFill: 'rgba(255, 140, 0, 0.24)', accent: '#ffdd55' },
        { wallFill: 'rgba(120, 255, 120, 0.26)', wallStroke: '#6dff6d', tunnelFill: 'rgba(120, 255, 120, 0.22)', accent: '#ffffff' }
    ];
    return themes[(gameState.level - 1) % themes.length];
}

function loadHighScore() {
    const savedHighScore = Number(localStorage.getItem(HIGH_SCORE_KEY));
    gameState.highScore = Number.isFinite(savedHighScore) ? savedHighScore : 0;
}

function updateHighScore() {
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem(HIGH_SCORE_KEY, String(gameState.highScore));
    }
}

function loadBestTime() {
    const savedBestTime = Number(localStorage.getItem(BEST_TIME_KEY));
    gameState.bestTime = Number.isFinite(savedBestTime) ? savedBestTime : 0;
}

function updateBestTime() {
    if (gameState.elapsedTime <= 0) return;
    if (gameState.bestTime === 0 || gameState.elapsedTime < gameState.bestTime) {
        gameState.bestTime = gameState.elapsedTime;
        localStorage.setItem(BEST_TIME_KEY, String(gameState.bestTime));
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
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

        if (isTunnelRow(pacman.y) && (newX < 0 || newX >= COLS)) {
            pacman.x = newX < 0 ? COLS - 1 : 0;
            pacman.y = TUNNEL_ROW;
            pacman.direction = pacman.nextDirection;
        } else if (canMoveTo(newX, newY)) {
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

            if (isTunnelRow(pacman.y) && (newX < 0 || newX >= COLS)) {
                pacman.x = newX < 0 ? COLS - 1 : 0;
                pacman.y = TUNNEL_ROW;
            } else if (canMoveTo(newX, newY)) {
                pacman.x = newX;
                pacman.y = newY;
            }
        }

        // Handle wrapping at edges
        wrapThroughTunnel(pacman);

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
const GHOST_CHASE_WEIGHTS = [0.12, 0.08, 0.05, 0.02, 0.04, 0.03];

function updateGhosts() {
    ghosts.forEach((ghost, index) => {
        if (!ghost.active) return;
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
        }
    });
}

function checkCollisions() {
    ghosts.forEach(ghost => {
        if (!ghost.active) return;
        if (ghost.respawnTimer > 0) return; // ghost is in cooldown, skip
        if (Math.abs(pacman.x - ghost.x) < 0.5 && Math.abs(pacman.y - ghost.y) < 0.5) {
            if (gameState.powerMode > 0) {
                // Escalating points: 200 → 400 → 800 → 1600
                const points = 200 * Math.pow(2, gameState.ghostsKilledThisPower);
                gameState.score += points;
                gameState.ghostsKilledThisPower++;
                ghost.respawnTimer = GHOST_RESPAWN_FRAMES;
                ghost.x = -999; // move off-screen while waiting
                ghost.y = -999;
            } else {
                gameState.lives--;
                if (gameState.lives <= 0) {
                    endGame('lose');
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
        if (gameState.level >= TOTAL_LEVELS) {
            updateBestTime();
            endGame('win');
        } else {
            nextLevel();
        }
    }
}

function endGame(reason) {
    gameState.gameOver = true;
    gameState.gameRunning = false;
    gameState.paused = false;
    gameState.resumeCountdown = 0;
    gameState.gameOverReason = reason;

    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('gameOverTitle').textContent = reason === 'lose' ? 'GAME OVER - YOU LOSE!' : 'LEVEL COMPLETE!';
    document.getElementById('gameOverScore').textContent = `Score: ${gameState.score}`;
    document.getElementById('gameOverLevel').textContent = `Level: ${gameState.level}`;
    stopMusic();
}

function resetPositions() {
    pacman.x = 10;
    pacman.y = 15;
    ghosts[0].x = 8; ghosts[0].y = 8;
    ghosts[1].x = 9; ghosts[1].y = 8;
    ghosts[2].x = 10; ghosts[2].y = 8;
    ghosts[3].x = 11; ghosts[3].y = 8;
    ghosts[4].x = 12; ghosts[4].y = 8;
    ghosts[5].x = 13; ghosts[5].y = 8;
    gameState.powerMode = 0;
}

function nextLevel() {
    gameState.level++;
    setMazeForLevel(gameState.level);
    pacman.x = 10;
    pacman.y = 15;
    pacman.moveProgress = 0;
    gameState.powerMode = 0;
    gameState.levelIntroCountdown = 150;
    resetPositions();
    updateGhostActivation();
    initPellets();
}

// ====== DRAW FUNCTIONS ======
function draw() {
    if (!ctx) return;

    const theme = getMazeTheme();

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    ctx.strokeStyle = theme.wallStroke;
    ctx.lineWidth = 2;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (maze[row][col] === 1) {
                ctx.fillStyle = theme.wallFill;
                ctx.fillRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
                ctx.strokeRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }

    // Highlight the tunnel row and its side teleport points
    const tunnelY = TUNNEL_ROW * GRID_SIZE;
    ctx.save();
    ctx.strokeStyle = theme.tunnelFill;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(GRID_SIZE, tunnelY + GRID_SIZE / 2);
    ctx.lineTo(canvas.width - GRID_SIZE, tunnelY + GRID_SIZE / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const portalWidth = GRID_SIZE * 1.15;
    const portalHeight = GRID_SIZE * 1.15;
    const portalY = tunnelY - GRID_SIZE * 0.08;
    const leftPortalX = -GRID_SIZE * 0.08;
    const rightPortalX = canvas.width - portalWidth + GRID_SIZE * 0.08;

    ctx.fillStyle = theme.tunnelFill;
    ctx.fillRect(leftPortalX, portalY, portalWidth, portalHeight);
    ctx.fillRect(rightPortalX, portalY, portalWidth, portalHeight);

    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(leftPortalX, portalY, portalWidth, portalHeight);
    ctx.strokeRect(rightPortalX, portalY, portalWidth, portalHeight);

    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↔', GRID_SIZE / 2, tunnelY + GRID_SIZE / 2);
    ctx.fillText('↔', canvas.width - GRID_SIZE / 2, tunnelY + GRID_SIZE / 2);
    ctx.restore();

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
    const powerWarning = gameState.powerMode > 0 && gameState.powerMode < 120;
    ghosts.forEach(ghost => {
        if (!ghost.active) return;
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

    // Draw level intro overlay (before each level, including level 1)
    if (gameState.gameRunning && gameState.levelIntroCountdown > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 56px Arial';
        ctx.fillText(`LEVEL ${gameState.level}`, canvas.width / 2, canvas.height / 2 - 10);

        const levelSecs = Math.ceil(gameState.levelIntroCountdown / 60);
        ctx.font = 'bold 40px Arial';
        ctx.fillText(levelSecs, canvas.width / 2, canvas.height / 2 + 52);
    }
}

function updateUI() {
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('highScoreDisplay').textContent = gameState.highScore;
    document.getElementById('timeDisplay').textContent = formatTime(gameState.elapsedTime);
    document.getElementById('bestTimeDisplay').textContent = gameState.bestTime ? formatTime(gameState.bestTime) : '--:--';
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

    if (gameState.gameRunning && !gameState.paused && gameState.levelIntroCountdown > 0) {
        gameState.levelIntroCountdown--;
    }

    // Only update game logic when running and not paused and not in level intro
    if (gameState.gameRunning && !gameState.paused && gameState.resumeCountdown === 0 && gameState.levelIntroCountdown === 0) {
        gameState.elapsedTime = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
        updatePacman();
        updateGhosts();
        checkCollisions();
        spawnFruit();
        checkLevelComplete();

        if (gameState.powerMode > 0) {
            gameState.powerMode--;
        }
        updateHighScore();
    }

    draw();
    updateUI();
    requestAnimationFrame(gameLoop);
}

// ====== START GAME FUNCTION ======
function startNewGame() {
    if (!canvas || !ctx) {
        return;
    }
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
    gameState.levelIntroCountdown = 180;
    gameState.gameOverReason = '';
    gameState.gameStartTime = Date.now();
    gameState.elapsedTime = 0;

    setMazeForLevel(gameState.level);
    startMusic();

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
        g.active = i < 4;
        if (i === 0) { g.x = 8;  g.y = 8; g.modeCounter = 0;   }
        else if (i === 1) { g.x = 9;  g.y = 8; g.modeCounter = 75;  }
        else if (i === 2) { g.x = 10; g.y = 8; g.modeCounter = 150; }
        else if (i === 3) { g.x = 11; g.y = 8; g.modeCounter = 225; }
        else if (i === 4) { g.x = 12; g.y = 8; g.modeCounter = 300; }
        else              { g.x = 13; g.y = 8; g.modeCounter = 375; }
    });

    fruit = null;
    updateGhostActivation();
    updateHighScore();
    initPellets();
}

// ====== SETUP ON DOM READY ======
function setupGame() {
    // Get canvas
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        return;
    }

    ctx = canvas.getContext('2d');
    COLS = canvas.width / GRID_SIZE;
    ROWS = canvas.height / GRID_SIZE;

    // Initialize game objects
    loadHighScore();
    loadBestTime();
    setMazeForLevel(1);
    initGhosts();
    initPellets();
    updateGhostActivation();

    // Register spacebar listener
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ') {
            if (e.repeat) return;
            e.preventDefault();

            if (!gameState.gameRunning) {
                startNewGame();
            } else if (gameState.paused && gameState.resumeCountdown === 0) {
                // Paused and not counting down — start countdown
                gameState.resumeCountdown = 180;
            } else if (!gameState.paused && gameState.resumeCountdown === 0) {
                // Playing — pause now
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
    gameLoop();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGame);
} else {
    setupGame();
}
