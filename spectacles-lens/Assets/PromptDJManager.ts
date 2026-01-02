/**
 * PromptDJ Manager - SIMPLIFIED ALL-IN-ONE
 * =========================================
 * Single script that handles everything:
 * - WebSocket connection
 * - Audio playback
 * - UI updates
 * - Genre/BPM management
 * 
 * SETUP:
 * 1. Create empty SceneObject named "PromptDJManager"
 * 2. Add this script
 * 3. Add InternetModule asset to project, connect to internetModule
 * 4. Add RemoteMediaModule asset to project, connect to remoteMediaModule
 * 5. Add AudioComponent to scene, connect to audioPlayer
 * 6. (Optional) Connect Text components for UI
 */

import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"

const TAG = "PromptDJManager"
const log = new NativeLogger(TAG)

// Register globally
declare const global: {
    djManager?: PromptDJManager
}

/** Genre definition */
interface Genre {
    id: string
    name: string
    tempo: number
    scale: string
}

/** Genres list */
const GENRES: Genre[] = [
    { id: "techno", name: "Techno", tempo: 128, scale: "C_minor" },
    { id: "house", name: "House", tempo: 124, scale: "F_major" },
    { id: "dubstep", name: "Dubstep", tempo: 140, scale: "D_minor" },
    { id: "dnb", name: "D&B", tempo: 174, scale: "A_minor" },
    { id: "funk", name: "Funk", tempo: 110, scale: "E_minor" },
    { id: "jazz", name: "Jazz", tempo: 120, scale: "G_major" },
    { id: "hiphop", name: "Hip Hop", tempo: 90, scale: "C_minor" },
    { id: "trap", name: "Trap", tempo: 140, scale: "A_minor" },
    { id: "electronic", name: "Electronic", tempo: 128, scale: "C_major" },
    { id: "chill", name: "Chill", tempo: 95, scale: "F_major" }
]

@component
export class PromptDJManager extends BaseScriptComponent {
    
    // ==================== REQUIRED INPUTS ====================
    
    @input("Asset.InternetModule")
    @hint("REQUIRED: Add InternetModule from Asset Browser")
    internetModule!: any
    
    @input("Asset.RemoteMediaModule") 
    @hint("REQUIRED: Add RemoteMediaModule from Asset Browser")
    remoteMediaModule!: any
    
    @input
    @hint("REQUIRED: AudioComponent for playback")
    audioPlayer!: AudioComponent
    
    // ==================== CONNECTION ====================
    
    @input
    @hint("Backend URL - Use your Mac's IP (not 127.0.0.1 for real Spectacles)")
    backendUrl: string = "ws://172.20.10.3:8123/ws/spectacles/"
    
    // ==================== OPTIONAL UI ====================
    
    @input
    @hint("Status text (optional)")
    @allowUndefined
    statusText: Text | undefined
    
    @input
    @hint("Genre/Now Playing text (optional)")
    @allowUndefined
    genreText: Text | undefined
    
    @input
    @hint("BPM text (optional)")
    @allowUndefined
    bpmText: Text | undefined
    
    // ==================== STATE ====================
    
    private socket: any = null
    private isConnected: boolean = false
    private isPlaying: boolean = false
    
    private currentGenreIndex: number = 0
    private currentBPM: number = 120
    private currentGenre: Genre = GENRES[0]
    
    private clientId: string = ""
    
    // ==================== EVENTS ====================
    
    private onStatusChangeEvent = new Event<string>()
    public readonly onStatusChange = this.onStatusChangeEvent.publicApi()
    
    // ==================== LIFECYCLE ====================
    
    onAwake(): void {
        // Generate client ID
        this.clientId = "spec-" + Math.random().toString(36).substring(2, 9)
        
        // Register globally
        global.djManager = this
        
        log.d("===========================================")
        log.d("PromptDJ Manager Initializing")
        log.d("Client ID: " + this.clientId)
        log.d("===========================================")
        
        this.createEvent("OnStartEvent").bind(() => {
            this.initialize()
        })
    }
    
