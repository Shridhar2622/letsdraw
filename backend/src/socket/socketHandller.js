import { createRoom, getRoom, deleteRoom, getRoomBySocketId } from "../game/gameManager.js";
import { ROUND_DURATION } from "../game/constants.js";

// Store timer intervals per room so we can clear them
const timers = new Map();

export default function socketHandler(io) {

    io.on("connection", (socket) => {


        //testing playerJoined
        console.log("new player joined: ", socket.id)


        // ── Create a new room ─────────────────────────────
        socket.on("create_room", (data) => {
            const room = createRoom({ socketId: socket.id, name: data.name, avatar: data.avatar });
            socket.join(room.roomId);
            socket.emit("room_created", {
                roomId: room.roomId,
                players: room.players
            });
        });

        // ── Get Room Info ─────────────────────────────────
        socket.on("get_room_info", (data) => {
            const roomId = typeof data === 'object' ? data.roomId : data;
            const room = getRoom(roomId);
            if (room) {
                socket.emit("room_info", {
                    players: room.players,
                    settings: {
                        maxRounds: room.maxRounds,
                        drawTime: room.drawTime,
                        maxPlayers: room.maxPlayers
                    },
                    gameState: room.status,
                    currentDrawer: room.status === "PLAYING" ? room.getCurrentDrawer() : null,
                    wordHint: room.status === "PLAYING" ? room.getWordHint() : "",
                    round: room.round,
                    timeRemaining: room.status === "PLAYING" ? room.timer : 0
                });
                if (room.status === "PLAYING") {
                    socket.emit("draw_history", room.drawHistory);
                }
            }
        });

        // ── Update Settings ───────────────────────────────
        socket.on("update_settings", (data) => {
            const room = getRoom(data.roomId);
            if (!room) return;

            // Optional: verify if sender is host (first player)
            if (room.players.length > 0 && room.players[0].socketId === socket.id) {
                if (data.settings.maxRounds) room.maxRounds = data.settings.maxRounds;
                if (data.settings.drawTime) room.drawTime = data.settings.drawTime;
                if (data.settings.maxPlayers) room.maxPlayers = data.settings.maxPlayers;

                // Broadcast updated settings to everyone
                io.to(room.roomId).emit("settings_updated", {
                    settings: {
                        maxRounds: room.maxRounds,
                        drawTime: room.drawTime,
                        maxPlayers: room.maxPlayers
                    }
                });
            }
        });

        // ── Join an existing room ─────────────────────────
        socket.on("join_room", (data) => {
            const room = getRoom(data.roomId);
            if (!room) {
                socket.emit("error", { message: "No room found." });
                return;
            }
            if (room.isFull()) {
                socket.emit("error", { message: "Room is full." });
                return;
            }
            room.addPlayer({ socketId: socket.id, name: data.name, avatar: data.avatar });
            socket.join(room.roomId);

            // Notify EVERYONE in the room (including the joiner)
            io.to(room.roomId).emit("player_joined", {
                players: room.players,
                status: room.status
            });

            // Send existing draw history to the new player
            socket.emit("draw_history", room.drawHistory);

            io.to(room.roomId).emit("system_message", {
                text: `${data.name} joined the room.`,
                type: 'system'
            });
        });

        // ── Host starts the game ──────────────────────────
        socket.on("start_game", (data) => {
            const room = getRoom(data.roomId);
            if (!room) return;

            room.startGame();

            io.to(room.roomId).emit("canvas_cleared");

            io.to(room.roomId).emit("game_started", {
                drawer: room.getCurrentDrawer(),
                wordHint: room.getWordHint(),
                round: room.round
            });

            // Send the actual word ONLY to the drawer
            const drawer = room.getCurrentDrawer();
            io.to(drawer.socketId).emit("word_to_draw", {
                word: room.currentWord
            });

            startTimer(io, room);
        });

        // ── Drawing coordinates from the drawer ───────────
        socket.on("draw", (data) => {
            const room = getRoom(data.roomId);
            if (room) {
                room.drawHistory.push({ type: 'draw', ...data });
                room.redoHistory = [];
            }
            socket.to(data.roomId).emit("draw_update", data);
        });

        // ── Fill canvas ──────────────────────────────────
        socket.on("fill_canvas", (data) => {
            const room = getRoom(data.roomId);
            if (room && room.status === "PLAYING") {
                room.drawHistory.push({ type: 'fill', ...data });
                room.redoHistory = [];
                io.to(data.roomId).emit("fill_canvas", data);
            }
        });

        // ── Draw Shape ───────────────────────────────────
        socket.on("draw_shape", (data) => {
            const room = getRoom(data.roomId);
            if (room) {
                room.drawHistory.push({ type: 'shape', ...data });
                room.redoHistory = [];
            }
            socket.to(data.roomId).emit("receive_shape", data);
        });


        // ── Clear canvas ──────────────────────────────────
        socket.on("clear_canvas", (data) => {
            const room = getRoom(data.roomId);
            if (room && room.status === "PLAYING") {
                room.drawHistory = [];
                room.redoHistory = [];
                io.to(data.roomId).emit("canvas_cleared");
            }
        });

        // ── Undo / Redo ───────────────────────────────────
        socket.on("undo_action", (data) => {
            const room = getRoom(data.roomId);
            if (room && room.status === "PLAYING" && room.drawHistory.length > 0) {
                const lastAction = room.drawHistory[room.drawHistory.length - 1];
                const undoneActions = [];

                if (lastAction.type === 'draw' && lastAction.strokeId) {
                    const targetStrokeId = lastAction.strokeId;
                    while (room.drawHistory.length > 0) {
                        const action = room.drawHistory[room.drawHistory.length - 1];
                        if (action.type === 'draw' && action.strokeId === targetStrokeId) {
                            undoneActions.unshift(room.drawHistory.pop());
                        } else {
                            break;
                        }
                    }
                } else {
                    undoneActions.push(room.drawHistory.pop());
                }

                if (undoneActions.length > 0) {
                    room.redoHistory.push(undoneActions);
                }

                io.to(data.roomId).emit("draw_history", room.drawHistory);
            }
        });

        socket.on("redo_action", (data) => {
            const room = getRoom(data.roomId);
            if (room && room.status === "PLAYING" && room.redoHistory.length > 0) {
                const actionsToRedo = room.redoHistory.pop();
                actionsToRedo.forEach(action => {
                    room.drawHistory.push(action);
                });
                io.to(data.roomId).emit("draw_history", room.drawHistory);
            }
        });

        // ── Player sends a guess ──────────────────────────
        socket.on("send_guess", (data) => {
            const room = getRoom(data.roomId);
            if (!room) return;

            const player = room.players.find(p => p.socketId === socket.id);
            if (!player) return;

            // If game isn't playing, just treat it as a chat message
            if (room.status !== "PLAYING") {
                io.to(room.roomId).emit("chat_message", {
                    name: player.name,
                    message: data.message
                });
                return;
            }

            const { isCorrect, allGuessed } = room.checkGuess(socket.id, data.message);

            if (isCorrect) {
                io.to(room.roomId).emit("correct_guess", {
                    playerName: player.name,
                    scores: room.getScoreboard()
                });

                if (allGuessed) {
                    io.to(room.roomId).emit("system_message", {
                        text: "Everyone has guessed the word!",
                        type: 'system'
                    });
                    
                    clearTimer(room.roomId);
                    room.nextTurn();

                    if (room.status === "GAME_OVER") {
                        io.to(room.roomId).emit("game_over", {
                            scoreboard: room.getScoreboard()
                        });
                    } else {
                        io.to(room.roomId).emit("canvas_cleared");
                        io.to(room.roomId).emit("new_turn", {
                            drawer: room.getCurrentDrawer(),
                            wordHint: room.getWordHint(),
                            round: room.round
                        });
                        const newDrawer = room.getCurrentDrawer();
                        io.to(newDrawer.socketId).emit("word_to_draw", {
                            word: room.currentWord
                        });
                        startTimer(io, room);
                    }
                }
            } else if (room.checkCloseGuess(data.message)) {
                // Broadcast standard message but tell solely the sender they are close
                io.to(room.roomId).emit("chat_message", {
                    name: player.name,
                    message: data.message
                });
                socket.emit("system_message", {
                    message: `'${data.message}' is very close!`,
                    type: "close"
                });
            } else {
                // Wrong guess — just show it as a chat message
                io.to(room.roomId).emit("chat_message", {
                    name: player.name,
                    message: data.message
                });
            }
        });

        // ── Player disconnects ────────────────────────────
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            const room = getRoomBySocketId(socket.id);
            if (!room) return;

            const leftPlayer = room.players.find(p => p.socketId === socket.id);
            const { wasDrawer, allGuessed } = room.removePlayer(socket.id);

            if (room.isEmpty()) {
                clearTimer(room.roomId);
                deleteRoom(room.roomId);
            } else {
                io.to(room.roomId).emit("player_left", {
                    players: room.players
                });
                io.to(room.roomId).emit("system_message", {
                    text: `${leftPlayer?.name || "A player"} left the room.`,
                    type: 'system'
                });

                if (room.players.length < 2 && room.status === "PLAYING") {
                    clearTimer(room.roomId);
                    room.status = "LOBBY";
                    room.round = 0;
                    room.currentDrawerIndex = 0;
                    io.to(room.roomId).emit("system_message", {
                        text: "Not enough players! Game returned to lobby.",
                        type: 'system'
                    });
                    io.to(room.roomId).emit("game_over", {
                        scoreboard: room.getScoreboard()
                    });
                } else if (room.status === "PLAYING") {
                    if (wasDrawer) {
                        io.to(room.roomId).emit("system_message", {
                            text: "The drawer left! Skipping turn...",
                            type: 'system'
                        });
                        
                        clearTimer(room.roomId);
                        room.nextTurn(false); // pass false because index already points to next player
                        
                        if (room.status === "GAME_OVER") {
                            io.to(room.roomId).emit("game_over", { scoreboard: room.getScoreboard() });
                        } else {
                            io.to(room.roomId).emit("canvas_cleared");
                            io.to(room.roomId).emit("new_turn", {
                                drawer: room.getCurrentDrawer(),
                                wordHint: room.getWordHint(),
                                round: room.round
                            });
                            const newDrawer = room.getCurrentDrawer();
                            io.to(newDrawer.socketId).emit("word_to_draw", { word: room.currentWord });
                            startTimer(io, room);
                        }
                    } else if (allGuessed) {
                        io.to(room.roomId).emit("system_message", {
                            text: "Everyone has guessed the word!",
                            type: 'system'
                        });
                        
                        clearTimer(room.roomId);
                        room.nextTurn();
                        
                        if (room.status === "GAME_OVER") {
                            io.to(room.roomId).emit("game_over", { scoreboard: room.getScoreboard() });
                        } else {
                            io.to(room.roomId).emit("canvas_cleared");
                            io.to(room.roomId).emit("new_turn", {
                                drawer: room.getCurrentDrawer(),
                                wordHint: room.getWordHint(),
                                round: room.round
                            });
                            const newDrawer = room.getCurrentDrawer();
                            io.to(newDrawer.socketId).emit("word_to_draw", { word: room.currentWord });
                            startTimer(io, room);
                        }
                    }
                }
            }
        });
    });
}

// ── Timer Helper ──────────────────────────────────────
function startTimer(io, room) {
    clearTimer(room.roomId);
    room.timer = room.drawTime;

    const interval = setInterval(() => {
        room.timer--;

        io.to(room.roomId).emit("time_tick", {
            timeRemaining: room.timer
        });

        if (room.timer <= 0) {
            clearInterval(interval);
            timers.delete(room.roomId);

            room.nextTurn();

            if (room.status === "GAME_OVER") {
                io.to(room.roomId).emit("game_over", {
                    scoreboard: room.getScoreboard()
                });
            } else {
                io.to(room.roomId).emit("canvas_cleared");
                io.to(room.roomId).emit("new_turn", {
                    drawer: room.getCurrentDrawer(),
                    wordHint: room.getWordHint(),
                    round: room.round
                });
                const newDrawer = room.getCurrentDrawer();
                io.to(newDrawer.socketId).emit("word_to_draw", {
                    word: room.currentWord
                });
                startTimer(io, room);
            }
        }
    }, 1000);

    timers.set(room.roomId, interval);
}

function clearTimer(roomId) {
    const interval = timers.get(roomId);
    if (interval) {
        clearInterval(interval);
        timers.delete(roomId);
    }
}
