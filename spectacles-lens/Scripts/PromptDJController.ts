/**
 * PromptDJ Controller for Snap Spectacles
 * ========================================
 * AI Music Generation Controller using SIK best practices.
 * Connects to PromptDJ backend via WebSocket and plays generated audio.
 * 
 * Based on Spectacles Interaction Kit patterns from RocketLaunchControl.
 * 
 * AUDIO PLAYBACK NOTES (from Snap documentation):
 * - Spectacles support max 16 concurrent audio tracks
 * - Use MP3 format, mono channel for best compatibility
 * - Set playbackMode to LowLatency for immediate response
 * - Keep audio under 15 seconds for optimal performance
 */

import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import {validate} from "SpectaclesInteractionKit.lspkg/Utils/validate"
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"

// Declare global types for Lens Studio
declare const HapticFeedbackType: { Success: any }
declare const Audio: {
    PlaybackMode: {
        LowLatency: number
        LowPower: number
    }
}
declare const global: {
    promptDJController?: PromptDJController
    HapticFeedbackSystem?: {
        hapticFeedback: (type: any) => void
    }
}

const TAG = "PromptDJ"
const log = new NativeLogger(TAG)

// ========================================
// TYPE DEFINITIONS
// ========================================

/** WebSocket connected message */
interface ConnectedMessage {
    type: "connected"
    state?: Partial<MusicParams>
    available_scales?: string[]
    available_drum_styles?: string[]
}

/** Audio ready message */
interface AudioReadyMessage {
    type: "audio_ready"
    url: string
    format: string
    size_bytes: number
    melody?: { url: string; size_bytes: number }
    drums?: { url: string; size_bytes: number }
}

/** Status message */
interface StatusMessage {
    type: "status"
    message: string
}

/** Error message */
interface ErrorMessage {
    type: "error"
    message: string
}

/** Params updated message */
interface ParamsUpdatedMessage {
    type: "params_updated"
}

/** Pong message */
interface PongMessage {
    type: "pong"
}

/** Union type for all WebSocket messages */
type WebSocketMessage = 
    | ConnectedMessage 
    | AudioReadyMessage 
    | StatusMessage 
    | ErrorMessage 
    | ParamsUpdatedMessage 
    | PongMessage

/** Music generation parameters */
export interface MusicParams {
    tempo_bpm: number
    scale: string
    density: number
    variation: number
    drum_style: string
    swing: number
    bars: number
}

/** WebSocket event types */
interface WebSocketOpenEvent {
    type: string
}

interface WebSocketMessageEvent {
    data: Blob | string
}

interface WebSocketCloseEvent {
    wasClean: boolean
    code: number
    reason: string
}

interface WebSocketErrorEvent {
    type: string
}

/** WebSocket interface for Lens Studio */
interface LensWebSocket {
    binaryType: string
    onopen: ((event: WebSocketOpenEvent) => void) | null
    onmessage: ((event: WebSocketMessageEvent) => void) | null
    onclose: ((event: WebSocketCloseEvent) => void) | null
    onerror: ((event: WebSocketErrorEvent) => void) | null
    send: (data: string) => void
    close: () => void
}

/** Internet Module interface */
interface InternetModule {
    createWebSocket: (url: string) => LensWebSocket
    makeResourceFromUrl: (url: string) => any
    fetch: (url: string) => Promise<Response>
}

/** Remote Media Module interface */
interface RemoteMediaModule {
    loadResourceAsAudioTrackAsset: (
        resource: any,
        onSuccess: (audioTrack: AudioTrackAsset) => void,
        onError: (error: string) => void
    ) => void
}

/** Delayed Callback Event interface */
interface DelayedCallbackEvent {
    bind: (callback: () => void) => void
    reset: (delay: number) => void
}

// Note: AudioComponent in Lens Studio already has playbackMode property
// No extension needed - we can use AudioComponent directly

/**
 * Main controller for PromptDJ music generation.
 * Manages WebSocket connection, audio playback, and UI state.
 */
@component
export class PromptDJController extends BaseScriptComponent {
    // ========================================
    // INPUTS
    // ========================================
    
    @input
    @hint("Internet Module for WebSocket connection")
    internetModule!: InternetModule
    
    @input
    @hint("Remote Media Module for audio loading")
    remoteMediaModule!: RemoteMediaModule
    
    @input
    @hint("WebSocket backend URL (ws://IP:8123/ws/spectacles/) - Use 127.0.0.1 for Lens Studio Preview, network IP for real Spectacles")
    backendUrl: string = "ws://127.0.0.1:8123/ws/spectacles/"
    
