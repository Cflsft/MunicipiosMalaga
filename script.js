const municipalities = [
    { name: 'Málaga', exact: '599.063', rounded: '599.000', roundedNum: 599000 },
    { name: 'Marbella', exact: '159.786', rounded: '160.000', roundedNum: 160000 },
    { name: 'Vélez-Málaga', exact: '86.048', rounded: '86.000', roundedNum: 86000 },
    { name: 'Fuengirola', exact: '85.211', rounded: '85.000', roundedNum: 85000 },
    { name: 'Estepona', exact: '79.621', rounded: '80.000', roundedNum: 80000 },
    { name: 'Benalmádena', exact: '78.338', rounded: '78.000', roundedNum: 78000 },
    { name: 'Torremolinos', exact: '71.329', rounded: '71.000', roundedNum: 71000 },
    { name: 'Rincón de la Victoria', exact: '52.454', rounded: '52.000', roundedNum: 52000 },
    { name: 'Antequera', exact: '45.066', rounded: '45.000', roundedNum: 45000 },
    { name: 'Ronda', exact: '33.671', rounded: '34.000', roundedNum: 34000 },
    { name: 'Nerja', exact: '22.132', rounded: '22.000', roundedNum: 22000 },
    { name: 'Manilva', exact: '18.165', rounded: '18.000', roundedNum: 18000 }
];

let currentScreen = 'home';
let testScore = 0;
let currentQuestionIndex = 0;
let shuffledList = [];

// DOM Elements
const screens = document.querySelectorAll('.screen');
const reviewList = document.getElementById('review-list');
const optionsContainer = document.getElementById('options-container');
const questionName = document.getElementById('focus-name');
const feedbackMsg = document.getElementById('feedback-message');
const scoreDisplay = document.getElementById('current-score');
const progressBar = document.getElementById('test-progress');

// Initialization
document.getElementById('btn-go-review').addEventListener('click', () => showScreen('review'));
document.getElementById('btn-go-test').addEventListener('click', () => startTest());

function showScreen(screenId) {
    screens.forEach(screen => {
        screen.classList.remove('active');
        if (screen.id === `screen-${screenId}`) {
            screen.classList.add('active');
        }
    });

    if (screenId === 'review') renderReview();
}

function renderReview() {
    reviewList.innerHTML = '';
    municipalities.forEach(m => {
        const card = document.createElement('div');
        card.className = 'municipality-card';
        card.innerHTML = `
            <div class="card-info">
                <h4>${m.name}</h4>
                <p>Málaga, España</p>
            </div>
            <div class="card-pop">
                <span class="pop-round">${m.rounded}</span>
                <span class="pop-exact">Exacto: ${m.exact}</span>
            </div>
        `;
        reviewList.appendChild(card);
    });
}

function startTest() {
    testScore = 0;
    currentQuestionIndex = 0;
    shuffledList = [...municipalities].sort(() => Math.random() - 0.5);
    updateScore();
    showScreen('test');
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= shuffledList.length) {
        finishTest();
        return;
    }

    const currentItem = shuffledList[currentQuestionIndex];
    questionName.innerText = currentItem.name;
    feedbackMsg.innerText = '';
    
    // Generate options
    const options = generateOptions(currentItem.rounded);
    renderOptions(options, currentItem.rounded);
    
    // Progress bar
    const progress = (currentQuestionIndex / shuffledList.length) * 100;
    progressBar.style.width = `${progress}%`;
}

function generateOptions(correctAnswer) {
    let options = [correctAnswer];
    
    // Get 3 more random populations
    while (options.length < 4) {
        const randomItem = municipalities[Math.floor(Math.random() * municipalities.length)];
        if (!options.includes(randomItem.rounded)) {
            options.push(randomItem.rounded);
        }
    }
    
    return options.sort(() => Math.random() - 0.5);
}

function renderOptions(options, correctAnswer) {
    optionsContainer.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, correctAnswer, btn);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selected, correct, btn) {
    // Disable all buttons
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach(b => b.style.pointerEvents = 'none');

    if (selected === correct) {
        btn.classList.add('correct');
        feedbackMsg.innerText = '¡Muy bien! ✨';
        feedbackMsg.style.color = '#1eb94e';
        testScore++;
        updateScore();
    } else {
        btn.classList.add('wrong');
        feedbackMsg.innerText = `Casi... era ${correct}`;
        feedbackMsg.style.color = '#ee5253';
        
        // Highlight correct one
        buttons.forEach(b => {
            if (b.innerText === correct) b.classList.add('correct');
        });
    }

    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 1500);
}

function updateScore() {
    scoreDisplay.innerText = testScore;
}

function finishTest() {
    progressBar.style.width = '100%';
    const emoji = document.getElementById('results-emoji');
    const title = document.getElementById('results-title');
    const summary = document.getElementById('results-summary');
    const finalScore = document.getElementById('final-score-display');
    
    finalScore.innerText = `${testScore}/${municipalities.length}`;
    
    if (testScore === municipalities.length) {
        emoji.innerText = '🏆';
        title.innerText = '¡Perfecto!';
        summary.innerText = '¡Te sabes todos los municipios de memoria!';
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    } else if (testScore > municipalities.length / 2) {
        emoji.innerText = '⭐';
        title.innerText = '¡Muy bien!';
        summary.innerText = '¡Ya casi los tienes todos! Sigue practicando.';
    } else {
        emoji.innerText = '💪';
        title.innerText = '¡Buen intento!';
        summary.innerText = 'Repasa un poco más y vuelve a intentarlo.';
    }
    
    showScreen('results');
}
