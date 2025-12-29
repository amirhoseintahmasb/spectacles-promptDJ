/**
 * DJ Button - Simple Genre Trigger
 * =================================
 * Drop this on any button to make it trigger a genre.
 * Works with SIK Interactable or can be called directly.
 * 
 * Usage:
 * 1. Add to a SceneObject with Interactable
 * 2. Set the genre
 * 3. Connect the UI controller
 */

import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {PromptDJUI} from "./PromptDJUI"

// Declare global for accessing UI controller
declare const global: {
    promptDJUI?: PromptDJUI
}

const TAG = "DJButton"
const log = new NativeLogger(TAG)

/**
 * Simple genre trigger button.
 * Triggers a specific genre when pressed.
 */
@component
export class DJButton extends BaseScriptComponent {
    // ========================================
    // INPUTS
    // ========================================
    
    @input
    @hint("PromptDJ UI Controller SceneObject")
    @allowUndefined
    uiController: SceneObject | undefined
    
    @input
    @hint("Genre to trigger (techno, house, funk, jazz, etc.)")
    genre: string = "techno"
    
    // ========================================
    // STATE
    // ========================================
    
    private ui: PromptDJUI | null = null
    private interactable: Interactable | null = null
    
    // ========================================
    // EVENTS
    // ========================================
    
    private onTriggeredEvent = new Event<string>()
    public readonly onTriggered = this.onTriggeredEvent.publicApi()
    
    // ========================================
    // LIFECYCLE
    // ========================================
    
    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart()
        })
    }
    
    private onStart(): void {
        this.findUIController()
        this.setupInteractable()
    }
    
    /**
     * Find UI controller using multiple methods.
     */
    private findUIController(): void {
        // Method 1: From linked SceneObject
        if (this.uiController) {
            const typeName = PromptDJUI.getTypeName()
            this.ui = this.uiController.getComponent(typeName) as PromptDJUI | null
            
            if (this.ui) {
                log.d("Found UI controller from linked SceneObject")
                return
            }
        }
        
        // Method 2: From global
        if (global.promptDJUI) {
            this.ui = global.promptDJUI
            log.d("Found UI controller from global.promptDJUI")
            return
        }
        
        log.w("UI controller not found")
    }
    
    private setupInteractable(): void {
        const typeName = Interactable.getTypeName()
        this.interactable = this.getSceneObject().getComponent(typeName) as Interactable | null
        
        if (this.interactable) {
            this.interactable.onTriggerEnd.add(() => {
                this.trigger()
            })
            log.d("Connected to Interactable for " + this.genre)
        } else {
            log.w("No Interactable found - button won't respond to interactions")
        }
    }
    
    // ========================================
    // PUBLIC API
    // ========================================
    
    /**
     * Trigger this button's genre.
     */
    public trigger(): void {
        log.i(this.genre + " pressed!")
        
        // Try to find UI if not found
        if (!this.ui) {
            this.findUIController()
        }
        
        if (this.ui) {
            this.ui.selectGenre(this.genre)
        } else {
            log.e("No UI controller found!")
        }
        
        this.onTriggeredEvent.invoke(this.genre)
    }
    
    /**
     * Set the genre programmatically.
     */
    public setGenre(genre: string): void {
        this.genre = genre
    }
    
    /**
     * Get the current genre.
     */
    public getGenre(): string {
        return this.genre
    }
}

