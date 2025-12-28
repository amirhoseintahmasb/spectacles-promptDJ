/**
 * PromptDJ Controller for Snap Spectacles
 * ========================================
 * Uses InternetModule.createWebSocket() to connect to PromptDJ backend.
 * Receives audio URLs and plays them using AudioComponent.
 * 
 * Setup in Lens Studio:
 * 1. Add this script to a SceneObject
 * 2. Add InternetModule as input
 * 3. Add RemoteMediaModule as input (for audio loading)
 * 4. Set backendUrl to your server (ws://YOUR_IP:8123/ws/spectacles/)
 * 5. Connect UI Text components for status display
 * 6. Connect AudioComponent for playback
 */

//@input Asset.InternetModule internetModule
//@input Asset.RemoteMediaModule remoteMediaModule {"label":"Remote Media Module"}
//@input string backendUrl = "ws://172.20.10.3:8123/ws/spectacles/"  // Change to your Mac's IP address
//@input Component.Text statusText
//@input Component.Text tempoText
//@input Component.Text scaleText
//@input Component.Text drumStyleText
//@input Component.AudioComponent audioPlayer {"label":"Audio Player"}

// ========================================
// STATE
// ========================================

var socket = null;
var isConnected = false;
var clientId = "spectacles-" + Math.random().toString(36).substring(2, 11);

// Music parameters
var params = {
    tempo_bpm: 120,
    scale: "C_major",
    density: 0.55,
    variation: 0.35,
    drum_style: "techno",
    swing: 0.0,
    bars: 8
};

// Available options
var scales = ["C_major", "A_minor", "D_minor", "G_major", "E_minor", "F_major", "D_major", "B_minor"];
var drumStyles = ["techno", "funk", "jazz", "electronic", "basic"];
var currentScaleIndex = 0;
var currentDrumStyleIndex = 0;

// Audio state
var currentAudioUrl = null;
var isPlaying = false;

// ========================================
// INITIALIZATION
// ========================================

function initialize() {
    print("PromptDJ: Initializing...");
    updateStatusText("Initializing...");
    
    // Connect after a short delay
    var delayEvent = script.createEvent("DelayedCallbackEvent");
    delayEvent.bind(function() {
        connect();
    });
    delayEvent.reset(1.0); // 1 second delay
}

// ========================================
// WEBSOCKET CONNECTION
// ========================================

function connect() {
    if (!script.internetModule) {
        print("PromptDJ: ERROR - InternetModule not connected!");
        updateStatusText("No InternetModule");
        return;
    }
    
    var url = script.backendUrl + clientId;
    print("PromptDJ: Connecting to " + url);
    updateStatusText("Connecting...");
    
    try {
        // Create WebSocket using InternetModule
        socket = script.internetModule.createWebSocket(url);
        socket.binaryType = "blob";
        
        // Connection opened
        socket.onopen = function(event) {
            isConnected = true;
            print("PromptDJ: Connected!");
            updateStatusText("Connected ✓");
        };
        
        // Listen for messages
        socket.onmessage = async function(event) {
            var data;
            
            if (event.data instanceof Blob) {
                // Binary frame - convert to text
                var text = await event.data.text();
                data = JSON.parse(text);
            } else {
                // Text frame
                data = JSON.parse(event.data);
            }
            
            handleMessage(data);
        };
        
        // Connection closed
        socket.onclose = function(event) {
            isConnected = false;
            if (event.wasClean) {
                print("PromptDJ: Connection closed cleanly");
                updateStatusText("Disconnected");
            } else {
                print("PromptDJ: Connection lost, code: " + event.code);
                updateStatusText("Connection lost");
            }
            
            // Auto-reconnect after 3 seconds
            var reconnectEvent = script.createEvent("DelayedCallbackEvent");
            reconnectEvent.bind(function() {
                if (!isConnected) {
                    connect();
                }
            });
            reconnectEvent.reset(3.0);
        };
        
        // Connection error
        socket.onerror = function(event) {
            print("PromptDJ: WebSocket error");
            updateStatusText("Connection error");
        };
        
    } catch (e) {
        print("PromptDJ: Failed to connect - " + e);
        updateStatusText("Failed to connect");
    }
}

function disconnect() {
    if (socket) {
        socket.close();
        socket = null;
    }
    isConnected = false;
}

// ========================================
// MESSAGE HANDLING
// ========================================

