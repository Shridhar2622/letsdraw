# LetsDraw (Doodle-Dash) - Project Context & Change Log

This file maintains a running log of application context, architecture decisions, and code modifications to ensure continuous project knowledge.

---

## 📌 Project Overview & Stack
- **Application Name:** LetsDraw / Doodle-Dash
- **Type:** Real-time multiplayer drawing & guessing web app (Skribbl.io clone)
- **Frontend:** React (Vite), Tailwind CSS v4, HTML5 Canvas API, Socket.io-client, GSAP
- **Backend:** Node.js, Express, Socket.io, Prometheus metrics (`/metrics`)
- **DevOps:** Docker, Docker Compose, Jenkins, GitHub Actions CI, Prometheus & Grafana

---

## 📝 Change Log & Issue Resolutions

### 📅 Date: July 23, 2026

#### 🔴 Issues Reported:
1. **Drawing Overlap after Canvas Clearing:** When the drawer cleared the canvas and drew a new stroke, remote viewers would see the previous drawing re-appear and overlap with the new drawing.
2. **Color Inconsistency across Viewers:** Changing colors during drawing would sometimes fail to update for viewers or render in wrong colors.
3. **Backend Socket Permission Checks:** Fill canvas and Undo/Redo actions lacked socket validation checking if the sender is the active drawer.

#### 🔍 Root Cause Analysis:
- **Canvas Path Accumulator Bug:** In `frontend/src/components/CanvasBoard.jsx`, `handleDraw` (which processes incoming `draw_update` events on remote viewers) was calling `ctx.moveTo()` and `ctx.lineTo()` without calling `ctx.beginPath()`.
- **Canvas 2D Path Accumulation behavior:** HTML5 2D Canvas keeps an internal path accumulator buffer. Calling `ctx.stroke()` without `ctx.beginPath()` causes the canvas to re-stroke **all prior subpaths** every time a new line segment arrives.
- When `handleClear` ran, `ctx.fillRect()` visually wiped the pixel grid, but the 2D path accumulator in `ctx` remained intact. The very next stroke from `draw_update` triggered `ctx.stroke()` without `beginPath()`, causing the canvas engine to instantly re-render **all strokes drawn before the clear**, resulting in overlapping drawings and corrupted colors across clients.

#### 🛠 Fixes Applied:
1. **`frontend/src/components/CanvasBoard.jsx`:**
   - Added `ctx.beginPath()` inside `handleDraw` before `moveTo`/`lineTo` so every incoming socket segment is drawn isolated on its own path.
   - Added `ctx.beginPath()` in `handleClear` and `handleHistory` to explicitly clear the 2D path buffer whenever the canvas is cleared or reloaded.
2. **`backend/src/socket/socketHandller.js`:**
   - Enforced drawer verification (`room.getCurrentDrawer()?.socketId === socket.id`) for `fill_canvas`, `undo_action`, and `redo_action` events to guarantee only the active drawer can modify the drawing history.

---

#### 🔴 Issue Reported: Irrelevant / Imbalanced Scoring System
- **Problem:** Drawers were earning disproportionately higher scores than fast guessers, and guessers received very low points (e.g. 10 points) if guessing near the end of the round.

#### 🛠 Fix Applied (Skribbl.io Inspired Scoring Engine):
- **`backend/src/game/constants.js` & `backend/src/game/Room.js`**:
  - **Guesser Points:** Base max increased from 100 to **400 points**. Added order penalty (`-35 pts` per subsequent guesser) and time bonus scaling between 50% and 100% of the base points. Minimum points for any correct guess is guaranteed at **100 points**.
  - **Drawer Points:** Capped at **250 points max** per turn. Drawer earns a proportional share (`250 / totalGuessers`) for each guesser who successfully guesses their drawing.
  - **Competitive Balance:** Fast guessers are now rewarded most (up to 400 pts), while drawers are fairly compensated only if their drawings are successfully understood by the lobby.

---

#### 🔴 Issues Fixed (Deep Bug Audit & Edge-Case Protection):
1. **Single-Player Lock Bug during Turn End (`backend/src/socket/socketHandller.js`):**
   - Fixed race condition where a player leaving during the 4-second `TURN_END_DELAY` left only 1 player, but `nextTurn()` still triggered. Added guards in `endTurnWithDelay` and `handlePlayerLeave` to cleanly reset room status to `LOBBY` and trigger game over when player count drops below 2.
2. **Tab Refresh / Session Persistence (`frontend/src/context/PlayerContext.jsx`):**
   - Initialized `PlayerName` and `PlayerAvtar` state from `localStorage`. Refreshing or reconnecting tabs now maintains the player's identity without triggering unwanted homepage redirects.
3. **Special Characters in Word Hints (`backend/src/game/Room.js`):**
   - Updated `getWordHint` to auto-reveal non-alphanumeric characters (hyphens, apostrophes) and excluded them from candidate hint reveals in `revealNextHint`.
4. **Keyboard Shortcut Guard (`frontend/src/components/Tools.jsx`):**
   - Expanded keyboard listener target guard to prevent tool hotkeys from triggering while focused on inputs, textareas, selects, buttons, or contentEditable elements.

---

#### 🔴 Bug: Join-via-Link Not Working + Page Refresh Drops Player from Room

**Problem:** When a user clicked an invite link (e.g., `https://domain.com/?join=ABCD` or `https://domain.com/room/ABCD`), they were never prompted to choose a name/avatar and the join itself silently failed — the player never appeared in the room.

Additionally, if any player refreshed their browser on `/game/ROOMID`, a new socket connection was created but `join_room` was never re-emitted, so the player fell out of the socket.io room and stopped receiving all real-time broadcasts (drawings, guesses, turn events).

**Root Cause:**
- `HomePage.jsx`'s `handleJoinGame` was directly emitting `join_room` to the backend *from the homepage* before the user navigated to the lobby. The `player_joined` response had no listener to handle navigation, so the user stayed stuck on the home page.
- `CreateGame.jsx` (the lobby screen at `/room/:roomId`) never emitted `join_room` — it only called `get_room_info`. So link-joiners who landed there were never actually added to the room.
- `MainGameScreen.jsx` also never emitted `join_room`, so page refreshes during gameplay silently disconnected the player from broadcasts.

**Fix Applied:**
1. **`frontend/src/pages/HomePage.jsx`:** Changed `handleJoinGame` to *navigate* to `/room/{roomId}` instead of emitting `join_room` directly. The actual join happens on the lobby page.
2. **`frontend/src/pages/CreateGame.jsx`:** Added `socket.emit("join_room", ...)` on mount. The backend's ghost-player-prevention logic safely handles both first-time joins and reconnections (same `playerId` → update socket ID, new `playerId` → add player).
3. **`frontend/src/pages/MainGameScreen.jsx`:** Added `socket.emit("join_room", ...)` on mount so page refreshes re-register the player in the socket.io room. Added `PlayerAvtar` to context destructuring.
4. Both `CreateGame.jsx` and `MainGameScreen.jsx` now listen for the `error` event to alert the user and redirect home if the room doesn't exist.

---
