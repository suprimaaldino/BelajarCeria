/**
 * PUZZLE BENTUK - Shape Matching Game
 */

const SHAPES = {
    circle: { name: 'Lingkaran', svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="COLOR"/></svg>', color: '#ef4444' },
    square: { name: 'Persegi', svg: '<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="COLOR"/></svg>', color: '#3b82f6' },
    triangle: { name: 'Segitiga', svg: '<svg viewBox="0 0 100 100"><polygon points="50,10 90,90 10,90" fill="COLOR"/></svg>', color: '#10b981' },
    star: { name: 'Bintang', svg: '<svg viewBox="0 0 100 100"><polygon points="50,10 61,35 89,35 67,52 78,78 50,61 22,78 33,52 11,35 39,35" fill="COLOR"/></svg>', color: '#fbbf24' },
    heart: { name: 'Hati', svg: '<svg viewBox="0 0 100 100"><path d="M50,85 C50,85 15,60 15,40 C15,25 25,15 35,15 C42,15 48,20 50,25 C52,20 58,15 65,15 C75,15 85,25 85,40 C85,60 50,85 50,85 Z" fill="COLOR"/></svg>', color: '#ec4899' },
    hexagon: { name: 'Segi Enam', svg: '<svg viewBox="0 0 100 100"><polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="COLOR"/></svg>', color: '#a855f7' }
};

const BentukGame = {
    score: 0,
    level: 1,
    correct: 0,
    currentShapes: [],
    draggedElement: null,
    elements: {}
};

const BentukAudio = {
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
    playMatch() {
        setTimeout(() => this.playTone(659, 0.1), 0);
        setTimeout(() => this.playTone(784, 0.15), 100);
    },
    playComplete() {
        [523, 587, 659, 698, 784, 880].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.12), i * 70);
        });
    }
};

function initGame() {
    BentukGame.elements = {
        score: document.getElementById('score'),
        level: document.getElementById('level'),
        correct: document.getElementById('correct'),
        shapesContainer: document.getElementById('shapesContainer'),
        targetsContainer: document.getElementById('targetsContainer'),
        successModal: document.getElementById('successModal'),
        levelScore: document.getElementById('levelScore'),
        nextBtn: document.getElementById('nextBtn')
    };

    BentukGame.elements.nextBtn.addEventListener('click', nextLevel);
    document.addEventListener('click', () => BentukAudio.init(), { once: true });

    startLevel();
}

function startLevel() {
    BentukGame.correct = 0;
    updateDisplay();

    // Determine number of shapes based on level
    const numShapes = Math.min(3 + BentukGame.level - 1, 6);

    // Select random shapes
    const shapeKeys = Object.keys(SHAPES);
    const selectedShapes = [];
    while (selectedShapes.length < numShapes) {
        const randomShape = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
        if (!selectedShapes.includes(randomShape)) {
            selectedShapes.push(randomShape);
        }
    }

    BentukGame.currentShapes = selectedShapes;

    // Shuffle for shapes container
    const shuffledShapes = [...selectedShapes].sort(() => Math.random() - 0.5);

    // Create shape elements
    BentukGame.elements.shapesContainer.innerHTML = '';
    shuffledShapes.forEach(shapeKey => {
        const shapeData = SHAPES[shapeKey];
        const shapeEl = document.createElement('div');
        shapeEl.className = 'shape';
        shapeEl.draggable = true;
        shapeEl.dataset.shape = shapeKey;
        shapeEl.innerHTML = shapeData.svg.replace('COLOR', shapeData.color);

        shapeEl.addEventListener('dragstart', handleDragStart);
        shapeEl.addEventListener('dragend', handleDragEnd);

        // Touch support
        shapeEl.addEventListener('touchstart', handleTouchStart, { passive: false });
        shapeEl.addEventListener('touchmove', handleTouchMove, { passive: false });
        shapeEl.addEventListener('touchend', handleTouchEnd);

        BentukGame.elements.shapesContainer.appendChild(shapeEl);
    });

    // Create target slots
    BentukGame.elements.targetsContainer.innerHTML = '';
    selectedShapes.forEach(shapeKey => {
        const shapeData = SHAPES[shapeKey];
        const targetEl = document.createElement('div');
        targetEl.className = 'target-slot';
        targetEl.dataset.shape = shapeKey;

        const outline = document.createElement('div');
        outline.className = 'target-outline';
        outline.innerHTML = shapeData.svg.replace('COLOR', '#cbd5e1');
        targetEl.appendChild(outline);

        targetEl.addEventListener('dragover', handleDragOver);
        targetEl.addEventListener('drop', handleDrop);
        targetEl.addEventListener('dragleave', handleDragLeave);

        BentukGame.elements.targetsContainer.appendChild(targetEl);
    });
}

