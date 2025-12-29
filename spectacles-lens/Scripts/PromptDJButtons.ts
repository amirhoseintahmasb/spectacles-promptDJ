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

const TAG = "PromptDJButton"
const log = new NativeLogger(TAG)

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

/**
 * Button handler for PromptDJ actions.
 * Add to a SceneObject with an Interactable component.
 */
@component
export class PromptDJButton extends BaseScriptComponent {
    @input
    @hint("Reference to the PromptDJ Controller SceneObject")
    controllerObject!: SceneObject
    
    // @input string action {"widget":"combobox", "values":[{"label":"Generate Melody", "value":"melody"}, {"label":"Generate Drums", "value":"drums"}, {"label":"Generate Both", "value":"both"}, {"label":"Tempo Up", "value":"tempoUp"}, {"label":"Tempo Down", "value":"tempoDown"}, {"label":"Next Scale", "value":"nextScale"}, {"label":"Previous Scale", "value":"prevScale"}, {"label":"Next Drum Style", "value":"nextDrumStyle"}, {"label":"Stop Playback", "value":"stop"}]}
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
        // Get controller reference
        if (this.controllerObject) {
            this.controller = this.controllerObject.getComponent(
                PromptDJController.getTypeName()
            ) as PromptDJController
        }
        
        if (!this.controller) {
            log.w("Controller not found!")
        }
        
        // Get interactable on this object
        this.interactable = this.getSceneObject().getComponent(
            Interactable.getTypeName()
        ) as Interactable
        
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
    }
    
    private executeAction(): void {
        if (!this.controller) {
            log.w("No controller - cannot execute action")
            return
        }
        
        log.d("Executing action: " + this.action)
        
        switch (this.action as ActionType) {
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
            default:
                log.w("Unknown action: " + this.action)
        }
    }
}

