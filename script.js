// ========== TEAM DATA ==========
const teams = {
    fb: { emoji: "💛💙", color: "#FFD700", color2: "#1a237e", glow: "rgba(255, 215, 0, 0.7)" },
    gs: { emoji: "🔴🟡", color: "#FF4444", color2: "#c62828", glow: "rgba(255, 68, 68, 0.7)" },
    bjk: { emoji: "🦅⚫", color: "#FFFFFF", color2: "#1a1a1a", glow: "rgba(255, 255, 255, 0.6)" },
    ts: { emoji: "🔵🔴", color: "#00BFFF", color2: "#8B0000", glow: "rgba(0, 191, 255, 0.7)" }
};

const usernames = [
    "Ali_34", "Mehmet_TR", "Fan_07", "Ultras_61", "Taraftar_99", "Gol_King",
    "Tribün_1", "Stadyum_FB", "Cimbom_GS", "Kartal_BJK", "Bordo_Mavi", "Sari_Lacivert",
    "Aslan_34", "Fener_1907", "Besiktas_03", "TS_61"
];

// ========== SETTINGS ==========
let settings = {
    matchTime: 180,
    goalDistance: 42,
    votePower: 0.2,
    simSpeed: 500,
    simEnabled: true,
    giftPowers: { 1: 5, 2: 15, 3: 30, 4: 50 }
};

// ========== STATE ==========
let selectedTeams = [];
let team1, team2;
let simInterval = null;
let state = {
    ballPos: 50,
    score1: 0,
    score2: 0,
    votes1: 0,
    votes2: 0,
    fans1: 0,
    fans2: 0,
    combo: 0,
    lastTeam: null,
    time: 180,
    running: false
};

// ========== TEAM SELECTION ==========
function selectTeam(id) {
    const card = document.querySelector(`[data-team="${id}"]`);

    if (selectedTeams.includes(id)) {
        selectedTeams = selectedTeams.filter(t => t !== id);
        card.classList.remove('selected');
    } else if (selectedTeams.length < 2) {
        selectedTeams.push(id);
        card.classList.add('selected');
    }

    document.getElementById('start-btn').classList.toggle('active', selectedTeams.length === 2);
}

// ========== START GAME ==========
function startGame() {
    if (selectedTeams.length !== 2) return;

    const t1id = selectedTeams[0];
    const t2id = selectedTeams[1];

    team1 = {
        ...teams[t1id],
        name: document.getElementById(`input-${t1id}`).value.toUpperCase() || teams[t1id].emoji
    };
    team2 = {
        ...teams[t2id],
        name: document.getElementById(`input-${t2id}`).value.toUpperCase() || teams[t2id].emoji
    };

    // Apply CSS Variables
    const root = document.documentElement;
    root.style.setProperty('--team1-color', team1.color);
    root.style.setProperty('--team1-color2', team1.color2);
    root.style.setProperty('--team1-glow', team1.glow);
    root.style.setProperty('--team2-color', team2.color);
    root.style.setProperty('--team2-color2', team2.color2);
    root.style.setProperty('--team2-glow', team2.glow);

    // Update HUD
    document.getElementById('hud-logo-1').textContent = team1.emoji;
    document.getElementById('hud-logo-2').textContent = team2.emoji;
    document.getElementById('hud-name-1').textContent = team1.name;
    document.getElementById('hud-name-2').textContent = team2.name;

    // Update Controls
    document.getElementById('vote-emoji-1').textContent = team1.emoji;
    document.getElementById('vote-emoji-2').textContent = team2.emoji;
    document.getElementById('vote-text-1').textContent = team1.name.substring(0, 8);
    document.getElementById('vote-text-2').textContent = team2.name.substring(0, 8);

    // Update Power Bar
    document.getElementById('power-emoji-1').textContent = team1.emoji;
    document.getElementById('power-emoji-2').textContent = team2.emoji;

    // Show Game
    document.getElementById('team-selection').classList.add('hidden');
    document.getElementById('game-container').style.display = 'flex';

    state.time = settings.matchTime;
    state.running = true;
    startTimer();
    if (settings.simEnabled) {
        startSimulation();
    }
}

// ========== VOTING ==========
function vote(teamNum, power = 1) {
    if (!state.running) return;

    const username = usernames[Math.floor(Math.random() * usernames.length)];
    const team = teamNum === 1 ? team1 : team2;

    if (teamNum === 1) {
        state.votes1 += power;
        state.fans1++;
    } else {
        state.votes2 += power;
        state.fans2++;
    }

    // Combo system
    if (state.lastTeam === teamNum) {
        state.combo++;
        if (state.combo % 10 === 0 && state.combo > 0) {
            showCombo();
        }
    } else {
        state.combo = 0;
    }
    state.lastTeam = teamNum;

    // Show live comment
    const text = power > 1 ? `🎁 +${power}!` : `${team.name.substring(0, 5)}!`;
    showLiveComment(teamNum, username, text);

    // Ball shake
    document.getElementById('ball').classList.add('shake');
    setTimeout(() => document.getElementById('ball').classList.remove('shake'), 100);

    updateGame();
}

