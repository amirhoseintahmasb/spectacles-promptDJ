/**
 * DJ Button - Simple Genre Trigger
 * =================================
 * Drop this on any button to make it trigger a genre.
 * Works with SIK Interactable or can be called directly.
 * 
 * Usage:
 * 1. Add to a SceneObject with Interactable
 * 2. Set the genre
 * 3. Connect the UI controller
 */

//@input SceneObject uiController {"label": "PromptDJ UI Controller"}
//@input string genre = "techno" {"label": "Genre"}

var ui = null;

function onStart() {
    // Find UI controller
    if (script.uiController) {
        var scripts = script.uiController.getComponents("Component.ScriptComponent");
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].selectGenre) {
                ui = scripts[i];
                break;
            }
        }
    }
    
    // Hook to Interactable if present
    var components = script.getSceneObject().getComponents("Component.ScriptComponent");
    for (var i = 0; i < components.length; i++) {
        if (components[i].onTriggerEnd) {
            components[i].onTriggerEnd.add(trigger);
            print("DJButton [" + script.genre + "]: Connected to Interactable");
            return;
        }
    }
}

function trigger() {
    print("DJButton: " + script.genre + " pressed!");
    
    if (ui && ui.selectGenre) {
        ui.selectGenre(script.genre);
    } else {
        print("DJButton: No UI controller found!");
    }
}

// Public API
script.trigger = trigger;
script.api = { trigger: trigger };

// Initialize
var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(onStart);

