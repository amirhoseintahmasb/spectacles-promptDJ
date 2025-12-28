# 🎵 PromptDJ API Reference

## Base URL

```
Local:  http://127.0.0.1:8123
```

---

## Endpoints

### GET `/`
Returns the PromptDJ Web UI.

### GET `/api`
Health check and API info.

**Response:**
```json
{
  "service": "PromptDJ - AI Music Generator",
  "version": "1.0.0",
  "status": "running",
  "spectacles_ready": true,
  "endpoints": [...]
}
```

---

### POST `/generate`
Generate a melody MIDI file.

**Request Body:**
```json
{
  "tempo_bpm": 120,        // 60-180, default: 120
  "bars": 8,               // 2-32, default: 8
  "seed": null,            // optional, for reproducibility
  "scale": "C_major",      // see scales below
  "density": 0.55,         // 0.0-1.0, note frequency
  "variation": 0.35,       // 0.0-1.0, melodic wildness
  "octave_range": 2        // 1-4, octave span
}
```

**Available Scales:**
- `C_major`, `C_minor`
- `D_major`, `D_minor`
- `E_minor`
- `F_major`
- `G_major`
- `A_major`, `A_minor`
- `B_minor`

**Response:** MIDI file download

**curl Example:**
```bash
curl -X POST "http://127.0.0.1:8123/generate" \
  -H "Content-Type: application/json" \
  -d '{"tempo_bpm":120,"bars":8,"scale":"C_major","density":0.6}' \
  --output melody.mid
```

---

### POST `/drums`
Generate a drum pattern MIDI file.

**Request Body:**
```json
{
  "tempo_bpm": 120,        // 60-180, default: 120
  "bars": 4,               // 2-32, default: 4
  "seed": null,            // optional, for reproducibility
  "style": "basic",        // see styles below
  "swing": 0.0             // 0.0-0.5, swing amount
}
```

**Available Styles:**
- `basic` - Simple rock beat
- `funk` - Syncopated funk groove
- `jazz` - Swing ride pattern
- `electronic` - Four-on-the-floor EDM
- `techno` - Driving techno beat

**Response:** MIDI file download

**curl Example:**
```bash
curl -X POST "http://127.0.0.1:8123/drums" \
  -H "Content-Type: application/json" \
  -d '{"tempo_bpm":128,"bars":8,"style":"techno","swing":0.1}' \
  --output drums.mid
```

---

### POST `/continue`
Upload a MIDI file and get an extended version.

**Request:** `multipart/form-data` with file

**curl Example:**
```bash
curl -X POST "http://127.0.0.1:8123/continue" \
  -F "file=@input.mid" \
  --output continued.mid
```

---

### POST `/style`
Apply humanization/style transformation to uploaded MIDI.

**Query Parameters:**
- `humanize` (float, 0-1): Timing variation
- `velocity_variation` (float, 0-1): Velocity variation
- `swing` (float, 0-0.5): Swing amount

**curl Example:**
```bash
curl -X POST "http://127.0.0.1:8123/style?humanize=0.3&velocity_variation=0.2&swing=0.15" \
  -F "file=@input.mid" \
  --output humanized.mid
```

---

## Complete curl Examples

### Generate Chill Lo-Fi Melody
```bash
curl -X POST "http://127.0.0.1:8123/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "tempo_bpm": 85,
    "bars": 16,
    "scale": "A_minor",
    "density": 0.35,
    "variation": 0.2
  }' \
  --output lofi_melody.mid
```

### Generate Energetic Techno
```bash
# Melody
curl -X POST "http://127.0.0.1:8123/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "tempo_bpm": 130,
    "bars": 8,
    "scale": "D_minor",
    "density": 0.7,
    "variation": 0.4
  }' \
  --output techno_melody.mid

# Drums
curl -X POST "http://127.0.0.1:8123/drums" \
  -H "Content-Type: application/json" \
  -d '{
    "tempo_bpm": 130,
    "bars": 8,
    "style": "techno",
    "swing": 0.05
  }' \
  --output techno_drums.mid
```

### Generate Jazz Combo
```bash
# Melody
curl -X POST "http://127.0.0.1:8123/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "tempo_bpm": 110,
    "bars": 12,
    "scale": "D_minor",
    "density": 0.5,
    "variation": 0.45
  }' \
  --output jazz_melody.mid

# Drums
curl -X POST "http://127.0.0.1:8123/drums" \
  -H "Content-Type: application/json" \
  -d '{
    "tempo_bpm": 110,
    "bars": 12,
    "style": "jazz",
    "swing": 0.35
  }' \
  --output jazz_drums.mid
```

---

## Using with Python

```python
import requests

# Generate melody
response = requests.post(
    "http://127.0.0.1:8123/generate",
    json={
        "tempo_bpm": 120,
        "bars": 8,
        "scale": "C_major",
        "density": 0.6
    }
)

with open("melody.mid", "wb") as f:
    f.write(response.content)
```

---

## Using with JavaScript/Fetch

```javascript
async function generateMelody() {
    const response = await fetch("http://127.0.0.1:8123/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            tempo_bpm: 120,
            bars: 8,
            scale: "C_major",
            density: 0.6
        })
    });
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    // Download
    const a = document.createElement("a");
    a.href = url;
    a.download = "melody.mid";
    a.click();
}
```

---

## Interactive API Docs

Visit: **http://127.0.0.1:8123/docs**

This provides a Swagger UI where you can test all endpoints interactively!

