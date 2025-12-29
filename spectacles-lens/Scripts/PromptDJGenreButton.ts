/**
 * PromptDJ Genre Button
 * =====================
 * A single button that generates music in a specific genre/style.
 * Attach to a UI button (with Interactable component).
 * 
 * Genres available:
 * - Techno, House, Dubstep, DNB (Drum and Bass)
 * - Funk, Jazz, HipHop, Trap
 * - Latin (Bossa Nova), Reggae
 * - Electronic, Basic
 */

import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {PromptDJController} from "./PromptDJController"

// Declare global for accessing controller
declare const global: {
    promptDJController?: PromptDJController
}

const TAG = "PromptDJGenreButton"
const log = new NativeLogger(TAG)

/**
 * Genre button for direct music generation.
 * Generates music with specific genre parameters when pressed.
 */
@component
export class PromptDJGenreButton extends BaseScriptComponent {
    // ========================================
    // INPUTS
    // ========================================
    
    @input
    @hint("PromptDJ Controller SceneObject")
    @allowUndefined
    controllerObject: SceneObject | undefined
    
    @input
    @hint("Genre/drum style (techno, house, funk, jazz, etc.)")
    genre: string = "techno"
    
    @input
    @hint("Scale (C_major, A_minor, D_minor, G_major, E_minor, F_major)")
    scale: string = "C_minor"
    
    @input
    @hint("Tempo in BPM (60-180)")
    tempo: number = 120
    
    @input
    @hint("Note density (0.0-1.0)")
    density: number = 0.6
    
    @input
    @hint("Button label text component (optional)")
    @allowUndefined
    labelText: Text | undefined
    
    // ========================================
    // STATE
    // ========================================
    
    private controller: PromptDJController | null = null
    private interactable: Interactable | null = null
    
    // ========================================
    // EVENTS
    // ========================================
    
    private onButtonPressedEvent = new Event<string>()
    public readonly onButtonPressed = this.onButtonPressedEvent.publicApi()
    
    // ========================================
    // LIFECYCLE
    // ========================================
    
    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart()
        })
    }
    
    private onStart(): void {
        this.findController()
        
        if (!this.controller) {
            log.w("Controller not found!")
        }
        
        // Set label text if provided
        this.updateLabel()
        
        // Setup interactable callback
        this.setupInteractable()
    }
    
    /**
     * Find controller using multiple methods.
     */
    private findController(): void {
        // Method 1: From linked SceneObject
        if (this.controllerObject) {
            const typeName = PromptDJController.getTypeName()
            this.controller = this.controllerObject.getComponent(typeName) as PromptDJController | null
            
            if (this.controller) {
                log.d("Found controller from linked SceneObject")
                return
            }
        }
        
        // Method 2: From global
        if (global.promptDJController) {
            this.controller = global.promptDJController
            log.d("Found controller from global.promptDJController")
            return
        }
        
        log.w("Controller not found via SceneObject or global")
    }
    
    private updateLabel(): void {
        if (this.labelText) {
            const displayName = this.genre.charAt(0).toUpperCase() + this.genre.slice(1)
            this.labelText.text = displayName
        }
    }
    
    private setupInteractable(): void {
        const typeName = Interactable.getTypeName()
        this.interactable = this.getSceneObject().getComponent(typeName) as Interactable | null
        
        if (this.interactable) {
            this.interactable.onTriggerEnd.add(() => {
                this.trigger()
            })
            log.d("Hooked to Interactable for " + this.genre)
        } else {
            log.w("No Interactable found - add one to this SceneObject")
        }
    }
    
    // ========================================
    // PUBLIC API
    // ========================================
    
    /**
     * Trigger music generation with this button's settings.
     */
    public trigger(): void {
        // Try to find controller if not found
        if (!this.controller) {
            this.findController()
        }
        
        if (!this.controller) {
            log.e("No controller!")
            return
        }
        
        log.i("Generating " + this.genre + " music...")
        
        // Update controller params
        this.controller.params.drum_style = this.genre
        this.controller.params.scale = this.scale
        this.controller.params.tempo_bpm = this.tempo
        this.controller.params.density = this.density
        
        // Generate both melody and drums in this genre
        this.controller.generateBoth()
        
        this.onButtonPressedEvent.invoke(this.genre)
    }
    
    /**
     * Set genre programmatically.
     */
    public setGenre(genre: string): void {
        this.genre = genre
        this.updateLabel()
    }
    
    /**
     * Get current genre.
     */
    public getGenre(): string {
        return this.genre
    }
    
    /**
     * Set scale programmatically.
     */
    public setScale(scale: string): void {
        this.scale = scale
    }
    
    /**
     * Set tempo programmatically.
     */
    public setTempo(tempo: number): void {
        this.tempo = Math.max(60, Math.min(180, tempo))
    }
    
    /**
     * Set density programmatically.
     */
    public setDensity(density: number): void {
        this.density = Math.max(0, Math.min(1, density))
    }
}

