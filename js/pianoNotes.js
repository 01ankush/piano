// Audio loader for piano notes
const noteNames = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
const noteAudio = {};

function loadAudio() {
    // Load piano notes using Web Audio API (synthesized)
    // If you have audio files, uncomment and use:
    /*
    noteNames.forEach(name => {
        const a = new Audio(`audio/piano_${name}.mp3`);
        a.preload = "auto";
        noteAudio[name] = a;
    });
    */
}

function playNote(name) {
    // Use synthesized notes (Web Audio API)
    const frequencies = {
        'C4': 261.63,
        'D4': 293.66,
        'E4': 329.63,
        'F4': 349.23,
        'G4': 392.00,
        'A4': 440.00,
        'B4': 493.88,
        'C5': 523.25
    };
    
    // If audio files are loaded, use them
    if (noteAudio[name]) {
        const a = noteAudio[name];
        a.currentTime = 0;
        a.play().catch(e => console.warn('Audio play error:', e));
        return;
    }
    
    // Otherwise synthesize the note
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const frequency = frequencies[name];
        if (!frequency) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    } catch (e) {
        console.warn('Audio synthesis error:', e);
    }
}

function getSongTime() {
    // No background audio, return 0 (we'll use game time instead)
    return 0;
}

