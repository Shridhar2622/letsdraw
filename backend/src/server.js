// src/server.js

import "dotenv/config"
import express from "express"
import http from "http"
import { Server } from "socket.io"
import socketHandler from "./socket/socketHandller.js"
import { getMetrics, getContentType } from "./metrics.js"

const app = express()

// Create HTTP server from express app
const server = http.createServer(app)

// Attach socket.io to HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // temporary for development
  }
})

// Basic route just to test server
app.get("/", (req, res) => {
  res.send("SKRIBBLE Backend Running 🚀")
})

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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