function handleDragStart(e) {
    BentukGame.draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const target = e.currentTarget;
    target.classList.remove('drag-over');

    if (!BentukGame.draggedElement) return;

    const draggedShape = BentukGame.draggedElement.dataset.shape;
    const targetShape = target.dataset.shape;

    if (draggedShape === targetShape && !target.classList.contains('filled')) {
        // Correct match
        target.classList.add('filled');
        target.innerHTML = BentukGame.draggedElement.innerHTML;
        BentukGame.draggedElement.style.display = 'none';

        BentukAudio.playMatch();
        BentukGame.correct++;
        BentukGame.score += 15;
        updateDisplay();

        // Check if level complete
        if (BentukGame.correct === BentukGame.currentShapes.length) {
            levelComplete();
        }
    }

    BentukGame.draggedElement = null;
}

// Touch support
let touchStartX, touchStartY, touchElement, touchClone;

function handleTouchStart(e) {
    e.preventDefault();
    touchElement = e.target;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    // Create clone for dragging
    touchClone = touchElement.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.zIndex = '9999';
    touchClone.style.opacity = '0.8';
    touchClone.style.left = touch.clientX - 40 + 'px';
    touchClone.style.top = touch.clientY - 40 + 'px';
    document.body.appendChild(touchClone);

    touchElement.style.opacity = '0.3';
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!touchClone) return;

    const touch = e.touches[0];
    touchClone.style.left = touch.clientX - 40 + 'px';
    touchClone.style.top = touch.clientY - 40 + 'px';
}

function handleTouchEnd(e) {
    if (!touchClone) return;

    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

    if (dropTarget && dropTarget.classList.contains('target-slot')) {
        const draggedShape = touchElement.dataset.shape;
        const targetShape = dropTarget.dataset.shape;

        if (draggedShape === targetShape && !dropTarget.classList.contains('filled')) {
            dropTarget.classList.add('filled');
            dropTarget.innerHTML = touchElement.innerHTML;
            touchElement.style.display = 'none';

            BentukAudio.playMatch();
            BentukGame.correct++;
            BentukGame.score += 15;
            updateDisplay();

            if (BentukGame.correct === BentukGame.currentShapes.length) {
                levelComplete();
            }
        }
    }

    touchClone.remove();
    touchClone = null;
    touchElement.style.opacity = '1';
}

function levelComplete() {
    BentukAudio.playComplete();
    BentukGame.elements.levelScore.textContent = BentukGame.score;

    setTimeout(() => {
        BentukGame.elements.successModal.classList.add('active');
    }, 500);
}

function nextLevel() {
    BentukGame.elements.successModal.classList.remove('active');
    BentukGame.level++;
    updateDisplay();
    startLevel();
}

function updateDisplay() {
    BentukGame.elements.score.textContent = BentukGame.score;
    BentukGame.elements.level.textContent = BentukGame.level;
    BentukGame.elements.correct.textContent = BentukGame.correct;
}

document.addEventListener('DOMContentLoaded', initGame);