    @input
    @hint("Audio component for playback")
    @allowUndefined
    audioPlayer: AudioComponent | undefined
    
    @input
    @hint("Use Low Latency audio mode (recommended for button feedback)")
    useLowLatencyAudio: boolean = true
    
    @input
    @hint("Status text display")
    @allowUndefined
    statusText: Text | undefined
    
    @input
    @hint("Tempo text display")
    @allowUndefined
    tempoText: Text | undefined
    
    @input
    @hint("Scale text display")
    @allowUndefined
    scaleText: Text | undefined
    
    @input
    @hint("Drum style text display")
    @allowUndefined
    drumStyleText: Text | undefined
    
    // ========================================
    // UI BUTTONS (optional)
    // ========================================
    
    @input
    @hint("Generate Melody button")
    @allowUndefined
    generateMelodyButton: SceneObject | undefined
    
    @input
    @hint("Generate Drums button")
    @allowUndefined
    generateDrumsButton: SceneObject | undefined
    
    @input
    @hint("Generate Both button")
    @allowUndefined
    generateBothButton: SceneObject | undefined
    
    @input
    @hint("Tempo Up button")
    @allowUndefined
    tempoUpButton: SceneObject | undefined
    
    @input
    @hint("Tempo Down button")
    @allowUndefined
    tempoDownButton: SceneObject | undefined
    
    @input
    @hint("Next Scale button")
    @allowUndefined
    nextScaleButton: SceneObject | undefined
    
    @input
    @hint("Next Drum Style button")
    @allowUndefined
    nextDrumStyleButton: SceneObject | undefined
    
    // ========================================
    // STATE
    // ========================================
    
    private socket: LensWebSocket | null = null
    private isConnected: boolean = false
    private clientId: string = "spectacles-" + Math.random().toString(36).substring(2, 11)
    
    /** Current music parameters - exposed for external access */
    public params: MusicParams = {
        tempo_bpm: 120,
        scale: "C_major",
        density: 0.55,
        variation: 0.35,
        drum_style: "techno",
        swing: 0.0,
        bars: 8
    }
    
    private scales: string[] = ["C_major", "A_minor", "D_minor", "G_major", "E_minor", "F_major"]
    private drumStyles: string[] = ["techno", "funk", "jazz", "electronic", "basic"]
    private currentScaleIndex: number = 0
    private currentDrumStyleIndex: number = 0
    
    private currentAudioUrl: string | null = null
    private isPlaying: boolean = false
    private audioLoadAttempts: number = 0
    private readonly MAX_AUDIO_LOAD_ATTEMPTS: number = 3
    
    // Delayed events
    private connectDelayEvent: DelayedCallbackEvent | null = null
    private reconnectDelayEvent: DelayedCallbackEvent | null = null
    private autoTestDelayEvent: DelayedCallbackEvent | null = null
    private audioRetryDelayEvent: DelayedCallbackEvent | null = null
    
    // ========================================
    // EVENTS
    // ========================================
    
    private onConnectedEvent = new Event()
    public readonly onConnected = this.onConnectedEvent.publicApi()
    
    private onDisconnectedEvent = new Event()
    public readonly onDisconnected = this.onDisconnectedEvent.publicApi()
    
    private onAudioReadyEvent = new Event<string>()
    public readonly onAudioReady = this.onAudioReadyEvent.publicApi()
    
    private onAudioPlayingEvent = new Event()
    public readonly onAudioPlaying = this.onAudioPlayingEvent.publicApi()
    
    private onAudioErrorEvent = new Event<string>()
    public readonly onAudioError = this.onAudioErrorEvent.publicApi()
    
    private onParamsChangedEvent = new Event<MusicParams>()
    public readonly onParamsChanged = this.onParamsChangedEvent.publicApi()
    
    // ========================================
    // LIFECYCLE
    // ========================================
    
