class SongManager {
    constructor() {
        this.songs = [
            {
                id: 'demo1',
                name: 'Simple Test Tune',
                bpm: 120,
                duration: 30, // 30 seconds for testing
                audioUrl: null, // No background audio
                beatMap: this.generateDemoBeatMap1()
            },
            {
                id: 'demo2',
                name: 'Medium Test Tune',
                bpm: 140,
                duration: 30,
                audioUrl: null,
                beatMap: this.generateDemoBeatMap2()
            },
            {
                id: 'demo3',
                name: 'Fast Test Tune',
                bpm: 160,
                duration: 30,
                audioUrl: null,
                beatMap: this.generateDemoBeatMap3()
            }
        ];
        
        this.currentSong = null;
        this.songStartTime = 0;
    }

    // Generate demo beat map - pattern of column indices, timings, and sounds
    generateDemoBeatMap1() {
        const beats = [];
        const bpm = 120;
        const beatInterval = 60 / bpm; // 0.5 seconds per beat
        
        // Note mapping for columns
        const noteMap = ['C4', 'D4', 'E4', 'F4'];
        
        // Generate continuous beats - simple pattern for testing
        const totalBeats = Math.floor(30 / beatInterval); // 30 seconds worth of beats
        
        for (let i = 0; i < totalBeats; i++) {
            const time = i * beatInterval;
            
            // Rotate through all 4 columns in sequence - EVERY beat gets a tile
            const column = i % 4;
            const note = noteMap[column];
            
            beats.push({ 
                time, 
                column: column,
                sound: note,
                lane: column + 1,
                spawned: false // Reset flag
            });
        }
        
        return beats;
    }

    generateDemoBeatMap2() {
        const beats = [];
        const bpm = 140;
        const beatInterval = 60 / bpm; // ~0.43 seconds per beat
        
        const noteMap = ['C4', 'D4', 'E4', 'F4'];
        const totalBeats = Math.floor(30 / beatInterval); // 30 seconds
        
        for (let i = 0; i < totalBeats; i++) {
            const time = i * beatInterval;
            
            // More complex pattern - use all 4 columns
            const pattern = i % 8;
            let column;
            if (pattern < 4) {
                column = pattern;
            } else {
                // Add beats in different columns for variation
                if (pattern === 4) {
                    column = 0;
                } else if (pattern === 5) {
                    column = 2;
                } else if (pattern === 6) {
                    column = 1;
                } else {
                    column = 3;
                }
            }
            
            beats.push({ 
                time, 
                column: column,
                sound: noteMap[column],
                lane: column + 1,
                spawned: false
            });
        }
        
        return beats;
    }

    generateDemoBeatMap3() {
        const beats = [];
        const bpm = 160;
        const beatInterval = 60 / bpm; // ~0.375 seconds per beat
        
        const noteMap = ['C4', 'D4', 'E4', 'F4'];
        const totalBeats = Math.floor(30 / beatInterval); // 30 seconds
        
        for (let i = 0; i < totalBeats; i++) {
            const time = i * beatInterval;
            
            // Fast pattern using all 4 columns
            const column = i % 4;
            beats.push({ 
                time, 
                column: column,
                sound: noteMap[column],
                lane: column + 1,
                spawned: false
            });
            
            // Add rapid double taps for challenge
            if (i % 6 === 0 && i > 0) {
                const nextColumn = (column + 1) % 4;
                beats.push({ 
                    time: time + 0.15, 
                    column: nextColumn,
                    sound: noteMap[nextColumn],
                    lane: nextColumn + 1,
                    spawned: false
                });
            }
            
            // Add triple taps occasionally
            if (i % 12 === 0 && i > 0) {
                const thirdColumn = (column + 2) % 4;
                beats.push({ 
                    time: time + 0.1, 
                    column: thirdColumn,
                    sound: noteMap[thirdColumn],
                    lane: thirdColumn + 1,
                    spawned: false
                });
            }
        }
        
        return beats;
    }

    loadSong(songId) {
        const song = this.songs.find(s => s.id === songId);
        if (song) {
            this.currentSong = song;
            // Sort beats by time
            song.beatMap.sort((a, b) => a.time - b.time);
            return song;
        }
        return null;
    }

    getCurrentSong() {
        return this.currentSong;
    }

    getBeatsForTimeRange(startTime, endTime) {
        if (!this.currentSong) return [];
        
        return this.currentSong.beatMap.filter(beat => 
            beat.time >= startTime && beat.time < endTime
        );
    }

    getNextBeat(currentTime) {
        if (!this.currentSong) return null;
        
        // Find the next beat that hasn't been spawned yet
        // Accept beats that are close to current time (for spawn ahead logic)
        const tolerance = 2.0; // 2 second window for spawn ahead
        
        const nextBeat = this.currentSong.beatMap.find(beat => {
            const timeDiff = beat.time - currentTime;
            // Accept beats that are within 2 seconds ahead (for spawn ahead)
            return timeDiff >= -0.1 && timeDiff <= tolerance && !beat.spawned;
        });
        
        if (nextBeat) {
            nextBeat.spawned = true;
            return nextBeat;
        }
        
        return null;
    }

    resetSong() {
        if (this.currentSong) {
            this.currentSong.beatMap.forEach(beat => {
                beat.spawned = false;
            });
        }
        this.songStartTime = 0;
    }

    getAllSongs() {
        return this.songs;
    }
}

