/**
 * =========================================
 * BALON HURUF - Balloon Pop Letter Game
 * Pop balloons with the correct letter!
 * =========================================
 */

// Game Configuration
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 500,
    BALLOON_RADIUS: 45,
    BALLOON_SPEED_MIN: 1,
    BALLOON_SPEED_MAX: 2,
    SPAWN_INTERVAL: 1500,
    MAX_BALLOONS: 8,
    LIVES: 3,
    POINTS_PER_POP: 10,
    LEVEL_UP_SCORE: 50
};

// Balloon Colors (Gradient pairs)
const BALLOON_COLORS = [
    { main: '#ff6b6b', shadow: '#ee5a5a' },
    { main: '#feca57', shadow: '#f9b635' },
    { main: '#48dbfb', shadow: '#33c9ec' },
    { main: '#ff9ff3', shadow: '#f77fe8' },
    { main: '#54a0ff', shadow: '#3d8bff' },
    { main: '#5f27cd', shadow: '#4a1fb3' },
    { main: '#00d2d3', shadow: '#00b8b9' },
    { main: '#ff6b81', shadow: '#ee5a70' }
];

// Game State
const BalloonGame = {
    canvas: null,
    ctx: null,
    balloons: [],
    score: 0,
    lives: CONFIG.LIVES,
    level: 1,
    targetLetter: '',
    isPlaying: false,
    lastSpawn: 0,
    animationId: null,

    // DOM Elements
    elements: {}
};

// Audio System
const BalloonAudio = {
    context: null,

    init() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    },

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.context) this.init();

        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(volume, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        } catch (e) {
            console.log('Audio error:', e);
        }
    },

    playPop() {
        // Pop sound
        this.playTone(400, 0.1, 'sine', 0.4);
        setTimeout(() => this.playTone(200, 0.1, 'sine', 0.2), 50);
    },

    playCorrect() {
        setTimeout(() => this.playTone(523.25, 0.12, 'sine', 0.4), 0);
        setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.4), 100);
        setTimeout(() => this.playTone(783.99, 0.2, 'sine', 0.4), 200);
    },

    playWrong() {
        this.playTone(200, 0.3, 'sawtooth', 0.2);
    },

    playLevelUp() {
        [523.25, 587.33, 659.25, 698.46, 783.99].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.3), i * 80);
        });
    },

    playGameOver() {
        [400, 350, 300, 250].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'triangle', 0.3), i * 150);
        });
    }
};

/**
 * Balloon class
 */
class Balloon {
    constructor(letter, x) {
        this.letter = letter;
        this.x = x;
        this.y = CONFIG.CANVAS_HEIGHT + CONFIG.BALLOON_RADIUS;
        this.radius = CONFIG.BALLOON_RADIUS;
        this.speed = CONFIG.BALLOON_SPEED_MIN + Math.random() * (CONFIG.BALLOON_SPEED_MAX - CONFIG.BALLOON_SPEED_MIN);
        this.speed *= (1 + BalloonGame.level * 0.1); // Increase speed with level
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.02 + Math.random() * 0.02;
        this.color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
        this.isPopping = false;
        this.popProgress = 0;
        this.stringWave = 0;
    }

    update() {
        if (this.isPopping) {
            this.popProgress += 0.15;
            return this.popProgress < 1;
        }

        // Move up
        this.y -= this.speed;

        // Wobble side to side
        this.wobbleOffset += this.wobbleSpeed;
        this.x += Math.sin(this.wobbleOffset) * 0.5;

        // String wave
        this.stringWave += 0.1;

        return this.y > -this.radius;
    }

    draw(ctx) {
        ctx.save();

        if (this.isPopping) {
            // Pop animation
            const scale = 1 + this.popProgress * 0.5;
            const alpha = 1 - this.popProgress;
            ctx.globalAlpha = alpha;
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);
            ctx.translate(-this.x, -this.y);
        }

