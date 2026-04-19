const DEFAULT_MUNICIPALITIES = [
    { id: 1, name: 'Málaga', exact: '599.063', rounded: '599.000' },
    { id: 2, name: 'Marbella', exact: '159.786', rounded: '160.000' },
    { id: 3, name: 'Vélez-Málaga', exact: '86.048', rounded: '86.000' },
    { id: 4, name: 'Fuengirola', exact: '85.211', rounded: '85.000' },
    { id: 5, name: 'Estepona', exact: '79.621', rounded: '80.000' },
    { id: 6, name: 'Benalmádena', exact: '78.338', rounded: '78.000' },
    { id: 7, name: 'Torremolinos', exact: '71.329', rounded: '71.000' },
    { id: 8, name: 'Rincón de la Victoria', exact: '52.454', rounded: '52.000' },
    { id: 9, name: 'Antequera', exact: '45.066', rounded: '45.000' },
    { id: 10, name: 'Ronda', exact: '33.671', rounded: '34.000' },
    { id: 11, name: 'Nerja', exact: '22.132', rounded: '22.000' },
    { id: 12, name: 'Manilva', exact: '18.165', rounded: '18.000' }
];

const DEFAULT_PLAYERS = [
    { id: 1, name: 'Elena', avatar: '👩', bestScore: 0, streak: 0, trophies: 0 },
    { id: 2, name: 'Marina', avatar: '👧', bestScore: 0, streak: 0, trophies: 0 }
];

let appData = {
    players: [],
    municipalities: [],
    settings: { mode: 'rounded' }
};

let currentPlayer = null;
let currentScreen = 'login';
let testMode = 'options'; // 'options' or 'typing'
let testScore = 0;
let currentQuestionIndex = 0;
let shuffledList = [];

// --- CORE LOGIC ---

function init() {
    const savedData = localStorage.getItem('munis_app_data');
    if (savedData) {
        appData = JSON.parse(savedData);
    } else {
        appData.players = [...DEFAULT_PLAYERS];
        appData.municipalities = [...DEFAULT_MUNICIPALITIES];
        saveData();
    }
    
    renderPlayerSelection();
    setupEventListeners();
}

function saveData() {
    localStorage.setItem('munis_app_data', JSON.stringify(appData));
}

