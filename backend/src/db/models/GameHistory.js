import mongoose from "mongoose";

const scoreboardSchema = new mongoose.Schema({
    playerId: { type: String, required: true },
    name: { type: String, required: true },
    score: { type: Number, required: true, default: 0 },
    avatar: { type: String, default: '' }
}, { _id: false });

const gameHistorySchema = new mongoose.Schema({
    roomId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    settings: {
        maxRounds: { type: Number, required: true },
        drawTime: { type: Number, required: true },
        difficulty: { type: String, required: true }
    },
    scoreboard: [scoreboardSchema]
});

export const GameHistory = mongoose.model("GameHistory", gameHistorySchema);
