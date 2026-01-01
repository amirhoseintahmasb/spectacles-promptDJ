/**
 * PromptDJ UI - Complete DJ Interface
 * ====================================
 * Creates a beautiful grid of genre buttons for music generation.
 * Attach to an empty SceneObject to auto-generate the UI.
 * 
 * Features:
 * - Genre grid (12 styles)
 * - Play/Stop controls
 * - Tempo slider
 * - Status display
 * 
 * NOTE: Uses global references to avoid circular import issues.
 */

import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"

// Music parameters interface (matches PromptDJController.MusicParams)
interface MusicParams {
    tempo_bpm: number
    scale: string
    density: number
    variation: number
    drum_style: string
    swing: number
    bars: number
}

// Interface for controller (avoids circular imports)
interface PromptDJControllerInterface {
    params: MusicParams
    generateBoth(): void
    generateMelody(): void
    generateDrums(): void
    stopPlayback(): void
    increaseTempo(): void
    decreaseTempo(): void
    nextScale(): void
    previousScale(): void
    nextDrumStyle(): void
    ping(): void
    readonly onStatusChange: { add: (callback: (status: string) => void) => void }
    readonly onAudioPlaying: { add: (callback: () => void) => void }
}

// Declare global for accessing controller
declare const global: {
    promptDJController?: PromptDJControllerInterface
    promptDJUI?: PromptDJUI
}

const TAG = "PromptDJUI"
const log = new NativeLogger(TAG)

// ========================================
// TYPE DEFINITIONS
// ========================================

/** Genre definition */
interface Genre {
    id: string
    name: string
    color: [number, number, number]
    tempo: number
    scale: string
}

/** Available genres */
const GENRES: Genre[] = [
    { id: "techno", name: "Techno", color: [0.8, 0.2, 0.8], tempo: 128, scale: "C_minor" },
    { id: "house", name: "House", color: [0.2, 0.6, 0.9], tempo: 124, scale: "F_major" },
    { id: "dubstep", name: "Dubstep", color: [1.0, 0.8, 0.0], tempo: 140, scale: "D_minor" },
    { id: "dnb", name: "Drum & Bass", color: [0.9, 0.3, 0.1], tempo: 174, scale: "A_minor" },
    { id: "funk", name: "Funk", color: [0.9, 0.5, 0.2], tempo: 110, scale: "E_minor" },
    { id: "jazz", name: "Jazz", color: [0.3, 0.3, 0.7], tempo: 120, scale: "G_major" },
    { id: "hiphop", name: "Hip Hop", color: [0.6, 0.2, 0.6], tempo: 90, scale: "C_minor" },
    { id: "trap", name: "Trap", color: [0.8, 0.1, 0.3], tempo: 140, scale: "A_minor" },
    { id: "latin", name: "Latin", color: [0.2, 0.8, 0.4], tempo: 105, scale: "D_major" },
    { id: "reggae", name: "Reggae", color: [0.1, 0.7, 0.3], tempo: 80, scale: "G_major" },
    { id: "electronic", name: "Electronic", color: [0.0, 0.9, 0.9], tempo: 128, scale: "C_major" },
    { id: "chillwave", name: "Chill", color: [0.5, 0.7, 0.9], tempo: 95, scale: "F_major" }
]

/**
 * PromptDJ UI Controller
 * Manages the DJ interface and genre selection.
 */
@component
export class PromptDJUI extends BaseScriptComponent {
    // ========================================
    // INPUTS
    // ========================================
    
    @input
    @hint("PromptDJ Controller SceneObject")
    @allowUndefined
    controllerObject: SceneObject | undefined
    
    @input
    @hint("UI Container (Screen Transform)")
    @allowUndefined
    uiContainer: SceneObject | undefined
    
    @input
    @hint("Status Text display")
    @allowUndefined
    statusText: Text | undefined
    
