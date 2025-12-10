/**
 * =========================================
 * BELAJAR CERIA - Main Application Script
 * Educational Games for Children
 * =========================================
 */

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Belajar Ceria - Loaded!');

    // Initialize app
    initializeApp();
});

/**
 * Initialize the main application
 */
function initializeApp() {
    // Add interactive effects to game cards
    initializeGameCards();

    // Add mascot interactivity
    initializeMascot();

    // Add sound effects (placeholder - will use Web Audio API)
    initializeAudio();

    // Check for PWA install prompt
    initializePWA();
}

/**
 * Add interactive effects to game cards
 */
function initializeGameCards() {
    const gameCards = document.querySelectorAll('.game-card');

    gameCards.forEach(card => {
        // Add touch/click feedback
        card.addEventListener('touchstart', handleCardTouch, { passive: true });
        card.addEventListener('mouseenter', handleCardHover);
        card.addEventListener('mouseleave', handleCardLeave);

        // Add click sound effect
        card.addEventListener('click', () => {
            playSound('click');
        });
    });
}

/**
 * Handle card touch event
 */
function handleCardTouch(event) {
    const card = event.currentTarget;
    card.style.transform = 'scale(0.98)';

    setTimeout(() => {
        card.style.transform = '';
    }, 150);
}

/**
 * Handle card hover event
 */
function handleCardHover(event) {
    const card = event.currentTarget;
    const icon = card.querySelector('.game-icon');

    // Add extra animation to icon
    if (icon) {
        icon.style.animation = 'bounce 0.5s ease-in-out';
    }
}

/**
 * Handle card leave event
 */
function handleCardLeave(event) {
    const card = event.currentTarget;
    const icon = card.querySelector('.game-icon');

    if (icon) {
        icon.style.animation = '';
    }
}

/**
 * Initialize mascot interactivity
 */
function initializeMascot() {
    const mascot = document.querySelector('.mascot-face');
    const pupils = document.querySelectorAll('.pupil');

    if (!mascot || pupils.length === 0) return;

    // Make eyes follow cursor/touch
    document.addEventListener('mousemove', (e) => {
        const rect = mascot.getBoundingClientRect();
        const mascotCenterX = rect.left + rect.width / 2;
        const mascotCenterY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - mascotCenterX) / 50;
        const deltaY = (e.clientY - mascotCenterY) / 50;

        // Limit movement
        const maxMove = 4;
        const moveX = Math.max(-maxMove, Math.min(maxMove, deltaX));
        const moveY = Math.max(-maxMove, Math.min(maxMove, deltaY));

        pupils.forEach(pupil => {
            pupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    });

    // Add click effect to mascot
    mascot.addEventListener('click', () => {
        mascot.style.animation = 'none';
        mascot.offsetHeight; // Trigger reflow
        mascot.style.animation = 'wiggle 0.3s ease-in-out 3';

        playSound('pop');
    });
}

/**
 * Audio System using Web Audio API
 */
const AudioSystem = {
    context: null,
    sounds: {},

    init() {
        // Create audio context on user interaction
        document.addEventListener('click', () => {
            if (!this.context) {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    },

    /**
     * Generate a simple tone
     */
    playTone(frequency, duration, type = 'sine') {
        if (!this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    },

    /**
     * Play click sound
     */
    click() {
        this.playTone(800, 0.1, 'sine');
    },

    /**
     * Play success sound
     */
    success() {
        // Play a happy melody
        setTimeout(() => this.playTone(523.25, 0.15), 0);    // C5
        setTimeout(() => this.playTone(659.25, 0.15), 100);  // E5
        setTimeout(() => this.playTone(783.99, 0.3), 200);   // G5
    },

    /**
     * Play error sound
     */
    error() {
        this.playTone(200, 0.3, 'sawtooth');
    },

    /**
     * Play pop sound
     */
    pop() {
        this.playTone(600, 0.05, 'sine');
        setTimeout(() => this.playTone(400, 0.05), 50);
    }
};

/**
 * Initialize audio system
 */
function initializeAudio() {
    AudioSystem.init();
}

/**
 * Play a sound effect
 */
function playSound(type) {
    if (AudioSystem[type]) {
        AudioSystem[type]();
    }
}

/**
 * PWA Installation Handler
 */
let deferredPrompt = null;

function initializePWA() {
    const installContainer = document.getElementById('installContainer');
    const installBtn = document.getElementById('installBtn');

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show install button
        if (installContainer) {
            installContainer.style.display = 'block';
            console.log('📲 PWA install prompt available');
        }
    });

    // Handle install button click
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) {
                // For iOS, show instructions
                alert('Untuk menginstall di iOS:\n1. Tap tombol Share\n2. Pilih "Add to Home Screen"');
                return;
            }

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            console.log(`PWA install outcome: ${outcome}`);

            if (outcome === 'accepted') {
                installContainer.style.display = 'none';
            }

            deferredPrompt = null;
        });
    }

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
        console.log('🎉 PWA installed successfully!');
        if (installContainer) {
            installContainer.style.display = 'none';
        }
        deferredPrompt = null;
    });
}

/**
 * Trigger PWA install (for external calls)
 */
async function installPWA() {
    if (!deferredPrompt) {
        console.log('PWA install not available');
        return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`PWA install outcome: ${outcome}`);
    deferredPrompt = null;

    return outcome === 'accepted';
}

// Export for use in other modules
window.BelajarCeria = {
    AudioSystem,
    playSound,
    installPWA
};

