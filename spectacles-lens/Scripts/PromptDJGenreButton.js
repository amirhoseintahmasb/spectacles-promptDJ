/**
 * PromptDJ Genre Button
 * =====================
 * A single button that generates music in a specific genre/style.
 * Attach to a UI button (with Interactable component).
 * 
 * Genres available:
 * - Techno, House, Dubstep, DNB (Drum and Bass)
 * - Funk, Jazz, HipHop, Trap
 * - Latin (Bossa Nova), Reggae
 * - Electronic, Basic
 */

//@input SceneObject controllerObject {"label": "PromptDJ Controller"}
//@input string genre = "techno" {"label": "Genre", "hint": "techno, house, dubstep, dnb, funk, jazz, hiphop, trap, latin, reggae, electronic, basic"}
//@input string scale = "C_minor" {"label": "Scale", "hint": "C_major, A_minor, D_minor, G_major, E_minor, F_major"}
//@input int tempo = 120 {"label": "Tempo BPM", "hint": "60-180"}
//@input float density = 0.6 {"label": "Note Density", "hint": "0.0-1.0"}
//@input Component.Text labelText {"label": "Button Label (optional)"}

var controller = null;

function initialize() {
    // Get controller reference
    if (script.controllerObject) {
        var scripts = script.controllerObject.getComponents("Component.ScriptComponent");
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].generateMelody) {
                controller = scripts[i];
                break;
            }
        }
    }
    
    if (!controller) {
        print("PromptDJGenreButton: WARNING - Controller not found!");
    }
    
    // Set label text if provided
    if (script.labelText) {
        var displayName = script.genre.charAt(0).toUpperCase() + script.genre.slice(1);
        script.labelText.text = displayName;
    }
    
    // Setup interactable callback
    setupInteractable();
}

function setupInteractable() {
    var interactable = script.getSceneObject().getComponent("Component.ScriptComponent");
    
    // Try to find Interactable in SIK style
    var components = script.getSceneObject().getComponents("Component.ScriptComponent");
    for (var i = 0; i < components.length; i++) {
        var comp = components[i];
        if (comp.onTriggerEnd) {
            comp.onTriggerEnd.add(onButtonPressed);
            print("PromptDJGenreButton: Hooked to Interactable for " + script.genre);
            return;
        }
    }
    
    print("PromptDJGenreButton: No Interactable found - add one to this SceneObject");
}

function onButtonPressed() {
    if (!controller) {
        print("PromptDJGenreButton: No controller!");
        return;
    }
    
    print("PromptDJGenreButton: Generating " + script.genre + " music...");
    
    // Update controller params
    if (controller.params) {
        controller.params.drum_style = script.genre;
        controller.params.scale = script.scale;
        controller.params.tempo_bpm = script.tempo;
        controller.params.density = script.density;
    }
    
    // Generate both melody and drums in this genre
    controller.generateBoth();
}

// Expose for external calls
script.api.onButtonPressed = onButtonPressed;
script.api.setGenre = function(genre) {
    script.genre = genre;
    if (script.labelText) {
        script.labelText.text = genre.charAt(0).toUpperCase() + genre.slice(1);
    }
};

initialize();

