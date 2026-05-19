// ── Game Settings ─────────────────────────────────
export const MAX_PLAYERS = 8;
export const MAX_ROUNDS = 3;
export const ROUND_DURATION = 60; // seconds per turn

// ── Scoring ───────────────────────────────────────
export const GUESSER_POINTS = 100;
export const DRAWER_POINTS = 50;

// ── Word Bank ─────────────────────────────────────
export const WORDS = [
    // Animals
    "cat", "dog", "elephant", "giraffe", "penguin", "dolphin", "butterfly", "spider", "snake", "parrot",

    // Food
    "pizza", "burger", "ice cream", "banana", "watermelon", "cake", "popcorn", "sandwich", "donut", "sushi",

    // Objects
    "guitar", "umbrella", "bicycle", "camera", "headphones", "sunglasses", "backpack", "candle", "key", "clock",

    // Places / Nature
    "mountain", "beach", "volcano", "lighthouse", "bridge", "castle", "igloo", "waterfall", "island", "forest",

    // Actions / Concepts
    "dancing", "swimming", "sleeping", "fishing", "painting", "skydiving", "camping", "surfing", "cooking", "singing",

    // Random Fun
    "rocket", "robot", "dinosaur", "pirate", "ninja", "unicorn", "dragon", "ghost", "alien", "wizard",
];
