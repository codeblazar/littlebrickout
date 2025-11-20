const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Sound Manager
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {
    paddle: { freq: 440, type: 'square', duration: 0.1 },
    brick: { freq: 880, type: 'square', duration: 0.05 },
    wall: { freq: 220, type: 'square', duration: 0.05 },
    die: { freq: 110, type: 'sawtooth', duration: 0.5 },
    win: { freq: 1760, type: 'sine', duration: 0.5 }
};

function playSound(name) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const sound = sounds[name];
    if (!sound) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = sound.type;
    osc.frequency.setValueAtTime(sound.freq, audioCtx.currentTime);

    // Simple envelope
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + sound.duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + sound.duration);
}

// Game State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let lives = 3;
let animationId;
let lastTime = 0;

// Input
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

// Event Listeners
window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') keys.ArrowRight = true;
    if (e.code === 'Space') {
        keys.Space = true;
        handleInput();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') keys.ArrowRight = false;
    if (e.code === 'Space') keys.Space = false;
});

// Touch Events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'START' || gameState === 'GAMEOVER') {
        handleInput();
    } else if (gameState === 'PLAYING') {
        updatePaddlePos(e.touches[0].clientX);
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') {
        updatePaddlePos(e.touches[0].clientX);
    }
}, { passive: false });

function updatePaddlePos(clientX) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const canvasX = (clientX - rect.left) * scaleX;

    paddle.x = canvasX - paddle.width / 2;

    // Clamp paddle position
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
}

function handleInput() {
    if (gameState === 'START') {
        startGame();
    } else if (gameState === 'GAMEOVER') {
        resetGame();
    }
}

// Game Objects
const paddle = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    width: 100,
    height: 15,
    speed: 700, // pixels per second
    color: '#00f3ff',
    dx: 0
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height - 40,
    radius: 8,
    speed: 300, // pixels per second
    dx: 300,
    dy: -300,
    color: '#fff'
};

const brickInfo = {
    w: 70,
    h: 20,
    padding: 10,
    offsetX: 45,
    offsetY: 60,
    visible: true
};

let bricks = [];
const brickRows = 5;
const brickCols = 9;

function createBricks() {
    bricks = [];
    for (let r = 0; r < brickRows; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickCols; c++) {
            const x = c * (brickInfo.w + brickInfo.padding) + brickInfo.offsetX;
            const y = r * (brickInfo.h + brickInfo.padding) + brickInfo.offsetY;
            bricks[r][c] = { x, y, ...brickInfo, color: getBrickColor(r) };
        }
    }
}

function getBrickColor(row) {
    const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff'];
    return colors[row % colors.length];
}

createBricks();

function startGame() {
    gameState = 'PLAYING';
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.remove('active');
    if (bricks.length === 0) createBricks(); // Ensure bricks exist
    lastTime = performance.now();
    gameLoop(lastTime);
}

function resetGame() {
    score = 0;
    lives = 3;
    ball.speed = 300;
    paddle.speed = 700;
    updateHUD();
    resetBallPaddle();
    createBricks();
    startGame();
}

function resetBallPaddle() {
    paddle.x = canvas.width / 2 - paddle.width / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 40;
    ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -ball.speed;
}

function update(deltaTime) {
    if (gameState !== 'PLAYING') return;

    // Paddle Movement
    if (keys.ArrowLeft && paddle.x > 0) {
        paddle.x -= paddle.speed * deltaTime;
    }
    if (keys.ArrowRight && paddle.x + paddle.width < canvas.width) {
        paddle.x += paddle.speed * deltaTime;
    }

    // Ball Movement
    ball.x += ball.dx * deltaTime;
    ball.y += ball.dy * deltaTime;
    updateBallColor();

    // Wall Collision
    if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.dx *= -1;
        playSound('wall');
    } else if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.dx *= -1;
        playSound('wall');
    }
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy *= -1;
        playSound('wall');
    }

    // Paddle Collision
    if (
        ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
    ) {
        // Calculate impact point for angle variation
        const collidePoint = ball.x - (paddle.x + paddle.width / 2);
        const normalizedCollidePoint = collidePoint / (paddle.width / 2);
        const angle = normalizedCollidePoint * (Math.PI / 3); // Max 60 degrees

        ball.dx = ball.speed * Math.sin(angle);
        ball.dy = -ball.speed * Math.cos(angle);

        // Speed up slightly on paddle hit
        ball.speed += 5;
        playSound('paddle');
    }

    // Brick Collision
    let activeBricksCount = 0;
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.visible) {
                activeBricksCount++;
                if (
                    ball.x + ball.radius > brick.x &&
                    ball.x - ball.radius < brick.x + brick.w &&
                    ball.y + ball.radius > brick.y &&
                    ball.y - ball.radius < brick.y + brick.h
                ) {
                    ball.dy *= -1;
                    brick.visible = false;
                    score += 10;
                    updateHUD();
                    playSound('brick');
                }
            }
        });
    });

    if (activeBricksCount === 0) {
        playSound('win');
        createBricks();
        ball.speed += 25;
        paddle.speed += 25;
        resetBallPaddle();
    }

    // Floor Collision (Death)
    if (ball.y - ball.radius > canvas.height) {
        lives--;
        playSound('die');
        updateHUD();
        if (lives <= 0) {
            gameOver();
        } else {
            resetBallPaddle();
        }
    }
}

function draw() {
    // Clear Canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Bricks
    bricks.forEach(row => {
        row.forEach(brick => {
            if (brick.visible) {
                ctx.fillStyle = brick.color;
                ctx.shadowBlur = 5;
                ctx.shadowColor = brick.color;
                ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
                ctx.shadowBlur = 0;
            }
        });
    });

    // Draw Paddle
    ctx.fillStyle = paddle.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;

    // Draw Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
}

function gameLoop(timestamp) {
    if (gameState === 'PLAYING') {
        const deltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        update(deltaTime);
        draw();
        animationId = requestAnimationFrame(gameLoop);
    }
}

function gameOver() {
    gameState = 'GAMEOVER';
    document.getElementById('game-over-screen').classList.add('active');
    document.getElementById('final-score').textContent = score;
    saveHighScore(score);
    displayHighScores();
    cancelAnimationFrame(animationId);
}

function saveHighScore(newScore) {
    const highScores = getHighScores();
    highScores.push(newScore);
    highScores.sort((a, b) => b - a);
    highScores.splice(5); // Keep top 5
    localStorage.setItem('littleBrickOutHighScores', JSON.stringify(highScores));
}

function getHighScores() {
    const scores = localStorage.getItem('littleBrickOutHighScores');
    return scores ? JSON.parse(scores) : [];
}

function displayHighScores() {
    const highScores = getHighScores();
    const highScoreList = document.getElementById('high-score-list');
    highScoreList.innerHTML = highScores
        .map(score => `<li>${score}</li>`)
        .join('');
}

function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
}

function updateBallColor() {
    if (ball.speed < 400) {
        ball.color = '#fff'; // White
    } else if (ball.speed < 500) {
        ball.color = '#ffff00'; // Yellow
    } else if (ball.speed < 600) {
        ball.color = '#ff7f00'; // Orange
    } else {
        ball.color = '#ff0000'; // Red
    }
}

// Initial Draw
draw();
