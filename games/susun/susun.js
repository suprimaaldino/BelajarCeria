/**
 * =========================================
 * SUSUN KATA - Word Arrangement Game
 * Arrange letters to form words!
 * =========================================
 */

// Word Database with Emojis
const WORDS = [
    { word: 'KUCING', emoji: '🐱', hint: 'Hewan berbulu yang suka mengeong' },
    { word: 'ANJING', emoji: '🐕', hint: 'Hewan setia sahabat manusia' },
    { word: 'KELINCI', emoji: '🐰', hint: 'Hewan lucu bertelinga panjang' },
    { word: 'IKAN', emoji: '🐟', hint: 'Hewan yang berenang di air' },
    { word: 'BURUNG', emoji: '🐦', hint: 'Hewan yang bisa terbang' },
    { word: 'GAJAH', emoji: '🐘', hint: 'Hewan besar berhidung panjang' },
    { word: 'SINGA', emoji: '🦁', hint: 'Raja hutan' },
    { word: 'KUDA', emoji: '🐴', hint: 'Hewan yang bisa ditunggangi' },
    { word: 'BEBEK', emoji: '🦆', hint: 'Hewan yang suka berenang dan bersayap' },
    { word: 'AYAM', emoji: '🐔', hint: 'Hewan berkokok di pagi hari' },
    { word: 'BUNGA', emoji: '🌸', hint: 'Tanaman yang indah dan wangi' },
    { word: 'APEL', emoji: '🍎', hint: 'Buah berwarna merah' },
    { word: 'PISANG', emoji: '🍌', hint: 'Buah berwarna kuning' },
    { word: 'BOLA', emoji: '⚽', hint: 'Mainan bulat yang bisa ditendang' },
    { word: 'BUKU', emoji: '📚', hint: 'Tempat membaca cerita' },
    { word: 'MOBIL', emoji: '🚗', hint: 'Kendaraan beroda empat' },
    { word: 'RUMAH', emoji: '🏠', hint: 'Tempat tinggal' },
    { word: 'MATAHARI', emoji: '☀️', hint: 'Bersinar terang di siang hari' },
    { word: 'BULAN', emoji: '🌙', hint: 'Bersinar di malam hari' },
    { word: 'HUJAN', emoji: '🌧️', hint: 'Air yang turun dari langit' }
];

// Game State
const SusunGame = {
    currentWord: null,
    currentWordIndex: 0,
    shuffledLetters: [],
    placedLetters: [],
    score: 0,
    wordsCompleted: 0,
    usedWordIndices: [],

    // Drag state
    draggedLetter: null,
    draggedIndex: null,
    ghostElement: null,

    // DOM Elements
    elements: {}
};

// Audio System
const SusunAudio = {
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

    playPickup() {
        this.playTone(500, 0.08, 'sine', 0.3);
    },

    playDrop() {
        this.playTone(400, 0.1, 'sine', 0.3);
    },

    playCorrect() {
        setTimeout(() => this.playTone(523.25, 0.12, 'sine', 0.4), 0);
        setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.4), 100);
        setTimeout(() => this.playTone(783.99, 0.2, 'sine', 0.4), 200);
    },

    playWrong() {
        this.playTone(200, 0.3, 'sawtooth', 0.2);
    },

    playWordComplete() {
        [523.25, 587.33, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.3), i * 80);
        });
    }
};

/**
 * Initialize the game
 */
