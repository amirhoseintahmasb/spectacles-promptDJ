# 🎛️ Button Setup Guide - Which Button Goes to Which Controller

This guide explains which button scripts connect to which controllers in your Lens Studio project.

---

## 📋 Architecture Overview

There are **two main architectures** you can use:

1. **Direct Controller Architecture** - Buttons connect directly to `PromptDJController`
2. **UI Manager Architecture** - Buttons connect to `PromptDJUI`, which manages `PromptDJController`

---

## 🎯 Architecture 1: Direct Controller (Simple Setup)

**Use this for:** Basic music generation controls (melody, drums, tempo, scales)

### Controller Setup

```
PromptDJ_Manager (SceneObject)
└── Script: PromptDJController.ts
    ├── Internet Module (Asset)
    ├── Remote Media Module (Asset)
    ├── Audio Player (AudioComponent)
    └── Backend URL: ws://YOUR_IP:8123/ws/spectacles/
```

### Button Setup

All buttons use **`PromptDJButtons.ts`** and connect to **`PromptDJ_Manager`**

| Button Name | Script | Controller Object | Action Value |
|-------------|--------|-------------------|--------------|
| **MelodyButton** | `PromptDJButtons.ts` | `PromptDJ_Manager` | `melody` |
| **DrumsButton** | `PromptDJButtons.ts` | `PromptDJ_Manager` | `drums` |
| **BothButton** | `PromptDJButtons.ts` | `PromptDJ_Manager` | `both` |
| **TempoUpButton** | `PromptDJButtons.ts` | `PromptDJ_Manager` | `tempoUp` |
| **TempoDownButton** | `PromptDJButtons.ts` | `PromptDJ_Manager` | `tempoDown` |
| **NextScaleButton** | `PromptDJButtons.ts` | `PromptDJ_Manager` | `nextScale` |
| **PrevScaleButton** | `PromptDJButtons.ts` | `PromptDJ_Manager` | `prevScale` |
| **NextDrumStyleButton** | `PromptDJButtons.ts` | `PromptDJ_Manager` | `nextDrumStyle` |
| **StopButton** | `PromptDJButtons.ts` | `PromptDJ_Manager` | `stop` |
| **PingButton** | `PromptDJButtons.ts` | `PromptDJ_Manager` | `ping` |

### Configuration Steps

1. **For each button:**
   - Add `PromptDJButtons.ts` script to the button SceneObject
   - Add `Interactable` component to the button (from SpectaclesInteractionKit)
   - In Inspector:
     - **Controller Object**: Drag `PromptDJ_Manager` object
     - **Action**: Select from dropdown (melody, drums, both, etc.)

2. **Note:** If you don't link Controller Object, buttons will use `global.promptDJController` automatically.

---

## 🎨 Architecture 2: UI Manager (Genre-Based Setup)

**Use this for:** Genre-based DJ interface with multiple genre buttons

### Controller Setup

```
PromptDJ_Manager (SceneObject)
└── Script: PromptDJController.ts
    ├── Internet Module (Asset)
    ├── Remote Media Module (Asset)
    ├── Audio Player (AudioComponent)
    └── Backend URL: ws://YOUR_IP:8123/ws/spectacles/

UI_Manager (SceneObject)  ← Optional, for genre management
└── Script: PromptDJUI.ts
    └── Controller Object: PromptDJ_Manager
```

### Button Setup

#### A. Genre Buttons (use `DJButton.ts`)

| Button Name | Script | UI Controller Object | Genre Value |
|-------------|--------|----------------------|-------------|
| **TechnoButton** | `DJButton.ts` | `UI_Manager` | `techno` |
| **HouseButton** | `DJButton.ts` | `UI_Manager` | `house` |
| **FunkButton** | `DJButton.ts` | `UI_Manager` | `funk` |
| **JazzButton** | `DJButton.ts` | `UI_Manager` | `jazz` |
| **HipHopButton** | `DJButton.ts` | `UI_Manager` | `hiphop` |
| **TrapButton** | `DJButton.ts` | `UI_Manager` | `trap` |
| **LatinButton** | `DJButton.ts` | `UI_Manager` | `latin` |
| **ReggaeButton** | `DJButton.ts` | `UI_Manager` | `reggae` |
| **ElectronicButton** | `DJButton.ts` | `UI_Manager` | `electronic` |
| **ChillButton** | `DJButton.ts` | `UI_Manager` | `chillwave` |
| **DubstepButton** | `DJButton.ts` | `UI_Manager` | `dubstep` |
| **DNBButton** | `DJButton.ts` | `UI_Manager` | `dnb` |

