import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import { PeerServer } from "peer";
import { WebSocketServer, type WebSocket } from "ws";
import type { ClientMessage, ServerMessage } from "./types.js";

const isProduction = process.env.NODE_ENV === "production";

const PEERJS_PORT = 9000;
const WS_PORT = 8080;

const localSslOptions = {
    key: fs.readFileSync("./key.pem", "utf-8"),
    cert: fs.readFileSync("./cert.pem", "utf-8")
};

PeerServer({
    port: PEERJS_PORT,
    host: "0.0.0.0",
    ...(isProduction ? {} : { ssl: { ...localSslOptions } })
});

console.log(`PeerJS server running on port ${PEERJS_PORT}`);

let wsServer: http.Server | https.Server;

if (isProduction) {
    console.log("[PROD MODE] WebSocket: Creating HTTP server.");
    wsServer = http.createServer();
} else {
    console.log("[DEV MODE] WebSocket: Creating HTTPS server.");
    wsServer = https.createServer(localSslOptions);
}

const wss = new WebSocketServer({
    server: wsServer
});

const rooms: Map<string, Set<WebSocket>> = new Map();

function sendServerMessage(client: WebSocket, message: ServerMessage) {
    client.send(JSON.stringify(message));
}

function broadcastExceptConnection(connection: WebSocket, roomId: string, message: ServerMessage) {
    rooms.get(roomId)?.forEach((client) => {
        if (client !== connection && client.readyState === client.OPEN) {
            sendServerMessage(client, message);
        }
    });
}

wss.on("connection", (connection) => {
    let currentRoomId: string | null = null;
    let currentPeerId: string | null = null;

    connection.on("message", (bytes: Buffer) => {
        const message: ClientMessage = JSON.parse(bytes.toString());

        if (message.event === "join-room") {
            const { roomId, peerId } = message;

            currentRoomId = roomId;
            currentPeerId = peerId;

            if (!rooms.has(roomId)) {
                rooms.set(roomId, new Set());
            }
            rooms.get(roomId)!.add(connection);

            broadcastExceptConnection(connection, roomId, { event: "user-connected", peerId });
        }
    });

    connection.on("close", () => {
        if (currentRoomId && rooms.has(currentRoomId) && currentPeerId) {
            rooms.get(currentRoomId)!.delete(connection);
            broadcastExceptConnection(connection, currentRoomId, {
                event: "user-disconnected",
                peerId: currentPeerId
            });
        }
    });
});

wsServer.listen(WS_PORT, "0.0.0.0", () => {
    console.log(
        `WebSocket server running on port ${WS_PORT} in ${
            isProduction ? "PRODUCTION" : "DEVELOPMENT"
        } mode.`
    );
});
