/**
 * ROKET ANTIGRAVITY - Flappy Rocket Educational Game
 */

const CONFIG = {
    WIDTH: 700,
    HEIGHT: 450,
    GRAVITY: 0.4,
    THRUST: -7,
    ROCKET_SIZE: 40,
    OBSTACLE_SPEED: 3,
    SPAWN_INTERVAL: 2000
};

const RoketGame = {
    canvas: null,
    ctx: null,
    rocket: { x: 100, y: 200, vy: 0, angle: 0 },
    obstacles: [],
    stars: [],
    score: 0,
    lives: 3,
    level: 1,
    targetLetter: 'A',
    isPlaying: false,
    lastSpawn: 0,
    animationId: null,
    elements: {}
};

const RoketAudio = {
    context: null,
    init() { this.context = new (window.AudioContext || window.webkitAudioContext)(); },
    playTone(freq, dur, type = 'sine') {
        if (!this.context) this.init();
        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.connect(gain);
            gain.connect(this.context.destination);
            osc.frequency.value = freq;
            osc.type = type;
            gain.gain.setValueAtTime(0.2, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + dur);
            osc.start(this.context.currentTime);
            osc.stop(this.context.currentTime + dur);
        } catch (e) { }
    },
    playThrust() { this.playTone(150, 0.1, 'sawtooth'); },
    playCollect() {
        setTimeout(() => this.playTone(523, 0.1), 0);
        setTimeout(() => this.playTone(659, 0.1), 80);
        setTimeout(() => this.playTone(784, 0.15), 160);
    },
    playHit() { this.playTone(150, 0.3, 'square'); },
    playGameOver() {
        [400, 350, 300].forEach((f, i) => setTimeout(() => this.playTone(f, 0.2, 'triangle'), i * 150));
    }
};

class Obstacle {
    constructor(letter, isTarget) {
        this.x = CONFIG.WIDTH + 30;
        this.y = 50 + Math.random() * (CONFIG.HEIGHT - 150);
        this.letter = letter;
        this.isTarget = isTarget;
        this.size = 50;
        this.collected = false;
    }

    update() {
        this.x -= CONFIG.OBSTACLE_SPEED + RoketGame.level * 0.3;
        return this.x > -this.size;
    }

    draw(ctx) {
        if (this.collected) return;

        // Draw bubble
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);

        if (this.isTarget) {
            ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
            ctx.strokeStyle = '#16a34a';
        } else {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.strokeStyle = '#dc2626';
        }

        ctx.fill();
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw shine
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 10, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        // Draw letter
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Fredoka';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.letter, this.x, this.y + 2);
    }

    checkCollision(rocket) {
        const dx = this.x - rocket.x;
        const dy = this.y - rocket.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (this.size / 2 + CONFIG.ROCKET_SIZE / 2 - 5);
    }
}

function initGame() {
    RoketGame.canvas = document.getElementById('gameCanvas');
    RoketGame.ctx = RoketGame.canvas.getContext('2d');

    RoketGame.elements = {
        score: document.getElementById('score'),
        lives: document.getElementById('lives'),
        level: document.getElementById('level'),
        targetLetter: document.getElementById('targetLetter'),
        startOverlay: document.getElementById('startOverlay'),
        startBtn: document.getElementById('startBtn'),
        gameOverModal: document.getElementById('gameOverModal'),
        finalScore: document.getElementById('finalScore'),
        restartBtn: document.getElementById('restartBtn')
    };

    // Create background stars
    for (let i = 0; i < 50; i++) {
        RoketGame.stars.push({
            x: Math.random() * CONFIG.WIDTH,
            y: Math.random() * CONFIG.HEIGHT,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 1 + 0.5
        });
    }

    // Resize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Event listeners
    RoketGame.elements.startBtn.addEventListener('click', startGame);
    RoketGame.elements.restartBtn.addEventListener('click', restartGame);

    RoketGame.canvas.addEventListener('click', handleThrust);
    RoketGame.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleThrust(); }, { passive: false });
    document.addEventListener('keydown', (e) => { if (e.code === 'Space') handleThrust(); });

    document.addEventListener('click', () => RoketAudio.init(), { once: true });
}

function resizeCanvas() {
    const maxWidth = Math.min(CONFIG.WIDTH, window.innerWidth - 40);
    const scale = maxWidth / CONFIG.WIDTH;
    RoketGame.canvas.style.width = `${CONFIG.WIDTH * scale}px`;
    RoketGame.canvas.style.height = `${CONFIG.HEIGHT * scale}px`;
}

