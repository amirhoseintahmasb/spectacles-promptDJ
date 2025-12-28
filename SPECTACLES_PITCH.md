# 🕶️ PromptDJ for Snap Spectacles

## Vision: AI Music Generation in Augmented Reality

**PromptDJ** brings AI-powered music creation to Snap Spectacles (2024), enabling users to generate, mix, and manipulate MIDI music through intuitive AR gestures and voice commands.

---

## 🎯 Concept

Imagine standing in your living room, raising your hands, and conducting an AI orchestra. With PromptDJ on Spectacles:

- **Gesture controls** adjust tempo, density, and variation
- **Voice commands** select scales and styles ("Give me a funky beat in D minor")
- **Spatial UI** displays floating DJ controls in your environment
- **Real-time visualization** shows music as 3D waveforms around you

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SPECTACLES (AR GLASSES)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Hand       │  │   Voice     │  │   Spatial UI            │  │
│  │  Tracking   │  │   Commands  │  │   (Lens Studio)         │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                │
│         └────────────────┼──────────────────────┘                │
│                          │                                       │
│                    ┌─────▼─────┐                                 │
│                    │  Lens     │                                 │
│                    │  Script   │                                 │
│                    └─────┬─────┘                                 │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTP/WebSocket
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    PROMPTDJ BACKEND (Mac/Cloud)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │
│  │  FastAPI    │  │   MIDI      │  │   AI Generation         │   │
│  │  Server     │  │   Engine    │  │   (Algorithmic/ML)      │   │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    OUTPUT                                         │
│  • MIDI files → DAW (Ableton/Logic)                              │
│  • Real-time audio → Bluetooth speakers                          │
│  • Shared sessions → Collaborative music creation                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎮 Interaction Design

### Hand Gestures (Spectacles Interaction Kit)

| Gesture | Action |
|---------|--------|
| **Pinch + Drag Up/Down** | Adjust tempo (60-180 BPM) |
| **Two-hand spread** | Increase note density |
| **Circular motion** | Add swing/groove |
| **Fist close** | Generate new pattern |
| **Palm open** | Stop/pause |
| **Point at UI element** | Select scale/style |

### Voice Commands (Spectacles Voice API)

```
"Hey Spectacles, generate a melody"
"Make it funkier"
"Switch to A minor"
"Add drums"
"Faster tempo"
"Export to Ableton"
```

### Spatial UI Elements

```
     ┌─────────────────────────────────────┐
     │           PROMPTDJ                   │
     │    ┌───────────────────────┐        │
     │    │  ◉ 120 BPM            │        │
     │    │  ════════●════════    │        │
     │    └───────────────────────┘        │
     │                                      │
     │   ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
     │   │ C  │ │ Am │ │ Dm │ │ G  │       │
     │   └────┘ └────┘ └────┘ └────┘       │
     │                                      │
     │   [ 🎹 MELODY ]  [ 🥁 DRUMS ]        │
     │                                      │
     │        ╔═══════════════╗            │
     │        ║   GENERATE    ║            │
     │        ╚═══════════════╝            │
     └─────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Lens Studio Project Structure

```
PromptDJ.lsproj/
├── Scripts/
│   ├── PromptDJController.js    # Main logic
│   ├── GestureHandler.js        # Hand tracking
│   ├── VoiceHandler.js          # Voice commands
│   ├── APIClient.js             # Backend communication
│   └── Visualizer.js            # 3D audio visualization
├── Objects/
│   ├── UI_Panel.prefab          # Floating control panel
│   ├── Sliders.prefab           # AR sliders
│   └── Visualizer.prefab        # 3D waveform
└── Resources/
    └── Materials/
```

### Sample Lens Script (TypeScript)

```typescript
// PromptDJController.ts - Spectacles Lens Script

@component
export class PromptDJController extends BaseScriptComponent {
    
    @input backendUrl: string = "http://192.168.1.x:8123";
    
    private tempo: number = 120;
    private scale: string = "C_major";
    private density: number = 0.55;
    
