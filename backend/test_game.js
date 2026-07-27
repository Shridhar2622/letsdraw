import { io } from "socket.io-client";
import fetch from "node-fetch";

async function run() {
    const backendUrl = "http://localhost:5000";
    
    // 1. Register a test user
    const username = "testuser_" + Date.now();
    const res = await fetch(`${backendUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: "password123" })
    });
    const data = await res.json();
    console.log("Register response:", data);
    
    const token = data.token;
    const userId = data.user.id;

    // 2. Connect socket with the userId
    const socket1 = io(backendUrl, { auth: { playerId: userId } });
    const socket2 = io(backendUrl, { auth: { playerId: "guest-12345" } });

    socket1.on("connect", () => console.log("Socket1 connected:", socket1.id));
    socket2.on("connect", () => console.log("Socket2 connected:", socket2.id));

    // 3. Create room
    socket1.emit("create_room", { 
        name: username, 
        avatar: "bear", 
        difficulty: "EASY", 
        maxRounds: 1, 
        drawTime: 30 
    });

    let roomId = null;
    socket1.on("room_created", (data) => {
        roomId = data.roomId;
        console.log("Room created:", roomId);
        
        // 4. Socket2 joins room
        socket2.emit("join_room", { roomId, name: "Guest", avatar: "panda" });
    });

    socket1.on("player_joined", (data) => {
        if (data.players.length === 2) {
            console.log("Both players in room. Starting game...");
            socket1.emit("start_game", { roomId });
        }
    });

    socket1.on("game_started", () => {
        console.log("Game started! Now socket2 will leave to trigger game over.");
        socket2.disconnect();
    });

    socket1.on("game_over", (data) => {
        console.log("Game over event received!");
        setTimeout(() => process.exit(0), 1000);
    });
}

run();
