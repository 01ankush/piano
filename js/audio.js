class AudioManager {
    constructor() {
        this.audioContext = null;
        this.currentAudio = null;
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.volume = 0.5;
    }

    init() {
        try {
            // Create audio context for Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    loadAudio(src) {
        return new Promise((resolve, reject) => {
            if (!src) {
                // No audio file, just resolve
                resolve();
                return;
            }

            const audio = new Audio(src);
            audio.volume = this.volume;
            
            audio.addEventListener('loadeddata', () => {
                this.currentAudio = audio;
                resolve(audio);
            });
            
            audio.addEventListener('error', (e) => {
                console.warn('Audio load error:', e);
                reject(e);
            });
            
            audio.load();
        });
    }

    play() {
        if (this.currentAudio) {
            if (this.pauseTime > 0) {
                this.currentAudio.currentTime = this.pauseTime;
            }
            this.currentAudio.play().catch(e => {
                console.warn('Audio play error:', e);
            });
            this.isPlaying = true;
            this.startTime = Date.now() - (this.pauseTime * 1000);
        }
    }

    pause() {
        if (this.currentAudio && this.isPlaying) {
            this.currentAudio.pause();
            this.pauseTime = this.currentAudio.currentTime;
            this.isPlaying = false;
        }
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.pauseTime = 0;
            this.isPlaying = false;
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.currentAudio) {
            this.currentAudio.volume = this.volume;
        }
    }

    getCurrentTime() {
        if (this.currentAudio && this.isPlaying) {
            return this.currentAudio.currentTime;
        }
        return this.pauseTime;
    }

    // Play tap sound effect
    playTapSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    // Play miss sound effect
    playMissSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
}

