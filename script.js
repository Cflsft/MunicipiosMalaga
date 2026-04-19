const DEFAULT_MUNICIPALITIES = [
    { id: 1, name: 'Málaga', exact: 599063, rounded: 599000 },
    { id: 2, name: 'Marbella', exact: 159786, rounded: 160000 },
    { id: 3, name: 'Vélez-Málaga', exact: 86048, rounded: 86000 },
    { id: 4, name: 'Fuengirola', exact: 85211, rounded: 85000 },
    { id: 5, name: 'Estepona', exact: 79621, rounded: 80000 },
    { id: 6, name: 'Benalmádena', exact: 78338, rounded: 78000 },
    { id: 7, name: 'Torremolinos', exact: 71329, rounded: 71000 },
    { id: 8, name: 'Rincón de la Victoria', exact: 52454, rounded: 52000 },
    { id: 9, name: 'Antequera', exact: 45066, rounded: 45000 },
    { id: 10, name: 'Ronda', exact: 33671, rounded: 34000 },
    { id: 11, name: 'Nerja', exact: 22132, rounded: 22000 },
    { id: 12, name: 'Manilva', exact: 18165, rounded: 18000 }
];

const DEFAULT_PLAYERS = [
    { id: 1, name: 'Elena', avatar: '👩', bestScore: 0, streak: 0, trophies: 0 },
    { id: 2, name: 'Marina', avatar: '👧', bestScore: 0, streak: 0, trophies: 0 }
];

const GIRLY_EMOJIS = ['🦄', '👸', '🧜‍♀️', '🧚', '🌈', '🍦', '🎨', '🦋', '🌸', '💖', '🐱'];
let selectedAvatar = '👩';

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

function formatNumber(val) {
    if (!val && val !== 0) return '0';
    // Remove dots if it comes as a string (old data)
    let clean = String(val).replace(/\./g, '');
    let num = parseInt(clean, 10);
    if (isNaN(num)) return '0';
    return num.toLocaleString('es-ES');
}

function isSameNumber(val1, val2) {
    const n1 = String(val1).replace(/\D/g, '');
    const n2 = String(val2).replace(/\D/g, '');
    if (!n1 || !n2) return false;
    return parseInt(n1, 10) === parseInt(n2, 10);
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
        
        // Handle image vs emoji avatar
        const avatarHtml = player.avatar.length > 5 
            ? `<img src="${player.avatar}" class="avatar-img">` 
            : `<span class="player-avatar">${player.avatar}</span>`;

        btn.innerHTML = `
            ${avatarHtml}
            <span class="player-name">${player.name}</span>
            <div class="player-stats-mini">
                <span class="stat-icon">🏆</span> ${player.trophies || 0}
            </div>
        `;
        btn.onclick = () => selectPlayer(player);
        container.appendChild(btn);
    });
}

