const maxApi = require("max-api");

const helds = new Map();

let TRANSPOSE_KEY = 9; // Default A minor
let BASE_SCALE = 9; // Default Scale A

const playNote = (note, velo) => maxApi.outlet(note, velo);
const stopNote = (note) => maxApi.outlet(note, 0);

const getTransposed = (note) => {
	const transpose = TRANSPOSE_KEY - BASE_SCALE;
	return note + transpose;
};

maxApi.addHandler("input", (note, velo) => {
	// Resend Note
	// maxApi.post(`size: ${helds.size}`);
	if (note < 24 && velo !== 0) {
		note = note % 12;
		TRANSPOSE_KEY = note;
		helds.forEach(([playedNote, playedVelo], baseNote) => {
			const updatedNote = getTransposed(baseNote);
			helds.set(baseNote, [updatedNote, playedVelo]);
			stopNote(playedNote);
			playNote(updatedNote, playedVelo);
		});
	}

	// Regulat Note
	if (note > 24) {
		if (helds.has(note)) {
			const [playedNote] = helds.get(note);
			// Note Off
			helds.delete(note);
			stopNote(playedNote, velo);
		} else {
			// Note On
			const TransposedNote = getTransposed(note);
			helds.set(note, [TransposedNote, velo]);
			playNote(TransposedNote, velo);
		}
	}
});

maxApi.addHandler("live_stop", (value) => {
	if (value === 0) {
		maxApi.post("Clear Chords");
		helds.clear();
	}
});
