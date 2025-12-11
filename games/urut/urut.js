/**
 * URUT ANGKA - Number Sequencing Game with Drag & Drop
 */

const UrutGame = {
    score: 0,
    level: 1,
    streak: 0,
    numbers: [],
    mode: 'ascending',
    draggedElement: null,
    elements: {}
};

const UrutAudio = {
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
    playSwap() {
        this.playTone(523, 0.1);
    },
    playCorrect() {
        [523, 587, 659, 698, 784, 880, 988].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.1), i * 60);
        });
    },
    playWrong() {
        this.playTone(200, 0.3, 'sawtooth', 0.2);
    }
};

function initGame() {
    UrutGame.elements = {
        score: document.getElementById('score'),
        level: document.getElementById('level'),
        streak: document.getElementById('streak'),
        instructionText: document.getElementById('instructionText'),
        numbersGrid: document.getElementById('numbersGrid'),
        checkBtn: document.getElementById('checkBtn'),
        successModal: document.getElementById('successModal'),
        wrongModal: document.getElementById('wrongModal'),
        levelScore: document.getElementById('levelScore'),
        nextBtn: document.getElementById('nextBtn'),
        retryBtn: document.getElementById('retryBtn')
    };

    UrutGame.elements.checkBtn.addEventListener('click', checkOrder);
    UrutGame.elements.nextBtn.addEventListener('click', nextLevel);
    UrutGame.elements.retryBtn.addEventListener('click', closeWrongModal);
    document.addEventListener('click', () => UrutAudio.init(), { once: true });

    startLevel();
}

function startLevel() {
    // Determine number range and count based on level
    let maxNum, count;
    if (UrutGame.level === 1) {
        maxNum = 5;
        count = 5;
    } else if (UrutGame.level === 2) {
        maxNum = 10;
        count = 6;
    } else {
        maxNum = 15;
        count = 7;
    }

    // Randomly choose ascending or descending
    UrutGame.mode = Math.random() < 0.5 ? 'ascending' : 'descending';

    // Update instruction
    if (UrutGame.mode === 'ascending') {
        UrutGame.elements.instructionText.textContent = 'Drag angka untuk menyusun dari kecil ke besar! ⬆️';
    } else {
        UrutGame.elements.instructionText.textContent = 'Drag angka untuk menyusun dari besar ke kecil! ⬇️';
    }

    // Generate random unique numbers
    const allNumbers = Array.from({ length: maxNum }, (_, i) => i + 1);
    const selectedNumbers = [];
    while (selectedNumbers.length < count) {
        const randomIndex = Math.floor(Math.random() * allNumbers.length);
        selectedNumbers.push(allNumbers.splice(randomIndex, 1)[0]);
    }

    UrutGame.numbers = selectedNumbers;

    // Create number tiles with drag & drop
    UrutGame.elements.numbersGrid.innerHTML = '';
    UrutGame.numbers.forEach((num, index) => {
        const tile = document.createElement('div');
        tile.className = 'number-tile';
        tile.textContent = num;
        tile.draggable = true;
        tile.dataset.index = index;

        // Drag events
        tile.addEventListener('dragstart', handleDragStart);
        tile.addEventListener('dragend', handleDragEnd);
        tile.addEventListener('dragover', handleDragOver);
        tile.addEventListener('drop', handleDrop);

        // Touch events for mobile
        tile.addEventListener('touchstart', handleTouchStart, { passive: false });
        tile.addEventListener('touchmove', handleTouchMove, { passive: false });
        tile.addEventListener('touchend', handleTouchEnd);

        UrutGame.elements.numbersGrid.appendChild(tile);
    });

    updateDisplay();
}

