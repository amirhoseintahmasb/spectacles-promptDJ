# 🎛️ Button Mapping Guide - Your DJ_UI Setup

## Your Current Buttons → Script Mapping

Based on your buttons, here's how to configure each one:

---

## ✅ ESSENTIAL BUTTONS (Keep These)

### Control Buttons

| Your Button | Script to Use | Action Value | Controller Object |
|-------------|---------------|--------------|-------------------|
| **StartBtn** | `DJControlButton.ts` | `start` | `DJ_UI` (with PromptDJUI) |
| **StopBtn** | `DJControlButton.ts` | `stop` | `DJ_UI` (with PromptDJUI) |
| **Random** | `DJControlButton.ts` | `random` | `DJ_UI` (with PromptDJUI) |

**Setup:**
1. Add `DJControlButton.ts` script to each button
2. Add `Interactable` component (from SpectaclesInteractionKit)
3. In Inspector:
   - **UI Controller**: Drag `DJ_UI` object
   - **Action**: Select from dropdown (start, stop, random)

---

### Genre Buttons (Keep 4-6 Most Popular)

| Your Button | Script to Use | Genre Value | Controller Object |
|-------------|---------------|-------------|-------------------|
| **TechnoBtn** | `DJButton.ts` | `techno` | `DJ_UI` (with PromptDJUI) |
| **HouseBtn** | `DJButton.ts` | `house` | `DJ_UI` (with PromptDJUI) |
| **FunkBtn** | `DJButton.ts` | `funk` | `DJ_UI` (with PromptDJUI) |
| **JazzBtn** | `DJButton.ts` | `jazz` | `DJ_UI` (with PromptDJUI) |

**Optional (if you have space):**
- **DubstepBtn** → `DJButton.ts` → genre: `dubstep`
- **DnbBtn** → `DJButton.ts` → genre: `dnb`
- **HiphopBtn** → `DJButton.ts` → genre: `hiphop`
- **TrapBtn** → `DJButton.ts` → genre: `trap`

**Setup:**
1. Add `DJButton.ts` script to each genre button
2. Add `Interactable` component
3. In Inspector:
   - **UI Controller**: Drag `DJ_UI` object
   - **Genre**: Type genre name (techno, house, funk, etc.)

---

### Parameter Control Buttons

| Your Button | Script to Use | Action Value | Controller Object |
|-------------|---------------|--------------|-------------------|
| **UPBtn** (BPM Up) | `DJControlButton.ts` | `bpmUp` | `DJ_UI` (with PromptDJUI) |
| **DownBtn** (BPM Down) | `DJControlButton.ts` | `bpmDown` | `DJ_UI` (with PromptDJUI) |
| **NEXTSCALE** | `PromptDJButtons.ts` | `nextScale` | `PromptDJ_Manager` |
| **NEXTDRUM** | `PromptDJButtons.ts` | `nextDrumStyle` | `PromptDJ_Manager` |

**Setup:**
- **UPBtn/DownBtn**: Use `DJControlButton.ts` with action `bpmUp`/`bpmDown`
- **NEXTSCALE/NEXTDRUM**: Use `PromptDJButtons.ts` with actions `nextScale`/`nextDrumStyle`

---

## ⚠️ SLIDERS (Not Recommended for Spectacles)

### Why Sliders Don't Work Well on Spectacles:
- Hard to control with hand gestures
- No visual feedback
- Difficult to set precise values
- Better alternatives exist

| Your Slider | Recommendation | Alternative |
|-------------|----------------|-------------|
| **BPMSLIDER** | ❌ Remove | Use UPBtn/DownBtn (+5/-5 BPM) |
| **DENSITYSLIDER** | ❌ Remove | Use fixed density (0.6) or preset buttons |
| **VARIATIONSLIDER** | ❌ Remove | Use fixed variation (0.4) or preset buttons |

**Better Alternatives:**
- **BPM**: Use UPBtn/DownBtn buttons (increment by 5)
- **Density**: Set to fixed 0.6 (good default)
- **Variation**: Set to fixed 0.4 (good default)

---

## 🎯 RECOMMENDED SPECTACLES UI (Simplified)

### Option 1: Minimal (Best for Spectacles)
```
DJ_UI
├── StartBtn → DJControlButton (start)
├── StopBtn → DJControlButton (stop)
├── Random → DJControlButton (random)
├── TechnoBtn → DJButton (techno)
├── HouseBtn → DJButton (house)
├── FunkBtn → DJButton (funk)
├── JazzBtn → DJButton (jazz)
├── UPBtn → DJControlButton (bpmUp)
└── DownBtn → DJControlButton (bpmDown)
```

**Total: 9 buttons** - Easy to use, clear actions

---

### Option 2: Full Genre Set (If You Have Space)
```
DJ_UI
├── StartBtn → DJControlButton (start)
├── StopBtn → DJControlButton (stop)
├── Random → DJControlButton (random)
├── TechnoBtn → DJButton (techno)
├── HouseBtn → DJButton (house)
├── DubstepBtn → DJButton (dubstep)
├── DnbBtn → DJButton (dnb)
├── FunkBtn → DJButton (funk)
├── JazzBtn → DJButton (jazz)
├── HiphopBtn → DJButton (hiphop)
├── TrapBtn → DJButton (trap)
├── UPBtn → DJControlButton (bpmUp)
├── DownBtn → DJControlButton (bpmDown)
├── NEXTSCALE → PromptDJButtons (nextScale)
└── NEXTDRUM → PromptDJButtons (nextDrumStyle)
```

**Total: 15 buttons** - More options, but still manageable

---

