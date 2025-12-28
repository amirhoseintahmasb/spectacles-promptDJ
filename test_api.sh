#!/bin/bash
# PromptDJ API Test Script
# ========================
# Run this to test all API endpoints and generate MIDI files

set -e

API_URL="${1:-http://127.0.0.1:8123}"
OUTPUT_DIR="./exports"

mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🎵 PROMPTDJ API TEST SUITE                         ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  API URL: $API_URL"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check API health
echo "🔍 Checking API health..."
HEALTH=$(curl -s "$API_URL/api" 2>/dev/null)
if [ -z "$HEALTH" ]; then
    echo "❌ API not responding at $API_URL"
    echo "   Start the server with: ./start.sh"
    exit 1
fi
echo "✅ API is running!"
echo ""

# ============================================
# MELODY GENERATION TESTS
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎹 MELODY GENERATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1: Basic melody
echo -n "  [1/4] C Major, 120 BPM, 8 bars... "
curl -X POST "$API_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{"tempo_bpm":120,"bars":8,"scale":"C_major","density":0.6,"variation":0.35}' \
  --output melody_01_c_major.mid --silent
echo "✅"

# Test 2: Chill melody
echo -n "  [2/4] A Minor, 85 BPM, 16 bars (chill)... "
curl -X POST "$API_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{"tempo_bpm":85,"bars":16,"scale":"A_minor","density":0.35,"variation":0.2}' \
  --output melody_02_a_minor_chill.mid --silent
echo "✅"

# Test 3: Energetic melody
echo -n "  [3/4] D Minor, 140 BPM, 8 bars (energetic)... "
curl -X POST "$API_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{"tempo_bpm":140,"bars":8,"scale":"D_minor","density":0.8,"variation":0.5}' \
  --output melody_03_d_minor_energetic.mid --silent
echo "✅"

# Test 4: With seed (reproducible)
echo -n "  [4/4] G Major, 110 BPM, seed=42 (reproducible)... "
curl -X POST "$API_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{"tempo_bpm":110,"bars":8,"scale":"G_major","density":0.55,"variation":0.3,"seed":42}' \
  --output melody_04_g_major_seed42.mid --silent
echo "✅"

echo ""

# ============================================
# DRUM GENERATION TESTS
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🥁 DRUM GENERATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1: Basic drums
echo -n "  [1/5] Basic, 120 BPM... "
curl -X POST "$API_URL/drums" \
  -H "Content-Type: application/json" \
  -d '{"tempo_bpm":120,"bars":4,"style":"basic","swing":0}' \
  --output drums_01_basic.mid --silent
echo "✅"

# Test 2: Funk drums
echo -n "  [2/5] Funk, 100 BPM, swing 0.25... "
curl -X POST "$API_URL/drums" \
  -H "Content-Type: application/json" \
  -d '{"tempo_bpm":100,"bars":4,"style":"funk","swing":0.25}' \
  --output drums_02_funk.mid --silent
echo "✅"

# Test 3: Jazz drums
echo -n "  [3/5] Jazz, 110 BPM, swing 0.3... "
curl -X POST "$API_URL/drums" \
  -H "Content-Type: application/json" \
  -d '{"tempo_bpm":110,"bars":8,"style":"jazz","swing":0.3}' \
  --output drums_03_jazz.mid --silent
echo "✅"

# Test 4: Electronic drums
echo -n "  [4/5] Electronic, 128 BPM... "
curl -X POST "$API_URL/drums" \
  -H "Content-Type: application/json" \
  -d '{"tempo_bpm":128,"bars":8,"style":"electronic","swing":0}' \
  --output drums_04_electronic.mid --silent
echo "✅"

# Test 5: Techno drums
echo -n "  [5/5] Techno, 130 BPM... "
curl -X POST "$API_URL/drums" \
  -H "Content-Type: application/json" \
  -d '{"tempo_bpm":130,"bars":8,"style":"techno","swing":0.1}' \
  --output drums_05_techno.mid --silent
echo "✅"

echo ""

# ============================================
# SUMMARY
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 GENERATED FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lh *.mid 2>/dev/null || echo "No files generated"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 FILES LOCATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$(pwd)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎵 NEXT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Open Finder: open $(pwd)"
echo "2. Drag .mid files into Ableton Live"
echo "3. Add instruments to hear the music!"
echo ""

