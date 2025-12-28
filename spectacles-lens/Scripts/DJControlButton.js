/**
 * DJ Control Button - Start/Stop/Random
 * ======================================
 * Control buttons for the DJ interface.
 * 
 * Actions:
 * - start: Generate and play (same as random genre)
 * - stop: Stop current playback
 * - random: Pick random genre and play
 * - next: Next genre
 * - previous: Previous genre
 * - regenerate: Regenerate current genre
 */

//@input SceneObject uiController {"label": "PromptDJ UI Controller"}
//@input string action = "start" {"label": "Action", "hint": "start, stop, random, next, previous, regenerate"}

var ui = null;
var controller = null;

function onStart() {
    // Find UI controller
    if (script.uiController) {
        var scripts = script.uiController.getComponents("Component.ScriptComponent");
        for (var i = 0; i < scripts.length; i++) {
            // Check for PromptDJUI
            if (scripts[i].selectGenre) {
                ui = scripts[i];
            }
            // Check for PromptDJController
            if (scripts[i].generateMelody) {
                controller = scripts[i];
            }
        }
    }
    
    // Hook to Interactable if present
    var components = script.getSceneObject().getComponents("Component.ScriptComponent");
    for (var i = 0; i < components.length; i++) {
        if (components[i].onTriggerEnd) {
            components[i].onTriggerEnd.add(trigger);
            print("DJControlButton [" + script.action + "]: Connected to Interactable");
            return;
        }
    }
}

function trigger() {
    print("DJControlButton: " + script.action + " pressed!");
    
    switch (script.action) {
        case "start":
        case "random":
            if (ui && ui.random) {
                ui.random();
            } else if (controller && controller.generateBoth) {
                controller.generateBoth();
            }
            break;
            
        case "stop":
            if (ui && ui.stop) {
                ui.stop();
            } else if (controller && controller.stopPlayback) {
                controller.stopPlayback();
            }
            break;
            
        case "next":
            if (ui && ui.next) {
                ui.next();
            }
            break;
            
        case "previous":
            if (ui && ui.previous) {
                ui.previous();
            }
            break;
            
        case "regenerate":
            if (ui && ui.regenerate) {
                ui.regenerate();
            } else if (controller && controller.generateBoth) {
                controller.generateBoth();
            }
            break;
            
        default:
            print("DJControlButton: Unknown action - " + script.action);
    }
}

// Public API
script.trigger = trigger;

// Initialize
var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(onStart);