    private initialize(): void {
        // Validate required inputs
        if (!this.validateInputs()) {
            return
        }
        
        // Update UI
        this.updateUI("Ready", this.currentGenre.name, this.currentBPM)
        
        // Connect after 1 second
        const connectEvent = this.createEvent("DelayedCallbackEvent")
        connectEvent.bind(() => {
            this.connect()
        })
        connectEvent.reset(1.0)
    }
    
    private validateInputs(): boolean {
        let valid = true
        
        if (!this.internetModule) {
            log.e("❌ InternetModule NOT connected!")
            log.e("   → Go to Asset Browser")
            log.e("   → Search 'InternetModule'")
            log.e("   → Add to project")
            log.e("   → Drag to 'Internet Module' input")
            this.setStatus("Missing: InternetModule")
            valid = false
        } else {
            log.d("✓ InternetModule connected")
        }
        
        if (!this.remoteMediaModule) {
            log.e("❌ RemoteMediaModule NOT connected!")
            log.e("   → Go to Asset Browser")
            log.e("   → Search 'RemoteMediaModule'")
            log.e("   → Add to project")
            log.e("   → Drag to 'Remote Media Module' input")
            this.setStatus("Missing: RemoteMediaModule")
            valid = false
        } else {
            log.d("✓ RemoteMediaModule connected")
        }
        
        if (!this.audioPlayer) {
            log.e("❌ AudioComponent NOT connected!")
            log.e("   → Add AudioComponent to scene")
            log.e("   → Drag to 'Audio Player' input")
            this.setStatus("Missing: AudioPlayer")
            valid = false
        } else {
            log.d("✓ AudioComponent connected")
            this.audioPlayer.enabled = true
        }
        
        if (!this.backendUrl || this.backendUrl.trim() === "") {
            log.e("❌ Backend URL is empty!")
            this.setStatus("Missing: Backend URL")
            valid = false
        } else {
            log.d("✓ Backend URL: " + this.backendUrl)
        }
        
        return valid
    }
    
    // ==================== CONNECTION ====================
    
    private connect(): void {
        if (this.isConnected) {
            log.d("Already connected")
            return
        }
        
        // Ensure URL ends with /
        let url = this.backendUrl.trim()
        if (!url.endsWith("/")) url += "/"
        url += this.clientId
        
        log.d("Connecting to: " + url)
        this.setStatus("Connecting...")
        
        try {
            this.socket = this.internetModule.createWebSocket(url)
            
            if (!this.socket) {
                log.e("WebSocket creation failed!")
                this.setStatus("Connection failed")
                this.scheduleReconnect()
                return
            }
            
            this.socket.binaryType = "blob"
            
            this.socket.onopen = () => {
                log.d("✓ Connected!")
                this.isConnected = true
                this.setStatus("Connected ✓")
            }
            
            this.socket.onmessage = async (event: any) => {
                await this.handleMessage(event)
            }
            
            this.socket.onclose = (event: any) => {
                log.d("Disconnected: " + event.code)
                this.isConnected = false
                this.setStatus("Disconnected")
                
                if (!event.wasClean) {
                    this.scheduleReconnect()
                }
            }
            
            this.socket.onerror = (event: any) => {
                log.e("WebSocket error!")
                log.e("Check: Is backend running?")
                log.e("Check: Is URL correct? " + url)
                log.e("Check: Same WiFi network?")
                this.setStatus("Connection error")
            }
            
        } catch (e) {
            log.e("Connection exception: " + e)
            this.setStatus("Connection failed")
            this.scheduleReconnect()
        }
    }
    
    private scheduleReconnect(): void {
        log.d("Reconnecting in 3s...")
        const event = this.createEvent("DelayedCallbackEvent")
        event.bind(() => {
            if (!this.isConnected) {
                this.connect()
            }
        })
        event.reset(3.0)
    }
    
