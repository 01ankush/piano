// KGF Theme Beat Map
// BPM and timing configuration
const KGF_BPM = 96;     // beats per minute
const KGF_OFFSET = 0.30; // seconds, to sync visual with audio

// Helper: convert beats → seconds
function b(bn) {
  return KGF_OFFSET + (60 / KGF_BPM) * bn;
}

// lanes: 0..3  (for 4 columns)
// notes: match your audio sample names (without extension)
const KGF_BEATMAP = [
  // Intro pattern - simple sequence
  { t: b(0),   lane: 0, note: "C4" },
  { t: b(1),   lane: 1, note: "D4" },
  { t: b(2),   lane: 2, note: "E4" },
  { t: b(3),   lane: 3, note: "F4" },
  
  // Main theme pattern - repeating sequence
  { t: b(4),   lane: 0, note: "G4" },
  { t: b(4.5), lane: 1, note: "A4" },
  { t: b(5),   lane: 2, note: "G4" },
  { t: b(5.5), lane: 3, note: "E4" },
  { t: b(6),   lane: 0, note: "C4" },
  { t: b(6.5), lane: 1, note: "D4" },
  { t: b(7),   lane: 2, note: "E4" },
  { t: b(7.5), lane: 3, note: "F4" },
  
  // Variation 1
  { t: b(8),   lane: 1, note: "G4" },
  { t: b(8.5), lane: 2, note: "A4" },
  { t: b(9),   lane: 0, note: "G4" },
  { t: b(9.5), lane: 3, note: "E4" },
  { t: b(10),  lane: 2, note: "C4" },
  { t: b(10.5), lane: 1, note: "D4" },
  { t: b(11),  lane: 0, note: "E4" },
  { t: b(11.5), lane: 3, note: "F4" },
  
  // Main theme repeat
  { t: b(12),  lane: 0, note: "G4" },
  { t: b(12.5), lane: 1, note: "A4" },
  { t: b(13),  lane: 2, note: "G4" },
  { t: b(13.5), lane: 3, note: "E4" },
  { t: b(14),  lane: 0, note: "C4" },
  { t: b(14.5), lane: 1, note: "D4" },
  { t: b(15),  lane: 2, note: "E4" },
  { t: b(15.5), lane: 3, note: "F4" },
  
  // Variation 2 - faster
  { t: b(16),  lane: 2, note: "G4" },
  { t: b(16.25), lane: 3, note: "A4" },
  { t: b(16.5), lane: 0, note: "G4" },
  { t: b(16.75), lane: 1, note: "E4" },
  { t: b(17),  lane: 3, note: "C4" },
  { t: b(17.25), lane: 2, note: "D4" },
  { t: b(17.5), lane: 1, note: "E4" },
  { t: b(17.75), lane: 0, note: "F4" },
  
  // Main theme repeat
  { t: b(18),  lane: 0, note: "G4" },
  { t: b(18.5), lane: 1, note: "A4" },
  { t: b(19),  lane: 2, note: "G4" },
  { t: b(19.5), lane: 3, note: "E4" },
  { t: b(20),  lane: 0, note: "C4" },
  { t: b(20.5), lane: 1, note: "D4" },
  { t: b(21),  lane: 2, note: "E4" },
  { t: b(21.5), lane: 3, note: "F4" },
  
  // Variation 3
  { t: b(22),  lane: 3, note: "G4" },
  { t: b(22.5), lane: 0, note: "A4" },
  { t: b(23),  lane: 1, note: "G4" },
  { t: b(23.5), lane: 2, note: "E4" },
  { t: b(24),  lane: 3, note: "C4" },
  { t: b(24.5), lane: 0, note: "D4" },
  { t: b(25),  lane: 1, note: "E4" },
  { t: b(25.5), lane: 2, note: "F4" },
  
  // Final sequence
  { t: b(26),  lane: 0, note: "G4" },
  { t: b(26.5), lane: 1, note: "A4" },
  { t: b(27),  lane: 2, note: "G4" },
  { t: b(27.5), lane: 3, note: "E4" },
  { t: b(28),  lane: 0, note: "C4" },
  { t: b(28.5), lane: 1, note: "D4" },
  { t: b(29),  lane: 2, note: "E4" },
  { t: b(29.5), lane: 3, note: "F4" },
];

// Export for use in game
if (typeof window !== "undefined") {
  window.KGF_BEATMAP = KGF_BEATMAP;
  window.KGF_BPM = KGF_BPM;
  window.KGF_OFFSET = KGF_OFFSET;
}