function handleMessage(data) {
    print("PromptDJ: Received - " + data.type);
    
    switch (data.type) {
        case "connected":
            // Update state from server
            if (data.state) {
                params.tempo_bpm = data.state.tempo_bpm || params.tempo_bpm;
                params.scale = data.state.scale || params.scale;
                params.density = data.state.density || params.density;
                params.drum_style = data.state.drum_style || params.drum_style;
            }
            if (data.available_scales) {
                scales = data.available_scales;
            }
            if (data.available_drum_styles) {
                drumStyles = data.available_drum_styles;
            }
            updateUI();
            break;
            
        case "params_updated":
            updateStatusText("Params Updated");
            break;
            
        case "status":
            updateStatusText(data.message);
            break;
            
        case "audio_ready":
            handleAudioReady(data);
            break;
            
        case "midi_data":
            // Legacy - MIDI data (won't play in Lens)
            updateStatusText("MIDI received (no audio)");
            print("PromptDJ: Received MIDI data - audio rendering may not be enabled on server");
            break;
            
        case "error":
            updateStatusText("Error!");
            print("PromptDJ Error: " + data.message);
            break;
            
        case "pong":
            print("PromptDJ: Pong received");
            break;
    }
}

function handleAudioReady(data) {
    print("PromptDJ: Audio ready!");
    
    var url = data.url;
    var format = data.format;
    var sizeBytes = data.size_bytes;
    
    // For "both" format, we get melody and drums URLs
    if (format === "both") {
        // Play melody first (or could mix them)
        url = data.melody ? data.melody.url : null;
        sizeBytes = data.melody ? data.melody.size_bytes : 0;
        print("PromptDJ: Melody URL: " + url);
        print("PromptDJ: Drums URL: " + (data.drums ? data.drums.url : "none"));
    }
    
    if (!url) {
        updateStatusText("No audio URL");
        return;
    }
    
    currentAudioUrl = url;
    updateStatusText("Loading audio...");
    print("PromptDJ: Loading audio from: " + url);
    
    // Load and play audio
    loadAndPlayAudio(url);
}

// ========================================
// AUDIO PLAYBACK
// ========================================

function loadAndPlayAudio(url) {
    if (!script.remoteMediaModule) {
        print("PromptDJ: ERROR - RemoteMediaModule not connected!");
        updateStatusText("No RemoteMediaModule");
        
        // Fallback: try using fetch + makeResourceFromUrl
        tryFetchAudio(url);
        return;
    }
    
    if (!script.audioPlayer) {
        print("PromptDJ: ERROR - AudioComponent not connected!");
        updateStatusText("No AudioPlayer");
        return;
    }
    
    try {
        // Create dynamic resource from URL
        var resource = script.internetModule.makeResourceFromUrl(url);
        
        // Load as audio
        script.remoteMediaModule.loadResourceAsAudioTrackAsset(
            resource,
            function(audioTrack) {
                // Success - play the audio
                print("PromptDJ: Audio loaded successfully!");
                updateStatusText("Playing ♪");
                
                script.audioPlayer.audioTrack = audioTrack;
                script.audioPlayer.play(1); // Play once
                isPlaying = true;
                
                // Trigger haptic feedback
                triggerHapticFeedback();
            },
            function(error) {
                // Error loading audio
                print("PromptDJ: Failed to load audio - " + error);
                updateStatusText("Audio load failed");
            }
        );
    } catch (e) {
        print("PromptDJ: Audio loading error - " + e);
        updateStatusText("Audio error");
    }
}

function tryFetchAudio(url) {
    // Alternative method using fetch
    print("PromptDJ: Trying fetch method for audio...");
    
    if (!script.internetModule) {
        updateStatusText("Cannot load audio");
        return;
    }
    
    try {
        script.internetModule.fetch(url)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error("HTTP " + response.status);
                }
                return response.blob();
            })
            .then(function(blob) {
                print("PromptDJ: Audio blob received, size: " + blob.size);
                
                // Create resource from blob
                var resource = script.internetModule.makeResourceFromBlob(blob);
                
                if (script.remoteMediaModule && script.audioPlayer) {
                    script.remoteMediaModule.loadResourceAsAudioTrackAsset(
                        resource,
                        function(audioTrack) {
                            print("PromptDJ: Audio loaded from blob!");
                            updateStatusText("Playing ♪");
                            script.audioPlayer.audioTrack = audioTrack;
                            script.audioPlayer.play(1);
                            isPlaying = true;
                        },
                        function(error) {
                            print("PromptDJ: Blob audio load failed - " + error);
                            updateStatusText("Audio failed");
                        }
                    );
                }
            })
            .catch(function(error) {
                print("PromptDJ: Fetch failed - " + error);
                updateStatusText("Fetch failed");
            });
    } catch (e) {
        print("PromptDJ: Fetch error - " + e);
        updateStatusText("Fetch error");
    }
}

// ========================================
// SEND COMMANDS
// ========================================