        // Draw balloon string
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.radius);
        ctx.quadraticCurveTo(
            this.x + Math.sin(this.stringWave) * 10,
            this.y + this.radius + 30,
            this.x + Math.sin(this.stringWave) * 5,
            this.y + this.radius + 50
        );
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw balloon body (oval shape)
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius * 0.85, this.radius, 0, 0, Math.PI * 2);

        // Gradient fill
        const gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            0,
            this.x,
            this.y,
            this.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, this.color.main);
        gradient.addColorStop(1, this.color.shadow);

        ctx.fillStyle = gradient;
        ctx.fill();

        // Balloon knot
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y + this.radius - 5);
        ctx.lineTo(this.x, this.y + this.radius + 8);
        ctx.lineTo(this.x + 5, this.y + this.radius - 5);
        ctx.closePath();
        ctx.fillStyle = this.color.shadow;
        ctx.fill();

        // Shine effect
        ctx.beginPath();
        ctx.ellipse(
            this.x - this.radius * 0.35,
            this.y - this.radius * 0.35,
            this.radius * 0.2,
            this.radius * 0.15,
            -Math.PI / 4,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        // Draw letter
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${this.radius * 0.9}px Fredoka`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.fillText(this.letter, this.x, this.y + 2);

        ctx.restore();
    }

    containsPoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return (dx * dx + dy * dy) <= (this.radius * this.radius);
    }

    pop() {
        this.isPopping = true;
        BalloonAudio.playPop();
    }
}

/**
 * Particle for pop effect
 */
class PopParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.color = color;
        this.life = 1;
        this.size = 5 + Math.random() * 10;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3; // Gravity
        this.life -= 0.03;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Particles array
let particles = [];

/**
 * Initialize the game
 */
function initGame() {
    // Get canvas and context
    BalloonGame.canvas = document.getElementById('gameCanvas');
    BalloonGame.ctx = BalloonGame.canvas.getContext('2d');

    // Responsive canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Get DOM elements
    BalloonGame.elements = {
        score: document.getElementById('score'),
        lives: document.getElementById('lives'),
        level: document.getElementById('level'),
        target: document.getElementById('target'),
        startOverlay: document.getElementById('startOverlay'),
        startBtn: document.getElementById('startBtn'),
        gameOverModal: document.getElementById('gameOverModal'),
        modalIcon: document.getElementById('modalIcon'),
        modalTitle: document.getElementById('modalTitle'),
        finalScore: document.getElementById('finalScore'),
        finalLevel: document.getElementById('finalLevel'),
        restartBtn: document.getElementById('restartBtn')
    };

    // Event listeners
    BalloonGame.elements.startBtn.addEventListener('click', startGame);
    BalloonGame.elements.restartBtn.addEventListener('click', restartGame);

    // Canvas click/touch handlers
    BalloonGame.canvas.addEventListener('click', handleCanvasClick);
    BalloonGame.canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });

    // Initialize audio on interaction
    document.addEventListener('click', () => BalloonAudio.init(), { once: true });
}

/**
 * Resize canvas to fit screen
 */
function resizeCanvas() {
    const container = BalloonGame.canvas.parentElement;
    const containerWidth = container.clientWidth || window.innerWidth - 20;
    const maxWidth = Math.min(CONFIG.CANVAS_WIDTH, containerWidth);
    const scale = maxWidth / CONFIG.CANVAS_WIDTH;

    // Update canvas display size
    BalloonGame.canvas.style.width = `${maxWidth}px`;
    BalloonGame.canvas.style.height = `${CONFIG.CANVAS_HEIGHT * scale}px`;
}

/**
 * Get canvas coordinates from event
 */
function getCanvasCoords(event) {
    const rect = BalloonGame.canvas.getBoundingClientRect();
    const scaleX = BalloonGame.canvas.width / rect.width;
    const scaleY = BalloonGame.canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

/**
 * Handle canvas click
 */
function handleCanvasClick(event) {
    if (!BalloonGame.isPlaying) return;

    const coords = getCanvasCoords(event);
    checkBalloonHit(coords.x, coords.y);
}

/**
 * Handle canvas touch
 */
function handleCanvasTouch(event) {
    if (!BalloonGame.isPlaying) return;
    event.preventDefault();

    const touch = event.touches[0];
    const coords = getCanvasCoords(touch);
    checkBalloonHit(coords.x, coords.y);
}

/**
 * Check if a balloon was hit
 */
function checkBalloonHit(x, y) {
    for (let i = BalloonGame.balloons.length - 1; i >= 0; i--) {
        const balloon = BalloonGame.balloons[i];

        if (!balloon.isPopping && balloon.containsPoint(x, y)) {
            // Check if correct letter
            if (balloon.letter === BalloonGame.targetLetter) {
                handleCorrectPop(balloon, i);
            } else {
                handleWrongPop(balloon);
            }
            break;
        }
    }
}

/**
 * Handle correct balloon pop
 */
function handleCorrectPop(balloon, index) {
    balloon.pop();

    // Create particles
    for (let i = 0; i < 15; i++) {
        particles.push(new PopParticle(balloon.x, balloon.y, balloon.color.main));
    }

    // Update score
    BalloonGame.score += CONFIG.POINTS_PER_POP;
    updateDisplay();

    // Play correct sound
    BalloonAudio.playCorrect();

    // Check for level up
    if (BalloonGame.score >= BalloonGame.level * CONFIG.LEVEL_UP_SCORE) {
        levelUp();
    }

    // Generate new target
    setTimeout(() => {
        generateNewTarget();
    }, 500);
}

/**
 * Handle wrong balloon pop
 */
function handleWrongPop(balloon) {
    BalloonGame.lives--;
    updateDisplay();

    BalloonAudio.playWrong();

    // Shake effect
    BalloonGame.canvas.style.animation = 'none';
    BalloonGame.canvas.offsetHeight;
    BalloonGame.canvas.style.animation = 'shake 0.3s ease';

    if (BalloonGame.lives <= 0) {
        gameOver();
    }
}

/**
 * Level up
 */
function levelUp() {
    BalloonGame.level++;
    updateDisplay();
    BalloonAudio.playLevelUp();

    // Show level up text
    showFloatingText('Level Up! 🎉', BalloonGame.canvas.width / 2, BalloonGame.canvas.height / 2);
}

/**
 * Show floating text
 */
function showFloatingText(text, x, y) {
    const ctx = BalloonGame.ctx;

    let alpha = 1;
    let offsetY = 0;

    function animate() {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 40px Fredoka';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(text, x, y + offsetY);
        ctx.restore();

        alpha -= 0.02;
        offsetY -= 2;

        if (alpha > 0) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

/**
 * Start the game
 */
function startGame() {
    BalloonGame.elements.startOverlay.classList.add('hidden');
    BalloonGame.isPlaying = true;

    generateNewTarget();
    gameLoop();
}

/**
 * Restart the game
 */
function restartGame() {
    BalloonGame.elements.gameOverModal.classList.remove('active');

    // Reset state
    BalloonGame.balloons = [];
    BalloonGame.score = 0;
    BalloonGame.lives = CONFIG.LIVES;
    BalloonGame.level = 1;
    particles = [];

    updateDisplay();
    startGame();
}

/**
 * Game over
 */
function gameOver() {
    BalloonGame.isPlaying = false;

    if (BalloonGame.animationId) {
        cancelAnimationFrame(BalloonGame.animationId);
    }

    BalloonAudio.playGameOver();

    // Update modal
    BalloonGame.elements.finalScore.textContent = BalloonGame.score;
    BalloonGame.elements.finalLevel.textContent = BalloonGame.level;

    if (BalloonGame.score >= 100) {
        BalloonGame.elements.modalIcon.textContent = '🏆';
        BalloonGame.elements.modalTitle.textContent = 'Luar Biasa!';
    } else if (BalloonGame.score >= 50) {
        BalloonGame.elements.modalIcon.textContent = '🎉';
        BalloonGame.elements.modalTitle.textContent = 'Hebat!';
    } else {
        BalloonGame.elements.modalIcon.textContent = '💪';
        BalloonGame.elements.modalTitle.textContent = 'Ayo Coba Lagi!';
    }

    setTimeout(() => {
        BalloonGame.elements.gameOverModal.classList.add('active');
    }, 500);
}

/**
 * Generate new target letter
 */
function generateNewTarget() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    BalloonGame.targetLetter = letters[Math.floor(Math.random() * letters.length)];

    // Animate target update
    const targetEl = BalloonGame.elements.target;
    targetEl.style.transform = 'scale(0)';

    setTimeout(() => {
        targetEl.textContent = BalloonGame.targetLetter;
        targetEl.style.transform = 'scale(1)';
    }, 150);
}

/**
 * Spawn a new balloon
 */
function spawnBalloon() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // 30% chance to spawn target letter
    let letter;
    if (Math.random() < 0.3) {
        letter = BalloonGame.targetLetter;
    } else {
        letter = letters[Math.floor(Math.random() * letters.length)];
    }

    // Random x position
    const padding = CONFIG.BALLOON_RADIUS + 20;
    const x = padding + Math.random() * (CONFIG.CANVAS_WIDTH - padding * 2);

    BalloonGame.balloons.push(new Balloon(letter, x));
}

/**
 * Update display
 */
function updateDisplay() {
    BalloonGame.elements.score.textContent = BalloonGame.score;
    BalloonGame.elements.lives.textContent = BalloonGame.lives;
    BalloonGame.elements.level.textContent = BalloonGame.level;
}

/**
 * Main game loop
 */
function gameLoop(timestamp = 0) {
    if (!BalloonGame.isPlaying) return;

    const ctx = BalloonGame.ctx;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#98D8E8');
    gradient.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Draw clouds
    drawClouds(ctx);

    // Spawn balloons
    if (timestamp - BalloonGame.lastSpawn > CONFIG.SPAWN_INTERVAL / (1 + BalloonGame.level * 0.1)) {
        if (BalloonGame.balloons.length < CONFIG.MAX_BALLOONS + BalloonGame.level) {
            spawnBalloon();
        }
        BalloonGame.lastSpawn = timestamp;
    }

    // Update and draw balloons
    BalloonGame.balloons = BalloonGame.balloons.filter(balloon => {
        const alive = balloon.update();
        if (alive) {
            balloon.draw(ctx);
        }
        return alive;
    });

    // Update and draw particles
    particles = particles.filter(particle => {
        const alive = particle.update();
        if (alive) {
            particle.draw(ctx);
        }
        return alive;
    });

    BalloonGame.animationId = requestAnimationFrame(gameLoop);
}

/**
 * Draw decorative clouds
 */
function drawClouds(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    // Cloud 1
    drawCloud(ctx, 100, 80, 0.8);

    // Cloud 2
    drawCloud(ctx, 400, 120, 1);

    // Cloud 3
    drawCloud(ctx, 650, 60, 0.7);
}

function drawCloud(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.arc(35, 0, 35, 0, Math.PI * 2);
    ctx.arc(70, 0, 30, 0, Math.PI * 2);
    ctx.arc(20, -20, 25, 0, Math.PI * 2);
    ctx.arc(50, -20, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Add shake animation
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-10px); }
        40% { transform: translateX(10px); }
        60% { transform: translateX(-10px); }
        80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(shakeStyle);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
