/**
 * AudioLayerManager.ts
 * =====================================================
 * Manages multiple DynamicAudioOutput layers with owner-based allocation.
 * Adapted for PromptDJ - handles melody, drums, and combined audio layers.
 * 
 * FEATURES:
 * - Dynamic layer acquisition/release
 * - Owner-based tracking (melody, drums, combined, etc.)
 * - Volume control with debouncing
 * - Singleton pattern for global access
 * 
 * USAGE:
 * 1. Add this component to a SceneObject
 * 2. Connect DynamicAudioOutput components to layer inputs
 * 3. Access via AudioLayerManager.getInstance()
 * 4. Acquire layers: const layerIdx = manager.acquireLayer("melody")
 * 5. Play audio: manager.playOnLayer(layerIdx, audioData)
 * 6. Release when done: manager.releaseLayerByOwner("melody")
 */

import { DynamicAudioOutput } from "./DynamicAudioOutput"

@component
export class AudioLayerManager extends BaseScriptComponent {
    
    // ═══════════════════════════════════════════════════════════════
    // LAYER INPUTS (4 layers for PromptDJ - expandable)
    // ═══════════════════════════════════════════════════════════════
    
    @ui.separator
    @ui.label("Audio Layer Manager for PromptDJ")
    @ui.separator
    
    @input("Component.ScriptComponent")
    @hint("Layer 0 - Primary audio (e.g., combined melody+drums)")
    private _layer0: ScriptComponent | undefined
    
    @input("Component.ScriptComponent")
    @hint("Layer 1 - Secondary audio (e.g., melody only)")
    private _layer1: ScriptComponent | undefined
    
    @input("Component.ScriptComponent")
    @hint("Layer 2 - Tertiary audio (e.g., drums only)")
    private _layer2: ScriptComponent | undefined
    
    @input("Component.ScriptComponent")
    @hint("Layer 3 - Extra layer for transitions/effects")
    private _layer3: ScriptComponent | undefined
    
    @ui.separator
    @ui.label("Settings")
    @ui.separator
    
    @input
    @hint("Default sample rate for audio output")
    private defaultSampleRate: number = 48000
    
    @input
    @hint("Volume debounce time in seconds")
    private debounceTime: number = 0.15
    
    // ═══════════════════════════════════════════════════════════════
    // PRIVATE STATE
    // ═══════════════════════════════════════════════════════════════
    
    private _layers: (DynamicAudioOutput | null)[] = []
    private _layerInUse: boolean[] = []
    private _layerOwner: (string | null)[] = []
    private _layerVolumes: number[] = []
    private _layerAudioData: (Uint8Array | null)[] = []
    private _initialized: boolean = false
    
    // Debounce control for volume changes
    private _pendingVolumeUpdate: boolean[] = []
    private _volumeUpdateTimer: number[] = []
    
    private readonly LAYER_COUNT: number = 4
    
    // ═══════════════════════════════════════════════════════════════
    // SINGLETON
    // ═══════════════════════════════════════════════════════════════
    
    private static _instance: AudioLayerManager | null = null
    
    public static getInstance(): AudioLayerManager | null {
        return AudioLayerManager._instance
    }
    
    // ═══════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════
    
    onAwake() {
        AudioLayerManager._instance = this
        print("[AudioLayerManager] Instance created")
        
        this.createEvent("OnStartEvent").bind(() => {
            this.initializeLayers()
        })
        
        this.createEvent("UpdateEvent").bind(() => {
            this.updateDebounceTimers()
        })
    }
    