// ========== LIVE COMMENT ==========
function showLiveComment(teamNum, username, text) {
    const el = document.getElementById(`live-comment-${teamNum}`);
    el.innerHTML = `<strong>@${username}</strong> ${text}`;
    el.classList.remove('active');

    // Force reflow
    void el.offsetWidth;

    el.classList.add('active');
}

// ========== UPDATE GAME ==========
function updateGame() {
    const total = state.votes1 + state.votes2;
    if (total === 0) return;

    const p1 = (state.votes1 / total) * 100;
    const p2 = (state.votes2 / total) * 100;

    // Move ball - use settings for vote power and goal distance
    const goalThreshold = 50 - settings.goalDistance / 2;
    const maxPos = 50 + settings.goalDistance / 2;
    state.ballPos = Math.max(goalThreshold, Math.min(maxPos, 50 + (state.votes2 - state.votes1) * settings.votePower));

    // Update UI
    document.getElementById('ball').style.left = ((state.ballPos - goalThreshold) / settings.goalDistance * 100) + '%';
    document.getElementById('power-1').style.width = p1 + '%';
    document.getElementById('power-2').style.width = p2 + '%';
    document.getElementById('power-indicator').style.left = ((state.ballPos - goalThreshold) / settings.goalDistance * 100) + '%';
    document.getElementById('percent-1').textContent = Math.round(p1) + '%';
    document.getElementById('percent-2').textContent = Math.round(p2) + '%';
    document.getElementById('fans-1').textContent = state.fans1;
    document.getElementById('fans-2').textContent = state.fans2;

    // Check for goal
    if (state.ballPos <= goalThreshold) {
        goal(2);
    } else if (state.ballPos >= maxPos) {
        goal(1);
    }
}

// ========== GOAL ==========
function goal(teamNum) {
    state.running = false;
    const team = teamNum === 1 ? team1 : team2;

    if (teamNum === 1) {
        state.score1++;
        document.getElementById('score-1').textContent = state.score1;
    } else {
        state.score2++;
        document.getElementById('score-2').textContent = state.score2;
    }

    const goalText = document.getElementById('goal-text');
    goalText.textContent = team.emoji + ' GOOOL!';
    goalText.style.color = team.color;
    goalText.style.textShadow = `0 0 100px ${team.glow}, 0 0 150px ${team.glow}`;

    document.getElementById('goal-scorer').textContent = team.name + ' GOL ATTI!';
    document.getElementById('goal-overlay').classList.add('active');

    createConfetti(team.color, team.color2);

    setTimeout(() => {
        document.getElementById('goal-overlay').classList.remove('active');
        resetRound();
        state.running = true;
    }, 3000);
}

// ========== RESET ROUND ==========
function resetRound() {
    state.ballPos = 50;
    state.votes1 = 0;
    state.votes2 = 0;
    state.combo = 0;

    document.getElementById('ball').style.left = '50%';
    document.getElementById('power-1').style.width = '50%';
    document.getElementById('power-2').style.width = '50%';
    document.getElementById('power-indicator').style.left = '50%';
    document.getElementById('percent-1').textContent = '50%';
    document.getElementById('percent-2').textContent = '50%';
}

// ========== CONFETTI ==========
function createConfetti(color1, color2) {
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.background = Math.random() > 0.5 ? color1 : color2;
        confetti.style.animationDelay = Math.random() * 1 + 's';
        confetti.style.width = (10 + Math.random() * 15) + 'px';
        confetti.style.height = (10 + Math.random() * 15) + 'px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 4000);
    }
}

// ========== COMBO ==========
function showCombo() {
    const el = document.getElementById('combo-display');
    el.textContent = `🔥 ${state.combo}x COMBO!`;
    el.classList.remove('active');
    void el.offsetWidth;
    el.classList.add('active');

    setTimeout(() => el.classList.remove('active'), 2000);
}

// ========== GIFTS ==========
function sendGift(type) {
    if (!state.running) return;

    const giftEmojis = { 1: '🌹', 2: '🦁', 3: '🚀', 4: '👑' };
    const power = settings.giftPowers[type];
    const emoji = giftEmojis[type];

    if (!power) return;

    // Show gift popup
    const popup = document.createElement('div');
    popup.className = 'gift-popup';
    popup.textContent = emoji;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);

    // Random team
    const teamNum = Math.random() > 0.5 ? 1 : 2;
    vote(teamNum, power);
}

// ========== TIMER ==========
function startTimer() {
    const el = document.getElementById('match-timer');

    const interval = setInterval(() => {
        if (!state.running && state.time > 0) return;

        state.time--;
        const mins = Math.floor(state.time / 60).toString().padStart(2, '0');
        const secs = (state.time % 60).toString().padStart(2, '0');
        el.textContent = `${mins}:${secs}`;

        if (state.time <= 0) {
            clearInterval(interval);
            endMatch();
        }
    }, 1000);
}

