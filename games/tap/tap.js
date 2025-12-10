/**
 * =========================================
 * TAP ANGKA & HURUF - Game Logic
 * Find and tap the correct letter or number
 * =========================================
 */

// Game State
const TapGame = {
    score: 0,
    streak: 0,
    bestStreak: 0,
    currentTarget: '',
    mode: 'letters', // 'letters', 'numbers', 'mixed'
    options: [],
    isAnimating: false,

    // Character pools
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    numbers: '0123456789'.split(''),

    // DOM Elements
    elements: {
        score: null,
        streak: null,
        target: null,
        options: null,
        feedback: null,
        modal: null,
        finalScore: null
    }
};

// Audio System
const TapAudio = {
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

    playCorrect() {
        // Happy ascending melody
        setTimeout(() => this.playTone(523.25, 0.15, 'sine', 0.4), 0);    // C5
        setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.4), 100);  // E5
        setTimeout(() => this.playTone(783.99, 0.25, 'sine', 0.4), 200);  // G5
    },

    playWrong() {
        // Descending tone
        this.playTone(200, 0.3, 'sawtooth', 0.2);
    },

    playClick() {
        this.playTone(600, 0.05, 'sine', 0.2);
    }
};

/**
 * Initialize the game
 */
function initGame() {
    // Get DOM elements
    TapGame.elements = {
        score: document.getElementById('score'),
        streak: document.getElementById('streak'),
        target: document.getElementById('target'),
        options: document.getElementById('options'),
        feedback: document.getElementById('feedback'),
        modal: document.getElementById('successModal'),
        finalScore: document.getElementById('finalScore')
    };

    // Setup mode buttons
    setupModeButtons();

    // Initialize audio on first interaction
    document.addEventListener('click', () => TapAudio.init(), { once: true });

    // Generate first round
    generateNewRound();
}

/**
 * Setup mode selector buttons
 */
function setupModeButtons() {
    const modeButtons = document.querySelectorAll('.mode-btn');

    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Change mode
            TapGame.mode = btn.dataset.mode;

            // Play click sound
            TapAudio.playClick();

            // Generate new round with new mode
            generateNewRound();
        });
    });
}

/**
 * Get character pool based on current mode
 */