function initGame() {
    // Get DOM elements
    SusunGame.elements = {
        wordImage: document.getElementById('wordImage'),
        dropSlots: document.getElementById('dropSlots'),
        letterTiles: document.getElementById('letterTiles'),
        score: document.getElementById('score'),
        resetBtn: document.getElementById('resetBtn'),
        skipBtn: document.getElementById('skipBtn'),
        successOverlay: document.getElementById('successOverlay'),
        completionModal: document.getElementById('completionModal'),
        wordsCompleted: document.getElementById('wordsCompleted'),
        finalScore: document.getElementById('finalScore'),
        continueBtn: document.getElementById('continueBtn')
    };

    // Event listeners
    SusunGame.elements.resetBtn.addEventListener('click', resetCurrentWord);
    SusunGame.elements.skipBtn.addEventListener('click', skipWord);
    SusunGame.elements.continueBtn.addEventListener('click', continueGame);

    // Initialize audio on first interaction
    document.addEventListener('click', () => SusunAudio.init(), { once: true });

    // Global drag events
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    // Start game
    loadNewWord();
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
 * Load a new word
 */
function loadNewWord() {
    // Get unused word
    let availableIndices = [];
    for (let i = 0; i < WORDS.length; i++) {
        if (!SusunGame.usedWordIndices.includes(i)) {
            availableIndices.push(i);
        }
    }

    // If all words used, reset
    if (availableIndices.length === 0) {
        showCompletionModal();
        return;
    }

    // Pick random word
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    SusunGame.currentWordIndex = randomIndex;
    SusunGame.currentWord = WORDS[randomIndex];
    SusunGame.usedWordIndices.push(randomIndex);

    // Shuffle letters
    SusunGame.shuffledLetters = shuffleArray(SusunGame.currentWord.word.split(''));

    // Reset placed letters
    SusunGame.placedLetters = new Array(SusunGame.currentWord.word.length).fill(null);

    // Render
    renderWordImage();
    renderDropSlots();
    renderLetterTiles();
}

/**
 * Render word image
 */
function renderWordImage() {
    const imageEl = SusunGame.elements.wordImage;
    imageEl.style.transform = 'scale(0)';

    setTimeout(() => {
        imageEl.textContent = SusunGame.currentWord.emoji;
        imageEl.style.transform = 'scale(1)';
    }, 150);
}

/**
 * Render drop slots
 */
function renderDropSlots() {
    const container = SusunGame.elements.dropSlots;
    container.innerHTML = '';

    const word = SusunGame.currentWord.word;

    for (let i = 0; i < word.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'drop-slot';
        slot.dataset.index = i;

        // Drop event listeners
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', (e) => handleDrop(e, i));

        // Click to remove letter
        slot.addEventListener('click', () => removeLetter(i));

        container.appendChild(slot);
    }
}

/**
 * Render letter tiles
 */
function renderLetterTiles() {
    const container = SusunGame.elements.letterTiles;
    container.innerHTML = '';

    SusunGame.shuffledLetters.forEach((letter, index) => {
        const tile = document.createElement('div');
        tile.className = 'letter-tile';
        tile.textContent = letter;
        tile.dataset.index = index;
        tile.dataset.letter = letter;

        // Check if letter is already used
        if (SusunGame.placedLetters.includes(index)) {
            tile.classList.add('used');
        }

        // Drag events
        tile.addEventListener('mousedown', (e) => handleDragStart(e, index, letter));
        tile.addEventListener('touchstart', (e) => handleTouchStart(e, index, letter), { passive: false });

        container.appendChild(tile);
    });
}

/**
 * Handle drag start
 */
function handleDragStart(event, index, letter) {
    if (SusunGame.placedLetters.includes(index)) return;

    event.preventDefault();

    SusunGame.draggedIndex = index;
    SusunGame.draggedLetter = letter;

    // Mark tile as dragging
    const tile = event.target;
    tile.classList.add('dragging');

    // Create ghost element
    createGhost(letter, event.clientX, event.clientY);

    SusunAudio.playPickup();
}

/**
 * Handle touch start
 */
function handleTouchStart(event, index, letter) {
    if (SusunGame.placedLetters.includes(index)) return;

    event.preventDefault();

    const touch = event.touches[0];

    SusunGame.draggedIndex = index;
    SusunGame.draggedLetter = letter;

    // Mark tile as dragging
    const tile = event.target;
    tile.classList.add('dragging');

    // Create ghost element
    createGhost(letter, touch.clientX, touch.clientY);

    SusunAudio.playPickup();
}

/**
 * Create ghost element for dragging
 */
function createGhost(letter, x, y) {
    // Remove existing ghost
    if (SusunGame.ghostElement) {
        SusunGame.ghostElement.remove();
    }

    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.textContent = letter;
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;

    document.body.appendChild(ghost);
    SusunGame.ghostElement = ghost;
}

/**
 * Handle drag move
 */
function handleDragMove(event) {
    if (!SusunGame.ghostElement) return;

    SusunGame.ghostElement.style.left = `${event.clientX}px`;
    SusunGame.ghostElement.style.top = `${event.clientY}px`;

    // Highlight slot under cursor
    highlightSlotUnderPoint(event.clientX, event.clientY);
}

/**
 * Handle touch move
 */
function handleTouchMove(event) {
    if (!SusunGame.ghostElement) return;

    event.preventDefault();

    const touch = event.touches[0];
    SusunGame.ghostElement.style.left = `${touch.clientX}px`;
    SusunGame.ghostElement.style.top = `${touch.clientY}px`;

    // Highlight slot under touch
    highlightSlotUnderPoint(touch.clientX, touch.clientY);
}

/**
 * Highlight slot under point
 */
function highlightSlotUnderPoint(x, y) {
    const slots = document.querySelectorAll('.drop-slot');

    slots.forEach(slot => {
        slot.classList.remove('highlight');

        const rect = slot.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            if (!slot.classList.contains('filled')) {
                slot.classList.add('highlight');
            }
        }
    });
}

