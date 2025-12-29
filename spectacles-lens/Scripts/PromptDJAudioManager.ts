/**
 * PromptDJ Audio Manager
 * =======================
 * Manages audio playback for Spectacles using DynamicAudioOutput approach.
 * Based on MiNiMIDI_LYRIA pattern for reliable Spectacles audio.
 * 
 * This is an alternative to AudioComponent approach that works better
 * on real Spectacles devices.
 */

import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"

// Declare RemoteServiceGateway types
declare const RemoteServiceGateway: {
    DynamicAudioOutput: any
}

const TAG = "PromptDJAudio"
const log = new NativeLogger(TAG)

/**
 * Audio Manager using DynamicAudioOutput for Spectacles.
 * This approach is more reliable than AudioComponent on real devices.
 */
@component
export class PromptDJAudioManager extends BaseScriptComponent {
    // ========================================
    // INPUTS
    // ========================================
    
    @input
    @hint("DynamicAudioOutput component (from RemoteServiceGateway)")
    @allowUndefined
    dynamicAudioOutput: any | undefined
    
    @input
    @hint("Internet Module for fetching audio")
    @allowUndefined
    internetModule: any | undefined
    
    // ========================================
    // STATE
    // ========================================
    
    private isInitialized: boolean = false
    private isPlaying: boolean = false
    private currentAudioData: Uint8Array | null = null
    private sampleRate: number = 48000 // 48kHz for Spectacles
    
    // ========================================
    // LIFECYCLE
    // ========================================
    
    onAwake(): void {
        log.i("Initializing Audio Manager...")
        
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart()
        })
    }
    
    private onStart(): void {
        if (this.dynamicAudioOutput) {
            try {
                this.dynamicAudioOutput.initialize(this.sampleRate)
                this.isInitialized = true
                log.i("DynamicAudioOutput initialized at " + this.sampleRate + " Hz")
            } catch (e) {
                log.e("Failed to initialize DynamicAudioOutput: " + e)
            }
        } else {
            log.w("DynamicAudioOutput not connected - audio won't play")
        }
    }
    
    // ========================================
    // AUDIO PLAYBACK
    // ========================================
    
    /**
     * Load and play audio from URL using fetch + DynamicAudioOutput.
     * This method works better on real Spectacles than RemoteMediaModule.
     */
    public async loadAndPlayAudio(url: string): Promise<void> {
        if (!this.internetModule) {
            log.e("InternetModule not connected!")
            return
        }
        
        if (!this.dynamicAudioOutput) {
            log.e("DynamicAudioOutput not connected!")
            return
        }
        
        if (!this.isInitialized) {
            log.e("Audio manager not initialized!")
            return
        }
        
        try {
            log.i("Fetching audio from: " + url)
            this.isPlaying = false
            
            // Fetch audio as blob
            const response = await this.internetModule.fetch(url)
            if (!response.ok) {
                throw new Error("HTTP " + response.status)
            }
            
            const blob = await response.blob()
            log.i("Audio blob received, size: " + blob.size + " bytes")
            
            // Convert blob to ArrayBuffer
            const arrayBuffer = await blob.arrayBuffer()
            const audioData = new Uint8Array(arrayBuffer)
            
            // Play using DynamicAudioOutput
            this.playAudioData(audioData)
            
        } catch (e) {
            log.e("Failed to load audio: " + e)
            throw e
        }
    }
    
    /**
     * Play audio data using DynamicAudioOutput.
     */
    private playAudioData(audioData: Uint8Array): void {
        if (!this.dynamicAudioOutput) {
            log.e("DynamicAudioOutput not available")
            return
        }
        
        try {
            // Stop any current playback
            if (this.isPlaying) {
                this.stop()
            }
            
            // Store reference
            this.currentAudioData = audioData
            
            // Interrupt any existing output
            this.dynamicAudioOutput.interruptAudioOutput()
            
            // Add audio frame (2 = stereo, but we use mono)
            this.dynamicAudioOutput.addAudioFrame(audioData, 2)
            
            this.isPlaying = true
            log.i("Audio playback started via DynamicAudioOutput")
            
        } catch (e) {
            log.e("Error playing audio: " + e)
            this.isPlaying = false
            throw e
        }
    }
    
    /**
     * Stop current playback.
     */
    public stop(): void {
        if (this.dynamicAudioOutput && this.isPlaying) {
            try {
                this.dynamicAudioOutput.interruptAudioOutput()
                this.isPlaying = false
                this.currentAudioData = null
                log.i("Audio stopped")
            } catch (e) {
                log.w("Error stopping audio: " + e)
            }
        }
    }
    
    /**
     * Check if playing.
     */
    public getIsPlaying(): boolean {
        return this.isPlaying
    }
    
    /**
     * Set volume (0.0 to 1.0).
     * Note: DynamicAudioOutput doesn't have built-in volume, so we'd need
     * to process the PCM data (like MiNiMIDI_LYRIA does).
     */
    public setVolume(volume: number): void {
        // Volume control would require PCM processing
        // For now, we'll keep it simple
        log.d("Volume control not yet implemented for DynamicAudioOutput")
    }
}

