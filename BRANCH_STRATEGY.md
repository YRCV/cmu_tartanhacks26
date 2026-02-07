# Branch Strategy & Team Workflow

## Project: Dedalus Labs SDK
**TartanHacks26 @ CMU - NJIT Team**

## Overview

Your team is building an **AI-powered firmware generation system** that uses intelligent LLM routing to create ESP32 firmware from natural language descriptions. You're using a smart parallel development strategy:

### Backend Team (Agent Pipeline Integration)
**Branch**: `agent-pipeline-integration`
**Focus**: Core functionality - making it work

### Frontend Team (UI Shell)
**Branch**: `feature/ui-shell`
**Focus**: User experience - making it beautiful

---

## Current Branch Status

### `agent-pipeline-integration` (Production/Demo)
✅ **Working Features:**
- AsyncDedalus SDK with intelligent LLM routing
- Firmware generation pipeline (`test_dir/firmware_pipeline.py`)
- ESP32 AI integration (`firmware/src/ai.cpp`)
- Continuous web server on ESP32
- OTA update conflict resolution
- Basic mobile app (2 screens, LED control)

**Purpose**: Demonstrate working AI firmware generation
**Demo Ready**: Yes
**Mobile App**: Minimal but functional

### `feature/ui-shell` (UI Development)
✅ **Polished Features:**
- 5 complete screen flows
- 12+ custom UI components (glassmorphism, neumorphism)
- Mock data system for testing
- NativeWind/TailwindCSS styling
- Jest + Maestro testing setup
- Modern iOS dark mode design
- Voice input support (native build)

**Purpose**: UI/UX prototyping and design iteration
**Demo Ready**: Yes (with mock data)
**Mobile App**: Feature-rich, beautiful, mock-driven

---

## After Rebase: What Changed

### ✅ Successfully Merged
- Backend AI pipeline code → UI Shell branch
- ESP32 firmware with AI integration
- Python Dedalus SDK
- Updated README (Dedalus Labs description)
- Git configuration updates

### ✅ Preserved in UI Shell
- All custom UI components
- All 5 screens
- Styling system (NativeWind)
- Testing infrastructure
- Documentation

### ✨ New Additions to UI Shell
- **DevModeBanner**: Visual indicator when using mock data
- **UI_SHELL_README.md**: Complete documentation of UI shell purpose
- **INTEGRATION_STRATEGY.md**: Step-by-step integration guide
- **.env**: Configured for UI development mode

---

## Recommended Workflow

### For UI Development (You)
```bash
# Stay on feature/ui-shell
git checkout feature/ui-shell

# Run the app with mock data
cd mobile/esp32controller
npx expo start

# Make UI changes, test with mocks
# Commit UI improvements
git add .
git commit -m "feat: improve control screen layout"
git push origin feature/ui-shell
```

**Key Points:**
- ✅ Keep `EXPO_PUBLIC_MOCK_DEVICE=true` in `.env`
- ✅ DevModeBanner will show you're in mock mode
- ✅ All screens work with hardcoded data
- ✅ Focus on polish, animations, user flows
- ✅ Don't worry about backend integration yet

### For Backend Development (Partner)
```bash
# Stay on agent-pipeline-integration
git checkout agent-pipeline-integration

# Test firmware generation
cd test_dir
python firmware_pipeline.py

# Test ESP32 firmware
cd ../firmware
# Upload and test

# Commit backend improvements
git add .
git commit -m "fix: improve AI validation logic"
git push origin agent-pipeline-integration
```

**Key Points:**
- ✅ Focus on AI pipeline reliability
- ✅ Improve firmware generation quality
- ✅ Test ESP32 integration
- ✅ Basic mobile app is sufficient for demo

### Sync Points

#### Weekly (or as needed)
1. **UI → Backend**: Share design updates
   - Screenshots of new UI
   - User flow videos
   - Component documentation

2. **Backend → UI**: Share API updates
   - New endpoints
   - Response formats
   - WebSocket events

3. **Rebase** (when backend has breaking changes):
   ```bash
   # On feature/ui-shell
   git fetch origin
   git rebase origin/agent-pipeline-integration
   # Resolve conflicts (keep UI work)
   git push origin feature/ui-shell --force-with-lease
   ```

---

## Integration Timeline

### Phase 1: Now - Demo Day ✅
**Status**: Parallel development
- Backend: Focus on working demo
- Frontend: Focus on polished UI
- **No integration needed**
- Both branches demo independently

### Phase 2: Post-Demo 🔄
**Status**: Define contracts
- Document API endpoints
- Define WebSocket protocol
- Agree on data formats
- Create integration checklist

