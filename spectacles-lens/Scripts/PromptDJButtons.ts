/**
 * PromptDJ Button Handler
 * =======================
 * Attach to UI buttons to trigger PromptDJ actions.
 * Follows SIK PinchButton pattern.
 */

import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import {validate} from "SpectaclesInteractionKit.lspkg/Utils/validate"
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {PromptDJController} from "./PromptDJController"

// Declare global for accessing controller
declare const global: {
    promptDJController?: PromptDJController
}

const TAG = "PromptDJButton"
const log = new NativeLogger(TAG)

/** Available action types for buttons */
type ActionType = 
    | "melody" 
    | "drums" 
    | "both" 
    | "tempoUp" 
    | "tempoDown" 
    | "nextScale" 
    | "prevScale" 
    | "nextDrumStyle"
    | "stop"
    | "ping"

/**
 * Button handler for PromptDJ actions.
 * Add to a SceneObject with an Interactable component.
 */
@component
export class PromptDJButton extends BaseScriptComponent {
    @input
    @hint("Reference to the PromptDJ Controller SceneObject (optional if using global)")
    @allowUndefined
    controllerObject: SceneObject | undefined
    
    @input
    @hint("Action to perform when button is pressed")
    action: string = "melody"
    
    private controller: PromptDJController | null = null
    private interactable: Interactable | null = null
    
    // Public event for external listeners
    private onButtonPressedEvent = new Event()
    public readonly onButtonPressed = this.onButtonPressedEvent.publicApi()
    
    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart()
        })
    }
    
    private onStart(): void {
        // Get controller reference - try multiple methods
        this.findController()
        
        if (!this.controller) {
            log.w("Controller not found! Will try global reference on button press.")
        } else {
            log.i("Controller found and connected")
        }
        
        // Get interactable on this object
        this.setupInteractable()
    }
    
    /**
     * Find the controller using multiple methods:
     * 1. From linked SceneObject input
     * 2. From global.promptDJController
     */
    private findController(): void {
        // Method 1: Try from linked SceneObject
        if (this.controllerObject) {
            const typeName = PromptDJController.getTypeName()
            this.controller = this.controllerObject.getComponent(typeName) as PromptDJController | null
            
            if (this.controller) {
                log.d("Found controller from linked SceneObject")
                return
            }
        }
        
        // Method 2: Try from global
        if (global.promptDJController) {
            this.controller = global.promptDJController
            log.d("Found controller from global.promptDJController")
            return
        }
        
        log.w("Controller not found via SceneObject or global")
    }
    
    private setupInteractable(): void {
        const typeName = Interactable.getTypeName()
        this.interactable = this.getSceneObject().getComponent(typeName) as Interactable | null
        
        if (!this.interactable) {
            log.e("Interactable component required on this SceneObject!")
            return
        }
        
        // Setup trigger callback
        this.interactable.onTriggerEnd.add(() => {
            if (this.enabled) {
                this.executeAction()
                this.onButtonPressedEvent.invoke()
            }
        })
        
        log.d("Button setup complete for action: " + this.action)
    }
    
    private executeAction(): void {
        // Try to find controller again if not found initially
        if (!this.controller) {
            this.findController()
        }
        
        if (!this.controller) {
            log.e("No controller - cannot execute action: " + this.action)
            return
        }
        
        log.d("Executing action: " + this.action)
        
        const actionType = this.action as ActionType
        
        switch (actionType) {
            case "melody":
                this.controller.generateMelody()
                break
            case "drums":
                this.controller.generateDrums()
                break
            case "both":
                this.controller.generateBoth()
                break
            case "tempoUp":
                this.controller.increaseTempo()
                break
            case "tempoDown":
                this.controller.decreaseTempo()
                break
            case "nextScale":
                this.controller.nextScale()
                break
            case "prevScale":
                this.controller.previousScale()
                break
            case "nextDrumStyle":
                this.controller.nextDrumStyle()
                break
            case "stop":
                this.controller.stopPlayback()
                break
            case "ping":
                this.controller.ping()
                break
            default:
                log.w("Unknown action: " + this.action)
        }
    }
    
    /**
     * Manually trigger the button action.
     * Useful for external scripts or testing.
     */
    public trigger(): void {
        this.executeAction()
        this.onButtonPressedEvent.invoke()
    }
    
    /**
     * Set the action type programmatically.
     */
    public setAction(action: ActionType): void {
        this.action = action
    }
    
    /**
     * Get the current action type.
     */
    public getAction(): string {
        return this.action
    }
}