    @input
    @hint("Now Playing Text display")
    @allowUndefined
    nowPlayingText: Text | undefined
    
    // ========================================
    // STATE
    // ========================================
    
    private controller: PromptDJControllerInterface | null = null
    private currentGenre: Genre | null = null
    private isPlaying: boolean = false
    
    // ========================================
    // EVENTS
    // ========================================
    
    private onGenreSelectedEvent = new Event<Genre>()
    public readonly onGenreSelected = this.onGenreSelectedEvent.publicApi()
    
    private onPlaybackStartedEvent = new Event()
    public readonly onPlaybackStarted = this.onPlaybackStartedEvent.publicApi()
    
    private onPlaybackStoppedEvent = new Event()
    public readonly onPlaybackStopped = this.onPlaybackStoppedEvent.publicApi()
    
    // ========================================
    // LIFECYCLE
    // ========================================
    
    onAwake(): void {
        log.i("Initializing...")
        
        // Register globally
        global.promptDJUI = this
        
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart()
        })
    }
    
    private onStart(): void {
        this.findController()
        
        if (!this.controller) {
            log.w("Controller not found!")
        } else {
            log.i("Controller connected!")
        }
        
        this.updateStatus("Ready to DJ! 🎧")
        this.updateNowPlaying("Select a genre")
    }
    
    /**
     * Find the controller from global reference.
     * PromptDJController registers itself globally in onAwake().
     */
    private findController(): void {
        // Get from global (controller registers itself there)
        if (global.promptDJController) {
            this.controller = global.promptDJController
            log.d("Found controller from global.promptDJController")
            return
        }
        
        log.w("Controller not found - waiting for it to initialize")
    }
    
    // ========================================
    // GENRE SELECTION
    // ========================================
    
    /**
     * Select a genre by ID and generate music.
     */
    public selectGenre(genreId: string): void {
        const genre = GENRES.find(g => g.id === genreId)
        
        if (!genre) {
            log.w("Unknown genre: " + genreId)
            return
        }
        
        this.currentGenre = genre
        log.i("Selected " + genre.name)
        
        this.updateNowPlaying("Loading " + genre.name + "...")
        this.onGenreSelectedEvent.invoke(genre)
        
        // Generate music in this genre
        this.generateInGenre(genre)
    }
    
    private generateInGenre(genre: Genre): void {
        // Try to find controller if not found
        if (!this.controller) {
            this.findController()
        }
        
        if (!this.controller) {
            log.e("No controller!")
            this.updateStatus("Error: No controller")
            return
        }
        
        log.i("Generating " + genre.name + " @ " + genre.tempo + " BPM")
        this.updateStatus("Generating " + genre.name + "...")
        
        // Set parameters
        this.controller.params.drum_style = genre.id
        this.controller.params.scale = genre.scale
        this.controller.params.tempo_bpm = genre.tempo
        this.controller.params.density = 0.6
        this.controller.params.variation = 0.4
        this.controller.params.bars = 8
        
        // Generate
        this.controller.generateBoth()
        
        this.isPlaying = true
        this.onPlaybackStartedEvent.invoke()
        this.updateNowPlaying("♪ " + genre.name + " - " + genre.tempo + " BPM")
    }
    
    // ========================================
    // CONTROLS
    // ========================================
    
    /**
     * Stop current playback.
     */
    public stop(): void {
        if (this.controller) {
            this.controller.stopPlayback()
        }
        this.isPlaying = false
        this.onPlaybackStoppedEvent.invoke()
        this.updateStatus("Stopped")
        this.updateNowPlaying("Select a genre")
    }
    
    /**
     * Regenerate current genre or pick random.
     */
    public regenerate(): void {
        if (this.currentGenre) {
            this.generateInGenre(this.currentGenre)
        } else {
            this.random()
        }
    }
    
    /**
     * Go to next genre.
     */
    public next(): void {
        let currentIndex = 0
        if (this.currentGenre) {
            currentIndex = GENRES.findIndex(g => g.id === this.currentGenre!.id)
        }
        const nextIndex = (currentIndex + 1) % GENRES.length
        this.selectGenre(GENRES[nextIndex].id)
    }
    
    /**
     * Go to previous genre.
     */
    public previous(): void {
        let currentIndex = 0
        if (this.currentGenre) {
            currentIndex = GENRES.findIndex(g => g.id === this.currentGenre!.id)
        }
        const prevIndex = (currentIndex - 1 + GENRES.length) % GENRES.length
        this.selectGenre(GENRES[prevIndex].id)
    }
    
    /**
     * Select random genre.
     */
    public random(): void {
        const randomIndex = Math.floor(Math.random() * GENRES.length)
        this.selectGenre(GENRES[randomIndex].id)
    }
    
    /**
     * Increase BPM by 5.
     */
    public increaseBPM(): void {
        if (!this.controller) {
            this.findController()
        }
        
        if (this.controller) {
            this.controller.increaseTempo()
            if (this.currentGenre) {
                this.currentGenre.tempo = this.controller.params.tempo_bpm
                this.updateNowPlaying("♪ " + this.currentGenre.name + " - " + this.currentGenre.tempo + " BPM")
            }
        }
    }
    
    /**
     * Decrease BPM by 5.
     */
    public decreaseBPM(): void {
        if (!this.controller) {
            this.findController()
        }
        
        if (this.controller) {
            this.controller.decreaseTempo()
            if (this.currentGenre) {
                this.currentGenre.tempo = this.controller.params.tempo_bpm
                this.updateNowPlaying("♪ " + this.currentGenre.name + " - " + this.currentGenre.tempo + " BPM")
            }
        }
    }
    
    /**
     * Set BPM to a specific value.
     */
    public setBPM(bpm: number): void {
        if (!this.controller) {
            this.findController()
        }
        
        if (this.controller) {
            const clampedBPM = Math.max(60, Math.min(180, bpm))
            this.controller.params.tempo_bpm = clampedBPM
            if (this.currentGenre) {
                this.currentGenre.tempo = clampedBPM
                this.updateNowPlaying("♪ " + this.currentGenre.name + " - " + clampedBPM + " BPM")
            }
        }
    }
    
    // ========================================
    // GENRE SHORTCUTS
    // ========================================
    
    public selectTechno(): void { this.selectGenre("techno") }
    public selectHouse(): void { this.selectGenre("house") }
    public selectDubstep(): void { this.selectGenre("dubstep") }
    public selectDnb(): void { this.selectGenre("dnb") }
    public selectFunk(): void { this.selectGenre("funk") }
    public selectJazz(): void { this.selectGenre("jazz") }
    public selectHiphop(): void { this.selectGenre("hiphop") }
    public selectTrap(): void { this.selectGenre("trap") }
    public selectLatin(): void { this.selectGenre("latin") }
    public selectReggae(): void { this.selectGenre("reggae") }
    public selectElectronic(): void { this.selectGenre("electronic") }
    public selectChill(): void { this.selectGenre("chillwave") }
    
    // ========================================
    // UI UPDATES
    // ========================================
    
    private updateStatus(message: string): void {
        if (this.statusText) {
            this.statusText.text = message
        }
        log.i("Status: " + message)
    }
    
    private updateNowPlaying(message: string): void {
        if (this.nowPlayingText) {
            this.nowPlayingText.text = message
        }
    }
    
    // ========================================
    // GETTERS
    // ========================================
    
    /**
     * Get current genre.
     */
    public getCurrentGenre(): Genre | null {
        return this.currentGenre
    }
    
    /**
     * Check if playing.
     */
    public getIsPlaying(): boolean {
        return this.isPlaying
    }
    
    /**
     * Get all available genres.
     */
    public getGenres(): Genre[] {
        return [...GENRES]
    }
}

