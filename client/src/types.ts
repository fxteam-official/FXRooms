export type ServerMessage =
    | { event: "user-connected"; peerId: string }
    | { event: "user-disconnected"; peerId: string };