// ========== END MATCH ==========
function endMatch() {
    state.running = false;

    const winner = state.score1 > state.score2 ? team1 :
        (state.score2 > state.score1 ? team2 : null);

    const goalText = document.getElementById('goal-text');

    if (winner) {
        goalText.textContent = winner.emoji + ' KAZANDI!';
        goalText.style.color = winner.color;
        goalText.style.textShadow = `0 0 100px ${winner.glow}`;
        createConfetti(winner.color, winner.color2);
    } else {
        goalText.textContent = '⚖️ BERABERE!';
        goalText.style.color = '#FFD700';
        goalText.style.textShadow = '0 0 100px rgba(255, 215, 0, 0.8)';
    }

    document.getElementById('goal-scorer').textContent = `Final: ${state.score1} - ${state.score2}`;
    document.getElementById('goal-overlay').classList.add('active');
}

// ========== SIMULATION ==========
function startSimulation() {
    if (simInterval) clearInterval(simInterval);

    simInterval = setInterval(() => {
        if (state.running && settings.simEnabled && Math.random() > 0.3) {
            vote(Math.random() > 0.5 ? 1 : 2);
        }
    }, settings.simSpeed);
}

// ========== KEYBOARD ==========
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    // Settings shortcut
    if (key === 'escape') {
        const overlay = document.getElementById('settings-overlay');
        if (overlay.classList.contains('active')) {
            toggleSettings();
        }
        return;
    }

    if (!state.running) return;

    switch (key) {
        case '1': vote(1); break;
        case '2': vote(2); break;
        case 'q': sendGift(1); break;
        case 'w': sendGift(2); break;
        case 'e': sendGift(3); break;
        case 'r': sendGift(4); break;
    }
});

// ========== SETTINGS FUNCTIONS ==========
function toggleSettings() {
    const overlay = document.getElementById('settings-overlay');
    overlay.classList.toggle('active');
}

function closeSettings(event) {
    if (event.target.id === 'settings-overlay') {
        toggleSettings();
    }
}

function updateSettingDisplay(input, suffix) {
    const valueEl = document.getElementById(input.id + '-value');
    if (valueEl) {
        valueEl.textContent = input.value + suffix;
    }

    // Update simulation toggle status
    if (input.id === 'setting-simulation') {
        document.getElementById('sim-status').textContent = input.checked ? 'Açık' : 'Kapalı';
    }
}

function saveSettings() {
    // Read values from inputs
    settings.matchTime = parseInt(document.getElementById('setting-time').value);
    settings.goalDistance = parseInt(document.getElementById('setting-distance').value);
    settings.votePower = parseFloat(document.getElementById('setting-votepower').value);
    settings.simSpeed = parseInt(document.getElementById('setting-simspeed').value);
    settings.simEnabled = document.getElementById('setting-simulation').checked;

    // Gift powers
    settings.giftPowers = {
        1: parseInt(document.getElementById('gift-power-1').value) || 5,
        2: parseInt(document.getElementById('gift-power-2').value) || 15,
        3: parseInt(document.getElementById('gift-power-3').value) || 30,
        4: parseInt(document.getElementById('gift-power-4').value) || 50
    };

    // Apply settings
    state.time = settings.matchTime;

    // Update timer display
    const mins = Math.floor(settings.matchTime / 60).toString().padStart(2, '0');
    const secs = (settings.matchTime % 60).toString().padStart(2, '0');
    document.getElementById('match-timer').textContent = `${mins}:${secs}`;

    // Restart simulation with new speed
    if (simInterval) {
        clearInterval(simInterval);
        if (settings.simEnabled && state.running) {
            startSimulation();
        }
    }

    // Show confirmation
    showSaveConfirmation();
    toggleSettings();
}

function showSaveConfirmation() {
    const popup = document.createElement('div');
    popup.className = 'gift-popup';
    popup.textContent = '✅';
    popup.style.fontSize = '6rem';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
}

function resetSettings() {
    // Reset to defaults
    document.getElementById('setting-time').value = 180;
    document.getElementById('setting-time-value').textContent = '180s';

    document.getElementById('setting-distance').value = 42;
    document.getElementById('setting-distance-value').textContent = '42';

    document.getElementById('setting-votepower').value = 0.2;
    document.getElementById('setting-votepower-value').textContent = '0.2x';

    document.getElementById('setting-simspeed').value = 500;
    document.getElementById('setting-simspeed-value').textContent = '500ms';

    document.getElementById('setting-simulation').checked = true;
    document.getElementById('sim-status').textContent = 'Açık';

    document.getElementById('gift-power-1').value = 5;
    document.getElementById('gift-power-2').value = 15;
    document.getElementById('gift-power-3').value = 30;
    document.getElementById('gift-power-4').value = 50;
}

// Initialize simulation checkbox listener
document.addEventListener('DOMContentLoaded', () => {
    const simCheckbox = document.getElementById('setting-simulation');
    if (simCheckbox) {
        simCheckbox.addEventListener('change', function () {
            document.getElementById('sim-status').textContent = this.checked ? 'Açık' : 'Kapalı';
        });
    }
});
