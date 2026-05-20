import generateRoomId from "../utills/createRoomId.js";
import Room from "./Room.js";
import { activeRooms } from "../metrics.js";

// ── Central storage for all active rooms ──────────
const rooms = new Map();

// ── Room Management ───────────────────────────────

export function createRoom(hostPlayer) {
    const roomId = generateRoomId();
    const room = new Room(roomId, hostPlayer);
    rooms.set(roomId, room);
    activeRooms.inc(); // Increment Prometheus metric
    return room;
}

export function getRoom(roomId) {
    return rooms.get(roomId);
}

export function deleteRoom(roomId) {
    if (rooms.has(roomId)) {
        rooms.delete(roomId);
        activeRooms.dec(); // Decrement Prometheus metric
    }
}

export function getRoomBySocketId(socketId) {
    for (const room of rooms.values()) {
        const found = room.players.find(p => p.socketId === socketId);
        if (found) return room;
    }
    return undefined;
}