// Drag & Drop handlers
function handleDragStart(e) {
    UrutGame.draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();

    if (!UrutGame.draggedElement) return;

    const dropTarget = e.target;
    if (dropTarget.classList.contains('number-tile') && dropTarget !== UrutGame.draggedElement) {
        // Swap positions
        const draggedIndex = parseInt(UrutGame.draggedElement.dataset.index);
        const targetIndex = parseInt(dropTarget.dataset.index);

        // Swap in array
        [UrutGame.numbers[draggedIndex], UrutGame.numbers[targetIndex]] =
            [UrutGame.numbers[targetIndex], UrutGame.numbers[draggedIndex]];

        // Update UI
        UrutGame.draggedElement.textContent = UrutGame.numbers[draggedIndex];
        dropTarget.textContent = UrutGame.numbers[targetIndex];

        UrutAudio.playSwap();
    }

    UrutGame.draggedElement = null;
}

// Touch support for mobile
let touchElement, touchClone, touchStartX, touchStartY;

function handleTouchStart(e) {
    e.preventDefault();
    touchElement = e.target;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    // Create visual clone
    touchClone = touchElement.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.zIndex = '9999';
    touchClone.style.opacity = '0.8';
    touchClone.style.width = touchElement.offsetWidth + 'px';
    touchClone.style.height = touchElement.offsetHeight + 'px';
    touchClone.style.left = touch.clientX - touchElement.offsetWidth / 2 + 'px';
    touchClone.style.top = touch.clientY - touchElement.offsetHeight / 2 + 'px';
    document.body.appendChild(touchClone);

    touchElement.style.opacity = '0.3';
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!touchClone) return;

    const touch = e.touches[0];
    touchClone.style.left = touch.clientX - touchClone.offsetWidth / 2 + 'px';
    touchClone.style.top = touch.clientY - touchClone.offsetHeight / 2 + 'px';
}

function handleTouchEnd(e) {
    if (!touchClone) return;

    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

    if (dropTarget && dropTarget.classList.contains('number-tile') && dropTarget !== touchElement) {
        const draggedIndex = parseInt(touchElement.dataset.index);
        const targetIndex = parseInt(dropTarget.dataset.index);

        // Swap in array
        [UrutGame.numbers[draggedIndex], UrutGame.numbers[targetIndex]] =
            [UrutGame.numbers[targetIndex], UrutGame.numbers[draggedIndex]];

        // Update UI
        touchElement.textContent = UrutGame.numbers[draggedIndex];
        dropTarget.textContent = UrutGame.numbers[targetIndex];

        UrutAudio.playSwap();
    }

    touchClone.remove();
    touchClone = null;
    touchElement.style.opacity = '1';
}

function checkOrder() {
    const isCorrect = UrutGame.mode === 'ascending'
        ? isAscending(UrutGame.numbers)
        : isDescending(UrutGame.numbers);

    if (isCorrect) {
        UrutAudio.playCorrect();
        UrutGame.score += 20;
        UrutGame.streak++;
        updateDisplay();

        // Animate tiles
        const tiles = UrutGame.elements.numbersGrid.children;
        Array.from(tiles).forEach((tile, i) => {
            setTimeout(() => {
                tile.classList.add('correct');
            }, i * 100);
        });

        UrutGame.elements.levelScore.textContent = UrutGame.score;
        setTimeout(() => {
            UrutGame.elements.successModal.classList.add('active');
        }, 1000);
    } else {
        UrutAudio.playWrong();
        UrutGame.streak = 0;
        updateDisplay();
        UrutGame.elements.wrongModal.classList.add('active');
    }
}

function isAscending(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] > arr[i + 1]) return false;
    }
    return true;
}

function isDescending(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] < arr[i + 1]) return false;
    }
    return true;
}

function nextLevel() {
    UrutGame.elements.successModal.classList.remove('active');
    UrutGame.level++;
    startLevel();
}

function closeWrongModal() {
    UrutGame.elements.wrongModal.classList.remove('active');
}

function updateDisplay() {
    UrutGame.elements.score.textContent = UrutGame.score;
    UrutGame.elements.level.textContent = UrutGame.level;
    UrutGame.elements.streak.textContent = UrutGame.streak;
}

document.addEventListener('DOMContentLoaded', initGame);
