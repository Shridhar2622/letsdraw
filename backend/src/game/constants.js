import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read categorized words from JSON
const wordsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'words.json'), 'utf8'));

// ── Game Settings ─────────────────────────────────
export const MAX_PLAYERS = 8;
export const MAX_ROUNDS = 3;
export const ROUND_DURATION = 60; // seconds per turn

// ── Scoring ───────────────────────────────────────
export const GUESSER_POINTS = 100;
export const DRAWER_POINTS = 50;
export const DEFAULT_HINTS = 2;  // Letters revealed per turn (0 = no hints)

// ── Word Bank ─────────────────────────────────────
// Export each difficulty tier separately for the "Skill Choice" system
export const WORDS_EASY = wordsData.easy;
export const WORDS_MEDIUM = wordsData.medium;
export const WORDS_HARD = wordsData.hard;