function selectPlayer(player) {
    currentPlayer = player;
    document.getElementById('current-player-name').innerText = player.name;
    const avatarBadge = document.getElementById('current-player-avatar');
    if (avatarBadge) {
        avatarBadge.innerHTML = player.avatar.length > 5 
            ? `<img src="${player.avatar}" class="avatar-img-tiny">` 
            : player.avatar;
    }
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
    const isCorrect = isSameNumber(userInput, currentItem.rounded);
    
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

    if (isSameNumber(selected, correct)) {
        btn.classList.add('correct');
        document.getElementById('feedback-message').innerText = '¡Fabuloso! ✨';
        testScore++;
        updateScoreDisplay();
    } else {
        btn.classList.add('wrong');
        const correctFormatted = formatNumber(correct);
        document.getElementById('feedback-message').innerText = `¡Oh! Era ${correctFormatted}`;
        buttons.forEach(b => { 
            if (isSameNumber(b.innerText, correct)) b.classList.add('correct'); 
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
    const pIndex = appData.players.findIndex(p => p.id === currentPlayer.id);
    const player = appData.players[pIndex];
    
    let isNewRecord = false;
    let earnedTrophy = false;

    // Update player stats
    if (testScore > player.bestScore) {
        player.bestScore = testScore;
        isNewRecord = true;
    }
    
    if (testScore === total) {
        player.streak++;
        // Easier trophy logic: 
        // 1st trophy for 1st perfect round.
        // Then every 2 perfect rounds (consecutive or not? let's stick to streak to reward consistency but make it easier)
        // Actually, let's make it more rewarding: every 2 perfect rounds total.
        if (player.trophies === 0) {
            player.trophies = 1;
            earnedTrophy = true;
        } else if (player.streak % 2 === 0) {
            player.trophies++;
            earnedTrophy = true;
        }
        
        if (earnedTrophy) {
            confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 }, colors: ['#ffd700', '#ffb703', '#ffffff'] });
        } else {
            confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
        }
    } else {
        player.streak = 0;
    }
    
    saveData();
    
    // Final UI
    document.getElementById('final-score-display').innerText = `${testScore}/${total}`;
    const badge = document.getElementById('achievement-badge');
    badge.innerHTML = '';

    if (isNewRecord && testScore > 0) {
        const b = document.createElement('div');
        b.className = 'record-badge';
        b.innerText = '⭐ ¡NUEVO RÉCORD! ⭐';
        badge.appendChild(b);
    }
    
    if (earnedTrophy) {
        const b = document.createElement('div');
        b.className = 'trophy-badge';
        b.innerText = '🏆 ¡HAS GANADO UN TROFEO! 🏆';
        badge.appendChild(b);
    }

    if (testScore === total) {
        document.getElementById('results-emoji').innerText = '🏆';
        document.getElementById('results-title').innerText = '¡Perfecto!';
        document.getElementById('results-summary').innerText = '¡Eres una verdadera experta en Málaga!';
    } else if (testScore > total * 0.7) {
        document.getElementById('results-emoji').innerText = '🌟';
        document.getElementById('results-title').innerText = '¡Casi perfecto!';
        document.getElementById('results-summary').innerText = '¡Lo has hecho fenomenal!';
    } else {
        document.getElementById('results-emoji').innerText = '👏';
        document.getElementById('results-title').innerText = '¡Buen intento!';
        document.getElementById('results-summary').innerText = '¡Sigue practicando para ganar trofeos!';
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
            <div class="card-info">
                <h4>${m.name}</h4>
                <p>Málaga, España</p>
            </div>
            <div class="card-pop">
                <span class="pop-round">${formatNumber(m.rounded)}</span>
                <span class="pop-exact">Exacto: ${formatNumber(m.exact)}</span>
            </div>
        `;
        list.appendChild(card);
    });
}

function renderStats() {
    const p = appData.players.find(pl => pl.id === currentPlayer.id);
    document.getElementById('stat-best-score').innerText = `${p.bestScore}/${appData.municipalities.length}`;
    
    // Update player identity in stats
    const avatarHtml = p.avatar.length > 5 
        ? `<img src="${p.avatar}" class="avatar-img-medium">` 
        : p.avatar;
    document.getElementById('stat-player-identity').innerHTML = `${avatarHtml} <span>${p.name}</span>`;

    const trophyList = document.getElementById('trophies-list');
    trophyList.innerHTML = '';
    
    // Render all current trophies + next 2 to achieve
    const totalToShow = Math.max(5, p.trophies + 2);
    for (let i = 0; i < totalToShow; i++) {
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
        const avatarHtml = p.avatar.length > 5 
            ? `<img src="${p.avatar}" class="avatar-img-mini">` 
            : p.avatar;
        div.innerHTML = `
            <span>${avatarHtml} ${p.name} (🏆 ${p.trophies || 0})</span>
            <div class="actions">
                <button onclick="editPlayer(${p.id})">✏️</button>
                <button onclick="deletePlayer(${p.id})">🗑️</button>
            </div>
        `;
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

function editPlayer(id) {
    const p = appData.players.find(p => p.id === id);
    document.getElementById('edit-player-id').value = p.id;
    document.getElementById('edit-player-name').value = p.name;
    selectedAvatar = p.avatar;
    
    document.getElementById('player-edit-form').style.display = 'block';
    document.getElementById('player-add-section').style.display = 'none';
    
    renderAvatarPicker();
}

function cancelPlayerEdit() {
    document.getElementById('player-edit-form').style.display = 'none';
    document.getElementById('player-add-section').style.display = 'flex';
}

function savePlayer() {
    const id = document.getElementById('edit-player-id').value;
    const name = document.getElementById('edit-player-name').value;
    
    if (!name) return alert('Por favor, escribe un nombre.');

    const pIndex = appData.players.findIndex(p => p.id == id);
    appData.players[pIndex].name = name;
    appData.players[pIndex].avatar = selectedAvatar;

    saveData();
    cancelPlayerEdit();
    renderSettings();
    renderPlayerSelection();
    
    // Update top nav if currently selected
    if (currentPlayer && currentPlayer.id == id) {
        selectPlayer(appData.players[pIndex]);
    }
}

function renderAvatarPicker() {
    const container = document.getElementById('avatar-picker-grid');
    container.innerHTML = '';
    
    GIRLY_EMOJIS.forEach(emoji => {
        const div = document.createElement('div');
        div.className = 'avatar-option' + (selectedAvatar === emoji ? ' selected' : '');
        div.innerText = emoji;
        div.onclick = () => {
            selectedAvatar = emoji;
            renderAvatarPicker();
            document.getElementById('avatar-upload-preview').innerHTML = '';
        };
        container.appendChild(div);
    });
}

function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Resize image using canvas to stay under localStorage limits
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 120;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            selectedAvatar = canvas.toDataURL('image/jpeg', 0.8);
            
            // Preview
            const preview = document.getElementById('avatar-upload-preview');
            preview.innerHTML = `<img src="${selectedAvatar}" class="avatar-img-preview">`;
            
            // Clear emoji selection
            document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
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
    
    document.getElementById('btn-save-player').onclick = () => savePlayer();
    document.getElementById('avatar-upload-input').onchange = (e) => handleAvatarUpload(e);
    
    document.getElementById('btn-add-player').onclick = () => {
        const name = document.getElementById('new-player-name').value;
        if (!name) return;
        // Default avatar for new players
        const newP = { id: Date.now(), name, avatar: '👩', bestScore: 0, streak: 0, trophies: 0 };
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
