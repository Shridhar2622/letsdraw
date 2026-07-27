import mongoose from "mongoose";

export async function connectDB() {
    try {
        const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/letsdraw";
        await mongoose.connect(uri);
        console.log("🟢 MongoDB Connected");
    } catch (error) {
        console.warn("🟡 MongoDB Connection Warning:", error.message);
        console.warn("   (This is fine if you are running locally without MongoDB installed. Game History will simply not be saved.)");
    }
}
