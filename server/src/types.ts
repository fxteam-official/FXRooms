export type ClientMessage = { event: "join-room"; roomId: string; peerId: string };

export type ServerMessage =
    | { event: "user-connected"; peerId: string }
    | { event: "user-disconnected"; peerId: string };