## 📋 Step-by-Step Setup

### Step 1: Setup DJ_UI Object

1. Select `DJ_UI` SceneObject
2. Add script: `PromptDJUI.ts`
3. In Inspector:
   - **Controller Object**: Drag `PromptDJ_Manager` object
   - **Status Text**: Drag your status text component
   - **Now Playing Text**: Drag your now playing text component

### Step 2: Setup Control Buttons

For **StartBtn**, **StopBtn**, **Random**:

1. Select button SceneObject
2. Add script: `DJControlButton.ts`
3. Add component: `Interactable` (from SpectaclesInteractionKit)
4. In Inspector:
   - **UI Controller**: Drag `DJ_UI` object
   - **Action**: Select from dropdown:
     - StartBtn → `start`
     - StopBtn → `stop`
     - Random → `random`

### Step 3: Setup Genre Buttons

For **TechnoBtn**, **HouseBtn**, **FunkBtn**, **JazzBtn**, etc.:

1. Select button SceneObject
2. Add script: `DJButton.ts`
3. Add component: `Interactable`
4. In Inspector:
   - **UI Controller**: Drag `DJ_UI` object
   - **Genre**: Type genre name:
     - TechnoBtn → `techno`
     - HouseBtn → `house`
     - DubstepBtn → `dubstep`
     - DnbBtn → `dnb`
     - FunkBtn → `funk`
     - JazzBtn → `jazz`
     - HiphopBtn → `hiphop`
     - TrapBtn → `trap`

### Step 4: Setup Parameter Buttons

For **UPBtn**, **DownBtn**:

1. Select button SceneObject
2. Add script: `DJControlButton.ts`
3. Add component: `Interactable`
4. In Inspector:
   - **UI Controller**: Drag `DJ_UI` object
   - **Action**: 
     - UPBtn → `bpmUp`
     - DownBtn → `bpmDown`

For **NEXTSCALE**, **NEXTDRUM**:

1. Select button SceneObject
2. Add script: `PromptDJButtons.ts`
3. Add component: `Interactable`
4. In Inspector:
   - **Controller Object**: Drag `PromptDJ_Manager` object
   - **Action**:
     - NEXTSCALE → `nextScale`
     - NEXTDRUM → `nextDrumStyle`

### Step 5: Remove Sliders

**Delete or disable:**
- BPMSLIDER
- DENSITYSLIDER
- VARIATIONSLIDER

These don't work well on Spectacles. Use buttons instead.

---

## 🎯 What Works Best on Spectacles

### ✅ Good for Spectacles:
- **Large, clear buttons** - Easy to pinch/select
- **Genre buttons** - One-tap genre selection
- **Simple controls** - Start, Stop, Random
- **BPM +/- buttons** - Increment by 5 BPM
- **Cycle buttons** - Next Scale, Next Drum Style

### ❌ Not Good for Spectacles:
- **Sliders** - Hard to control precisely
- **Too many buttons** - Overwhelming (keep under 12)
- **Small buttons** - Hard to select
- **Complex gestures** - Keep it simple

---

## 💡 Recommended Button Layout

### Minimal Setup (9 buttons):
```
┌─────────┬─────────┬─────────┐
│  Start  │  Stop   │ Random  │
├─────────┼─────────┼─────────┤
│ Techno  │  House  │  Funk   │
├─────────┼─────────┼─────────┤
│  Jazz   │  BPM+   │  BPM-   │
└─────────┴─────────┴─────────┘
```

### Full Setup (12 buttons):
```
┌─────────┬─────────┬─────────┐
│  Start  │  Stop   │ Random  │
├─────────┼─────────┼─────────┤
│ Techno  │  House  │ Dubstep │
├─────────┼─────────┼─────────┤
│   DNB   │  Funk   │  Jazz   │
├─────────┼─────────┼─────────┤
│  BPM+   │  BPM-   │ Scale→  │
└─────────┴─────────┴─────────┘
```

---

## 🔧 Quick Reference

### Button → Script Mapping:

| Button Type | Script | Action/Genre |
|-------------|--------|--------------|
| StartBtn | `DJControlButton.ts` | `start` |
| StopBtn | `DJControlButton.ts` | `stop` |
| Random | `DJControlButton.ts` | `random` |
| Any GenreBtn | `DJButton.ts` | `techno`, `house`, `funk`, etc. |
| UPBtn | `DJControlButton.ts` | `bpmUp` |
| DownBtn | `DJControlButton.ts` | `bpmDown` |
| NEXTSCALE | `PromptDJButtons.ts` | `nextScale` |
| NEXTDRUM | `PromptDJButtons.ts` | `nextDrumStyle` |
| BPMSLIDER | ❌ **Remove** | Use buttons instead |
| DENSITYSLIDER | ❌ **Remove** | Use fixed 0.6 |
| VARIATIONSLIDER | ❌ **Remove** | Use fixed 0.4 |

---

## ✅ Final Checklist

- [ ] DJ_UI has `PromptDJUI.ts` script
- [ ] PromptDJ_Manager has `PromptDJController.ts` script
- [ ] All buttons have `Interactable` component
- [ ] Control buttons use `DJControlButton.ts`
- [ ] Genre buttons use `DJButton.ts`
- [ ] Parameter buttons use `PromptDJButtons.ts` or `DJControlButton.ts`
- [ ] Sliders removed (BPMSLIDER, DENSITYSLIDER, VARIATIONSLIDER)
- [ ] All buttons connected to correct controller objects
- [ ] Actions/genres set correctly in Inspector

---

*Optimized for Snap Spectacles - Simple, clear, easy to use!* 🕶️

