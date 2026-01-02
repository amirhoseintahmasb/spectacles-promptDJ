/**
 * DynamicAudioOutput - PCM16 Audio Playback for Spectacles
 * =========================================================
 * 
 * This component enables dynamic audio playback from PCM16 data.
 * Based on Snap's RemoteServiceGateway pattern for AI audio output.
 * 
 * REQUIREMENTS:
 * - Audio Output asset (audioOutputTrack) connected
 * - AudioComponent on the same SceneObject
 * - PCM 16-bit signed little-endian input data
 * 
 * USAGE:
 * 1. Initialize with sample rate: dynamicAudioOutput.initialize(48000)
 * 2. Add audio frames: dynamicAudioOutput.addAudioFrame(uint8Array, channels)
 */

@component
export class DynamicAudioOutput extends BaseScriptComponent {
    @ui.separator
    @ui.label("Dynamic Audio Output for PromptDJ")
    @ui.separator
    
    @input("Asset.AudioTrackAsset")
    @hint("Audio Output track asset for procedural audio")
    private audioOutputTrack: AudioTrackAsset | undefined
    
    private audComponent: AudioComponent | null = null
    private audioOutputProvider: AudioOutputProvider | null = null
    private isInitialized: boolean = false
    private currentSampleRate: number = 48000
    
    onAwake() {
        // Get AudioComponent from this SceneObject
        this.audComponent = this.sceneObject.getComponent("AudioComponent") as AudioComponent
        
        if (!this.audComponent) {
            print("[DynamicAudioOutput] Warning: No AudioComponent found on SceneObject")
            print("[DynamicAudioOutput] Please add an AudioComponent to use dynamic audio")
        }
        
        if (this.audioOutputTrack) {
            try {
                this.audioOutputProvider = this.audioOutputTrack.control as AudioOutputProvider
                print("[DynamicAudioOutput] AudioOutputProvider ready")
            } catch (e) {
                print("[DynamicAudioOutput] Error getting AudioOutputProvider: " + e)
            }
        } else {
            print("[DynamicAudioOutput] Warning: No audioOutputTrack connected")
            print("[DynamicAudioOutput] Create an Audio Output asset and connect it")
        }
    }
    
    /**
     * Initializes the audio output with the specified sample rate.
     * Call this before adding audio frames.
     * 
     * @param sampleRate - Sample rate for the audio output (default: 48000)
     */
    public initialize(sampleRate: number = 48000): boolean {
        if (!this.audioOutputProvider) {
            print("[DynamicAudioOutput] Error: audioOutputProvider not available")
            return false
        }
        
        if (!this.audComponent) {
            print("[DynamicAudioOutput] Error: AudioComponent not available")
            return false
        }
        
        if (!this.audioOutputTrack) {
            print("[DynamicAudioOutput] Error: audioOutputTrack not connected")
            return false
        }
        
        try {
            this.currentSampleRate = sampleRate
            this.audioOutputProvider.sampleRate = sampleRate
            this.audComponent.audioTrack = this.audioOutputTrack
            this.audComponent.play(-1)  // Loop indefinitely
            this.isInitialized = true
            print("[DynamicAudioOutput] Initialized @ " + sampleRate + " Hz")
            return true
        } catch (e) {
            print("[DynamicAudioOutput] Initialize error: " + e)
            return false
        }
    }
    
    /**
     * Adds an audio frame to the output buffer.
     * 
     * @param uint8Array - Audio data in PCM 16-bit signed little-endian format
     * @param channels - Number of audio channels (1 = mono, 2 = stereo). Default: 1
     * 
     * Note: For stereo input, data should be interleaved (L,R,L,R,...)
     * The output is always converted to mono for Spectacles compatibility.
     */
    public addAudioFrame(uint8Array: Uint8Array, channels: number = 1): void {
        if (!this.isInitialized) {
            print("[DynamicAudioOutput] Not initialized - call initialize() first")
            this.initialize(this.currentSampleRate)
        }
        
        if (!this.audioOutputProvider) {
            print("[DynamicAudioOutput] No audioOutputProvider")
            return
        }
        
        if (!this.audComponent) {
            print("[DynamicAudioOutput] No AudioComponent")
            return
        }
        
        // Ensure audio is playing
        if (!this.audComponent.isPlaying()) {
            try {
                this.audComponent.play(-1)
            } catch (e) {
                print("[DynamicAudioOutput] Error resuming playback: " + e)
            }
        }
        
        // Convert PCM16 to Float32 and enqueue
        const { data, shape } = this.convertPCM16ToAudioFrame(uint8Array, channels)
        
        try {
            this.audioOutputProvider.enqueueAudioFrame(data, shape)
            print("[DynamicAudioOutput] Enqueued " + data.length + " samples")
        } catch (e) {
            print("[DynamicAudioOutput] Enqueue error: " + e)
        }
    }
    
    /**
     * Adds audio from a base64-encoded PCM16 string.
     * This is the format sent by the PromptDJ backend.
     * 
     * @param base64String - Base64-encoded PCM16 audio data
     * @param channels - Number of audio channels (default: 1)
     */
    public addAudioFromBase64(base64String: string, channels: number = 1): void {
        try {
            // Decode base64 to Uint8Array
            const uint8Array = Base64.decode(base64String)
            this.addAudioFrame(uint8Array, channels)
        } catch (e) {
            print("[DynamicAudioOutput] Base64 decode error: " + e)
        }
    }
    
    /**
     * Stops the audio output.
     */
    public stop(): void {
        if (this.audComponent && this.audComponent.isPlaying()) {
            try {
                this.audComponent.stop(false)
                print("[DynamicAudioOutput] Stopped")
            } catch (e) {
                print("[DynamicAudioOutput] Stop error: " + e)
            }
        }
    }
    
    /**
     * Checks if audio is currently playing.
     */
    public isPlaying(): boolean {
        return this.audComponent?.isPlaying() ?? false
    }
    
    /**
     * Converts PCM16 (signed 16-bit little-endian) to Float32 audio frame.
     * Also handles stereo to mono downmix for Spectacles compatibility.
     */
    private convertPCM16ToAudioFrame(
        uint8Array: Uint8Array,
        channels: number = 1
    ): { data: Float32Array; shape: vec3 } {
        const clampedChannels = Math.max(1, Math.floor(channels))
        const bytesPerFrame = 2 * clampedChannels  // 2 bytes per sample * channels
        
        // Ensure we have complete frames
        const safeLength = uint8Array.length - (uint8Array.length % bytesPerFrame)
        const totalSamples = safeLength / 2
        const frames = Math.floor(totalSamples / clampedChannels)
        
        // Output is always mono for Spectacles
        const monoData = new Float32Array(frames)
        
        if (clampedChannels === 1) {
            // Mono input - direct conversion
            for (let i = 0, j = 0; i < safeLength; i += 2, j++) {
                // Read 16-bit signed little-endian
                const sample = ((uint8Array[i] | (uint8Array[i + 1] << 8)) << 16) >> 16
                // Normalize to [-1.0, 1.0]
                monoData[j] = sample / 32768.0
            }
        } else {
            // Stereo/multi-channel - take left channel only
            for (let f = 0; f < frames; f++) {
                const byteIndex = f * bytesPerFrame
                const sample = ((uint8Array[byteIndex] | (uint8Array[byteIndex + 1] << 8)) << 16) >> 16
                monoData[f] = sample / 32768.0
            }
        }
        
        // Shape: [samples, channels, 1] - mono output
        const shape = new vec3(monoData.length, 1, 1)
        
        return { data: monoData, shape: shape }
    }
}

