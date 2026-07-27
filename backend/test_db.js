import { connectDB } from "./src/db/connect.js";
import { GameHistory } from "./src/db/models/GameHistory.js";
import { User } from "./src/db/models/User.js";

async function run() {
    await connectDB();
    console.log("Connected.");
    
    // Create a mock user
    let user = await User.findOne({ username: "test_winner" });
    if (!user) {
        user = await User.create({ username: "test_winner", password: "123" });
    }
    
    console.log("Mock user ID:", user._id);

    try {
        const scoreboard = [
            {
                playerId: user._id.toString(),
                name: "WinnerName",
                score: 50,
                avatar: "bear"
            },
            {
                playerId: "guest-uuid",
                name: "LoserName",
                score: 10,
                avatar: "panda"
            }
        ];

        // 1. Save the game history
        const history = await GameHistory.create({
            roomId: "test_room",
            settings: {
                maxRounds: 1,
                drawTime: 30,
                difficulty: "EASY"
            },
            scoreboard
        });
        console.log(`💾 Saved Game History!`, history._id);

        if (scoreboard.length > 0) {
            const winnerId = scoreboard[0].playerId;

            for (const player of scoreboard) {
                // If playerId is a valid MongoDB ObjectId (24 char hex), they are logged in
                if (player.playerId.match(/^[0-9a-fA-F]{24}$/)) {
                    const isWinner = player.playerId === winnerId;
                    
                    const updated = await User.findByIdAndUpdate(player.playerId, {
                        $inc: {
                            totalScore: player.score,
                            gamesPlayed: 1,
                            gamesWon: isWinner ? 1 : 0
                        }
                    }, { new: true });
                    
                    console.log("Updated user stats:", updated);
                }
            }
        }
    } catch (err) {
        console.error("Failed!", err);
    }
    process.exit(0);
}
run();