function handleThrust() {
    if (!RoketGame.isPlaying) return;
    RoketGame.rocket.vy = CONFIG.THRUST;
    RoketAudio.playThrust();
}

function startGame() {
    RoketGame.elements.startOverlay.classList.add('hidden');
    RoketGame.isPlaying = true;
    generateNewTarget();
    gameLoop();
}

function restartGame() {
    RoketGame.elements.gameOverModal.classList.remove('active');
    RoketGame.rocket = { x: 100, y: 200, vy: 0, angle: 0 };
    RoketGame.obstacles = [];
    RoketGame.score = 0;
    RoketGame.lives = 3;
    RoketGame.level = 1;
    RoketGame.lastSpawn = 0;
    updateDisplay();
    startGame();
}

function generateNewTarget() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    RoketGame.targetLetter = letters[Math.floor(Math.random() * letters.length)];
    RoketGame.elements.targetLetter.textContent = RoketGame.targetLetter;
}

function spawnObstacle() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // 40% chance for target letter
    if (Math.random() < 0.4) {
        RoketGame.obstacles.push(new Obstacle(RoketGame.targetLetter, true));
    } else {
        let letter;
        do {
            letter = letters[Math.floor(Math.random() * letters.length)];
        } while (letter === RoketGame.targetLetter);
        RoketGame.obstacles.push(new Obstacle(letter, false));
    }
}

function updateDisplay() {
    RoketGame.elements.score.textContent = RoketGame.score;
    RoketGame.elements.lives.textContent = RoketGame.lives;
    RoketGame.elements.level.textContent = RoketGame.level;
}

function gameOver() {
    RoketGame.isPlaying = false;
    cancelAnimationFrame(RoketGame.animationId);
    RoketAudio.playGameOver();
    RoketGame.elements.finalScore.textContent = RoketGame.score;
    setTimeout(() => RoketGame.elements.gameOverModal.classList.add('active'), 500);
}

function gameLoop(timestamp = 0) {
    if (!RoketGame.isPlaying) return;

    const ctx = RoketGame.ctx;
    const rocket = RoketGame.rocket;

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.HEIGHT);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#24243e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    // Draw and update stars
    RoketGame.stars.forEach(star => {
        star.x -= star.speed;
        if (star.x < 0) star.x = CONFIG.WIDTH;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.random() * 0.5})`;
        ctx.fill();
    });

    // Update rocket physics
    rocket.vy += CONFIG.GRAVITY;
    rocket.y += rocket.vy;
    rocket.angle = Math.min(Math.max(rocket.vy * 3, -30), 30);

    // Keep rocket in bounds
    if (rocket.y < CONFIG.ROCKET_SIZE) {
        rocket.y = CONFIG.ROCKET_SIZE;
        rocket.vy = 0;
    }
    if (rocket.y > CONFIG.HEIGHT - CONFIG.ROCKET_SIZE) {
        rocket.y = CONFIG.HEIGHT - CONFIG.ROCKET_SIZE;
        rocket.vy = 0;
    }

    // Draw rocket
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(rocket.angle * Math.PI / 180);

    // Rocket body
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(-15, -15);
    ctx.lineTo(-15, 15);
    ctx.closePath();
    ctx.fill();

    // Rocket window
    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Rocket flame
    if (rocket.vy < 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-15, -8);
        ctx.lineTo(-30 - Math.random() * 10, 0);
        ctx.lineTo(-15, 8);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();

    // Spawn obstacles
    if (timestamp - RoketGame.lastSpawn > CONFIG.SPAWN_INTERVAL - RoketGame.level * 100) {
        spawnObstacle();
        RoketGame.lastSpawn = timestamp;
    }

    // Update and draw obstacles
    RoketGame.obstacles = RoketGame.obstacles.filter(obs => {
        const alive = obs.update();
        obs.draw(ctx);

        // Check collision
        if (!obs.collected && obs.checkCollision(rocket)) {
            obs.collected = true;

            if (obs.isTarget) {
                RoketGame.score += 10;
                RoketAudio.playCollect();

                if (RoketGame.score % 50 === 0) {
                    RoketGame.level++;
                    generateNewTarget();
                }
            } else {
                RoketGame.lives--;
                RoketAudio.playHit();

                if (RoketGame.lives <= 0) {
                    gameOver();
                    return false;
                }
            }
            updateDisplay();
        }

        return alive;
    });

    RoketGame.animationId = requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', initGame);