    onAwake() {
        // Initialize hand tracking
        this.setupGestureRecognition();
        
        // Initialize voice commands
        this.setupVoiceCommands();
        
        // Setup UI
        this.initializeUI();
    }
    
    async generateMelody() {
        const request = new Request(
            `${this.backendUrl}/generate`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tempo_bpm: this.tempo,
                    bars: 8,
                    scale: this.scale,
                    density: this.density
                })
            }
        );
        
        const response = await fetch(request);
        // Handle MIDI response
        this.onMidiGenerated(response);
    }
    
    onPinchGesture(delta: vec3) {
        // Adjust tempo based on vertical movement
        this.tempo = Math.clamp(
            this.tempo + delta.y * 2,
            60, 180
        );
        this.updateTempoUI();
    }
    
    onVoiceCommand(command: string) {
        if (command.includes("generate")) {
            this.generateMelody();
        } else if (command.includes("funky")) {
            this.density = 0.8;
            this.generateDrums("funk");
        }
        // ... more commands
    }
}
```

---

## 🚀 Development Roadmap

### Phase 1: Web Prototype ✅
- [x] FastAPI backend with MIDI generation
- [x] Web UI with DJ controls
- [x] REST API endpoints

### Phase 2: Spectacles Integration (Current)
- [ ] Create Lens Studio project
- [ ] Implement Spectacles Interaction Kit
- [ ] Add hand gesture controls
- [ ] Connect to backend via Remote Service Module

### Phase 3: Enhanced Features
- [ ] Voice command integration
- [ ] 3D audio visualization
- [ ] Real-time MIDI playback
- [ ] Multi-user collaboration (Sync Kit)

### Phase 4: Production
- [ ] Cloud deployment for backend
- [ ] Lens submission to Snapchat
- [ ] Performance optimization

---

## 📱 Spectacles SDK Features Used

| Feature | Purpose |
|---------|---------|
| **Spectacles Interaction Kit** | Hand tracking & gestures |
| **Spectacles UI Kit** | Floating AR interface |
| **Remote Service Module** | HTTP calls to backend |
| **Audio Component** | MIDI playback preview |
| **Sync Kit** | Multi-user jam sessions |
| **SnapML** | Future: On-device ML inference |

---

## 🎵 Use Cases

1. **Live Performance DJ** - Generate backing tracks in real-time during a set
2. **Music Producer** - Sketch ideas hands-free while walking
3. **Music Education** - Visualize music theory in 3D space
4. **Collaborative Jam** - Multiple Spectacles users creating music together
5. **Accessibility** - Hands-free music creation for musicians with disabilities

---

## 📚 Resources

- [Spectacles Developer Portal](https://developers.snap.com/spectacles/home)
- [Lens Studio Download](https://ar.snap.com/lens-studio)
- [Spectacles Interaction Kit](https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-interaction-kit)
- [Spectacles UI Kit](https://developers.snap.com/spectacles/spectacles-frameworks/spectacles-ui-kit)
- [Remote Service Module](https://developers.snap.com/spectacles/spectacles-features/apis/remote-service-module)

---

## 💡 Why Spectacles?

1. **Immersive Creation** - Music creation becomes a spatial, physical experience
2. **Hands-Free** - Perfect for musicians already holding instruments
3. **Social** - Share your AR music session with friends
4. **Portable** - Create anywhere, not just at a desk
5. **Future-Ready** - First-mover advantage in AR music tools

---

## 🏆 Pitch Summary

> **PromptDJ transforms Snap Spectacles into an AI-powered music creation studio. Using hand gestures and voice commands, users generate professional MIDI compositions in augmented reality. The backend AI service runs locally or in the cloud, making it fast, private, and infinitely scalable.**

**Target Audience:** Musicians, producers, DJs, music educators, creative professionals

**Differentiation:** First AR-native AI music generator for Spectacles

**Monetization:** Premium features, cloud processing credits, collaboration tools

---

*Built with ❤️ for Snap Spectacles 2024*

