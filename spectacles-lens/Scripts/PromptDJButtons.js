/**
 * PromptDJ Button Handlers
 * ========================
 * Attach this script to UI buttons to trigger PromptDJ actions.
 * Works with Spectacles Interaction Kit buttons.
 * 
 * Setup:
 * 1. Attach to a button SceneObject
 * 2. Link the controller reference
 * 3. Select the action type
 */

//@input SceneObject controllerObject
//@input string action {"widget":"combobox", "values":[{"label":"Generate Melody", "value":"melody"}, {"label":"Generate Drums", "value":"drums"}, {"label":"Generate Both", "value":"both"}, {"label":"Tempo Up", "value":"tempoUp"}, {"label":"Tempo Down", "value":"tempoDown"}, {"label":"Next Scale", "value":"nextScale"}, {"label":"Previous Scale", "value":"prevScale"}, {"label":"Next Drum Style", "value":"nextDrumStyle"}, {"label":"Ping", "value":"ping"}]}

var controller = null;

function initialize() {
    if (script.controllerObject) {
        controller = script.controllerObject.getComponent("Component.ScriptComponent");
    }
    
    if (!controller) {
        print("PromptDJButtons: WARNING - Controller not found!");
    }
}

/**
 * Call this from button's onTrigger event
 */
script.onButtonPressed = function() {
    if (!controller) {
        print("PromptDJButtons: No controller!");
        return;
    }
    
    switch (script.action) {
        case "melody":
            controller.generateMelody();
            break;
        case "drums":
            controller.generateDrums();
            break;
        case "both":
            controller.generateBoth();
            break;
        case "tempoUp":
            controller.increaseTempo();
            break;
        case "tempoDown":
            controller.decreaseTempo();
            break;
        case "nextScale":
            controller.nextScale();
            break;
        case "prevScale":
            controller.previousScale();
            break;
        case "nextDrumStyle":
            controller.nextDrumStyle();
            break;
        case "ping":
            controller.ping();
            break;
        default:
            print("PromptDJButtons: Unknown action - " + script.action);
    }
};

// Also expose as api for direct calls
script.api.onButtonPressed = script.onButtonPressed;

initialize();

