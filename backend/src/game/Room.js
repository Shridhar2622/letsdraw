import { WORDS_EASY, WORDS_MEDIUM, WORDS_HARD, MAX_PLAYERS, MAX_ROUNDS, ROUND_DURATION, GUESSER_MAX_POINTS, DRAWER_MAX_POINTS, MIN_GUESSER_POINTS, DEFAULT_HINTS } from "./constants.js";

// Fisher-Yates shuffle — guarantees every word is used before any repeats
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default class Room {
    constructor(roomId, hostPlayer, settings = {}) {
        this.roomId = roomId;
        this.players = [];           // Array of { socketId, name, score, isDrawer }
        this.status = "LOBBY";       // "LOBBY" | "PLAYING" | "ROUND_END" | "GAME_OVER"
        this.currentWord = null;
        this.currentDrawerIndex = 0;
        this.round = 0;
        this.maxRounds = settings.rounds || MAX_ROUNDS;
        this.drawTime = settings.drawTime || ROUND_DURATION;
        this.maxPlayers = MAX_PLAYERS;
        this.timer = this.drawTime;
        this.difficulty = settings.difficulty || "mixed"; // "easy" | "medium" | "hard" | "mixed"
        this.hints = settings.hints ?? DEFAULT_HINTS;     // Number of letters to reveal per turn
        this.drawHistory = [];
        this.redoHistory = [];
        this.wordPool = [];      // Shuffled deck — words drawn from front
        this.wordChoices = [];
        this.revealedIndices = new Set(); // Tracks which letter indices have been progressively revealed
        // Auto-add the host as the first player
        this.addPlayer(hostPlayer);
    }

    // ── Player Management ─────────────────────────────

    addPlayer(player) {
        if (this.isFull()) return false;
        this.players.push({
            socketId: player.socketId,
            playerId: player.playerId,
            name: player.name,
            score: 0,
            isDrawer: false,
            hasGuessed: false,
            avatar: player.avatar
        });
        return true;
    }

    removePlayer(socketId) {
        const index = this.players.findIndex(p => p.socketId === socketId);
        if (index === -1) return { wasDrawer: false, allGuessed: false };

        const wasDrawer = index === this.currentDrawerIndex;
        
        this.players.splice(index, 1);

        // Adjust index to prevent skipping players
        if (index < this.currentDrawerIndex) {
            this.currentDrawerIndex--;
        }

        // Check if all remaining players have guessed (in case a non-guesser left)
        let allGuessed = false;
        if (this.status === "PLAYING" && this.players.length > 1) {
            allGuessed = this.players.every((p, i) => i === this.currentDrawerIndex || p.hasGuessed);
        }

        return { wasDrawer, allGuessed };
    }

    // ── Game Flow ─────────────────────────────────────

    startGame() {
        this.status = "CHOOSING_WORD";
        this.round = 1;
        this.currentDrawerIndex = 0;
        this.drawHistory = [];
        this.redoHistory = [];
        this.wordPool = []; // Reset so it gets rebuilt
        this.revealedIndices = new Set();
        this.players.forEach(p => {
            p.score = 0;
            p.hasGuessed = false;
            p.isDrawer = false;
        });
        if (this.players.length > 0) {
            this.players[0].isDrawer = true;
        }
        this.selectWords();
    }

    _buildWordPool() {
        // Build the base pool based on room difficulty setting
        let base;
        if (this.difficulty === "easy")   base = WORDS_EASY;
        else if (this.difficulty === "medium") base = WORDS_MEDIUM;
        else if (this.difficulty === "hard")   base = WORDS_HARD;
        else {
            // "mixed" — blend all tiers: 30% easy, 40% medium, 30% hard
            const e = shuffleArray(WORDS_EASY).slice(0, Math.floor(WORDS_EASY.length * 0.3));
            const m = shuffleArray(WORDS_MEDIUM).slice(0, Math.floor(WORDS_MEDIUM.length * 0.4));
            const h = shuffleArray(WORDS_HARD).slice(0, Math.floor(WORDS_HARD.length * 0.3));
            base = [...e, ...m, ...h];
        }
        // Full Fisher-Yates shuffle so every word is equally likely
        this.wordPool = shuffleArray(base);
    }

    selectWords() {
        // Refill the deck when it runs out — guarantees all words get used before repeats
        if (this.wordPool.length < 3) {
            this._buildWordPool();
        }

        // Draw the next 3 words off the top of the shuffled deck
        const choices = [];
        while (choices.length < 3 && this.wordPool.length > 0) {
            choices.push(this.wordPool.shift());
        }

        this.wordChoices = choices;
        this.currentWord = null;
    }

    setWord(word) {
        this.currentWord = word;
        this.revealedIndices = new Set(); // Fresh hints for the new word
        this.status = "PLAYING";
    }

    nextTurn(advanceIndex = true) {
        if (this.players.length === 0) return;
        
        // Unmark current drawer
        if (this.players[this.currentDrawerIndex]) {
             this.players[this.currentDrawerIndex].isDrawer = false;
        }

        if (advanceIndex) {
             this.currentDrawerIndex += 1;
        }

        // Everyone has drawn this round → next round
        if (this.currentDrawerIndex >= this.players.length) {
            this.currentDrawerIndex = 0;
            this.round++;
        }

        // All rounds done → game over
        if (this.round > this.maxRounds) {
            this.status = "GAME_OVER";
            return;
        }

        // Reset guesses and mark new drawer
        this.players.forEach(p => p.hasGuessed = false);
        this.players[this.currentDrawerIndex].isDrawer = true;
        this.drawHistory = [];
        this.redoHistory = [];
        this.revealedIndices = new Set(); // Reset hints for the new turn
        this.status = "CHOOSING_WORD";
        this.selectWords();
    }

    // ── Gameplay ──────────────────────────────────────

    checkGuess(socketId, guess) {
        if (!this.currentWord) return { isCorrect: false, allGuessed: false };

        const guesser = this.players.find(p => p.socketId === socketId);
        if (!guesser) return { isCorrect: false, allGuessed: false };

        // Drawer can't guess their own word
        if (this.players[this.currentDrawerIndex]?.socketId === socketId) return { isCorrect: false, allGuessed: false };

        // Already guessed
        if (guesser.hasGuessed) return { isCorrect: false, allGuessed: false };

        if (guess.toLowerCase().trim() === this.currentWord.toLowerCase()) {
            // Count how many players had ALREADY guessed correctly before this person
            const previousCorrectCount = this.players.filter(p => !p.isDrawer && p.hasGuessed).length;
            const guesserOrder = previousCorrectCount + 1; // 1 for 1st guesser, 2 for 2nd, etc.

            guesser.hasGuessed = true;
            
            // ── Skribbl.io Style Guesser Scoring ──────────────
            // Order penalty: 1st guesser gets highest base, 2nd gets slightly less, etc.
            const orderBase = Math.max(200, GUESSER_MAX_POINTS - (guesserOrder - 1) * 35);
            
            // Time bonus: scaling between 50% (if time runs out) and 100% (if guessed instantly)
            const timeRatio = Math.max(0, Math.min(1, this.timer / this.drawTime));
            const points = Math.max(MIN_GUESSER_POINTS, Math.floor(orderBase * (0.5 + 0.5 * timeRatio)));
            guesser.score += points;

            // ── Drawer Scoring ───────────────────────────────
            // Drawer gets points proportional to total guessers in the room for each successful guess
            const totalGuessers = Math.max(1, this.players.length - 1);
            const drawerPointsPerGuess = Math.floor(DRAWER_MAX_POINTS / totalGuessers);
            
            if (this.players[this.currentDrawerIndex]) {
                this.players[this.currentDrawerIndex].score += drawerPointsPerGuess;
            }

            // Check if everyone (except drawer) has guessed
            const allGuessed = this.players.every((p, i) => i === this.currentDrawerIndex || p.hasGuessed);

            return { isCorrect: true, allGuessed };
        }

        return { isCorrect: false, allGuessed: false };
    }

    checkCloseGuess(guess) {
        if (!this.currentWord) return false;
        const target = this.currentWord.toLowerCase();
        const input = guess.toLowerCase().trim();
        
        if (target.length <= 3) return false; // Too short to have a "close" guess
        if (target === input) return false;

        // Simple Levenshtein distance
        const m = input.length;
        const n = target.length;
        if (Math.abs(m - n) > 2) return false;

        const dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (input[i - 1] === target[j - 1]) dp[i][j] = dp[i - 1][j - 1];
                else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
        return dp[m][n] <= 2;
    }

    // ── Display Helpers ───────────────────────────────

    /**
     * Generates a word hint that:
     *  - Shows first & last letter of EACH word
     *  - Shows progressively revealed letters from hints
     *  - Uses visible gaps between words (non-breaking spaces)
     *  - Example: "ice skating" → "i _ e    s _ _ _ _ _ g"
     */
    getWordHint() {
        if (!this.currentWord) return "";

        const words = this.currentWord.split(" ");
        let globalIdx = 0;

        return words.map(word => {
            const hint = word.split("").map((char) => {
                const idx = globalIdx;
                globalIdx++;
                // Auto-reveal non-alphanumeric characters (hyphens, apostrophes, etc.)
                if (!/[a-zA-Z0-9]/.test(char)) return char;
                // Only show letters that have been progressively revealed
                if (this.revealedIndices.has(idx)) return char;
                return "_";
            }).join(" ");
            globalIdx++; // skip the space between words
            return hint;
        }).join("   \u00A0   "); // wide non-breaking space gap between words
    }

    /**
     * Reveals one random hidden letter as a hint.
     * Returns true if a letter was revealed, false if no more letters to reveal.
     */
    revealNextHint() {
        if (!this.currentWord) return false;

        const words = this.currentWord.split(" ");
        const candidates = [];
        let globalIdx = 0;

        for (const word of words) {
            for (let i = 0; i < word.length; i++) {
                const char = word[i];
                // Only alphanumeric characters that haven't been revealed are candidates
                if (/[a-zA-Z0-9]/.test(char) && !this.revealedIndices.has(globalIdx)) {
                    candidates.push(globalIdx);
                }
                globalIdx++;
            }
            globalIdx++; // skip the space
        }

        if (candidates.length === 0) return false;

        // Pick a random hidden letter to reveal
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        this.revealedIndices.add(pick);
        return true;
    }

    getScoreboard() {
        return [...this.players].sort((a, b) => b.score - a.score);
    }

    getCurrentDrawer() {
        return this.players[this.currentDrawerIndex];
    }

    // ── Room Info ─────────────────────────────────────

    isFull() {
        return this.players.length >= this.maxPlayers;
    }

    isEmpty() {
        return this.players.length === 0;
    }
}