### Phase 3: Integration 🔌
**Status**: Connect the pieces
- Set up backend API service
- Build mobile client layer
- Add mock/real toggle
- Test end-to-end flow
- See `INTEGRATION_STRATEGY.md` for details

---

## For Demo Day

### Option 1: Dual Demo (Recommended)
**Backend Demo** (`agent-pipeline-integration`):
1. Show firmware generation pipeline
2. Generate ESP32 code from natural language
3. Deploy to ESP32 and test
4. Use basic mobile app for control

**Frontend Demo** (`feature/ui-shell`):
1. Show polished mobile UI
2. Walk through user flows
3. Demonstrate design system
4. Mention "this is the future UI"

**Narrative**: "We built both the brain (AI pipeline) and the face (mobile UI). Here's the working system, and here's how users will interact with it."

### Option 2: Backend-Only Demo
Show `agent-pipeline-integration`:
- Full working system
- Basic but functional UI
- Focus on AI capabilities

### Option 3: Frontend-Only Demo
Show `feature/ui-shell`:
- Beautiful UI with mocks
- Smooth user experience
- "Backend integration in progress"

---

## Git Hygiene

### Never Do This ❌
- Don't merge `feature/ui-shell` → `agent-pipeline-integration` (yet)
  - Would overwrite working backend with mocks
  - Creates confusion
  - Wait until integration phase

### Do This ✅
- Keep branches separate until integration phase
- Rebase UI shell when backend has critical updates
- Communicate before rebasing
- Use feature flags when integrating

---

## Efficiency Tips

### UI Development (Your Focus)

1. **Component Library**
   - Document each component's props
   - Create examples in code
   - Consider Storybook for showcase

2. **Mock Data Realism**
   - Use realistic firmware code samples
   - Simulate real timing (delays, loading)
   - Include error states

3. **Performance**
   - Test with many controls (10+)
   - Simulate rapid updates
   - Optimize animations

4. **Accessibility**
   - Test with VoiceOver
   - Check color contrast
   - Ensure touch targets are large enough

### Backend Development (Partner's Focus)

1. **API Design**
   - Document endpoints clearly
   - Use consistent response formats
   - Include error codes

2. **Firmware Quality**
   - Test generated code thoroughly
   - Add validation steps
   - Handle edge cases

3. **Performance**
   - Optimize LLM routing
   - Cache common patterns
   - Monitor generation time

---

## Files to Reference

### In UI Shell Branch
- **[UI_SHELL_README.md](mobile/esp32controller/UI_SHELL_README.md)**: Complete UI shell documentation
- **[INTEGRATION_STRATEGY.md](mobile/esp32controller/INTEGRATION_STRATEGY.md)**: How to integrate UI with backend
- **[.env](mobile/esp32controller/.env)**: Environment configuration
- **[DevModeBanner.tsx](mobile/esp32controller/src/components/ui/DevModeBanner.tsx)**: Mock mode indicator

### In Backend Branch
- **[README.md](README.md)**: Dedalus SDK overview
- **[firmware_pipeline.py](test_dir/firmware_pipeline.py)**: Generation pipeline
- **[ai.cpp](firmware/src/ai.cpp)**: ESP32 AI integration

---

## Quick Reference

### I want to...

**...work on UI design**
→ Stay on `feature/ui-shell`, keep mock mode on

**...test AI generation**
→ Switch to `agent-pipeline-integration`, run Python pipeline

**...sync UI with latest backend**
→ Rebase `feature/ui-shell` onto `agent-pipeline-integration`

**...prepare for integration**
→ Read `INTEGRATION_STRATEGY.md`

**...demo the project**
→ Show both branches, or choose one based on audience

**...check if I'm in mock mode**
→ Look for "DEV MODE" banner at top of app

---

## Summary

Your setup is **excellent** for parallel development:

✅ **Backend team** can iterate on AI quality without UI concerns
✅ **Frontend team** can polish UX without backend dependency
✅ **Both branches** are demo-ready independently
✅ **Integration path** is well-documented
✅ **Rebase successful** - UI shell has latest backend code

**Keep this strategy!** It's efficient, reduces merge conflicts, and lets each team move fast.

---

## Questions?

- UI not loading? Check `.env` has `EXPO_PUBLIC_MOCK_DEVICE=true`
- Missing DevModeBanner? Make sure you imported it in screens
- Backend changes needed in UI shell? Rebase from `agent-pipeline-integration`
- Ready to integrate? Start with Phase 1 in `INTEGRATION_STRATEGY.md`

Good luck at TartanHacks26! 🚀