**Configuration:**
- Add `DJButton.ts` script to button
- Add `Interactable` component
- In Inspector:
  - **UI Controller**: Drag `UI_Manager` object (or leave empty to use global)
  - **Genre**: Set genre name (techno, house, funk, etc.)

#### B. Control Buttons (use `DJControlButton.ts`)

| Button Name | Script | UI Controller Object | Action Value |
|-------------|--------|----------------------|--------------|
| **StartButton** | `DJControlButton.ts` | `UI_Manager` | `start` |
| **StopButton** | `DJControlButton.ts` | `UI_Manager` | `stop` |
| **RandomButton** | `DJControlButton.ts` | `UI_Manager` | `random` |
| **NextButton** | `DJControlButton.ts` | `UI_Manager` | `next` |
| **PreviousButton** | `DJControlButton.ts` | `UI_Manager` | `previous` |
| **RegenerateButton** | `DJControlButton.ts` | `UI_Manager` | `regenerate` |

**Configuration:**
- Add `DJControlButton.ts` script to button
- Add `Interactable` component
- In Inspector:
  - **UI Controller**: Drag `UI_Manager` object (or leave empty to use global)
  - **Action**: Select from dropdown (start, stop, random, next, previous, regenerate)

#### C. Genre-Specific Buttons (use `PromptDJGenreButton.ts`)

| Button Name | Script | Controller Object | Genre | Scale | Tempo |
|-------------|--------|-------------------|-------|-------|-------|
| **TechnoGenreButton** | `PromptDJGenreButton.ts` | `PromptDJ_Manager` | `techno` | `C_minor` | `128` |
| **FunkGenreButton** | `PromptDJGenreButton.ts` | `PromptDJ_Manager` | `funk` | `E_minor` | `110` |
| **JazzGenreButton** | `PromptDJGenreButton.ts` | `PromptDJ_Manager` | `jazz` | `G_major` | `120` |

**Configuration:**
- Add `PromptDJGenreButton.ts` script to button
- Add `Interactable` component
- In Inspector:
  - **Controller Object**: Drag `PromptDJ_Manager` object
  - **Genre**: Set genre name
  - **Scale**: Set scale (C_major, A_minor, etc.)
  - **Tempo**: Set BPM (60-180)
  - **Density**: Set note density (0.0-1.0)

---

## 🔄 Global Controller Access

**All scripts support global access** - if you don't link a controller object, they will automatically find:
- `global.promptDJController` - Main controller
- `global.promptDJUI` - UI manager (if using UI architecture)

This means **Controller Object is optional** in most cases!

---

## 📊 Quick Reference Table

| Button Script | Connects To | Use Case |
|---------------|-------------|----------|
| `PromptDJButtons.ts` | `PromptDJController` | Basic controls (melody, drums, tempo) |
| `DJButton.ts` | `PromptDJUI` | Genre selection buttons |
| `DJControlButton.ts` | `PromptDJUI` or `PromptDJController` | Start/Stop/Random controls |
| `PromptDJGenreButton.ts` | `PromptDJController` | Genre buttons with custom params |

---

## 🎯 Recommended Setup

### For Simple Interface:
```
✅ Use Architecture 1 (Direct Controller)
- PromptDJButtons.ts for all buttons
- Connect to PromptDJ_Manager
- Simple and straightforward
```

### For Genre-Based DJ Interface:
```
✅ Use Architecture 2 (UI Manager)
- DJButton.ts for genre buttons
- DJControlButton.ts for controls
- PromptDJUI.ts manages everything
- More organized for multiple genres
```

---

## ⚠️ Important Notes

1. **All buttons require `Interactable` component** from SpectaclesInteractionKit
2. **Controller Object is optional** - scripts will use global if not linked
3. **PromptDJController must be set up first** - it registers globally on startup
4. **PromptDJUI is optional** - only needed for genre-based interface

---

## 🔍 Troubleshooting

### Button not working?
- ✅ Check that `Interactable` component is added
- ✅ Check that Controller Object is linked (or global is available)
- ✅ Check Logger panel for error messages
- ✅ Verify action/genre value is correct

### Controller not found?
- ✅ Make sure `PromptDJController` is on a SceneObject
- ✅ Check that it has InternetModule and RemoteMediaModule connected
- ✅ Look for "Registered globally" message in logs

---

*Last updated: Based on TypeScript refactor with global controller registration*