    private initializeLayers(): void {
        print("[AudioLayerManager] Initializing layers...")
        
        // Collect layer references
        const layerInputs = [this._layer0, this._layer1, this._layer2, this._layer3]
        
        // Initialize arrays
        this._layers = []
        this._layerInUse = new Array(this.LAYER_COUNT).fill(false)
        this._layerOwner = new Array(this.LAYER_COUNT).fill(null)
        this._layerVolumes = new Array(this.LAYER_COUNT).fill(1.0)
        this._layerAudioData = new Array(this.LAYER_COUNT).fill(null)
        this._pendingVolumeUpdate = new Array(this.LAYER_COUNT).fill(false)
        this._volumeUpdateTimer = new Array(this.LAYER_COUNT).fill(0)
        
        // Initialize each DynamicAudioOutput
        let validCount = 0
        for (let i = 0; i < this.LAYER_COUNT; i++) {
            const layerScript = layerInputs[i]
            
            if (layerScript) {
                try {
                    // Cast to DynamicAudioOutput
                    const dynamicAudio = layerScript as unknown as DynamicAudioOutput
                    
                    if (dynamicAudio && typeof dynamicAudio.initialize === 'function') {
                        const success = dynamicAudio.initialize(this.defaultSampleRate)
                        if (success) {
                            this._layers[i] = dynamicAudio
                            validCount++
                            print(`[AudioLayerManager] Layer ${i} initialized @ ${this.defaultSampleRate}Hz`)
                        } else {
                            this._layers[i] = null
                            print(`[AudioLayerManager] Layer ${i} failed to initialize`)
                        }
                    } else {
                        this._layers[i] = null
                        print(`[AudioLayerManager] Layer ${i} is not a DynamicAudioOutput`)
                    }
                } catch (e) {
                    this._layers[i] = null
                    print(`[AudioLayerManager] Layer ${i} init error: ${e}`)
                }
            } else {
                this._layers[i] = null
                print(`[AudioLayerManager] Layer ${i} is not connected`)
            }
        }
        
        this._initialized = true
        print(`[AudioLayerManager] ═══ Ready with ${validCount}/${this.LAYER_COUNT} layers ═══`)
    }
    