function send(action, actionParams) {
    if (!isConnected || !socket) {
        print("PromptDJ: Not connected");
        updateStatusText("Not connected");
        return;
    }
    
    var message = JSON.stringify({
        action: action,
        params: actionParams || {}
    });
    
    socket.send(message);
    print("PromptDJ: Sent " + action);
}

// ========================================
// PUBLIC API - Call from buttons/gestures
// ========================================

/**
 * Generate a melody with current parameters
 */
script.generateMelody = function() {
    updateStatusText("Generating melody...");
    send("generate_melody", {
        tempo_bpm: params.tempo_bpm,
        scale: params.scale,
        bars: params.bars,
        density: params.density,
        variation: params.variation
    });
};

/**
 * Generate drums with current parameters
 */
script.generateDrums = function() {
    updateStatusText("Generating drums...");
    send("generate_drums", {
        tempo_bpm: params.tempo_bpm,
        style: params.drum_style,
        bars: params.bars,
        swing: params.swing
    });
};

/**
 * Generate both melody and drums
 */
script.generateBoth = function() {
    updateStatusText("Generating both...");
    send("generate_both", {
        tempo_bpm: params.tempo_bpm,
        scale: params.scale,
        style: params.drum_style,
        bars: params.bars,
        density: params.density,
        variation: params.variation,
        swing: params.swing
    });
};

/**
 * Stop current playback
 */
script.stopPlayback = function() {
    if (script.audioPlayer && isPlaying) {
        script.audioPlayer.stop(true);
        isPlaying = false;
        updateStatusText("Stopped");
    }
};

/**
 * Increase tempo by 5 BPM
 */
script.increaseTempo = function() {
    params.tempo_bpm = Math.min(180, params.tempo_bpm + 5);
    updateUI();
    syncParams();
};

/**
 * Decrease tempo by 5 BPM
 */
script.decreaseTempo = function() {
    params.tempo_bpm = Math.max(60, params.tempo_bpm - 5);
    updateUI();
    syncParams();
};

/**
 * Cycle to next scale
 */
script.nextScale = function() {
    currentScaleIndex = (currentScaleIndex + 1) % scales.length;
    params.scale = scales[currentScaleIndex];
    updateUI();
    syncParams();
};

/**
 * Cycle to previous scale
 */
script.previousScale = function() {
    currentScaleIndex = (currentScaleIndex - 1 + scales.length) % scales.length;
    params.scale = scales[currentScaleIndex];
    updateUI();
    syncParams();
};

/**
 * Cycle to next drum style
 */
script.nextDrumStyle = function() {
    currentDrumStyleIndex = (currentDrumStyleIndex + 1) % drumStyles.length;
    params.drum_style = drumStyles[currentDrumStyleIndex];
    updateUI();
    syncParams();
};

/**
 * Set density (0-1)
 */
script.setDensity = function(value) {
    params.density = Math.max(0, Math.min(1, value));
    syncParams();
};

/**
 * Set variation (0-1)
 */
script.setVariation = function(value) {
    params.variation = Math.max(0, Math.min(1, value));
    syncParams();
};

/**
 * Set number of bars
 */
script.setBars = function(value) {
    params.bars = Math.max(2, Math.min(64, value));
    syncParams();
};

/**
 * Send ping to test connection
 */
script.ping = function() {
    send("ping");
};

/**
 * Get current parameters
 */
script.getParams = function() {
    return params;
};

/**
 * Check if connected
 */
script.isConnected = function() {
    return isConnected;
};

// ========================================
// SYNC & UI
// ========================================

function syncParams() {
    send("update_params", {
        tempo_bpm: params.tempo_bpm,
        scale: params.scale,
        density: params.density,
        variation: params.variation,
        drum_style: params.drum_style,
        swing: params.swing
    });
}

function updateUI() {
    if (script.tempoText) {
        script.tempoText.text = params.tempo_bpm + " BPM";
    }
    if (script.scaleText) {
        script.scaleText.text = params.scale.replace("_", " ");
    }
    if (script.drumStyleText) {
        script.drumStyleText.text = params.drum_style.charAt(0).toUpperCase() + params.drum_style.slice(1);
    }
}

function updateStatusText(message) {
    if (script.statusText) {
        script.statusText.text = message;
    }
    print("PromptDJ Status: " + message);
}

function triggerHapticFeedback() {
    // Use HapticFeedbackSystem if available on Spectacles
    try {
        if (global.HapticFeedbackSystem) {
            global.HapticFeedbackSystem.hapticFeedback(HapticFeedbackType.Success);
        }
    } catch (e) {
        // Haptics not available
    }
}

// ========================================
// START
// ========================================

initialize();
