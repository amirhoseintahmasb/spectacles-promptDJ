/**
 * DJ Button Simple
 * =================
 * Minimal button - just set the action and it works.
 * 
 * SETUP:
 * 1. Create UI button with Interactable component
 * 2. Add this script
 * 3. Set "action" to one of:
 *    - Genre: techno, house, dubstep, dnb, funk, jazz, hiphop, trap, electronic, chill
 *    - Control: next, prev, random, regenerate, stop, bpmUp, bpmDown, test
 */

import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import {PromptDJManager} from "./PromptDJManager"

const TAG = "DJButton"
const log = new NativeLogger(TAG)

declare const global: {
    djManager?: PromptDJManager
}

@component
export class DJButtonSimple extends BaseScriptComponent {
    
    @input
    @hint("Action: techno/house/funk/jazz/etc OR next/prev/random/stop/bpmUp/bpmDown/test")
    action: string = "techno"
    
    private manager: PromptDJManager | null = null
    private interactable: Interactable | null = null
    
    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => {
            this.setup()
        })
    }
    
    private setup(): void {
        // Find interactable
        try {
            const typeName = Interactable.getTypeName()
            this.interactable = this.getSceneObject().getComponent(typeName) as Interactable | null
            
            if (this.interactable) {
                this.interactable.onTriggerEnd.add(() => {
                    this.onPressed()
                })
                log.d("Button ready: " + this.action)
            } else {
                log.e("No Interactable on button: " + this.action)
            }
        } catch (e) {
            log.e("Setup error: " + e)
        }
        
        // Find manager after delay
        const findEvent = this.createEvent("DelayedCallbackEvent")
        findEvent.bind(() => {
            this.findManager()
        })
        findEvent.reset(0.5)
    }
    
    private findManager(): void {
        if (global.djManager) {
            this.manager = global.djManager
            log.d("Found manager for: " + this.action)
        } else {
            log.w("Manager not found for: " + this.action)
        }
    }
    
    private onPressed(): void {
        log.d("Pressed: " + this.action)
        
        // Find manager if needed
        if (!this.manager && global.djManager) {
            this.manager = global.djManager
        }
        
        if (!this.manager) {
            log.e("No manager! Is PromptDJManager in scene?")
            return
        }
        
        // Execute action
        switch (this.action.toLowerCase()) {
            // Genres
            case "techno":
            case "house":
            case "dubstep":
            case "dnb":
            case "funk":
            case "jazz":
            case "hiphop":
            case "trap":
            case "electronic":
            case "chill":
                this.manager.playGenre(this.action.toLowerCase())
                break
            
            // Controls
            case "next":
                this.manager.nextGenre()
                break
            case "prev":
            case "previous":
                this.manager.prevGenre()
                break
            case "random":
            case "start":
                this.manager.randomGenre()
                break
            case "regenerate":
            case "regen":
                this.manager.regenerate()
                break
            case "stop":
                this.manager.stop()
                break
            case "bpmup":
            case "tempoup":
                this.manager.bpmUp()
                break
            case "bpmdown":
            case "tempodown":
                this.manager.bpmDown()
                break
            case "test":
            case "debug":
                this.manager.testConnection()
                break
            
            default:
                log.w("Unknown action: " + this.action)
        }
    }
    
    /**
     * Call manually from behavior script
     */
    public trigger(): void {
        this.onPressed()
    }
}