    onAwake(): void {
        log.i("Initializing...")
        this.updateStatusText("Initializing...")
        
        // Register globally for access from other scripts
        this.registerGlobal()
        
        // Create delayed events
        this.connectDelayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
        this.connectDelayEvent.bind(() => this.connect())
        
        this.reconnectDelayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
        this.reconnectDelayEvent.bind(() => {
            if (!this.isConnected) {
                this.connect()
            }
        })
        
        this.autoTestDelayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
        this.autoTestDelayEvent.bind(() => {
            log.i("Auto-generating test melody...")
            this.generateMelody()
        })
        
        this.audioRetryDelayEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
        this.audioRetryDelayEvent.bind(() => {
            if (this.currentAudioUrl && this.audioLoadAttempts < this.MAX_AUDIO_LOAD_ATTEMPTS) {
                log.i("Retrying audio load (attempt " + (this.audioLoadAttempts + 1) + ")...")
                this.loadAndPlayAudio(this.currentAudioUrl)
            }
        })
        
        // Setup on start
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart()
        })
    }
    
    /**
     * Register this controller globally so other scripts can access it.
     * This fixes the "cannot set property 'generateMelody' of undefined" error.
     */
    private registerGlobal(): void {
        // Register on global for legacy script access
        global.promptDJController = this
        log.i("Registered globally as global.promptDJController")
    }
    
    private onStart(): void {
        // Configure audio player for Spectacles
        this.configureAudioPlayer()
        
        // Setup button callbacks
        this.setupButtonCallbacks()
        
        // Connect after delay
        validate(this.connectDelayEvent)
        this.connectDelayEvent!.reset(1.0)
    }
    
    /**
     * Configure the AudioComponent for optimal Spectacles playback.
     * 
     * KEY FINDINGS FROM RESEARCH:
     * 1. Spectacles default to Low Power mode which has latency
     * 2. Set playbackMode to LowLatency for immediate response
     * 3. Max 16 concurrent audio tracks supported
     */
    private configureAudioPlayer(): void {
        if (!this.audioPlayer) {
            log.w("No AudioComponent connected - audio will not play!")
            log.w("Please add an AudioComponent to the scene and connect it.")
            return
        }
        
        // Set Low Latency mode for immediate playback (Spectacles specific)
        if (this.useLowLatencyAudio) {
            try {
                if (typeof Audio !== 'undefined' && Audio.PlaybackMode) {
                    this.audioPlayer.playbackMode = Audio.PlaybackMode.LowLatency
                    log.i("Audio playback mode set to LowLatency")
                } else {
                    log.d("Audio.PlaybackMode not available - using default mode")
                }
            } catch (e) {
                log.w("Could not set LowLatency mode: " + e)
            }
        }
        
        // Log audio configuration
        log.i("AudioComponent configured:")
        log.i("  - Volume: " + (this.audioPlayer.volume || "default"))
        log.i("  - Low Latency: " + this.useLowLatencyAudio)
    }
    
    // ========================================
    // BUTTON SETUP (SIK Pattern)
    // ========================================
    
    private setupButtonCallbacks(): void {
        const interactableTypeName = Interactable.getTypeName()
        
        // Generate Melody button
        if (this.generateMelodyButton) {
            const interactable = this.generateMelodyButton.getComponent(interactableTypeName) as Interactable | null
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.generateMelody())
            }
        }
        
        // Generate Drums button
        if (this.generateDrumsButton) {
            const interactable = this.generateDrumsButton.getComponent(interactableTypeName) as Interactable | null
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.generateDrums())
            }
        }
        
        // Generate Both button
        if (this.generateBothButton) {
            const interactable = this.generateBothButton.getComponent(interactableTypeName) as Interactable | null
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.generateBoth())
            }
        }
        
        // Tempo Up button
        if (this.tempoUpButton) {
            const interactable = this.tempoUpButton.getComponent(interactableTypeName) as Interactable | null
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.increaseTempo())
            }
        }
        
        // Tempo Down button
        if (this.tempoDownButton) {
            const interactable = this.tempoDownButton.getComponent(interactableTypeName) as Interactable | null
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.decreaseTempo())
            }
        }
        
        // Next Scale button
        if (this.nextScaleButton) {
            const interactable = this.nextScaleButton.getComponent(interactableTypeName) as Interactable | null
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.nextScale())
            }
        }
        
        // Next Drum Style button
        if (this.nextDrumStyleButton) {
            const interactable = this.nextDrumStyleButton.getComponent(interactableTypeName) as Interactable | null
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.nextDrumStyle())
            }
        }
    }
    
    // ========================================
    // WEBSOCKET CONNECTION
    // ========================================
    
    private connect(): void {
        if (!this.internetModule) {
            log.e("InternetModule not connected!")
            this.updateStatusText("No InternetModule")
            return
        }
        
        const url = this.backendUrl + this.clientId
        log.i("Connecting to " + url)
        this.updateStatusText("Connecting...")
        
        try {
            this.socket = this.internetModule.createWebSocket(url)
            this.socket.binaryType = "blob"
            
            this.socket.onopen = () => {
                this.isConnected = true
                log.i("Connected!")
                this.updateStatusText("Connected ✓")
                this.onConnectedEvent.invoke()
                
                // Auto-test after 3 seconds
                validate(this.autoTestDelayEvent)
                this.autoTestDelayEvent!.reset(3.0)
            }
            
            this.socket.onmessage = async (event: WebSocketMessageEvent) => {
                let data: WebSocketMessage
                
                if (event.data instanceof Blob) {
                    const text = await event.data.text()
                    data = JSON.parse(text) as WebSocketMessage
                } else {
                    data = JSON.parse(event.data as string) as WebSocketMessage
                }
                
                this.handleMessage(data)
            }
            
            this.socket.onclose = (event: WebSocketCloseEvent) => {
                this.isConnected = false
                
                if (event.wasClean) {
                    log.i("Connection closed cleanly")
                    this.updateStatusText("Disconnected")
                } else {
                    log.w("Connection lost, code: " + event.code)
                    this.updateStatusText("Connection lost")
                }
                
                this.onDisconnectedEvent.invoke()
                
                // Auto-reconnect
                validate(this.reconnectDelayEvent)
                this.reconnectDelayEvent!.reset(3.0)
            }
            
            this.socket.onerror = () => {
                log.e("WebSocket error")
                this.updateStatusText("Connection error")
            }
            
        } catch (e) {
            log.e("Failed to connect: " + e)
            this.updateStatusText("Failed to connect")
        }
    }
    
    /** Disconnect from WebSocket */
    public disconnect(): void {
        if (this.socket) {
            this.socket.close()
            this.socket = null
        }
        this.isConnected = false
    }
    
    // ========================================
    // MESSAGE HANDLING
    // ========================================
    
    private handleMessage(data: WebSocketMessage): void {
        log.d("Received: " + data.type)
        
        switch (data.type) {
            case "connected":
                this.handleConnectedMessage(data)
                break
                
            case "audio_ready":
                this.handleAudioReady(data)
                break
                
            case "params_updated":
                this.updateStatusText("Params Updated")
                break
                
            case "status":
                this.updateStatusText(data.message)
                break
                
            case "error":
                log.e("Server error: " + data.message)
                this.updateStatusText("Error!")
                break
                
            case "pong":
                log.d("Pong received")
                break
        }
    }
    
    private handleConnectedMessage(data: ConnectedMessage): void {
        if (data.state) {
            this.params = { ...this.params, ...data.state }
        }
        if (data.available_scales) {
            this.scales = data.available_scales
        }
        if (data.available_drum_styles) {
            this.drumStyles = data.available_drum_styles
        }
        this.updateUI()
    }
    
    private handleAudioReady(data: AudioReadyMessage): void {
        log.i("Audio ready!")
        log.i("  Format: " + data.format)
        log.i("  Size: " + data.size_bytes + " bytes")
        
        let url = data.url
        
        // Handle "both" format
        if (data.format === "both" && data.melody) {
            url = data.melody.url
            log.d("Melody URL: " + url)
            if (data.drums) {
                log.d("Drums URL: " + data.drums.url)
            }
        }
        
        if (!url) {
            this.updateStatusText("No audio URL")
            this.onAudioErrorEvent.invoke("No audio URL received")
            return
        }
        
        // Reset retry counter for new audio
        this.audioLoadAttempts = 0
        this.currentAudioUrl = url
        this.updateStatusText("Loading audio...")
        log.i("Loading audio from: " + url)
        
        this.onAudioReadyEvent.invoke(url)
        this.loadAndPlayAudio(url)
    }
    
    // ========================================
    // AUDIO PLAYBACK
    // ========================================
    
    /**
     * Load and play audio from URL.
     * 
     * SPECTACLES AUDIO REQUIREMENTS (from research):
     * 1. RemoteMediaModule required for remote audio
     * 2. AudioComponent must be connected
     * 3. Max 16 concurrent tracks
     * 4. MP3 format recommended
     * 5. Mono channel preferred
     * 6. Under 15 seconds optimal
     */
    private loadAndPlayAudio(url: string): void {
        this.audioLoadAttempts++
        
        // Validate RemoteMediaModule
        if (!this.remoteMediaModule) {
            const errorMsg = "RemoteMediaModule not connected! This is REQUIRED for audio playback on Spectacles."
            log.e(errorMsg)
            this.updateStatusText("No RemoteMediaModule")
            this.onAudioErrorEvent.invoke(errorMsg)
            return
        }
        
        // Validate AudioComponent
        if (!this.audioPlayer) {
            const errorMsg = "AudioComponent not connected! Add an AudioComponent to the scene."
            log.e(errorMsg)
            this.updateStatusText("No AudioPlayer")
            this.onAudioErrorEvent.invoke(errorMsg)
            return
        }
        
        // Validate InternetModule
        if (!this.internetModule) {
            const errorMsg = "InternetModule not connected!"
            log.e(errorMsg)
            this.updateStatusText("No InternetModule")
            this.onAudioErrorEvent.invoke(errorMsg)
            return
        }
        
        // Stop any current playback before loading new audio
        if (this.isPlaying) {
            this.stopPlayback()
        }
        
        try {
            log.i("Creating resource from URL...")
            const resource = this.internetModule.makeResourceFromUrl(url)
            
            log.i("Loading audio asset...")
            this.remoteMediaModule.loadResourceAsAudioTrackAsset(
                resource,
                (audioTrack: AudioTrackAsset) => {
                    this.onAudioLoaded(audioTrack)
                },
                (error: string) => {
                    this.onAudioLoadError(error)
                }
            )
        } catch (e) {
            const errorMsg = "Audio loading exception: " + e
            log.e(errorMsg)
            this.updateStatusText("Audio error")
            this.onAudioErrorEvent.invoke(errorMsg)
            
            // Retry on exception
            this.scheduleAudioRetry()
        }
    }
    
    /**
     * Called when audio track is successfully loaded.
     */
    private onAudioLoaded(audioTrack: AudioTrackAsset): void {
        log.i("Audio loaded successfully!")
        
        if (!this.audioPlayer) {
            log.e("AudioPlayer disappeared!")
            return
        }
        
        try {
            // Assign the audio track
            this.audioPlayer.audioTrack = audioTrack
            
            // Play the audio (1 = play once)
            this.audioPlayer.play(1)
            
            this.isPlaying = true
            this.updateStatusText("Playing ♪")
            log.i("Audio playback started!")
            
            // Trigger events
            this.onAudioPlayingEvent.invoke()
            this.triggerHapticFeedback()
            
        } catch (e) {
            const errorMsg = "Error starting playback: " + e
            log.e(errorMsg)
            this.updateStatusText("Playback error")
            this.onAudioErrorEvent.invoke(errorMsg)
        }
    }
    
    /**
     * Called when audio loading fails.
     */
    private onAudioLoadError(error: string): void {
        log.e("Failed to load audio: " + error)
        log.e("Attempt " + this.audioLoadAttempts + " of " + this.MAX_AUDIO_LOAD_ATTEMPTS)
        
        // Common error causes on Spectacles:
        // - Network connectivity issues
        // - Unsupported audio format (use MP3)
        // - Audio file too large
        // - CORS issues on server
        
        if (this.audioLoadAttempts < this.MAX_AUDIO_LOAD_ATTEMPTS) {
            this.updateStatusText("Retrying audio...")
            this.scheduleAudioRetry()
        } else {
            this.updateStatusText("Audio load failed")
            this.onAudioErrorEvent.invoke("Failed after " + this.MAX_AUDIO_LOAD_ATTEMPTS + " attempts: " + error)
        }
    }
    
    /**
     * Schedule an audio load retry.
     */
    private scheduleAudioRetry(): void {
        validate(this.audioRetryDelayEvent)
        this.audioRetryDelayEvent!.reset(1.0) // Retry after 1 second
    }
    
    // ========================================
    // SEND COMMANDS
    // ========================================
    
    private send(action: string, actionParams?: object): void {
        if (!this.isConnected || !this.socket) {
            log.w("Not connected")
            this.updateStatusText("Not connected")
            return
        }
        
        const message = JSON.stringify({
            action: action,
            params: actionParams || {}
        })
        
        this.socket.send(message)
        log.d("Sent: " + action)
    }
    
    // ========================================
    // PUBLIC API
    // ========================================
    
    /** Generate a melody with current parameters */
    public generateMelody(): void {
        this.updateStatusText("Generating melody...")
        this.send("generate_melody", {
            tempo_bpm: this.params.tempo_bpm,
            scale: this.params.scale,
            bars: this.params.bars,
            density: this.params.density,
            variation: this.params.variation
        })
    }
    
    /** Generate drums with current parameters */
    public generateDrums(): void {
        this.updateStatusText("Generating drums...")
        this.send("generate_drums", {
            tempo_bpm: this.params.tempo_bpm,
            style: this.params.drum_style,
            bars: this.params.bars,
            swing: this.params.swing
        })
    }
    
    /** Generate both melody and drums */
    public generateBoth(): void {
        this.updateStatusText("Generating both...")
        this.send("generate_both", {
            tempo_bpm: this.params.tempo_bpm,
            scale: this.params.scale,
            style: this.params.drum_style,
            bars: this.params.bars,
            density: this.params.density,
            variation: this.params.variation,
            swing: this.params.swing
        })
    }
    
    /** Stop current playback */
    public stopPlayback(): void {
        if (this.audioPlayer && this.isPlaying) {
            try {
                this.audioPlayer.stop(true)
            } catch (e) {
                log.w("Error stopping audio: " + e)
            }
            this.isPlaying = false
            this.updateStatusText("Stopped")
        }
    }
    
    /** Increase tempo by 5 BPM */
    public increaseTempo(): void {
        this.params.tempo_bpm = Math.min(180, this.params.tempo_bpm + 5)
        this.updateUI()
        this.syncParams()
    }
    
    /** Decrease tempo by 5 BPM */
    public decreaseTempo(): void {
        this.params.tempo_bpm = Math.max(60, this.params.tempo_bpm - 5)
        this.updateUI()
        this.syncParams()
    }
    
    /** Cycle to next scale */
    public nextScale(): void {
        this.currentScaleIndex = (this.currentScaleIndex + 1) % this.scales.length
        this.params.scale = this.scales[this.currentScaleIndex]
        this.updateUI()
        this.syncParams()
    }
    
    /** Cycle to previous scale */
    public previousScale(): void {
        this.currentScaleIndex = (this.currentScaleIndex - 1 + this.scales.length) % this.scales.length
        this.params.scale = this.scales[this.currentScaleIndex]
        this.updateUI()
        this.syncParams()
    }
    
    /** Cycle to next drum style */
    public nextDrumStyle(): void {
        this.currentDrumStyleIndex = (this.currentDrumStyleIndex + 1) % this.drumStyles.length
        this.params.drum_style = this.drumStyles[this.currentDrumStyleIndex]
        this.updateUI()
        this.syncParams()
    }
    
    /** Set density (0-1) */
    public setDensity(value: number): void {
        this.params.density = Math.max(0, Math.min(1, value))
        this.syncParams()
    }
    
    /** Set variation (0-1) */
    public setVariation(value: number): void {
        this.params.variation = Math.max(0, Math.min(1, value))
        this.syncParams()
    }
    
    /** Set number of bars */
    public setBars(value: number): void {
        this.params.bars = Math.max(2, Math.min(64, value))
        this.syncParams()
    }
    
    /** Send ping to test connection */
    public ping(): void {
        this.send("ping")
    }
    
    /** Get current parameters */
    public getParams(): MusicParams {
        return { ...this.params }
    }
    
    /** Check if connected */
    public getIsConnected(): boolean {
        return this.isConnected
    }
    
    /** Check if playing */
    public getIsPlaying(): boolean {
        return this.isPlaying
    }
    
    /** Get current audio URL */
    public getCurrentAudioUrl(): string | null {
        return this.currentAudioUrl
    }
    
    // ========================================
    // SYNC & UI
    // ========================================
    
    private syncParams(): void {
        this.send("update_params", this.params)
        this.onParamsChangedEvent.invoke(this.params)
    }
    
    private updateUI(): void {
        if (this.tempoText) {
            this.tempoText.text = this.params.tempo_bpm + " BPM"
        }
        if (this.scaleText) {
            this.scaleText.text = this.params.scale.replace("_", " ")
        }
        if (this.drumStyleText) {
            const style = this.params.drum_style
            this.drumStyleText.text = style.charAt(0).toUpperCase() + style.slice(1)
        }
    }
    
    private updateStatusText(message: string): void {
        if (this.statusText) {
            this.statusText.text = message
        }
        log.i("Status: " + message)
    }
    
    private triggerHapticFeedback(): void {
        try {
            if (global.HapticFeedbackSystem) {
                global.HapticFeedbackSystem.hapticFeedback(HapticFeedbackType.Success)
            }
        } catch (e) {
            // Haptics not available
        }
    }
}
