import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc, doc, onSnapshot, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAMCwCjCSFYCf5OP3yY4fl4-k-Vq5wj7XY",
    authDomain: "sn-baby.firebaseapp.com",
    projectId: "sn-baby",
    storageBucket: "sn-baby.firebasestorage.app",
    messagingSenderId: "547477581316",
    appId: "1:547477581316:web:39750635c867fa44ed0f51",
    measurementId: "G-WEXGBKMCXC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Gender Polling logic with Firebase
let hasVoted = false;
let localVotesBoy = 0;
let localVotesGirl = 0;

// Listen for real-time poll updates from Firebase (using 'nameGuesses' collection to bypass potential new-collection rule restrictions)
onSnapshot(doc(db, 'nameGuesses', 'poll_results'), (snap) => {
    if (snap.exists()) {
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
        
        // Only animate the bars if the results section has been revealed to the user
        if (resultsDiv.style.display !== 'none') {
            barBoy.style.width = percentBoy + '%';
            barBoy.textContent = `Boy: ${percentBoy}%`;
            
            barGirl.style.width = percentGirl + '%';
            barGirl.textContent = `Girl: ${percentGirl}%`;
        }
    }
}

// Attach to window since we are now in an ES module
window.voteGender = async function(gender) {
    if (hasVoted) return;
    hasVoted = true;
    
    // Change theme based on guess!
    window.changeTheme(gender === 'boy' ? 'blue' : 'pink');
    
    // Optimistic local update so it shows the animation instantly no matter what!
    if (gender === 'boy') localVotesBoy++;
    else localVotesGirl++;
    
    // Show results section immediately to prepare for animation
    const resultsDiv = document.getElementById('poll-results');
    const barBoy = document.getElementById('bar-boy');
    const barGirl = document.getElementById('bar-girl');
    
    if (resultsDiv.style.display === 'none') {
        barBoy.style.width = '0%';
        barGirl.style.width = '0%';
        resultsDiv.style.display = 'block';
        void resultsDiv.offsetHeight; // Force layout reflow for animation
    }
    
    updatePollUI();
    
    // Save vote to Firebase
    try {
        const pollRef = doc(db, 'nameGuesses', 'poll_results');
        if (gender === 'boy') {
            await setDoc(pollRef, { boy: increment(1) }, { merge: true });
        } else {
            await setDoc(pollRef, { girl: increment(1) }, { merge: true });
        }
    } catch (e) {
        console.error("Error saving vote to Firebase: ", e);
    }
};

// Guess Name logic
window.guessName = async function() {
    const input = document.getElementById('name-input');
    const feedback = document.getElementById('name-feedback');
    
    const name = input.value.trim();
    
    if (name.length > 0) {
        const startChar = name.charAt(0).toUpperCase();
        
        if (startChar === 'S') {
            feedback.textContent = "Great guess! 'S' corresponds to a boy 💙";
            feedback.style.color = "var(--dark-blue)";
        } else if (startChar === 'N') {
            feedback.textContent = "Beautiful! 'N' corresponds to a girl 💖";
            feedback.style.color = "var(--dark-pink)";
        } else {
            feedback.textContent = "Oops! Hint: Try a name starting with 'S' or 'N' 😉";
            feedback.style.color = "#ff8da1";
        }
        
        input.value = '';
        
        try {
            await addDoc(collection(db, "nameGuesses"), {
                name: name,
                createdAt: serverTimestamp()
            });
            setTimeout(() => { feedback.textContent = ''; }, 4000);
        } catch (e) {
            console.error("Error adding name guess: ", e);
        }
    }
};

// Allow Enter key to submit name guess
const nameInputEl = document.getElementById('name-input');
if (nameInputEl) {
    nameInputEl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') window.guessName();
    });
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
    
    // If not already opened
    if (!msg.classList.contains('show')) {
        // Change icon and animate
        box.textContent = '✨';
        box.style.animation = 'none';
        box.style.transform = 'scale(1.2) rotate(360deg)';
        
        inst.style.display = 'none';
        
        // Show message
        msg.classList.add('show');
        
        // Create random sparkles
        for (let i = 0; i < 8; i++) {
            createSparkle(section);
        }
    }
};

function createSparkle(parent) {
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
