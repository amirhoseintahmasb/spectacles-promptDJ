/**
 * Pinch Gesture Handler for PromptDJ
 * ===================================
 * Detects pinch gestures from Spectacles hand tracking
 * and triggers music generation.
 * 
 * Gesture Mapping:
 * - Right hand pinch: Generate Melody
 * - Left hand pinch: Generate Drums  
 * - Both hands pinch: Generate Both
 * 
 * Setup:
 * 1. Attach to a SceneObject
 * 2. Link the PromptDJ controller
 * 3. Link hand tracking components from SpectaclesInteractionKit
 */

//@input SceneObject controllerObject
//@input Component.ScriptComponent rightHandTracking
//@input Component.ScriptComponent leftHandTracking
//@input float pinchThreshold = 0.8 {"widget":"slider", "min":0.5, "max":1.0, "step":0.05}
//@input float cooldownTime = 0.5

var controller = null;
var lastRightPinchTime = 0;
var lastLeftPinchTime = 0;
var rightPinching = false;
var leftPinching = false;

function initialize() {
    print("PinchGestureHandler: Initializing...");
    
    if (script.controllerObject) {
        controller = script.controllerObject.getComponent("Component.ScriptComponent");
    }
    
    if (!controller) {
        print("PinchGestureHandler: WARNING - Controller not found!");
    }
    
    // Set up update event for continuous gesture checking
    script.createEvent("UpdateEvent").bind(onUpdate);
    
    print("PinchGestureHandler: Ready");
}

function onUpdate() {
    checkPinchGestures();
}

function checkPinchGestures() {
    var now = getTime();
    
    // Check right hand pinch
    var rightPinchStrength = getRightPinchStrength();
    var leftPinchStrength = getLeftPinchStrength();
    
    // Right hand pinch detection
    if (rightPinchStrength > script.pinchThreshold && !rightPinching) {
        rightPinching = true;
        
        if (now - lastRightPinchTime > script.cooldownTime) {
            // Check if both hands are pinching
            if (leftPinching || leftPinchStrength > script.pinchThreshold) {
                onBothHandsPinch();
                lastRightPinchTime = now;
                lastLeftPinchTime = now;
            } else {
                onRightHandPinch();
                lastRightPinchTime = now;
            }
        }
    } else if (rightPinchStrength < script.pinchThreshold - 0.1) {
        rightPinching = false;
    }
    
    // Left hand pinch detection
    if (leftPinchStrength > script.pinchThreshold && !leftPinching) {
        leftPinching = true;
        
        if (now - lastLeftPinchTime > script.cooldownTime) {
            // Check if both hands are pinching
            if (rightPinching || rightPinchStrength > script.pinchThreshold) {
                // Already handled by right hand check
            } else {
                onLeftHandPinch();
                lastLeftPinchTime = now;
            }
        }
    } else if (leftPinchStrength < script.pinchThreshold - 0.1) {
        leftPinching = false;
    }
}

function getRightPinchStrength() {
    // Get pinch strength from hand tracking
    // This depends on your SpectaclesInteractionKit setup
    try {
        if (script.rightHandTracking && script.rightHandTracking.api) {
            return script.rightHandTracking.api.getPinchStrength() || 0;
        }
    } catch (e) {
        // Hand tracking not available
    }
    return 0;
}

function getLeftPinchStrength() {
    try {
        if (script.leftHandTracking && script.leftHandTracking.api) {
            return script.leftHandTracking.api.getPinchStrength() || 0;
        }
    } catch (e) {
        // Hand tracking not available
    }
    return 0;
}

function onRightHandPinch() {
    print("PinchGestureHandler: Right hand pinch - Generate Melody");
    if (controller && controller.generateMelody) {
        controller.generateMelody();
    }
}

function onLeftHandPinch() {
    print("PinchGestureHandler: Left hand pinch - Generate Drums");
    if (controller && controller.generateDrums) {
        controller.generateDrums();
    }
}

function onBothHandsPinch() {
    print("PinchGestureHandler: Both hands pinch - Generate Both");
    if (controller && controller.generateBoth) {
        controller.generateBoth();
    }
}

// ========================================
// PUBLIC API - For manual triggering
// ========================================

script.api.triggerRightPinch = function() {
    onRightHandPinch();
};

script.api.triggerLeftPinch = function() {
    onLeftHandPinch();
};

script.api.triggerBothPinch = function() {
    onBothHandsPinch();
};

initialize();

