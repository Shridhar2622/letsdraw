// src/server.js

import "dotenv/config"
import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"
import socketHandler from "./socket/socketHandller.js"
import { getMetrics, getContentType } from "./metrics.js"
import { connectDB } from "./db/connect.js"
import authRouter from "./routes/auth.js"

const app = express()
app.use(cors({ origin: "*" }))
app.use(express.json())

// Create HTTP server from express app
const server = http.createServer(app)

// Attach socket.io to HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // temporary for development
  }
})

// Auth routes
if (process.env.NODE_ENV === "development") {
  app.use("/api/auth", authRouter)
}

// Basic route just to test server
app.get("/", (req, res) => {
  res.send("SKRIBBLE Backend Running 🚀")
})

// Game History API
app.get("/api/game-history", async (req, res) => {
  try {
    const { GameHistory } = await import("./db/models/GameHistory.js");
    const history = await GameHistory.find().sort({ timestamp: -1 }).limit(10).lean();
    res.json(history);
  } catch (err) {
    console.warn("Could not fetch game history:", err.message);
    res.json([]);
  }
});

// Leaderboard API
app.get("/api/leaderboard", async (req, res) => {
  try {
    const { User } = await import("./db/models/User.js");
    // Sort by totalScore by default
    const leaderboard = await User.find({}, "username totalScore gamesPlayed gamesWon")
                                  .sort({ totalScore: -1 })
                                  .limit(10)
                                  .lean();
    res.json(leaderboard);
  } catch (err) {
    console.warn("Could not fetch leaderboard:", err.message);
    res.json([]);
  }
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
    try {
        res.set('Content-Type', getContentType());
        res.end(await getMetrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});

// Wire up all socket event handlers
socketHandler(io)

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
