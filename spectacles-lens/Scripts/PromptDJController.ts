/**
 * PromptDJ Controller for Snap Spectacles
 * ========================================
 * AI Music Generation Controller using SIK best practices.
 * Connects to PromptDJ backend via WebSocket and plays generated audio.
 * 
 * Based on Spectacles Interaction Kit patterns from RocketLaunchControl.
 */

import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import {validate} from "SpectaclesInteractionKit.lspkg/Utils/validate"
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"

const TAG = "PromptDJ"
const log = new NativeLogger(TAG)

// WebSocket message types
interface ConnectedMessage {
    type: "connected"
    state?: MusicParams
    available_scales?: string[]
    available_drum_styles?: string[]
}

interface AudioReadyMessage {
    type: "audio_ready"
    url: string
    format: string
    size_bytes: number
    melody?: { url: string; size_bytes: number }
    drums?: { url: string; size_bytes: number }
}

interface MusicParams {
    tempo_bpm: number
    scale: string
    density: number
    variation: number
    drum_style: string
    swing: number
    bars: number
}

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
    @hint("WebSocket backend URL (ws://IP:8123/ws/spectacles/)")
    backendUrl: string = "ws://127.0.0.1:8123/ws/spectacles/"
    
    @input
    @hint("Audio component for playback")
    @allowUndefined
    audioPlayer: AudioComponent | undefined
    
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
    
    private socket: WebSocket | null = null
    private isConnected: boolean = false
    private clientId: string = "spectacles-" + Math.random().toString(36).substring(2, 11)
    
    private params: MusicParams = {
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
    
    // Delayed events
    private connectDelayEvent: DelayedCallbackEvent | null = null
    private reconnectDelayEvent: DelayedCallbackEvent | null = null
    private autoTestDelayEvent: DelayedCallbackEvent | null = null
    
    // ========================================
    // EVENTS
    // ========================================
    
    private onConnectedEvent = new Event()
    public readonly onConnected = this.onConnectedEvent.publicApi()
    
    private onDisconnectedEvent = new Event()
    public readonly onDisconnected = this.onDisconnectedEvent.publicApi()
    
    private onAudioReadyEvent = new Event<string>()
    public readonly onAudioReady = this.onAudioReadyEvent.publicApi()
    
    private onParamsChangedEvent = new Event<MusicParams>()
    public readonly onParamsChanged = this.onParamsChangedEvent.publicApi()
    
    // ========================================
    // LIFECYCLE
    // ========================================
    
    onAwake(): void {
        log.i("Initializing...")
        this.updateStatusText("Initializing...")
        
        // Create delayed events
        this.connectDelayEvent = this.createEvent("DelayedCallbackEvent")
        this.connectDelayEvent.bind(() => this.connect())
        
        this.reconnectDelayEvent = this.createEvent("DelayedCallbackEvent")
        this.reconnectDelayEvent.bind(() => {
            if (!this.isConnected) {
                this.connect()
            }
        })
        
        this.autoTestDelayEvent = this.createEvent("DelayedCallbackEvent")
        this.autoTestDelayEvent.bind(() => {
            log.i("Auto-generating test melody...")
            this.generateMelody()
        })
        
        // Setup on start
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart()
        })
    }
    
    private onStart(): void {
        // Setup button callbacks
        this.setupButtonCallbacks()
        
        // Connect after delay
        validate(this.connectDelayEvent)
        this.connectDelayEvent.reset(1.0)
    }
    
    // ========================================
    // BUTTON SETUP (SIK Pattern)
    // ========================================
    
    private setupButtonCallbacks(): void {
        const interactableTypeName = Interactable.getTypeName()
        
        // Generate Melody button
        if (this.generateMelodyButton) {
            const interactable = this.generateMelodyButton.getComponent(interactableTypeName) as Interactable
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.generateMelody())
            }
        }
        
        // Generate Drums button
        if (this.generateDrumsButton) {
            const interactable = this.generateDrumsButton.getComponent(interactableTypeName) as Interactable
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.generateDrums())
            }
        }
        
        // Generate Both button
        if (this.generateBothButton) {
            const interactable = this.generateBothButton.getComponent(interactableTypeName) as Interactable
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.generateBoth())
            }
        }
        
        // Tempo Up button
        if (this.tempoUpButton) {
            const interactable = this.tempoUpButton.getComponent(interactableTypeName) as Interactable
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.increaseTempo())
            }
        }
        
        // Tempo Down button
        if (this.tempoDownButton) {
            const interactable = this.tempoDownButton.getComponent(interactableTypeName) as Interactable
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.decreaseTempo())
            }
        }
        
        // Next Scale button
        if (this.nextScaleButton) {
            const interactable = this.nextScaleButton.getComponent(interactableTypeName) as Interactable
            if (interactable) {
                interactable.onTriggerEnd.add(() => this.nextScale())
            }
        }
        
        // Next Drum Style button
        if (this.nextDrumStyleButton) {
            const interactable = this.nextDrumStyleButton.getComponent(interactableTypeName) as Interactable
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
                this.autoTestDelayEvent.reset(3.0)
            }
            
            this.socket.onmessage = async (event: MessageEvent) => {
                let data: any
                
                if (event.data instanceof Blob) {
                    const text = await event.data.text()
                    data = JSON.parse(text)
                } else {
                    data = JSON.parse(event.data as string)
                }
                
                this.handleMessage(data)
            }
            
            this.socket.onclose = (event: CloseEvent) => {
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
                this.reconnectDelayEvent.reset(3.0)
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
    
    // ========================================
    // MESSAGE HANDLING
    // ========================================
    
    private handleMessage(data: any): void {
        log.d("Received: " + data.type)
        
        switch (data.type) {
            case "connected":
                this.handleConnectedMessage(data as ConnectedMessage)
                break
                
            case "audio_ready":
                this.handleAudioReady(data as AudioReadyMessage)
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
            return
        }
        
        this.currentAudioUrl = url
        this.updateStatusText("Loading audio...")
        log.i("Loading audio from: " + url)
        
        this.onAudioReadyEvent.invoke(url)
        this.loadAndPlayAudio(url)
    }
    
    // ========================================
    // AUDIO PLAYBACK
    // ========================================
    
    private loadAndPlayAudio(url: string): void {
        if (!this.remoteMediaModule) {
            log.e("RemoteMediaModule not connected!")
            this.updateStatusText("No RemoteMediaModule")
            return
        }
        
        if (!this.audioPlayer) {
            log.e("AudioComponent not connected!")
            this.updateStatusText("No AudioPlayer")
            return
        }
        
        try {
            const resource = this.internetModule.makeResourceFromUrl(url)
            
            this.remoteMediaModule.loadResourceAsAudioTrackAsset(
                resource,
                (audioTrack: AudioTrackAsset) => {
                    log.i("Audio loaded successfully!")
                    this.updateStatusText("Playing ♪")
                    
                    validate(this.audioPlayer)
                    this.audioPlayer.audioTrack = audioTrack
                    this.audioPlayer.play(1)
                    this.isPlaying = true
                    
                    this.triggerHapticFeedback()
                },
                (error: string) => {
                    log.e("Failed to load audio: " + error)
                    this.updateStatusText("Audio load failed")
                }
            )
        } catch (e) {
            log.e("Audio loading error: " + e)
            this.updateStatusText("Audio error")
        }
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
    generateMelody(): void {
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
    generateDrums(): void {
        this.updateStatusText("Generating drums...")
        this.send("generate_drums", {
            tempo_bpm: this.params.tempo_bpm,
            style: this.params.drum_style,
            bars: this.params.bars,
            swing: this.params.swing
        })
    }
    
    /** Generate both melody and drums */
    generateBoth(): void {
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
    stopPlayback(): void {
        if (this.audioPlayer && this.isPlaying) {
            this.audioPlayer.stop(true)
            this.isPlaying = false
            this.updateStatusText("Stopped")
        }
    }
    
    /** Increase tempo by 5 BPM */
    increaseTempo(): void {
        this.params.tempo_bpm = Math.min(180, this.params.tempo_bpm + 5)
        this.updateUI()
        this.syncParams()
    }
    
    /** Decrease tempo by 5 BPM */
    decreaseTempo(): void {
        this.params.tempo_bpm = Math.max(60, this.params.tempo_bpm - 5)
        this.updateUI()
        this.syncParams()
    }
    
    /** Cycle to next scale */
    nextScale(): void {
        this.currentScaleIndex = (this.currentScaleIndex + 1) % this.scales.length
        this.params.scale = this.scales[this.currentScaleIndex]
        this.updateUI()
        this.syncParams()
    }
    
    /** Cycle to previous scale */
    previousScale(): void {
        this.currentScaleIndex = (this.currentScaleIndex - 1 + this.scales.length) % this.scales.length
        this.params.scale = this.scales[this.currentScaleIndex]
        this.updateUI()
        this.syncParams()
    }
    
    /** Cycle to next drum style */
    nextDrumStyle(): void {
        this.currentDrumStyleIndex = (this.currentDrumStyleIndex + 1) % this.drumStyles.length
        this.params.drum_style = this.drumStyles[this.currentDrumStyleIndex]
        this.updateUI()
        this.syncParams()
    }
    
    /** Set density (0-1) */
    setDensity(value: number): void {
        this.params.density = Math.max(0, Math.min(1, value))
        this.syncParams()
    }
    
    /** Set variation (0-1) */
    setVariation(value: number): void {
        this.params.variation = Math.max(0, Math.min(1, value))
        this.syncParams()
    }
    
    /** Set number of bars */
    setBars(value: number): void {
        this.params.bars = Math.max(2, Math.min(64, value))
        this.syncParams()
    }
    
    /** Get current parameters */
    getParams(): MusicParams {
        return { ...this.params }
    }
    
    /** Check if connected */
    getIsConnected(): boolean {
        return this.isConnected
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
            if ((global as any).HapticFeedbackSystem) {
                (global as any).HapticFeedbackSystem.hapticFeedback(HapticFeedbackType.Success)
            }
        } catch (e) {
            // Haptics not available
        }
    }
}

