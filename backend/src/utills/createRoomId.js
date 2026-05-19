import { customAlphabet } from "nanoid";

// Use only uppercase A-Z and digits for a 4-character ID
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 4);

export default function generateRoomId() {
    return nanoid();
}