function formatNumber(num) {
    if (!num) return '0';
    return Number(num).toLocaleString('es-ES');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screenId}`).classList.add('active');
    
    if (screenId === 'review') renderReview();
    if (screenId === 'stats') renderStats();
    if (screenId === 'settings') renderSettings();
    if (screenId === 'login') renderPlayerSelection();
}

// --- PLAYER SYSTEM ---

function renderPlayerSelection() {
    const container = document.getElementById('player-buttons');
    container.innerHTML = '';
    
    appData.players.forEach(player => {
        const btn = document.createElement('div');
        btn.className = 'player-btn';
        btn.innerHTML = `
            <span class="player-avatar">${player.avatar}</span>
            <span class="player-name">${player.name}</span>
        `;
        btn.onclick = () => selectPlayer(player);
        container.appendChild(btn);
    });
}

function selectPlayer(player) {
    currentPlayer = player;
    document.getElementById('current-player-name').innerText = player.name;
    showScreen('home');
}

// --- TEST SYSTEM ---

function startTest(mode = 'options') {
    testMode = mode;
    testScore = 0;
    currentQuestionIndex = 0;
    
    // UI selection
    const optionsUI = document.getElementById('test-options-ui');
    const typingUI = document.getElementById('test-typing-ui');
    
    if (mode === 'typing') {
        optionsUI.style.display = 'none';
        typingUI.style.display = 'block';
        document.getElementById('typing-input').value = '';
    } else {
        optionsUI.style.display = 'block';
        typingUI.style.display = 'none';
    }

    shuffledList = [...appData.municipalities].sort(() => Math.random() - 0.5);
    updateScoreDisplay();
    showScreen('test');
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= shuffledList.length) {
        finishTest();
        return;
    }

    const currentItem = shuffledList[currentQuestionIndex];
    document.getElementById('focus-name').innerText = currentItem.name;
    document.getElementById('feedback-message').innerText = '';
    
    if (testMode === 'options') {
        const options = generateOptions(currentItem.rounded);
        renderOptions(options, currentItem.rounded);
    } else {
        document.getElementById('typing-input').value = '';
        document.getElementById('typing-input').focus();
        // Reactive check button
        document.getElementById('btn-check-typing').style.pointerEvents = 'auto';
        document.getElementById('btn-check-typing').style.opacity = '1';
    }
    
    const progress = (currentQuestionIndex / shuffledList.length) * 100;
    document.getElementById('test-progress').style.width = `${progress}%`;
}

function checkTypingAnswer() {
    const currentItem = shuffledList[currentQuestionIndex];
    const userInput = document.getElementById('typing-input').value.trim();
    const btn = document.getElementById('btn-check-typing');
    
    if (!userInput) return;
    
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.5';

    // Compare raw numbers
    const isCorrect = userInput == currentItem.rounded;
    
    if (isCorrect) {
        document.getElementById('feedback-message').innerText = '¡Perfecto! 🌟';
        testScore++;
        updateScoreDisplay();
    } else {
        document.getElementById('feedback-message').innerText = `Casi... era ${formatNumber(currentItem.rounded)}`;
    }

    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 1500);
}

function generateOptions(correctAnswer) {
    let options = [formatNumber(correctAnswer)];
    while (options.length < 4) {
        const randomItem = appData.municipalities[Math.floor(Math.random() * appData.municipalities.length)];
        const formatted = formatNumber(randomItem.rounded);
        if (!options.includes(formatted)) options.push(formatted);
    }
    return options.sort(() => Math.random() - 0.5);
}

function renderOptions(options, correctAnswer) {
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, correctAnswer, btn);
        container.appendChild(btn);
    });
}

function checkAnswer(selected, correct, btn) {
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(b => b.style.pointerEvents = 'none');

    if (selected === correct) {
        btn.classList.add('correct');
        document.getElementById('feedback-message').innerText = '¡Fabuloso! ✨';
        testScore++;
        updateScoreDisplay();
    } else {
        btn.classList.add('wrong');
        document.getElementById('feedback-message').innerText = `¡Oh! Era ${formatNumber(correct)}`;
        buttons.forEach(b => { 
            if (b.innerText === formatNumber(correct)) b.classList.add('correct'); 
        });
    }

    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 1500);
}

function updateScoreDisplay() {
    document.getElementById('current-score').innerText = testScore;
}

function finishTest() {
    document.getElementById('test-progress').style.width = '100%';
    const total = appData.municipalities.length;
    
    // Update player stats
    const pIndex = appData.players.findIndex(p => p.id === currentPlayer.id);
    if (testScore > appData.players[pIndex].bestScore) {
        appData.players[pIndex].bestScore = testScore;
    }
    
    if (testScore === total) {
        appData.players[pIndex].streak++;
        if (appData.players[pIndex].streak % 3 === 0) {
            appData.players[pIndex].trophies++;
            confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 }, colors: ['#ffd700', '#ffb703'] });
        } else {
            confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
        }
    } else {
        appData.players[pIndex].streak = 0;
    }
    
    saveData();
    
    // Final UI
    document.getElementById('final-score-display').innerText = `${testScore}/${total}`;
    if (testScore === total) {
        document.getElementById('results-emoji').innerText = '🏆';
        document.getElementById('results-title').innerText = '¡Perfecto!';
        document.getElementById('results-summary').innerText = '¡Eres una experta en Málaga!';
    } else {
        document.getElementById('results-emoji').innerText = '👏';
        document.getElementById('results-title').innerText = '¡Muy bien!';
        document.getElementById('results-summary').innerText = '¡Sigue así, vas genial!';
    }
    
    showScreen('results');
}

// --- REVIEW & STATS ---

function renderReview() {
    const list = document.getElementById('review-list');
    list.innerHTML = '';
    appData.municipalities.forEach(m => {
        const card = document.createElement('div');
        card.className = 'municipality-card';
        card.innerHTML = `
            <div class="card-info"><h4>${m.name}</h4></div>
            <div class="card-pop">
                <span class="pop-round">${formatNumber(m.rounded)}</span>
                <span class="pop-exact">${formatNumber(m.exact)}</span>
            </div>
        `;
        list.appendChild(card);
    });
}

function renderStats() {
    const p = appData.players.find(pl => pl.id === currentPlayer.id);
    document.getElementById('stat-best-score').innerText = `${p.bestScore}/${appData.municipalities.length}`;
    
    const trophyList = document.getElementById('trophies-list');
    trophyList.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
        const item = document.createElement('div');
        item.className = 'trophy-item' + (i < p.trophies ? ' unlocked' : '');
        item.innerHTML = `<span class="trophy-emoji">🏆</span><p>${i + 1}</p>`;
        trophyList.appendChild(item);
    }
}

// --- SETTINGS (CRUD) ---

function renderSettings() {
    // Render Players
    const pList = document.getElementById('settings-players-list');
    pList.innerHTML = '';
    appData.players.forEach(p => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<span>${p.avatar} ${p.name}</span><button onclick="deletePlayer(${p.id})">🗑️</button>`;
        pList.appendChild(div);
    });
    
    // Render Data
    const dList = document.getElementById('settings-data-list');
    dList.innerHTML = '';
    appData.municipalities.forEach(m => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <span>${m.name} (${formatNumber(m.rounded)})</span>
            <div class="actions">
                <button onclick="editMuni(${m.id})">✏️</button>
                <button onclick="deleteMuni(${m.id})">🗑️</button>
            </div>
        `;
        dList.appendChild(div);
    });
}

function saveMuni() {
    const id = document.getElementById('edit-muni-id').value;
    const name = document.getElementById('muni-name').value;
    const exact = document.getElementById('muni-exact').value;
    const rounded = document.getElementById('muni-rounded').value;

    if (!name || !exact || !rounded) return alert('Por favor, rellena todos los campos.');

    if (id) {
        // Update
        const index = appData.municipalities.findIndex(m => m.id == id);
        appData.municipalities[index] = { id: parseInt(id), name, exact, rounded };
    } else {
        // Add
        const newMuni = { id: Date.now(), name, exact, rounded };
        appData.municipalities.push(newMuni);
    }

    clearMuniForm();
    saveData();
    renderSettings();
}

function editMuni(id) {
    const m = appData.municipalities.find(m => m.id == id);
    document.getElementById('edit-muni-id').value = m.id;
    document.getElementById('muni-name').value = m.name;
    document.getElementById('muni-exact').value = m.exact;
    document.getElementById('muni-rounded').value = m.rounded;
    document.getElementById('btn-save-muni').innerText = 'Actualizar Municipio';
}

function clearMuniForm() {
    document.getElementById('edit-muni-id').value = '';
    document.getElementById('muni-name').value = '';
    document.getElementById('muni-exact').value = '';
    document.getElementById('muni-rounded').value = '';
    document.getElementById('btn-save-muni').innerText = 'Guardar Municipio';
}

function deletePlayer(id) {
    if (appData.players.length <= 1) return alert('Debes tener al menos un jugador.');
    appData.players = appData.players.filter(p => p.id !== id);
    saveData();
    renderSettings();
}

function deleteMuni(id) {
    appData.municipalities = appData.municipalities.filter(m => m.id !== id);
    saveData();
    renderSettings();
}

function setupEventListeners() {
    document.getElementById('btn-go-review').onclick = () => showScreen('review');
    document.getElementById('btn-go-test-options').onclick = () => startTest('options');
    document.getElementById('btn-go-test-typing').onclick = () => startTest('typing');
    
    document.getElementById('btn-check-typing').onclick = () => checkTypingAnswer();
    document.getElementById('typing-input').onkeypress = (e) => {
        if (e.key === 'Enter') checkTypingAnswer();
    };

    document.getElementById('btn-go-stats').onclick = () => showScreen('stats');
    document.getElementById('btn-manage-players').onclick = () => showScreen('settings');
    
    document.getElementById('btn-save-muni').onclick = () => saveMuni();
    
    document.getElementById('btn-add-player').onclick = () => {
        const name = document.getElementById('new-player-name').value;
        if (!name) return;
        const newP = { id: Date.now(), name, avatar: '👤', bestScore: 0, streak: 0, trophies: 0 };
        appData.players.push(newP);
        document.getElementById('new-player-name').value = '';
        saveData();
        renderSettings();
    };
    
    document.getElementById('btn-reset-data').onclick = () => {
        if(confirm('¿Quieres borrar todos los cambios y volver a los datos de 2025?')) {
            appData.municipalities = [...DEFAULT_MUNICIPALITIES];
            saveData();
            renderSettings();
        }
    };
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        };
    });
}

// Start everything
init();