function getCharacterPool() {
    switch (TapGame.mode) {
        case 'letters':
            return TapGame.letters;
        case 'numbers':
            return TapGame.numbers;
        case 'mixed':
            return [...TapGame.letters, ...TapGame.numbers];
        default:
            return TapGame.letters;
    }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Generate a new round
 */
function generateNewRound() {
    if (TapGame.isAnimating) return;

    const pool = getCharacterPool();

    // Select 4 random unique characters
    const shuffled = shuffleArray(pool);
    TapGame.options = shuffled.slice(0, 4);

    // Pick one as the target
    TapGame.currentTarget = TapGame.options[Math.floor(Math.random() * TapGame.options.length)];

    // Update target display with animation
    updateTargetDisplay();

    // Render options
    renderOptions();
}

/**
 * Update target display with animation
 */
function updateTargetDisplay() {
    const targetEl = TapGame.elements.target;

    // Animate out
    targetEl.style.transform = 'scale(0)';
    targetEl.style.opacity = '0';

    setTimeout(() => {
        // Update text
        targetEl.textContent = TapGame.currentTarget;

        // Animate in
        targetEl.style.transform = 'scale(1)';
        targetEl.style.opacity = '1';
    }, 150);
}

/**
 * Render option buttons
 */
function renderOptions() {
    const container = TapGame.elements.options;
    container.innerHTML = '';

    // Shuffle options for display
    const displayOptions = shuffleArray(TapGame.options);

    displayOptions.forEach((char, index) => {
        const btn = document.createElement('button');
        btn.className = `option-btn opt-${(index % 4) + 1}`;
        btn.textContent = char;
        btn.dataset.value = char;

        // Add entrance animation delay
        btn.style.animation = `cardAppear 0.4s ease-out ${index * 0.1}s both`;

        // Add click handler
        btn.addEventListener('click', () => handleOptionClick(char, btn));

        container.appendChild(btn);
    });
}

/**
 * Handle option click
 */
function handleOptionClick(value, button) {
    if (TapGame.isAnimating) return;
    TapGame.isAnimating = true;

    TapAudio.playClick();

    if (value === TapGame.currentTarget) {
        // Correct answer!
        handleCorrectAnswer(button);
    } else {
        // Wrong answer
        handleWrongAnswer(button);
    }
}

/**
 * Handle correct answer
 */
function handleCorrectAnswer(button) {
    // Update score
    TapGame.score++;
    TapGame.streak++;

    if (TapGame.streak > TapGame.bestStreak) {
        TapGame.bestStreak = TapGame.streak;
    }

    updateScoreDisplay();

    // Play success sound
    TapAudio.playCorrect();

    // Add animation to button
    button.classList.add('correct-animation');

    // Show feedback
    showFeedback('correct', '✓ Benar!');

    // Create confetti effect
    createConfetti();

    // Generate new round after delay
    setTimeout(() => {
        button.classList.remove('correct-animation');
        TapGame.isAnimating = false;
        generateNewRound();
    }, 800);
}

/**
 * Handle wrong answer
 */
function handleWrongAnswer(button) {
    // Reset streak
    TapGame.streak = 0;
    updateScoreDisplay();

    // Play wrong sound
    TapAudio.playWrong();

    // Add shake animation
    button.classList.add('wrong-animation');

    // Show feedback
    showFeedback('wrong', '✗ Coba Lagi!');

    setTimeout(() => {
        button.classList.remove('wrong-animation');
        TapGame.isAnimating = false;
    }, 500);
}

/**
 * Update score display
 */
function updateScoreDisplay() {
    TapGame.elements.score.textContent = TapGame.score;
    TapGame.elements.streak.textContent = TapGame.streak;

    // Add pop animation to score
    TapGame.elements.score.style.transform = 'scale(1.3)';
    setTimeout(() => {
        TapGame.elements.score.style.transform = 'scale(1)';
    }, 200);
}

/**
 * Show feedback text
 */
function showFeedback(type, text) {
    const feedbackEl = TapGame.elements.feedback;

    feedbackEl.textContent = text;
    feedbackEl.className = `feedback-text ${type} show`;

    setTimeout(() => {
        feedbackEl.classList.remove('show');
    }, 600);
}

/**
 * Create confetti particles
 */
function createConfetti() {
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
    const emojis = ['⭐', '✨', '🎉', '💫', '🌟'];

    for (let i = 0; i < 12; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-particle';
        confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];

        confetti.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            font-size: ${1.5 + Math.random() * 1.5}rem;
            pointer-events: none;
            z-index: 1000;
            animation: confettiFly ${0.8 + Math.random() * 0.5}s ease-out forwards;
            --tx: ${(Math.random() - 0.5) * 300}px;
            --ty: ${-100 - Math.random() * 200}px;
            --r: ${Math.random() * 360}deg;
        `;

        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 1500);
    }
}

// Add confetti animation CSS
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confettiFly {
        0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1) rotate(var(--r));
            opacity: 0;
        }
    }
`;
document.head.appendChild(confettiStyle);

/**
 * Show success modal
 */
function showSuccessModal() {
    TapGame.elements.finalScore.textContent = TapGame.score;
    TapGame.elements.modal.classList.add('active');
}

/**
 * Close modal and reset game
 */
function closeModal() {
    TapGame.elements.modal.classList.remove('active');
    TapGame.score = 0;
    TapGame.streak = 0;
    updateScoreDisplay();
    generateNewRound();
}

// Make closeModal globally accessible
window.closeModal = closeModal;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
