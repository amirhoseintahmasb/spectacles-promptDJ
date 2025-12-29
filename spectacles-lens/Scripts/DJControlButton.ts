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

import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {PromptDJUI} from "./PromptDJUI"
import {PromptDJController} from "./PromptDJController"

// Declare global for accessing controllers
declare const global: {
    promptDJUI?: PromptDJUI
    promptDJController?: PromptDJController
}

const TAG = "DJControlButton"
const log = new NativeLogger(TAG)

/** Available control actions */
type ControlAction = 
    | "start" 
    | "stop" 
    | "random" 
    | "next" 
    | "previous" 
    | "regenerate"
    | "bpmUp"
    | "bpmDown"

/**
 * Control button for DJ interface.
 * Handles start, stop, random, next, previous, regenerate actions.
 */
@component
export class DJControlButton extends BaseScriptComponent {
    // ========================================
    // INPUTS
    // ========================================
    
    @input
    @hint("PromptDJ UI Controller SceneObject (can use both UI and Controller)")
    @allowUndefined
    uiController: SceneObject | undefined
    
    @input
    @hint("Action to perform (start, stop, random, next, previous, regenerate, bpmUp, bpmDown)")
    action: string = "start"
    
    // ========================================
    // STATE
    // ========================================
    
    private ui: PromptDJUI | null = null
    private controller: PromptDJController | null = null
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
        this.findControllers()
        this.setupInteractable()
    }
    
    /**
     * Find UI and main controller using multiple methods.
     */
    private findControllers(): void {
        // From linked SceneObject
        if (this.uiController) {
            // Try to find PromptDJUI
            const uiTypeName = PromptDJUI.getTypeName()
            this.ui = this.uiController.getComponent(uiTypeName) as PromptDJUI | null
            
            // Try to find PromptDJController
            const controllerTypeName = PromptDJController.getTypeName()
            this.controller = this.uiController.getComponent(controllerTypeName) as PromptDJController | null
        }
        
        // From global
        if (!this.ui && global.promptDJUI) {
            this.ui = global.promptDJUI
        }
        
        if (!this.controller && global.promptDJController) {
            this.controller = global.promptDJController
        }
        
        if (this.ui) {
            log.d("Found UI controller")
        }
        if (this.controller) {
            log.d("Found main controller")
        }
    }
    
    private setupInteractable(): void {
        const typeName = Interactable.getTypeName()
        this.interactable = this.getSceneObject().getComponent(typeName) as Interactable | null
        
        if (this.interactable) {
            this.interactable.onTriggerEnd.add(() => {
                this.trigger()
            })
            log.d("Connected to Interactable for action: " + this.action)
        } else {
            log.w("No Interactable found - button won't respond to interactions")
        }
    }
    
    // ========================================
    // PUBLIC API
    // ========================================
    
    /**
     * Trigger this button's action.
     */
    public trigger(): void {
        log.i(this.action + " pressed!")
        
        // Try to find controllers if not found
        if (!this.ui && !this.controller) {
            this.findControllers()
        }
        
        const actionType = this.action as ControlAction
        
        switch (actionType) {
            case "start":
            case "random":
                if (this.ui) {
                    this.ui.random()
                } else if (this.controller) {
                    this.controller.generateBoth()
                } else {
                    log.e("No controller found for action: " + this.action)
                }
                break
                
            case "stop":
                if (this.ui) {
                    this.ui.stop()
                } else if (this.controller) {
                    this.controller.stopPlayback()
                } else {
                    log.e("No controller found for action: " + this.action)
                }
                break
                
            case "next":
                if (this.ui) {
                    this.ui.next()
                } else {
                    log.e("UI controller required for 'next' action")
                }
                break
                
            case "previous":
                if (this.ui) {
                    this.ui.previous()
                } else {
                    log.e("UI controller required for 'previous' action")
                }
                break
                
            case "regenerate":
                if (this.ui) {
                    this.ui.regenerate()
                } else if (this.controller) {
                    this.controller.generateBoth()
                } else {
                    log.e("No controller found for action: " + this.action)
                }
                break
                
            case "bpmUp":
                if (this.ui) {
                    this.ui.increaseBPM()
                } else if (this.controller) {
                    this.controller.increaseTempo()
                } else {
                    log.e("No controller found for action: " + this.action)
                }
                break
                
            case "bpmDown":
                if (this.ui) {
                    this.ui.decreaseBPM()
                } else if (this.controller) {
                    this.controller.decreaseTempo()
                } else {
                    log.e("No controller found for action: " + this.action)
                }
                break
                
            default:
                log.w("Unknown action: " + this.action)
        }
        
        this.onTriggeredEvent.invoke(this.action)
    }
    
    /**
     * Set the action programmatically.
     */
    public setAction(action: ControlAction): void {
        this.action = action
    }
    
    /**
     * Get the current action.
     */
    public getAction(): string {
        return this.action
    }
}

