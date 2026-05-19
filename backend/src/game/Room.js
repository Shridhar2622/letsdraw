import { WORDS, MAX_PLAYERS, MAX_ROUNDS, ROUND_DURATION, GUESSER_POINTS, DRAWER_POINTS } from "./constants.js";

export default class Room {
    constructor(roomId, hostPlayer) {
        this.roomId = roomId;
        this.players = [];           // Array of { socketId, name, score, isDrawer }
        this.status = "LOBBY";       // "LOBBY" | "PLAYING" | "ROUND_END" | "GAME_OVER"
        this.currentWord = null;
        this.currentDrawerIndex = 0;
        this.round = 0;
        this.maxRounds = MAX_ROUNDS;
        this.drawTime = ROUND_DURATION;
        this.maxPlayers = MAX_PLAYERS;
        this.timer = ROUND_DURATION;
        this.drawHistory = [];
        this.redoHistory = [];
        // Auto-add the host as the first player
        this.addPlayer(hostPlayer);
    }

    // ── Player Management ─────────────────────────────

    addPlayer(player) {
        if (this.isFull()) return false;
        this.players.push({
            socketId: player.socketId,
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
        this.status = "PLAYING";
        this.round = 1;
        this.currentDrawerIndex = 0;
        this.drawHistory = [];
        this.redoHistory = [];
        this.players[0].isDrawer = true;
        this.selectWord();
    }

    selectWord() {
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        this.currentWord = word;
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
        this.selectWord();
    }

    // ── Gameplay ──────────────────────────────────────

    checkGuess(socketId, guess) {
        const guesser = this.players.find(p => p.socketId === socketId);
        if (!guesser) return { isCorrect: false, allGuessed: false };

        // Drawer can't guess their own word
        if (this.players[this.currentDrawerIndex]?.socketId === socketId) return { isCorrect: false, allGuessed: false };

        // Already guessed
        if (guesser.hasGuessed) return { isCorrect: false, allGuessed: false };

        if (guess.toLowerCase().trim() === this.currentWord.toLowerCase()) {
            guesser.hasGuessed = true;
            
            // Dynamic Scoring based on time left
            const timeRatio = this.timer / this.drawTime;
            const points = Math.max(10, Math.floor(GUESSER_POINTS * timeRatio));
            guesser.score += points;

            // Drawer gets points for each correct guess based on total players
            this.players[this.currentDrawerIndex].score += Math.floor(DRAWER_POINTS / Math.max(1, (this.players.length - 1)));

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

    getWordHint() {
        if (!this.currentWord) return "";
        return this.currentWord
            .split("")
            .map((char, i) => (i === 0 || i === this.currentWord.length - 1) ? char : "_")
            .join(" ");
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
