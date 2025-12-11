/**
 * URUT ANGKA - Number Sequencing Game
 */

const UrutGame = {
    score: 0,
    level: 1,
    streak: 0,
    numbers: [],
    selectedTiles: [],
    mode: 'ascending', // ascending or descending
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
    playSelect() {
        this.playTone(440, 0.1);
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
    UrutGame.selectedTiles = [];

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
        UrutGame.elements.instructionText.textContent = 'Susun dari kecil ke besar! ⬆️';
    } else {
        UrutGame.elements.instructionText.textContent = 'Susun dari besar ke kecil! ⬇️';
    }

    // Generate random unique numbers
    const allNumbers = Array.from({ length: maxNum }, (_, i) => i + 1);
    const selectedNumbers = [];
    while (selectedNumbers.length < count) {
        const randomIndex = Math.floor(Math.random() * allNumbers.length);
        selectedNumbers.push(allNumbers.splice(randomIndex, 1)[0]);
    }

    UrutGame.numbers = selectedNumbers;

    // Create number tiles
    UrutGame.elements.numbersGrid.innerHTML = '';
    UrutGame.numbers.forEach((num, index) => {
        const tile = document.createElement('div');
        tile.className = 'number-tile';
        tile.textContent = num;
        tile.dataset.index = index;
        tile.addEventListener('click', () => selectTile(index));
        UrutGame.elements.numbersGrid.appendChild(tile);
    });

    updateDisplay();
}

function selectTile(index) {
    const tiles = UrutGame.elements.numbersGrid.children;
    const tile = tiles[index];

    if (UrutGame.selectedTiles.includes(index)) {
        // Deselect
        UrutGame.selectedTiles = UrutGame.selectedTiles.filter(i => i !== index);
        tile.classList.remove('selected');
    } else {
        if (UrutGame.selectedTiles.length < 2) {
            // Select
            UrutGame.selectedTiles.push(index);
            tile.classList.add('selected');
            UrutAudio.playSelect();

            // If 2 tiles selected, swap them
            if (UrutGame.selectedTiles.length === 2) {
                setTimeout(() => swapTiles(), 300);
            }
        }
    }
}

function swapTiles() {
    const [index1, index2] = UrutGame.selectedTiles;

    // Swap in array
    [UrutGame.numbers[index1], UrutGame.numbers[index2]] =
        [UrutGame.numbers[index2], UrutGame.numbers[index1]];

    // Update UI
    const tiles = UrutGame.elements.numbersGrid.children;
    tiles[index1].textContent = UrutGame.numbers[index1];
    tiles[index2].textContent = UrutGame.numbers[index2];

    // Remove selection
    tiles[index1].classList.remove('selected');
    tiles[index2].classList.remove('selected');

    UrutGame.selectedTiles = [];
    UrutAudio.playSwap();
}

function checkOrder() {
    const isCorrect = UrutGame.mode === 'ascending'
        ? isAscending(UrutGame.numbers)
        : isDescending(UrutGame.numbers);

    if (isCorrect) {
        // Correct!
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

        // Show success modal
        UrutGame.elements.levelScore.textContent = UrutGame.score;
        setTimeout(() => {
            UrutGame.elements.successModal.classList.add('active');
        }, 1000);
    } else {
        // Wrong
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
