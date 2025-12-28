/**
 * PromptDJ UI - Complete DJ Interface
 * ====================================
 * Creates a beautiful grid of genre buttons for music generation.
 * Attach to an empty SceneObject to auto-generate the UI.
 * 
 * Features:
 * - Genre grid (12 styles)
 * - Play/Stop controls
 * - Tempo slider
 * - Status display
 */

//@input SceneObject controllerObject {"label": "PromptDJ Controller"}
//@input SceneObject uiContainer {"label": "UI Container (Screen Transform)"}
//@input Asset.Material buttonMaterial {"label": "Button Material (optional)"}
//@input Asset.Material activeMaterial {"label": "Active Button Material (optional)"}
//@input Component.Text statusText {"label": "Status Text"}
//@input Component.Text nowPlayingText {"label": "Now Playing Text"}

// ========================================
// GENRE DEFINITIONS
// ========================================

var GENRES = [
    { id: "techno", name: "Techno", color: [0.8, 0.2, 0.8], tempo: 128, scale: "C_minor" },
    { id: "house", name: "House", color: [0.2, 0.6, 0.9], tempo: 124, scale: "F_major" },
    { id: "dubstep", name: "Dubstep", color: [1.0, 0.8, 0.0], tempo: 140, scale: "D_minor" },
    { id: "dnb", name: "Drum & Bass", color: [0.9, 0.3, 0.1], tempo: 174, scale: "A_minor" },
    { id: "funk", name: "Funk", color: [0.9, 0.5, 0.2], tempo: 110, scale: "E_minor" },
    { id: "jazz", name: "Jazz", color: [0.3, 0.3, 0.7], tempo: 120, scale: "G_major" },
    { id: "hiphop", name: "Hip Hop", color: [0.6, 0.2, 0.6], tempo: 90, scale: "C_minor" },
    { id: "trap", name: "Trap", color: [0.8, 0.1, 0.3], tempo: 140, scale: "A_minor" },
    { id: "latin", name: "Latin", color: [0.2, 0.8, 0.4], tempo: 105, scale: "D_major" },
    { id: "reggae", name: "Reggae", color: [0.1, 0.7, 0.3], tempo: 80, scale: "G_major" },
    { id: "electronic", name: "Electronic", color: [0.0, 0.9, 0.9], tempo: 128, scale: "C_major" },
    { id: "chillwave", name: "Chill", color: [0.5, 0.7, 0.9], tempo: 95, scale: "F_major" }
];

// ========================================
// STATE
// ========================================

var controller = null;
var currentGenre = null;
var isPlaying = false;
var genreButtons = [];

// ========================================
// INITIALIZATION
// ========================================

function initialize() {
    print("PromptDJ UI: Initializing...");
    
    // Get controller
    if (script.controllerObject) {
        var scripts = script.controllerObject.getComponents("Component.ScriptComponent");
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].generateMelody || scripts[i].generateBoth) {
                controller = scripts[i];
                break;
            }
        }
    }
    
    if (!controller) {
        print("PromptDJ UI: WARNING - Controller not found!");
    } else {
        print("PromptDJ UI: Controller connected!");
    }
    
    updateStatus("Ready to DJ! 🎧");
    updateNowPlaying("Select a genre");
}

// ========================================
// GENRE SELECTION
// ========================================

function selectGenre(genreId) {
    var genre = null;
    for (var i = 0; i < GENRES.length; i++) {
        if (GENRES[i].id === genreId) {
            genre = GENRES[i];
            break;
        }
    }
    
    if (!genre) {
        print("PromptDJ UI: Unknown genre: " + genreId);
        return;
    }
    
    currentGenre = genre;
    print("PromptDJ UI: Selected " + genre.name);
    
    updateNowPlaying("Loading " + genre.name + "...");
    
    // Generate music in this genre
    generateInGenre(genre);
}

