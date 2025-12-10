class PianoNotes {
    constructor() {
        this.notes = {
            'C4': 261.63,
            'D4': 293.66,
            'E4': 329.63,
            'F4': 349.23,
            'G4': 392.00,
            'A4': 440.00,
            'B4': 493.88,
            'C5': 523.25
        };
        
        this.audioContext = null;
        this.loadedSounds = {};
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    // Play a piano note by name (e.g., 'C4', 'E4')
    playNote(noteName, volume = 0.3, duration = 0.2) {
        if (!this.audioContext) {
            this.init();
            if (!this.audioContext) return;
        }

        const frequency = this.notes[noteName];
        if (!frequency) {
            console.warn(`Note ${noteName} not found`);
            return;
        }

        // Create oscillator for the note
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine'; // Piano-like sound
        
        // Envelope: quick attack, smooth decay
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Play note for specific column (maps columns to notes)
    playColumnNote(column, volume = 0.3) {
        const noteMap = ['C4', 'D4', 'E4', 'F4']; // Columns 0-3
        const noteName = noteMap[Math.max(0, Math.min(3, column))];
        this.playNote(noteName, volume);
    }

    // Play a chord (multiple notes at once)
    playChord(noteNames, volume = 0.2) {
        noteNames.forEach(noteName => {
            this.playNote(noteName, volume, 0.3);
        });
    }
}