    private updateDebounceTimers(): void {
        const dt = getDeltaTime()
        
        for (let i = 0; i < this.LAYER_COUNT; i++) {
            if (this._pendingVolumeUpdate[i]) {
                this._volumeUpdateTimer[i] -= dt
                
                if (this._volumeUpdateTimer[i] <= 0) {
                    this._pendingVolumeUpdate[i] = false
                    this._applyVolumeToLayer(i)
                }
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // LAYER ACQUISITION
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Acquire a layer for a specific owner (e.g., "melody", "drums", "combined")
     * @param ownerId Unique identifier for the audio source
     * @returns Layer index, or -1 if no layers available
     */
    public acquireLayer(ownerId: string): number {
        if (!this._initialized) {
            print(`[AudioLayerManager] Not initialized yet`)
            return -1
        }
        
        // First check if this owner already has a layer
        for (let i = 0; i < this._layerOwner.length; i++) {
            if (this._layerOwner[i] === ownerId) {
                print(`[AudioLayerManager] Owner "${ownerId}" already has layer ${i}`)
                return i
            }
        }
        
        // Find first available layer
        for (let i = 0; i < this._layerInUse.length; i++) {
            if (!this._layerInUse[i] && this._layers[i]) {
                this._layerInUse[i] = true
                this._layerOwner[i] = ownerId
                this._layerVolumes[i] = 1.0
                this._layerAudioData[i] = null
                print(`[AudioLayerManager] ✓ Acquired layer ${i} for "${ownerId}" (${this.getActiveLayerCount()}/${this.LAYER_COUNT} in use)`)
                return i
            }
        }
        
        print(`[AudioLayerManager] ✗ No available layers! (${this.getActiveLayerCount()}/${this.LAYER_COUNT} in use)`)
        this.logLayerStatus()
        return -1
    }
    
    /**
     * Release a layer by owner ID
     */
    public releaseLayerByOwner(ownerId: string): void {
        for (let i = 0; i < this._layerOwner.length; i++) {
            if (this._layerOwner[i] === ownerId) {
                this.releaseLayer(i)
                return
            }
        }
        print(`[AudioLayerManager] No layer found for owner "${ownerId}"`)
    }
    
    /**
     * Release a layer by index
     */
    public releaseLayer(index: number): void {
        if (index < 0 || index >= this.LAYER_COUNT) return
        
        const owner = this._layerOwner[index]
        
        // Stop audio first
        this.stopLayer(index)
        
        // Reset layer state
        this._layerInUse[index] = false
        this._layerOwner[index] = null
        this._layerAudioData[index] = null
        this._layerVolumes[index] = 1.0
        this._pendingVolumeUpdate[index] = false
        this._volumeUpdateTimer[index] = 0
        
        print(`[AudioLayerManager] Released layer ${index} (was: "${owner}") - ${this.getActiveLayerCount()}/${this.LAYER_COUNT} in use`)
    }
    
    /**
     * Release ALL layers - call when switching modes or resetting
     */
    public releaseAllLayers(): void {
        print(`[AudioLayerManager] ═══ Releasing all layers ═══`)
        
        for (let i = 0; i < this.LAYER_COUNT; i++) {
            if (this._layerInUse[i]) {
                this.releaseLayer(i)
            }
        }
        
        print(`[AudioLayerManager] All layers released. Active: ${this.getActiveLayerCount()}`)
    }
    
    /**
     * Get layer index for an owner, or -1 if not found
     */
    public getLayerForOwner(ownerId: string): number {
        for (let i = 0; i < this._layerOwner.length; i++) {
            if (this._layerOwner[i] === ownerId) {
                return i
            }
        }
        return -1
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PLAYBACK CONTROL
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Play audio on a layer
     * @param index Layer index
     * @param audioData PCM16 audio data as Uint8Array
     * @param channels Number of channels (1 = mono, 2 = stereo)
     */
    public playOnLayer(index: number, audioData: Uint8Array, channels: number = 1): void {
        if (index < 0 || index >= this.LAYER_COUNT) {
            print(`[AudioLayerManager] Invalid layer index: ${index}`)
            return
        }
        
        const layer = this._layers[index]
        if (!layer) {
            print(`[AudioLayerManager] Layer ${index} is null`)
            return
        }
        
        // Store audio data for volume updates
        this._layerAudioData[index] = audioData
        
        // Apply current volume
        const adjustedAudio = this._applyVolume(audioData, this._layerVolumes[index])
        
        try {
            // Interrupt current playback by re-initializing
            layer.initialize(this.defaultSampleRate)
            
            // Play new audio
            layer.addAudioFrame(adjustedAudio, channels)
            
            const owner = this._layerOwner[index] || "unknown"
            const durationSec = (audioData.length / 2 / channels / this.defaultSampleRate).toFixed(2)
            print(`[AudioLayerManager] ▶ Playing on layer ${index} (${owner}) - ${durationSec}s @ ${Math.round(this._layerVolumes[index] * 100)}%`)
        } catch (e) {
            print(`[AudioLayerManager] Play error on layer ${index}: ${e}`)
        }
    }
    
    /**
     * Play audio from base64 string on a layer
     */
    public playBase64OnLayer(index: number, base64Audio: string, channels: number = 1): void {
        if (index < 0 || index >= this.LAYER_COUNT) {
            print(`[AudioLayerManager] Invalid layer index: ${index}`)
            return
        }
        
        const layer = this._layers[index]
        if (!layer) {
            print(`[AudioLayerManager] Layer ${index} is null`)
            return
        }
        
        try {
            // Decode base64 to Uint8Array
            const audioData = Base64.decode(base64Audio)
            this.playOnLayer(index, audioData, channels)
        } catch (e) {
            print(`[AudioLayerManager] Base64 decode error: ${e}`)
        }
    }
    
    /**
     * Stop a layer
     */
    public stopLayer(index: number): void {
        if (index < 0 || index >= this.LAYER_COUNT) return
        
        const layer = this._layers[index]
        if (!layer) return
        
        try {
            layer.stop()
            print(`[AudioLayerManager] ⏹ Stopped layer ${index}`)
        } catch (e) {
            print(`[AudioLayerManager] Stop error on layer ${index}: ${e}`)
        }
    }
    
    /**
     * Stop layer by owner
     */
    public stopLayerByOwner(ownerId: string): void {
        const index = this.getLayerForOwner(ownerId)
        if (index >= 0) {
            this.stopLayer(index)
        }
    }
    
    /**
     * Stop all layers (without releasing)
     */
    public stopAll(): void {
        for (let i = 0; i < this.LAYER_COUNT; i++) {
            if (this._layers[i]) {
                try {
                    this._layers[i]!.stop()
                } catch (e) {}
            }
        }
        print(`[AudioLayerManager] Stopped all layers`)
    }
    
    // ═══════════════════════════════════════════════════════════════
    // VOLUME CONTROL
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Set layer volume (0.0 to 1.0) - debounced
     */
    public setLayerVolume(index: number, volume: number): void {
        if (index < 0 || index >= this.LAYER_COUNT) return
        
        const clampedVolume = Math.max(0, Math.min(1, volume))
        this._layerVolumes[index] = clampedVolume
        
        // Only trigger debounced update if we have audio data
        if (this._layerAudioData[index]) {
            this._pendingVolumeUpdate[index] = true
            this._volumeUpdateTimer[index] = this.debounceTime
        }
    }
    
    /**
     * Set volume by owner ID
     */
    public setVolumeByOwner(ownerId: string, volume: number): void {
        const index = this.getLayerForOwner(ownerId)
        if (index >= 0) {
            this.setLayerVolume(index, volume)
        }
    }
    
    /**
     * Get layer volume
     */
    public getLayerVolume(index: number): number {
        if (index < 0 || index >= this.LAYER_COUNT) return 0
        return this._layerVolumes[index]
    }
    
    /**
     * Get volume by owner
     */
    public getVolumeByOwner(ownerId: string): number {
        const index = this.getLayerForOwner(ownerId)
        if (index >= 0) {
            return this._layerVolumes[index]
        }
        return 0
    }
    
    /**
     * Apply pending volume change to layer (called after debounce)
     */
    private _applyVolumeToLayer(index: number): void {
        const audioData = this._layerAudioData[index]
        const layer = this._layers[index]
        
        if (!audioData || !layer) return
        
        const adjustedAudio = this._applyVolume(audioData, this._layerVolumes[index])
        
        try {
            // Re-initialize and replay with new volume
            layer.initialize(this.defaultSampleRate)
            layer.addAudioFrame(adjustedAudio, 1) // Assuming mono
            print(`[AudioLayerManager] 🔊 Volume applied to layer ${index}: ${Math.round(this._layerVolumes[index] * 100)}%`)
        } catch (e) {
            print(`[AudioLayerManager] Volume apply error on layer ${index}: ${e}`)
        }
    }
    
    /**
     * Apply volume to PCM audio data (16-bit)
     */
    private _applyVolume(audioData: Uint8Array, volume: number): Uint8Array {
        // Skip processing if full volume
        if (volume >= 0.99) return audioData
        
        // Return silence if muted
        if (volume <= 0.01) {
            return new Uint8Array(audioData.length)
        }
        
        const adjusted = new Uint8Array(audioData.length)
        
        // Process 16-bit samples (2 bytes per sample)
        for (let i = 0; i < audioData.length; i += 2) {
            // Read 16-bit sample (little-endian)
            let sample = audioData[i] | (audioData[i + 1] << 8)
            
            // Handle signed conversion
            if (sample > 32767) sample -= 65536
            
            // Apply volume
            sample = Math.round(sample * volume)
            
            // Clamp to valid range
            sample = Math.max(-32768, Math.min(32767, sample))
            
            // Convert back to unsigned
            if (sample < 0) sample += 65536
            
            // Write back (little-endian)
            adjusted[i] = sample & 0xFF
            adjusted[i + 1] = (sample >> 8) & 0xFF
        }
        
        return adjusted
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CONVENIENCE METHODS FOR PROMPTDJ
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Play melody audio (acquires layer if needed)
     */
    public playMelody(audioData: Uint8Array, channels: number = 1): number {
        let index = this.getLayerForOwner("melody")
        if (index < 0) {
            index = this.acquireLayer("melody")
        }
        if (index >= 0) {
            this.playOnLayer(index, audioData, channels)
        }
        return index
    }
    
    /**
     * Play drums audio (acquires layer if needed)
     */
    public playDrums(audioData: Uint8Array, channels: number = 1): number {
        let index = this.getLayerForOwner("drums")
        if (index < 0) {
            index = this.acquireLayer("drums")
        }
        if (index >= 0) {
            this.playOnLayer(index, audioData, channels)
        }
        return index
    }
    
    /**
     * Play combined audio (acquires layer if needed)
     */
    public playCombined(audioData: Uint8Array, channels: number = 1): number {
        let index = this.getLayerForOwner("combined")
        if (index < 0) {
            index = this.acquireLayer("combined")
        }
        if (index >= 0) {
            this.playOnLayer(index, audioData, channels)
        }
        return index
    }
    
    /**
     * Stop melody playback
     */
    public stopMelody(): void {
        this.stopLayerByOwner("melody")
    }
    
    /**
     * Stop drums playback
     */
    public stopDrums(): void {
        this.stopLayerByOwner("drums")
    }
    
    /**
     * Stop combined playback
     */
    public stopCombined(): void {
        this.stopLayerByOwner("combined")
    }
    
    /**
     * Set melody volume
     */
    public setMelodyVolume(volume: number): void {
        this.setVolumeByOwner("melody", volume)
    }
    
    /**
     * Set drums volume
     */
    public setDrumsVolume(volume: number): void {
        this.setVolumeByOwner("drums", volume)
    }
    
    /**
     * Set combined volume
     */
    public setCombinedVolume(volume: number): void {
        this.setVolumeByOwner("combined", volume)
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STATUS / GETTERS
    // ═══════════════════════════════════════════════════════════════
    
    public isReady(): boolean {
        return this._initialized
    }
    
    public isLayerInUse(index: number): boolean {
        if (index < 0 || index >= this.LAYER_COUNT) return false
        return this._layerInUse[index]
    }
    
    public hasAudioData(index: number): boolean {
        if (index < 0 || index >= this.LAYER_COUNT) return false
        return this._layerAudioData[index] !== null
    }
    
    public getActiveLayerCount(): number {
        return this._layerInUse.filter(inUse => inUse).length
    }
    
    public getAvailableLayerCount(): number {
        return this._layerInUse.filter(inUse => !inUse).length
    }
    
    public getTotalLayerCount(): number {
        return this.LAYER_COUNT
    }
    
    public getLayerOwner(index: number): string | null {
        if (index < 0 || index >= this.LAYER_COUNT) return null
        return this._layerOwner[index]
    }
    
    /**
     * Check if a specific owner has an active layer
     */
    public hasOwner(ownerId: string): boolean {
        return this.getLayerForOwner(ownerId) >= 0
    }
    
    /**
     * Log current layer status (for debugging)
     */
    public logLayerStatus(): void {
        print(`[AudioLayerManager] ═══════════════════════════════════════`)
        print(`[AudioLayerManager]          LAYER STATUS                  `)
        print(`[AudioLayerManager] ═══════════════════════════════════════`)
        
        for (let i = 0; i < this.LAYER_COUNT; i++) {
            const status = this._layerInUse[i] ? "🔊 IN USE" : "⚪ FREE  "
            const owner = this._layerOwner[i] || "-"
            const volume = Math.round(this._layerVolumes[i] * 100)
            const hasData = this._layerAudioData[i] ? "📀" : "  "
            const connected = this._layers[i] ? "✓" : "✗"
            print(`  Layer ${i}: ${connected} ${status} | Owner: ${owner.padEnd(10)} | Vol: ${volume}% ${hasData}`)
        }
        
        print(`[AudioLayerManager] ───────────────────────────────────────`)
        print(`[AudioLayerManager] Active: ${this.getActiveLayerCount()} | Available: ${this.getAvailableLayerCount()} | Total: ${this.LAYER_COUNT}`)
        print(`[AudioLayerManager] ═══════════════════════════════════════`)
    }
}