/**
 * Handle drag end
 */
function handleDragEnd(event) {
    if (SusunGame.draggedLetter === null) return;

    // Find slot under cursor
    const slot = getSlotUnderPoint(event.clientX, event.clientY);

    if (slot !== null) {
        placeLetter(slot);
    }

    cleanupDrag();
}

/**
 * Handle touch end
 */
function handleTouchEnd(event) {
    if (SusunGame.draggedLetter === null) return;

    // Get last touch position from ghost element
    if (SusunGame.ghostElement) {
        const ghostRect = SusunGame.ghostElement.getBoundingClientRect();
        const x = ghostRect.left + ghostRect.width / 2;
        const y = ghostRect.top + ghostRect.height / 2;

        const slot = getSlotUnderPoint(x, y);

        if (slot !== null) {
            placeLetter(slot);
        }
    }

    cleanupDrag();
}

/**
 * Get slot under point
 */
function getSlotUnderPoint(x, y) {
    const slots = document.querySelectorAll('.drop-slot');

    for (let i = 0; i < slots.length; i++) {
        const rect = slots[i].getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            if (!slots[i].classList.contains('filled')) {
                return i;
            }
        }
    }

    return null;
}

/**
 * Handle drop event
 */
function handleDrop(event, slotIndex) {
    event.preventDefault();

    if (SusunGame.draggedLetter === null) return;

    placeLetter(slotIndex);
    cleanupDrag();
}

/**
 * Place letter in slot
 */
function placeLetter(slotIndex) {
    if (SusunGame.placedLetters[slotIndex] !== null) return;

    // Place letter
    SusunGame.placedLetters[slotIndex] = SusunGame.draggedIndex;

    // Update slot display
    const slot = document.querySelectorAll('.drop-slot')[slotIndex];
    slot.textContent = SusunGame.draggedLetter;
    slot.classList.add('filled');

    // Mark tile as used
    const tile = document.querySelector(`.letter-tile[data-index="${SusunGame.draggedIndex}"]`);
    if (tile) {
        tile.classList.add('used');
    }

    SusunAudio.playDrop();

    // Check if word is complete
    checkWordComplete();
}

/**
 * Remove letter from slot
 */
function removeLetter(slotIndex) {
    const letterIndex = SusunGame.placedLetters[slotIndex];
    if (letterIndex === null) return;

    // Clear slot
    SusunGame.placedLetters[slotIndex] = null;

    const slot = document.querySelectorAll('.drop-slot')[slotIndex];
    slot.textContent = '';
    slot.classList.remove('filled', 'correct', 'wrong');

    // Unmark tile
    const tile = document.querySelector(`.letter-tile[data-index="${letterIndex}"]`);
    if (tile) {
        tile.classList.remove('used');
    }

    SusunAudio.playPickup();
}

/**
 * Cleanup drag state
 */