    // ==================== MESSAGE HANDLING ====================
    
    private async handleMessage(event: any): Promise<void> {
        try {
            let data: any
            
            if (event.data instanceof Blob) {
                const text = await event.data.text()
                data = JSON.parse(text)
            } else {
                data = JSON.parse(event.data)
            }
            
            log.d("Received: " + data.type)
            
            switch (data.type) {
                case "connected":
                    log.d("Server confirmed connection")
                    break
                    
                case "audio_ready":
                    this.handleAudioReady(data)
                    break
                    
                case "status":
                    this.setStatus(data.message)
                    break
                    
                case "error":
                    log.e("Server error: " + data.message)
                    this.setStatus("Error!")
                    break
                    
                case "pong":
                    log.d("Pong received")
                    break
            }
        } catch (e) {
            log.e("Message parse error: " + e)
        }
    }
    
    private handleAudioReady(data: any): void {
        let url = data.url
        
        // Handle "both" format
        if (data.format === "both" && data.melody) {
            url = data.melody.url
        }
        
        if (!url) {
            log.e("No audio URL in response!")
            this.setStatus("No audio")
            return
        }
        
        log.d("Loading audio: " + url)
        this.setStatus("Loading...")
        
        this.loadAudio(url)
    }
    
    // ==================== AUDIO ====================
    
    private loadAudio(url: string): void {
        if (!this.remoteMediaModule || !this.audioPlayer) {
            log.e("Missing required modules for audio!")
            return
        }
        
        // Stop current playback
        if (this.isPlaying) {
            try {
                this.audioPlayer.stop(true)
            } catch (e) {}
            this.isPlaying = false
        }
        
        try {
            const resource = this.internetModule.makeResourceFromUrl(url)
            
            this.remoteMediaModule.loadResourceAsAudioTrackAsset(
                resource,
                (track: AudioTrackAsset) => {
                    this.playAudio(track)
                },
                (error: string) => {
                    log.e("Audio load failed: " + error)
                    this.setStatus("Audio error")
                }
            )
        } catch (e) {
            log.e("Audio load exception: " + e)
            this.setStatus("Audio error")
        }
    }
    
    private playAudio(track: AudioTrackAsset): void {
        if (!track || !this.audioPlayer) {
            log.e("Invalid track or player")
            return
        }
        
        try {
            this.audioPlayer.audioTrack = track
            
            // Small delay for stability
            const playEvent = this.createEvent("DelayedCallbackEvent")
            playEvent.bind(() => {
                try {
                    this.audioPlayer!.play(1)
                    this.isPlaying = true
                    log.d("✓ Playing!")
                    this.setStatus("Playing ♪")
                    this.updateGenreDisplay()
                } catch (e) {
                    log.e("Play error: " + e)
                    this.setStatus("Play failed")
                }
            })
            playEvent.reset(0.1)
            
        } catch (e) {
            log.e("Audio setup error: " + e)
        }
    }
    
    // ==================== COMMANDS ====================
    
    private send(action: string, params?: object): void {
        if (!this.isConnected || !this.socket) {
            log.w("Not connected!")
            this.setStatus("Not connected")
            return
        }
        
        const msg = JSON.stringify({
            action: action,
            params: params || {}
        })
        
        try {
            this.socket.send(msg)
            log.d("Sent: " + action)
        } catch (e) {
            log.e("Send error: " + e)
        }
    }
    
    // ==================== PUBLIC API ====================
    // Call these from buttons
    
    /**
     * Play a specific genre
     */
    public playGenre(genreId: string): void {
        const genre = GENRES.find(g => g.id === genreId)
        if (!genre) {
            log.w("Unknown genre: " + genreId)
            return
        }
        
        this.currentGenre = genre
        this.currentGenreIndex = GENRES.indexOf(genre)
        this.currentBPM = genre.tempo
        
        log.d("Playing: " + genre.name + " @ " + genre.tempo + " BPM")
        this.setStatus("Generating " + genre.name + "...")
        this.updateGenreDisplay()
        
        this.send("generate_both", {
            tempo_bpm: genre.tempo,
            scale: genre.scale,
            style: genre.id,
            bars: 8,
            density: 0.6,
            variation: 0.4,
            swing: 0.0
        })
    }
    
