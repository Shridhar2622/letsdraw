# Room Class — How to Think & Implement

## What IS a Room?

Think of the Room class as a **container for one game session**. When a user creates a room, you create a `new Room()`. It holds everything about that specific game — who's in it, what word is being drawn, whose turn it is, and the score.

---

## Step 1: What Data Does a Room Need? (Constructor Properties)

Ask yourself: *"If I froze the game mid-play, what info would I need to restart it exactly?"*

| Property | Type | Why You Need It |
|---|---|---|
| `roomId` | String | To identify this room (from your `generateRoomId()`) |
| `players` | Array of objects | To track who's in the room. Each player object: `{ socketId, name, score, isDrawer }` |
| `currentWord` | String or null | The word the drawer is drawing right now |
| `currentDrawerIndex` | Number | Index into the `players` array — whose turn is it? |
| `status` | String | What phase the room is in: `"LOBBY"`, `"PLAYING"`, `"ROUND_END"`, `"GAME_OVER"` |
| `round` | Number | Which round we're on (e.g., 1 of 3) |
| `maxRounds` | Number | Total rounds per game |
| `timer` | Number or null | Seconds remaining in the current turn |

> **Tip**: Pass `roomId` and the host player's info into the constructor. Initialize everything else to defaults (`players = []`, `status = "LOBBY"`, `round = 0`, etc.).

---

## Step 2: What Actions Can a Room Perform? (Methods)

Think about what **events happen** during a game and write a method for each:

### `addPlayer(player)`
- Push a new player object into `this.players`
- Set their `score` to 0 and `isDrawer` to false
- **Edge case**: Check if room is full before adding (use `MAX_PLAYERS` from your constants)

### `removePlayer(socketId)`
- Filter the player out of `this.players`
- **Critical thinking**: What if the person who left WAS the drawer? You need to handle that — either skip to next turn or end the round early

### `startGame()`
- Set `status` to `"PLAYING"`, `round` to 1
- Call your method to pick the first drawer and pick a word
- This is where the timer should begin (but timer logic lives outside — more on that below)

### `selectWord()`
- Import your `WORDS` array from `constants.js`
- Pick a random word: `WORDS[Math.floor(Math.random() * WORDS.length)]`
- Set it to `this.currentWord`

### `nextTurn()`
- Move `currentDrawerIndex` forward by 1
- If it exceeds `players.length`, that means everyone drew once → increment `round`
- If `round > maxRounds`, set `status = "GAME_OVER"`
- Otherwise, pick a new word via `selectWord()`

### `checkGuess(socketId, guess)`
- Compare `guess.toLowerCase()` with `this.currentWord.toLowerCase()`
- If correct → add points to the guesser AND the drawer (reward both!)
- Return `true` or `false` so the socket handler knows whether to announce a correct guess or just show it as a normal chat message
- **Edge case**: The drawer should NOT be allowed to guess

### `getScoreboard()`
- Return `this.players` sorted by score (descending)
- Useful for displaying at round end or game over

### `getWordHint()`
- Return the word with most letters replaced by underscores: `"apple"` → `"a _ _ _ e"`
- This is what guessers see. You decide how many letters to reveal

---

## Step 3: How to Think About the Timer

The Room class should **NOT** run its own `setInterval`. Why? Because the Room is just data + logic. The timer is a **side effect** — it belongs in your socket handler or game manager.

**Pattern**:
- When a turn starts, the socket handler starts a `setInterval` that decrements time and emits `"time_tick"` to the room every second
- When time hits 0, the socket handler calls `room.nextTurn()`
- Store the interval ID so you can `clearInterval` if someone guesses correctly before time runs out

---

## Step 4: Export It

Since you're using ES modules:
```
export default class Room { ... }
```

Then import it in `gameManager.js` where you'll create and store Room instances.

---

## Mental Model — The Big Picture

```
User clicks "Create Room"
        ↓
socketHandler receives 'create_room'
        ↓
gameManager.createRoom() → new Room(roomId, hostPlayer)
        ↓
Room sits in memory (in a Map inside gameManager)
        ↓
Other users join → room.addPlayer()
        ↓
Host starts game → room.startGame()
        ↓
socketHandler runs the timer loop, calling room methods each turn
        ↓
Game ends → room.getScoreboard() → gameManager.deleteRoom()
```

---

## Summary: Build It in This Order

1. **Constructor** with all the properties listed above
2. **`addPlayer`** and **`removePlayer`** — test these first
3. **`startGame`** and **`selectWord`**
4. **`checkGuess`** — the core game mechanic
5. **`nextTurn`** — advancing the game state
6. **`getScoreboard`** and **`getWordHint`** — display helpers