function cleanupDrag() {
    // Remove ghost
    if (SusunGame.ghostElement) {
        SusunGame.ghostElement.remove();
        SusunGame.ghostElement = null;
    }

    // Remove dragging class
    const draggingTile = document.querySelector('.letter-tile.dragging');
    if (draggingTile) {
        draggingTile.classList.remove('dragging');
    }

    // Remove highlight
    document.querySelectorAll('.drop-slot').forEach(slot => {
        slot.classList.remove('highlight');
    });

    // Reset drag state
    SusunGame.draggedLetter = null;
    SusunGame.draggedIndex = null;
}

/**
 * Check if word is complete
 */
function checkWordComplete() {
    // Check if all slots are filled
    if (SusunGame.placedLetters.some(l => l === null)) return;

    // Build placed word
    const placedWord = SusunGame.placedLetters
        .map(index => SusunGame.shuffledLetters[index])
        .join('');

    const correctWord = SusunGame.currentWord.word;
    const slots = document.querySelectorAll('.drop-slot');

    if (placedWord === correctWord) {
        // Correct!
        slots.forEach(slot => slot.classList.add('correct'));

        SusunAudio.playWordComplete();

        // Update score
        SusunGame.score += correctWord.length * 10;
        SusunGame.wordsCompleted++;
        updateScore();

        // Show success overlay
        showSuccessOverlay();

        // Load new word after delay
        setTimeout(() => {
            hideSuccessOverlay();
            loadNewWord();
        }, 1500);
    } else {
        // Wrong - show which letters are correct/wrong
        for (let i = 0; i < placedWord.length; i++) {
            if (placedWord[i] === correctWord[i]) {
                slots[i].classList.add('correct');
            } else {
                slots[i].classList.add('wrong');
            }
        }

        SusunAudio.playWrong();

        // Reset after delay
        setTimeout(() => {
            slots.forEach(slot => {
                slot.classList.remove('correct', 'wrong');
            });
        }, 1000);
    }
}

/**
 * Update score display
 */
function updateScore() {
    const scoreEl = SusunGame.elements.score;
    scoreEl.textContent = SusunGame.score;

    // Pop animation
    scoreEl.style.transform = 'scale(1.3)';
    setTimeout(() => {
        scoreEl.style.transform = 'scale(1)';
    }, 200);
}

/**
 * Show success overlay
 */
function showSuccessOverlay() {
    SusunGame.elements.successOverlay.classList.add('show');
    createConfetti();
}

/**
 * Hide success overlay
 */
function hideSuccessOverlay() {
    SusunGame.elements.successOverlay.classList.remove('show');
}

/**
 * Create confetti effect
 */
function createConfetti() {
    const emojis = ['⭐', '✨', '🎉', '💫', '🌟', '🎊'];

    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];

        confetti.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            font-size: ${1.5 + Math.random() * 1.5}rem;
            pointer-events: none;
            z-index: 1000;
            animation: confettiFly ${0.8 + Math.random() * 0.5}s ease-out forwards;
            --tx: ${(Math.random() - 0.5) * 400}px;
            --ty: ${-150 - Math.random() * 200}px;
            --r: ${Math.random() * 360}deg;
        `;

        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 1500);
    }
}

// Add confetti animation
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
 * Reset current word
 */
function resetCurrentWord() {
    // Clear all placed letters
    SusunGame.placedLetters = new Array(SusunGame.currentWord.word.length).fill(null);

    // Re-render
    renderDropSlots();
    renderLetterTiles();

    SusunAudio.playPickup();
}

/**
 * Skip current word
 */
function skipWord() {
    loadNewWord();
    SusunAudio.playDrop();
}

/**
 * Show completion modal
 */
function showCompletionModal() {
    SusunGame.elements.wordsCompleted.textContent = SusunGame.wordsCompleted;
    SusunGame.elements.finalScore.textContent = SusunGame.score;
    SusunGame.elements.completionModal.classList.add('active');
}

/**
 * Continue game after completion
 */
function continueGame() {
    SusunGame.elements.completionModal.classList.remove('active');
    SusunGame.usedWordIndices = [];
    loadNewWord();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
