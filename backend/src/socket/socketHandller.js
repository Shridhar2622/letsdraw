import { createRoom, getRoom, deleteRoom, getRoomBySocketId } from "../game/gameManager.js";
import { ROUND_DURATION } from "../game/constants.js";
import { activePlayers, drawEventsTotal, messagesSentTotal } from "../metrics.js";

// Store timer intervals per room so we can clear them
const timers = new Map();

export default function socketHandler(io) {

    io.on("connection", (socket) => {
        // Increment player count
        activePlayers.inc();

        // Extract the unique player ID from the socket handshake
        const playerId = socket.handshake.auth?.playerId;

        //testing playerJoined
        console.log("new player joined: ", socket.id, "playerId:", playerId)


        // ── Create a new room ─────────────────────────────
        socket.on("create_room", (data) => {
            const settings = {
                difficulty: data.difficulty || "mixed",
                rounds: data.rounds || undefined,
                drawTime: data.drawTime || undefined
            };
            const room = createRoom({ socketId: socket.id, playerId, name: data.name, avatar: data.avatar }, settings);
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
                    currentDrawer: (room.status === "PLAYING" || room.status === "CHOOSING_WORD") ? room.getCurrentDrawer() : null,
                    wordHint: (room.status === "PLAYING" || room.status === "CHOOSING_WORD") ? room.getWordHint() : "",
                    round: room.round,
                    timeRemaining: room.status === "PLAYING" ? room.timer : 0
                });
                if (room.status === "PLAYING") {
                    socket.emit("draw_history", room.drawHistory);
                }
                if (room.status === "CHOOSING_WORD") {
                    const drawer = room.getCurrentDrawer();
                    if (drawer && drawer.socketId === socket.id) {
                        socket.emit("word_choices", { words: room.wordChoices });
                    }
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
                if (data.settings.difficulty) room.difficulty = data.settings.difficulty;

                // Broadcast updated settings to everyone
                io.to(room.roomId).emit("settings_updated", {
                    settings: {
                        maxRounds: room.maxRounds,
                        drawTime: room.drawTime,
                        maxPlayers: room.maxPlayers,
                        difficulty: room.difficulty
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

            // ── Ghost Player Prevention ──────────────────
            // Check if a player with the same playerId (browser session) already exists
            // This handles mobile reconnections where socket.io gets a new socket ID
            const existingPlayer = playerId ? room.players.find(p => p.playerId === playerId) : null;
            if (existingPlayer) {
                const oldSocketId = existingPlayer.socketId;
                // Update the existing player's socket ID to the new one
                existingPlayer.socketId = socket.id;
                socket.join(room.roomId);

                // Notify everyone with the updated player list
                io.to(room.roomId).emit("player_joined", {
                    roomId: room.roomId,
                    players: room.players,
                    status: room.status
                });

                // Send existing draw history to the reconnected player
                socket.emit("draw_history", room.drawHistory);

                // If game is in progress, resync the reconnected player
                if (room.status === "PLAYING" || room.status === "CHOOSING_WORD") {
                    socket.emit("room_info", {
                        players: room.players,
                        settings: {
                            maxRounds: room.maxRounds,
                            drawTime: room.drawTime,
                            maxPlayers: room.maxPlayers
                        },
                        gameState: room.status,
                        currentDrawer: room.getCurrentDrawer(),
                        wordHint: room.getWordHint(),
                        round: room.round,
                        timeRemaining: room.timer
                    });

                    // If this reconnected player IS the drawer, resend word choices/word
                    const drawer = room.getCurrentDrawer();
                    if (drawer && drawer.socketId === socket.id) {
                        if (room.status === "CHOOSING_WORD") {
                            socket.emit("word_choices", { words: room.wordChoices });
                        } else if (room.currentWord) {
                            socket.emit("word_to_draw", { word: room.currentWord });
                        }
                    }
                }

                console.log(`Player "${data.name}" reconnected with new socket ${socket.id} (old: ${oldSocketId})`);
                return;
            }

            if (room.isFull()) {
                socket.emit("error", { message: "Room is full." });
                return;
            }
            room.addPlayer({ socketId: socket.id, playerId, name: data.name, avatar: data.avatar });
            socket.join(room.roomId);

            // Notify EVERYONE in the room (including the joiner)
            io.to(room.roomId).emit("player_joined", {
                roomId: room.roomId,
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
            io.to(room.roomId).emit("game_started");
            proceedToNextState(io, room);
        });

        // ── Restart game ──────────────────────────────────
        socket.on("restart_game", (data) => {
            const room = getRoom(data.roomId);
            if (!room) return;
            
            room.status = "LOBBY";
            
            // Notify everyone to go back to lobby
            io.to(room.roomId).emit("game_restarted");
            
            // Wait a moment then broadcast the new state so they land cleanly in lobby
            setTimeout(() => {
                io.to(room.roomId).emit("room_info", {
                    players: room.players,
                    settings: {
                        maxRounds: room.maxRounds,
                        drawTime: room.drawTime,
                        maxPlayers: room.maxPlayers,
                        difficulty: room.difficulty
                    },
                    gameState: room.status,
                    currentDrawer: null,
                    wordHint: "",
                    round: 0,
                    timeRemaining: 0
                });
            }, 500);
        });

        // ── Drawer chooses a word ─────────────────────────
        socket.on("word_chosen", (data) => {
            const room = getRoom(data.roomId);
            if (room && room.status === "CHOOSING_WORD" && room.getCurrentDrawer()?.socketId === socket.id) {
                clearTimer(room.roomId);
                room.setWord(data.word);
                proceedToNextState(io, room);
            }
        });

        // ── Drawing coordinates from the drawer ───────────
        socket.on("draw", (data) => {
            drawEventsTotal.inc();
            const room = getRoom(data.roomId);
            if (room) {
                room.drawHistory.push({ type: 'draw', ...data });
                room.redoHistory = [];
            }
            socket.to(data.roomId).emit("draw_update", data);
        });

        // ── Fill canvas ──────────────────────────────────
        socket.on("fill_canvas", (data) => {
            drawEventsTotal.inc();
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
            messagesSentTotal.inc();
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

                // Reveal the word exclusively to the person who guessed it
                socket.emit("word_revealed", { word: room.currentWord });

                if (allGuessed) {
                    io.to(room.roomId).emit("system_message", {
                        text: "Everyone has guessed the word!",
                        type: 'system'
                    });
                    
                    endTurnWithDelay(io, room);
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

        // ── Helper to handle player leaving ───────────────
        const handlePlayerLeave = (socketId) => {
            const room = getRoomBySocketId(socketId);
            if (!room) return;

            // ── Stale Disconnect Guard ───────────────────
            // If the player already reconnected with a new socket ID,
            // this old disconnect event should be ignored
            const player = room.players.find(p => p.socketId === socketId);
            if (!player) return; // Player already removed or socket ID was replaced

            const leftPlayer = player;
            const { wasDrawer, allGuessed } = room.removePlayer(socketId);

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

                if (room.players.length < 2 && (room.status === "PLAYING" || room.status === "CHOOSING_WORD")) {
                    clearTimer(room.roomId);
                    room.status = "LOBBY";
                    room.round = 0;
                    room.currentDrawerIndex = 0;
                    io.to(room.roomId).emit("system_message", {
                        text: "Not enough players! Game over.",
                        type: 'system'
                    });
                    io.to(room.roomId).emit("game_over", {
                        scoreboard: room.getScoreboard()
                    });
                } else if (room.status === "PLAYING" || room.status === "CHOOSING_WORD") {
                    if (wasDrawer) {
                        io.to(room.roomId).emit("system_message", {
                            text: "The drawer left!",
                            type: 'system'
                        });
                        endTurnWithDelay(io, room);
                    } else if (allGuessed && room.status === "PLAYING") {
                        io.to(room.roomId).emit("system_message", {
                            text: "Everyone has guessed the word!",
                            type: 'system'
                        });
                        
                        endTurnWithDelay(io, room);
                    }
                }
            }
        };

        // ── Player explicitly leaves ──────────────────────
        socket.on("leave_room", () => {
            const room = getRoomBySocketId(socket.id);
            if (room) {
                socket.leave(room.roomId);
                handlePlayerLeave(socket.id);
            }
        });

        // ── Player disconnects ────────────────────────────
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            activePlayers.dec();
            handlePlayerLeave(socket.id);
        });
    });
}

// ── Turn Transition Helper ─────────────────────────────
function endTurnWithDelay(io, room) {
    if (room.status === "TURN_END_DELAY") return; // Prevent double trigger
    
    room.status = "TURN_END_DELAY";
    clearTimer(room.roomId);

    // Announce the word to everyone
    io.to(room.roomId).emit("system_message", {
        text: `Turn over! The word was: ${room.currentWord}`,
        type: 'system'
    });
    io.to(room.roomId).emit("word_revealed", { word: room.currentWord });
    io.to(room.roomId).emit("turn_ended", { 
        word: room.currentWord,
        scoreboard: room.getScoreboard()
    });

    // Wait 4 seconds so players can see the word, the final drawing, and their scores
    setTimeout(() => {
        // Ensure room still exists (e.g. everyone didn't leave)
        const currentRoom = getRoom(room.roomId);
        if (currentRoom) {
            currentRoom.nextTurn();
            
            if (currentRoom.status === "GAME_OVER") {
                io.to(currentRoom.roomId).emit("game_over", { scoreboard: currentRoom.getScoreboard() });
            } else {
                proceedToNextState(io, currentRoom);
            }
        }
    }, 4000);
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
            endTurnWithDelay(io, room);
        }
    }, 1000);

    timers.set(room.roomId, interval);
}

function startChoiceTimer(io, room) {
    clearTimer(room.roomId);
    room.timer = 15; // 15 seconds to choose

    const interval = setInterval(() => {
        room.timer--;
        io.to(room.roomId).emit("time_tick", { timeRemaining: room.timer });

        if (room.timer <= 0) {
            clearTimer(room.roomId);
            room.setWord(room.wordChoices[0]); // Auto pick
            proceedToNextState(io, room);
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

function proceedToNextState(io, room) {
    if (room.status === "GAME_OVER") {
        io.to(room.roomId).emit("game_over", {
            scoreboard: room.getScoreboard()
        });
    } else if (room.status === "CHOOSING_WORD") {
        io.to(room.roomId).emit("canvas_cleared");
        io.to(room.roomId).emit("choosing_word", {
            drawer: room.getCurrentDrawer(),
            round: room.round
        });
        const drawer = room.getCurrentDrawer();
        if (drawer) {
            io.to(drawer.socketId).emit("word_choices", {
                words: room.wordChoices
            });
        }
        startChoiceTimer(io, room);
    } else if (room.status === "PLAYING") {
        io.to(room.roomId).emit("canvas_cleared");
        io.to(room.roomId).emit("new_turn", {
            drawer: room.getCurrentDrawer(),
            wordHint: room.getWordHint(),
            round: room.round
        });
        const drawer = room.getCurrentDrawer();
        if (drawer) {
            io.to(drawer.socketId).emit("word_to_draw", { word: room.currentWord });
        }
        startTimer(io, room);
    }
}
