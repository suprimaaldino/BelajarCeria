/**
 * HITUNG HEWAN - Count Animals Game
 */

const ANIMALS = [
    { emoji: '🐔', name: 'ayam' },
    { emoji: '🐕', name: 'anjing' },
    { emoji: '🐱', name: 'kucing' },
    { emoji: '🐰', name: 'kelinci' },
    { emoji: '🐦', name: 'burung' },
    { emoji: '🐸', name: 'katak' },
    { emoji: '🦋', name: 'kupu-kupu' },
    { emoji: '🐢', name: 'kura-kura' }
];

const HitungGame = {
    score: 0,
    streak: 0,
    level: 1,
    correctAnswer: 0,
    isAnimating: false,
    elements: {}
};

const HitungAudio = {
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
            gain.gain.setValueAtTime(0.3, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + dur);
            osc.start(this.context.currentTime);
            osc.stop(this.context.currentTime + dur);
        } catch (e) { }
    },
    playCorrect() {
        setTimeout(() => this.playTone(523, 0.12), 0);
        setTimeout(() => this.playTone(659, 0.12), 100);
        setTimeout(() => this.playTone(784, 0.2), 200);
    },
    playWrong() { this.playTone(200, 0.3, 'sawtooth'); }
};

function initGame() {
    HitungGame.elements = {
        arena: document.getElementById('animalArena'),
        targetName: document.getElementById('targetName'),
        targetEmoji: document.getElementById('targetEmoji'),
        answerOptions: document.getElementById('answerOptions'),
        score: document.getElementById('score'),
        streak: document.getElementById('streak'),
        level: document.getElementById('level'),
        modal: document.getElementById('gameOverModal'),
        finalScore: document.getElementById('finalScore'),
        restartBtn: document.getElementById('restartBtn')
    };

    HitungGame.elements.restartBtn.addEventListener('click', restartGame);
    document.addEventListener('click', () => HitungAudio.init(), { once: true });

    generateRound();
}

function generateRound() {
    const arena = HitungGame.elements.arena;

    // Clear previous animals (keep ground)
    arena.querySelectorAll('.animal-emoji').forEach(el => el.remove());

    // Pick target animal
    const targetAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];

    // Pick other animals
    const otherAnimals = ANIMALS.filter(a => a.emoji !== targetAnimal.emoji);

    // Determine counts based on level
    const minCount = Math.min(2 + HitungGame.level, 5);
    const maxCount = Math.min(4 + HitungGame.level, 10);
    const targetCount = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));

    HitungGame.correctAnswer = targetCount;

    // Update question
    HitungGame.elements.targetName.textContent = targetAnimal.name;
    HitungGame.elements.targetEmoji.textContent = targetAnimal.emoji;

    // Spawn target animals
    for (let i = 0; i < targetCount; i++) {
        spawnAnimal(arena, targetAnimal.emoji, i * 0.1);
    }

    // Spawn some distractor animals
    const distractorCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < distractorCount; i++) {
        const other = otherAnimals[Math.floor(Math.random() * otherAnimals.length)];
        spawnAnimal(arena, other.emoji, (targetCount + i) * 0.1);
    }

    // Generate answer options
    generateAnswerOptions(targetCount);
}

function spawnAnimal(arena, emoji, delay) {
    const animal = document.createElement('div');
    animal.className = 'animal-emoji';
    animal.textContent = emoji;

    const rect = arena.getBoundingClientRect();
    const padding = 50;
    const x = padding + Math.random() * (rect.width - padding * 2 - 60);
    const y = 30 + Math.random() * (rect.height - 100);

    animal.style.left = `${x}px`;
    animal.style.top = `${y}px`;
    animal.style.animationDelay = `${Math.random() * 2}s`;
    animal.style.opacity = '0';
    animal.style.transform = 'scale(0)';

    arena.appendChild(animal);

    setTimeout(() => {
        animal.style.transition = 'all 0.3s ease';
        animal.style.opacity = '1';
        animal.style.transform = 'scale(1)';
    }, delay * 1000);
}

function generateAnswerOptions(correctAnswer) {
    const container = HitungGame.elements.answerOptions;
    container.innerHTML = '';

    // Generate 3 options including correct answer
    let options = [correctAnswer];

    while (options.length < 3) {
        let wrong = correctAnswer + (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3));
        if (wrong > 0 && !options.includes(wrong)) {
            options.push(wrong);
        }
    }

    // Shuffle options
    options = options.sort(() => Math.random() - 0.5);

    options.forEach(num => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = num;
        btn.addEventListener('click', () => handleAnswer(num, btn));
        container.appendChild(btn);
    });
}

function handleAnswer(answer, button) {
    if (HitungGame.isAnimating) return;
    HitungGame.isAnimating = true;

    if (answer === HitungGame.correctAnswer) {
        button.classList.add('correct');
        HitungAudio.playCorrect();

        HitungGame.score += 10 * HitungGame.level;
        HitungGame.streak++;

        if (HitungGame.streak % 5 === 0) {
            HitungGame.level++;
        }

        updateDisplay();

        setTimeout(() => {
            button.classList.remove('correct');
            HitungGame.isAnimating = false;
            generateRound();
        }, 800);
    } else {
        button.classList.add('wrong');
        HitungAudio.playWrong();
        HitungGame.streak = 0;
        updateDisplay();

        setTimeout(() => {
            button.classList.remove('wrong');
            HitungGame.isAnimating = false;
        }, 500);
    }
}

function updateDisplay() {
    HitungGame.elements.score.textContent = HitungGame.score;
    HitungGame.elements.streak.textContent = HitungGame.streak;
    HitungGame.elements.level.textContent = HitungGame.level;
}

function restartGame() {
    HitungGame.elements.modal.classList.remove('active');
    HitungGame.score = 0;
    HitungGame.streak = 0;
    HitungGame.level = 1;
    updateDisplay();
    generateRound();
}

document.addEventListener('DOMContentLoaded', initGame);