    /**
     * Play next genre
     */
    public nextGenre(): void {
        this.currentGenreIndex = (this.currentGenreIndex + 1) % GENRES.length
        this.playGenre(GENRES[this.currentGenreIndex].id)
    }
    
    /**
     * Play previous genre
     */
    public prevGenre(): void {
        this.currentGenreIndex = (this.currentGenreIndex - 1 + GENRES.length) % GENRES.length
        this.playGenre(GENRES[this.currentGenreIndex].id)
    }
    
    /**
     * Play random genre
     */
    public randomGenre(): void {
        const idx = Math.floor(Math.random() * GENRES.length)
        this.playGenre(GENRES[idx].id)
    }
    
    /**
     * Regenerate current genre
     */
    public regenerate(): void {
        this.playGenre(this.currentGenre.id)
    }
    
    /**
     * Stop playback
     */
    public stop(): void {
        if (this.audioPlayer && this.isPlaying) {
            try {
                this.audioPlayer.stop(true)
            } catch (e) {}
            this.isPlaying = false
            this.setStatus("Stopped")
        }
    }
    
    /**
     * Increase BPM
     */
    public bpmUp(): void {
        this.currentBPM = Math.min(180, this.currentBPM + 5)
        this.updateBPMDisplay()
        log.d("BPM: " + this.currentBPM)
    }
    
    /**
     * Decrease BPM
     */
    public bpmDown(): void {
        this.currentBPM = Math.max(60, this.currentBPM - 5)
        this.updateBPMDisplay()
        log.d("BPM: " + this.currentBPM)
    }
    
    /**
     * Test connection (call from button to debug)
     */
    public testConnection(): void {
        log.d("========== CONNECTION TEST ==========")
        log.d("InternetModule: " + (this.internetModule ? "✓" : "✗"))
        log.d("RemoteMediaModule: " + (this.remoteMediaModule ? "✓" : "✗"))
        log.d("AudioPlayer: " + (this.audioPlayer ? "✓" : "✗"))
        log.d("Backend URL: " + this.backendUrl)
        log.d("Connected: " + this.isConnected)
        log.d("=====================================")
        
        if (!this.isConnected) {
            this.connect()
        } else {
            this.send("ping")
            this.setStatus("Ping sent...")
        }
    }
    
    // ==================== UI ====================
    
    private setStatus(msg: string): void {
        log.d("Status: " + msg)
        if (this.statusText) {
            try {
                this.statusText.text = msg
            } catch (e) {}
        }
        this.onStatusChangeEvent.invoke(msg)
    }
    
    private updateGenreDisplay(): void {
        if (this.genreText) {
            try {
                const prefix = this.isPlaying ? "♪ " : ""
                this.genreText.text = prefix + this.currentGenre.name
            } catch (e) {}
        }
    }
    
    private updateBPMDisplay(): void {
        if (this.bpmText) {
            try {
                this.bpmText.text = this.currentBPM + " BPM"
            } catch (e) {}
        }
    }
    
    private updateUI(status: string, genre: string, bpm: number): void {
        this.setStatus(status)
        if (this.genreText) {
            try { this.genreText.text = genre } catch (e) {}
        }
        if (this.bpmText) {
            try { this.bpmText.text = bpm + " BPM" } catch (e) {}
        }
    }
    
    // ==================== GETTERS ====================
    
    public getIsConnected(): boolean { return this.isConnected }
    public getIsPlaying(): boolean { return this.isPlaying }
    public getCurrentGenre(): Genre { return this.currentGenre }
    public getCurrentBPM(): number { return this.currentBPM }
    public getGenres(): Genre[] { return [...GENRES] }
}

