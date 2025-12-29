/**
 * Pinch Gesture Handler for PromptDJ
 * ===================================
 * Detects pinch gestures from Spectacles hand tracking
 * and triggers music generation.
 * 
 * Gesture Mapping:
 * - Right hand pinch: Generate Melody
 * - Left hand pinch: Generate Drums  
 * - Both hands pinch: Generate Both
 * 
 * Setup:
 * 1. Attach to a SceneObject
 * 2. Link the PromptDJ controller
 * 3. Link hand tracking components from SpectaclesInteractionKit
 */

import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {PromptDJController} from "./PromptDJController"

// Declare global for accessing controller
declare const global: {
    promptDJController?: PromptDJController
}

// Declare getTime function from Lens Studio
declare function getTime(): number

const TAG = "PinchGestureHandler"
const log = new NativeLogger(TAG)

/** Hand tracking API interface */
interface HandTrackingAPI {
    getPinchStrength?: () => number
}

/** Hand tracking script component */
interface HandTrackingComponent {
    api?: HandTrackingAPI
}

/**
 * Pinch gesture handler for music generation.
 * Detects hand pinches and triggers appropriate actions.
 */
@component
export class PinchGestureHandler extends BaseScriptComponent {
    // ========================================
    // INPUTS
    // ========================================
    
    @input
    @hint("PromptDJ Controller SceneObject")
    @allowUndefined
    controllerObject: SceneObject | undefined
    
    @input
    @hint("Right hand tracking component")
    @allowUndefined
    rightHandTracking: ScriptComponent | undefined
    
    @input
    @hint("Left hand tracking component")
    @allowUndefined
    leftHandTracking: ScriptComponent | undefined
    
    @input
    @hint("Pinch detection threshold (0.5-1.0)")
    pinchThreshold: number = 0.8
    
    @input
    @hint("Cooldown time between triggers (seconds)")
    cooldownTime: number = 0.5
    
    // ========================================
    // STATE
    // ========================================
    
    private controller: PromptDJController | null = null
    private lastRightPinchTime: number = 0
    private lastLeftPinchTime: number = 0
    private rightPinching: boolean = false
    private leftPinching: boolean = false
    
    // ========================================
    // EVENTS
    // ========================================
    
    private onRightPinchEvent = new Event()
    public readonly onRightPinch = this.onRightPinchEvent.publicApi()
    
    private onLeftPinchEvent = new Event()
    public readonly onLeftPinch = this.onLeftPinchEvent.publicApi()
    
    private onBothPinchEvent = new Event()
    public readonly onBothPinch = this.onBothPinchEvent.publicApi()
    
    // ========================================
    // LIFECYCLE
    // ========================================
    
    onAwake(): void {
        log.i("Initializing...")
        
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart()
        })
    }
    
    private onStart(): void {
        this.findController()
        
        if (!this.controller) {
            log.w("Controller not found!")
        }
        
        // Set up update event for continuous gesture checking
        this.createEvent("UpdateEvent").bind(() => {
            this.onUpdate()
        })
        
        log.i("Ready")
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
    
    private onUpdate(): void {
        this.checkPinchGestures()
    }
    
    // ========================================
    // GESTURE DETECTION
    // ========================================
    
    private checkPinchGestures(): void {
        const now = getTime()
        
        // Get pinch strengths
        const rightPinchStrength = this.getRightPinchStrength()
        const leftPinchStrength = this.getLeftPinchStrength()
        
        // Right hand pinch detection
        if (rightPinchStrength > this.pinchThreshold && !this.rightPinching) {
            this.rightPinching = true
            
            if (now - this.lastRightPinchTime > this.cooldownTime) {
                // Check if both hands are pinching
                if (this.leftPinching || leftPinchStrength > this.pinchThreshold) {
                    this.handleBothHandsPinch()
                    this.lastRightPinchTime = now
                    this.lastLeftPinchTime = now
                } else {
                    this.handleRightHandPinch()
                    this.lastRightPinchTime = now
                }
            }
        } else if (rightPinchStrength < this.pinchThreshold - 0.1) {
            this.rightPinching = false
        }
        
        // Left hand pinch detection
        if (leftPinchStrength > this.pinchThreshold && !this.leftPinching) {
            this.leftPinching = true
            
            if (now - this.lastLeftPinchTime > this.cooldownTime) {
                // Check if both hands are pinching (not already handled)
                if (!(this.rightPinching || rightPinchStrength > this.pinchThreshold)) {
                    this.handleLeftHandPinch()
                    this.lastLeftPinchTime = now
                }
            }
        } else if (leftPinchStrength < this.pinchThreshold - 0.1) {
            this.leftPinching = false
        }
    }
    
    private getRightPinchStrength(): number {
        try {
            const handTracking = this.rightHandTracking as HandTrackingComponent | undefined
            if (handTracking?.api?.getPinchStrength) {
                return handTracking.api.getPinchStrength()
            }
        } catch (e) {
            // Hand tracking not available
        }
        return 0
    }
    
    private getLeftPinchStrength(): number {
        try {
            const handTracking = this.leftHandTracking as HandTrackingComponent | undefined
            if (handTracking?.api?.getPinchStrength) {
                return handTracking.api.getPinchStrength()
            }
        } catch (e) {
            // Hand tracking not available
        }
        return 0
    }
    
    // ========================================
    // GESTURE HANDLERS
    // ========================================
    
    private handleRightHandPinch(): void {
        log.i("Right hand pinch - Generate Melody")
        
        // Try to find controller if not found
        if (!this.controller) {
            this.findController()
        }
        
        if (this.controller) {
            this.controller.generateMelody()
        }
        
        this.onRightPinchEvent.invoke()
    }
    
    private handleLeftHandPinch(): void {
        log.i("Left hand pinch - Generate Drums")
        
        // Try to find controller if not found
        if (!this.controller) {
            this.findController()
        }
        
        if (this.controller) {
            this.controller.generateDrums()
        }
        
        this.onLeftPinchEvent.invoke()
    }
    
    private handleBothHandsPinch(): void {
        log.i("Both hands pinch - Generate Both")
        
        // Try to find controller if not found
        if (!this.controller) {
            this.findController()
        }
        
        if (this.controller) {
            this.controller.generateBoth()
        }
        
        this.onBothPinchEvent.invoke()
    }
    
    // ========================================
    // PUBLIC API - For manual triggering
    // ========================================
    
    /**
     * Manually trigger right pinch action.
     */
    public triggerRightPinch(): void {
        this.handleRightHandPinch()
    }
    
    /**
     * Manually trigger left pinch action.
     */
    public triggerLeftPinch(): void {
        this.handleLeftHandPinch()
    }
    
    /**
     * Manually trigger both pinch action.
     */
    public triggerBothPinch(): void {
        this.handleBothHandsPinch()
    }
    
    /**
     * Set pinch threshold.
     */
    public setPinchThreshold(threshold: number): void {
        this.pinchThreshold = Math.max(0.5, Math.min(1.0, threshold))
    }
    
    /**
     * Set cooldown time.
     */
    public setCooldownTime(time: number): void {
        this.cooldownTime = Math.max(0.1, time)
    }
}