function generateInGenre(genre) {
    if (!controller) {
        print("PromptDJ UI: No controller!");
        updateStatus("Error: No controller");
        return;
    }
    
    print("PromptDJ UI: Generating " + genre.name + " @ " + genre.tempo + " BPM");
    updateStatus("Generating " + genre.name + "...");
    
    // Set parameters
    if (controller.params) {
        controller.params.drum_style = genre.id;
        controller.params.scale = genre.scale;
        controller.params.tempo_bpm = genre.tempo;
        controller.params.density = 0.6;
        controller.params.variation = 0.4;
        controller.params.bars = 8;
    }
    
    // Generate
    if (controller.generateBoth) {
        controller.generateBoth();
    } else if (controller.generateMelody) {
        controller.generateMelody();
    }
    
    isPlaying = true;
    updateNowPlaying("♪ " + genre.name + " - " + genre.tempo + " BPM");
}

// ========================================
// CONTROLS
// ========================================

function stopPlayback() {
    if (controller && controller.stopPlayback) {
        controller.stopPlayback();
    }
    isPlaying = false;
    updateStatus("Stopped");
    updateNowPlaying("Select a genre");
}

function regenerate() {
    if (currentGenre) {
        generateInGenre(currentGenre);
    } else {
        // Random genre
        var randomIndex = Math.floor(Math.random() * GENRES.length);
        selectGenre(GENRES[randomIndex].id);
    }
}

function nextGenre() {
    var currentIndex = 0;
    if (currentGenre) {
        for (var i = 0; i < GENRES.length; i++) {
            if (GENRES[i].id === currentGenre.id) {
                currentIndex = i;
                break;
            }
        }
    }
    var nextIndex = (currentIndex + 1) % GENRES.length;
    selectGenre(GENRES[nextIndex].id);
}

function previousGenre() {
    var currentIndex = 0;
    if (currentGenre) {
        for (var i = 0; i < GENRES.length; i++) {
            if (GENRES[i].id === currentGenre.id) {
                currentIndex = i;
                break;
            }
        }
    }
    var prevIndex = (currentIndex - 1 + GENRES.length) % GENRES.length;
    selectGenre(GENRES[prevIndex].id);
}

function randomGenre() {
    var randomIndex = Math.floor(Math.random() * GENRES.length);
    selectGenre(GENRES[randomIndex].id);
}

// ========================================
// UI UPDATES
// ========================================

function updateStatus(message) {
    if (script.statusText) {
        script.statusText.text = message;
    }
    print("PromptDJ UI Status: " + message);
}

function updateNowPlaying(message) {
    if (script.nowPlayingText) {
        script.nowPlayingText.text = message;
    }
}

// ========================================
// PUBLIC API
// ========================================

// Genre selection
script.selectTechno = function() { selectGenre("techno"); };
script.selectHouse = function() { selectGenre("house"); };
script.selectDubstep = function() { selectGenre("dubstep"); };
script.selectDnb = function() { selectGenre("dnb"); };
script.selectFunk = function() { selectGenre("funk"); };
script.selectJazz = function() { selectGenre("jazz"); };
script.selectHiphop = function() { selectGenre("hiphop"); };
script.selectTrap = function() { selectGenre("trap"); };
script.selectLatin = function() { selectGenre("latin"); };
script.selectReggae = function() { selectGenre("reggae"); };
script.selectElectronic = function() { selectGenre("electronic"); };
script.selectChill = function() { selectGenre("chillwave"); };

// Controls
script.stop = stopPlayback;
script.regenerate = regenerate;
script.next = nextGenre;
script.previous = previousGenre;
script.random = randomGenre;
script.selectGenre = selectGenre;

// Getters
script.getCurrentGenre = function() { return currentGenre; };
script.getIsPlaying = function() { return isPlaying; };
script.getGenres = function() { return GENRES; };

// ========================================
// START
// ========================================

initialize();

print("PromptDJ UI: Ready! Available genres: " + GENRES.map(function(g) { return g.id; }).join(", "));

