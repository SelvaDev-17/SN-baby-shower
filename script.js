// Remove module imports
const firebaseConfig = {
    apiKey: "AIzaSyAMCwCjCSFYCf5OP3yY4fl4-k-Vq5wj7XY",
    authDomain: "sn-baby.firebaseapp.com",
    projectId: "sn-baby",
    storageBucket: "sn-baby.firebasestorage.app",
    messagingSenderId: "547477581316",
    appId: "1:547477581316:web:39750635c867fa44ed0f51",
    measurementId: "G-WEXGBKMCXC"
};

// Initialize Firebase Compat
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Gender Polling logic with Firebase
let hasVoted = false;
let localVotesBoy = 0;
let localVotesGirl = 0;

// Listen for real-time poll updates from Firebase
db.collection('nameGuesses').doc('poll_results').onSnapshot((snap) => {
    if (snap.exists) {
        const data = snap.data();
        localVotesBoy = data.boy || 0;
        localVotesGirl = data.girl || 0;
        updatePollUI();
    }
});

function updatePollUI() {
    const total = localVotesBoy + localVotesGirl;
    if (total > 0) {
        const percentBoy = Math.round((localVotesBoy / total) * 100);
        const percentGirl = Math.round((localVotesGirl / total) * 100);
        
        const resultsDiv = document.getElementById('poll-results');
        const barBoy = document.getElementById('bar-boy');
        const barGirl = document.getElementById('bar-girl');
        
        if (resultsDiv && resultsDiv.style.display !== 'none') {
            barBoy.style.width = percentBoy + '%';
            barBoy.textContent = `Boy: ${percentBoy}%`;
            
            barGirl.style.width = percentGirl + '%';
            barGirl.textContent = `Girl: ${percentGirl}%`;
        }
    }
}

window.voteGender = async function(gender) {
    if (hasVoted) return;
    hasVoted = true;
    
    window.changeTheme(gender === 'boy' ? 'blue' : 'pink');
    
    if (gender === 'boy') localVotesBoy++;
    else localVotesGirl++;
    
    const resultsDiv = document.getElementById('poll-results');
    const barBoy = document.getElementById('bar-boy');
    const barGirl = document.getElementById('bar-girl');
    
    if (resultsDiv && resultsDiv.style.display === 'none') {
        barBoy.style.width = '0%';
        barGirl.style.width = '0%';
        resultsDiv.style.display = 'block';
        void resultsDiv.offsetHeight;
    }
    
    updatePollUI();
    
    try {
        const pollRef = db.collection('nameGuesses').doc('poll_results');
        const inc = firebase.firestore.FieldValue.increment(1);
        if (gender === 'boy') {
            await pollRef.set({ boy: inc }, { merge: true });
        } else {
            await pollRef.set({ girl: inc }, { merge: true });
        }
    } catch (e) {
        console.error("Error saving vote to Firebase: ", e);
    }
};

window.guessName = async function() {
    const input = document.getElementById('nameInput');
    const userNameInput = document.getElementById('userName');
    const feedback = document.getElementById('name-feedback');
    
    if (!input || !userNameInput || !feedback) return;
    
    const name = input.value.trim();
    const userName = userNameInput.value.trim();
    
    if (name.length === 0 || userName.length === 0) {
        feedback.textContent = "Please enter both your name and a guess! ✨";
        feedback.style.color = "#ff8da1";
        return;
    }
    
    if (name.length > 0 && userName.length > 0) {
        const startChar = name.charAt(0).toUpperCase();
        
        if (startChar === 'S') {
            feedback.textContent = `Great guess, ${userName}! '${name}' for a boy 💙`;
            feedback.style.color = "var(--dark-blue)";
        } else if (startChar === 'N') {
            feedback.textContent = `Beautiful, ${userName}! '${name}' for a girl 💖`;
            feedback.style.color = "var(--dark-pink)";
        } else {
            feedback.textContent = `Oops, ${userName}! Hint: Try a name starting with 'S' or 'N' 😉`;
            feedback.style.color = "#ff8da1";
        }
        
        input.value = '';
        
        try {
            await db.collection("nameGuesses").add({
                name: name,
                guessedBy: userName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            setTimeout(() => { feedback.textContent = ''; }, 4000);
        } catch (e) {
            console.error("Error adding name guess: ", e);
        }
    }
};

const nameInputEl = document.getElementById('nameInput');
if (nameInputEl) {
    nameInputEl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') window.guessName();
    });
}

const userNameEl = document.getElementById('userName');
if (userNameEl) {
    userNameEl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') window.guessName();
    });
}

const nameBtnEl = document.getElementById('nameBtn');
if (nameBtnEl) {
    nameBtnEl.addEventListener('click', window.guessName);
}



// Theme Decorator logic
window.changeTheme = function(theme) {
    const root = document.documentElement;
    if (theme === 'pink') {
        root.style.setProperty('--pink', '#ffe6eb');
        root.style.setProperty('--blue', '#ffd1dc');
    } else if (theme === 'blue') {
        root.style.setProperty('--pink', '#e6f2ff');
        root.style.setProperty('--blue', '#cce0ff');
    }
};

// Surprise Box logic
window.openBox = function() {
    const box = document.getElementById('surprise-box');
    const msg = document.getElementById('hidden-message');
    const inst = document.getElementById('box-instruction');
    const section = document.getElementById('surprise');
    
    if (msg && !msg.classList.contains('show')) {
        box.textContent = '✨';
        box.style.animation = 'none';
        box.style.transform = 'scale(1.2) rotate(360deg)';
        
        if (inst) inst.style.display = 'none';
        
        msg.classList.add('show');
        
        for (let i = 0; i < 8; i++) {
            createSparkle(section);
        }
    }
};

function createSparkle(parent) {
    if (!parent) return;
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.textContent = ['✨', '💫', '⭐️'][Math.floor(Math.random() * 3)];
    
    const rx = (Math.random() - 0.5) * 150;
    const ry = (Math.random() - 0.5) * 100 - 50;
    
    sparkle.style.left = `calc(50% + ${rx}px)`;
    sparkle.style.top = `calc(50% + ${ry}px)`;
    
    parent.appendChild(sparkle);
    
    setTimeout(() => {
        sparkle.remove();
    }, 1000);
}

// Music logic
let isPlaying = false;
window.toggleMusic = function() {
    const audio = document.getElementById('bg-music');
    const icon = document.getElementById('music-icon');
    
    if (!audio || !icon) return;
    
    if (isPlaying) {
        audio.pause();
        icon.textContent = "🔇";
        isPlaying = false;
    } else {
        audio.play().catch(e => console.log("Audio play failed:", e));
        icon.textContent = "🔊";
        isPlaying = true;
    }
};
