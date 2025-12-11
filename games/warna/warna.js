/**
 * TEBAK WARNA - Color Recognition Game
 */

const COLORS = {
    'Merah': { hex: '#ef4444', emoji: '🔴' },
    'Biru': { hex: '#3b82f6', emoji: '🔵' },
    'Kuning': { hex: '#fbbf24', emoji: '🟡' },
    'Hijau': { hex: '#10b981', emoji: '🟢' },
    'Ungu': { hex: '#a855f7', emoji: '🟣' },
    'Orange': { hex: '#f97316', emoji: '🟠' },
    'Pink': { hex: '#ec4899', emoji: '🩷' },
    'Coklat': { hex: '#92400e', emoji: '🟤' }
};

const WarnaGame = {
    score: 0,
    lives: 3,
    level: 1,
    currentColor: null,
    isPlaying: false,
    elements: {}
};

const WarnaAudio = {
    context: null,
    init() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    },
    playTone(freq, dur, type = 'sine', vol = 0.3) {
        if (!this.context) this.init();
        try {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.connect(gain);
            gain.connect(this.context.destination);
            osc.frequency.value = freq;
            osc.type = type;
            gain.gain.setValueAtTime(vol, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + dur);
            osc.start(this.context.currentTime);
            osc.stop(this.context.currentTime + dur);
        } catch (e) { }
    },
    playCorrect() {
        setTimeout(() => this.playTone(523, 0.1), 0);
        setTimeout(() => this.playTone(659, 0.1), 100);
        setTimeout(() => this.playTone(784, 0.15), 200);
    },
    playWrong() {
        this.playTone(200, 0.3, 'sawtooth', 0.2);
    },
    playLevelUp() {
        [523, 587, 659, 698, 784].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.15), i * 80);
        });
    }
};

function initGame() {
    WarnaGame.elements = {
        score: document.getElementById('score'),
        lives: document.getElementById('lives'),
        level: document.getElementById('level'),
        colorDisplay: document.getElementById('colorDisplay'),
        colorOptions: document.getElementById('colorOptions'),
        gameOverModal: document.getElementById('gameOverModal'),
        modalTitle: document.getElementById('modalTitle'),
        finalScore: document.getElementById('finalScore'),
        restartBtn: document.getElementById('restartBtn')
    };

    WarnaGame.elements.restartBtn.addEventListener('click', restartGame);
    document.addEventListener('click', () => WarnaAudio.init(), { once: true });

    startGame();
}

function startGame() {
    WarnaGame.isPlaying = true;
    generateQuestion();
}

function restartGame() {
    WarnaGame.elements.gameOverModal.classList.remove('active');
    WarnaGame.score = 0;
    WarnaGame.lives = 3;
    WarnaGame.level = 1;
    updateDisplay();
    startGame();
}

function generateQuestion() {
    if (!WarnaGame.isPlaying) return;

    // Pick random color
    const colorNames = Object.keys(COLORS);
    const correctColor = colorNames[Math.floor(Math.random() * colorNames.length)];
    WarnaGame.currentColor = correctColor;

    // Display color
    const colorData = COLORS[correctColor];
    WarnaGame.elements.colorDisplay.style.background = colorData.hex;
    WarnaGame.elements.colorDisplay.textContent = colorData.emoji;

    // Generate options (3-4 based on level)
    const numOptions = WarnaGame.level <= 2 ? 3 : 4;
    const options = [correctColor];

    while (options.length < numOptions) {
        const randomColor = colorNames[Math.floor(Math.random() * colorNames.length)];
        if (!options.includes(randomColor)) {
            options.push(randomColor);
        }
    }

    // Shuffle options
    options.sort(() => Math.random() - 0.5);

    // Create buttons
    WarnaGame.elements.colorOptions.innerHTML = '';
    options.forEach(colorName => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.textContent = colorName;
        btn.style.background = COLORS[colorName].hex;
        btn.addEventListener('click', () => checkAnswer(colorName, btn));
        WarnaGame.elements.colorOptions.appendChild(btn);
    });
}

function checkAnswer(selectedColor, btn) {
    if (!WarnaGame.isPlaying) return;

    const isCorrect = selectedColor === WarnaGame.currentColor;

    if (isCorrect) {
        btn.classList.add('correct');
        WarnaAudio.playCorrect();
        WarnaGame.score += 10;
        updateDisplay();

        // Show confetti
        createConfetti();

        // Check level up
        if (WarnaGame.score >= WarnaGame.level * 50) {
            WarnaGame.level++;
            WarnaAudio.playLevelUp();
            updateDisplay();
        }

        setTimeout(() => {
            generateQuestion();
        }, 1000);
    } else {
        btn.classList.add('wrong');
        WarnaAudio.playWrong();
        WarnaGame.lives--;
        updateDisplay();

        if (WarnaGame.lives <= 0) {
            gameOver();
        } else {
            setTimeout(() => {
                btn.classList.remove('wrong');
            }, 500);
        }
    }
}

function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        document.body.appendChild(confetti);

        const fall = confetti.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: 2000 + Math.random() * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        fall.onfinish = () => confetti.remove();
    }
}

function updateDisplay() {
    WarnaGame.elements.score.textContent = WarnaGame.score;
    WarnaGame.elements.lives.textContent = WarnaGame.lives;
    WarnaGame.elements.level.textContent = WarnaGame.level;
}

function gameOver() {
    WarnaGame.isPlaying = false;
    WarnaGame.elements.finalScore.textContent = WarnaGame.score;

    if (WarnaGame.score >= 100) {
        WarnaGame.elements.modalTitle.textContent = 'Luar Biasa! 🏆';
    } else if (WarnaGame.score >= 50) {
        WarnaGame.elements.modalTitle.textContent = 'Hebat! 🎉';
    } else {
        WarnaGame.elements.modalTitle.textContent = 'Ayo Coba Lagi! 💪';
    }

    setTimeout(() => {
        WarnaGame.elements.gameOverModal.classList.add('active');
    }, 500);
}

document.addEventListener('DOMContentLoaded', initGame);
