"use client";

import { ServerMessage } from "@/types";
import { Mic, MicOff, UserPlus, Video, VideoOff } from "lucide-react";
import Peer, { type MediaConnection } from "peerjs";
import { useEffect, useRef, useState } from "react";
import { PackedGrid } from "react-packed-grid";
import { toast } from "sonner";
import clsx from "clsx";

type Props = {
    roomId: string;
};

const calls: Map<string, MediaConnection> = new Map();

export default function ClientPage({ roomId }: Readonly<Props>) {
    const myVideoRef = useRef<HTMLVideoElement | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
    const [pinnedUser, setPinnedUser] = useState<string | null>(null);
    const [isMicOn, setIsMicOn] = useState<boolean>(true);
    const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
    const [isMyStreamStarted, setIsMyStreamStarted] = useState<boolean>(false);

    const myStreamRef = useRef<MediaStream | null>(null);
    const peerRef = useRef<Peer | null>(null);

    useEffect(() => {
        let ws: WebSocket | null = null;

        const isProduction = process.env.NODE_ENV === "production";

        navigator.mediaDevices
            .getUserMedia({ video: false, audio: true })
            .then((stream) => {
                myStreamRef.current = stream;
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                }

                setIsMyStreamStarted(true);

                peerRef.current = new Peer(crypto.randomUUID(), {
                    host: process.env.NEXT_PUBLIC_SERVER_URL,
                    port: isProduction ? 443 : 9000,
                    ...(isProduction ? { path: "/peerjs" } : {}),
                    config: {
                        iceServers: [
                            { urls: "stun:stun.l.google.com:19302" },
                            { urls: "stun:stun1.l.google.com:19302" },
                            { urls: "stun:stun2.l.google.com:19302" }
                        ]
                    }
                });
                const peer = peerRef.current;

                const removeUser = (peerId: string) => {
                    calls.get(peerId)?.close();
                    calls.delete(peerId);
                    setRemoteStreams((prev) => {
                        const newStreams = { ...prev };
                        delete newStreams[peerId];
                        return newStreams;
                    });
                };

                peer.on("open", (myPeerId) => {
                    ws = new WebSocket(
                        `wss://${process.env.NEXT_PUBLIC_SERVER_URL}${
                            isProduction ? "/ws" : ":8080"
                        }`
                    );
                    ws.onopen = () =>
                        ws!.send(JSON.stringify({ event: "join-room", roomId, peerId: myPeerId }));
                    ws.onmessage = (event) => {
                        const data: ServerMessage = JSON.parse(event.data);
                        if (data.event === "user-connected") {
                            const call = peer.call(data.peerId, myStreamRef.current!);
                            call.on("stream", (remoteStream) => {
                                setRemoteStreams((prev) => ({
                                    ...prev,
                                    [data.peerId]: remoteStream
                                }));
                            });
                            calls.set(data.peerId, call);
                            toast.info("Подключился новый пользователь");
                        }
                        if (data.event === "user-disconnected") {
                            removeUser(data.peerId);
                            toast.info("Пользователь отключился");
                        }
                    };

                    ws.onerror = (event) => {
                        console.error("Ошибка WebSocket:", event);
                        toast.error("Ошибка соединения. Пожалуйста, обновите страницу.");
                    };
                });

                peer.on("call", (call) => {
                    call.answer(myStreamRef.current!);
                    call.on("stream", (remoteStream) => {
                        setRemoteStreams((prev) => ({ ...prev, [call.peer]: remoteStream }));
                    });
                    calls.set(call.peer, call);
                });

                peer.on("error", (err) => {
                    console.error("Ошибка Peer.js:", err);
                    toast.error("Ошибка подключения");
                });
            })
            .catch((err) => {
                console.error("Не удалось получить доступ к микрофону:", err);
                toast.error("Не удалось получить доступ к микрофону");
            });

        return () => {
            myStreamRef.current?.getTracks().forEach((track) => track.stop());
            ws?.close();
            calls.forEach((call) => call.close());
            peerRef.current?.destroy();
            calls.clear();
        };
    }, [roomId]);

    const toggleMic = () => {
        if (myStreamRef.current) {
            myStreamRef.current
                .getAudioTracks()
                .forEach((track) => (track.enabled = !track.enabled));
            setIsMicOn((prev) => !prev);
        }
    };

    const toggleCamera = async () => {
        if (!myStreamRef.current || !peerRef.current) return;
        const stream = myStreamRef.current;
        const peer = peerRef.current;
        const videoTrack = stream.getVideoTracks()[0];

        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsCameraOn((prev) => !prev);
        } else {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = videoStream.getVideoTracks()[0];
                stream.addTrack(newVideoTrack);

                for (const [peerId, call] of calls.entries()) {
                    call.close();
                    const newCall = peer.call(peerId, stream);
                    newCall.on("stream", (remoteStream) => {
                        setRemoteStreams((prev) => ({ ...prev, [peerId]: remoteStream }));
                    });
                    calls.set(peerId, newCall);
                }

                setIsCameraOn(true);
            } catch (err) {
                console.error("Не удалось получить доступ к камере:", err);
                toast.error("Не удалось получить доступ к камере");
            }
        }
    };

    async function copyRoomLink() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Ссылка на комнату скопирована в буфер обмена");
        } catch {
            toast.error("Не удалось скопировать ссылку на комнату");
        }
    }

    return (
        <>
            {pinnedUser === null ? (
                <div className="p-2 h-[100dvh] w-screen">
                    {Object.entries(remoteStreams).length ? (
                        <PackedGrid className="w-full h-full" boxAspectRatio={16 / 9}>
                            {Object.entries(remoteStreams).map(([peerId, stream]) => (
                                <div className="h-full w-full" key={peerId}>
                                    <div
                                        className="aspect-video rounded-md overflow-hidden cursor-pointer p-1"
                                        onClick={() => setPinnedUser(peerId)}
                                    >
                                        <video
                                            className="w-full h-full bg-black object-cover transform -scale-x-100 rounded-md"
                                            autoPlay
                                            playsInline
                                            muted
                                            ref={(video) => {
                                                if (video) video.srcObject = stream;
                                            }}
                                        />
                                        <audio
                                            autoPlay
                                            ref={(audio) => {
                                                if (audio) audio.srcObject = stream;
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </PackedGrid>
                    ) : (
                        <div className="w-full h-full flex justify-center items-center">
                            {isMyStreamStarted ? (
                                <p className="text-neutral-400 text-center">
                                    Тишина. Пока что.
                                    <br />
                                    Отправьте ссылку на эту комнату собеседникам, чтобы начать
                                    разговор.
                                </p>
                            ) : (
                                <p className="text-neutral-400 text-center">
                                    Чтобы подключиться к комнате, сначала разрешите доступ к
                                    микрофону.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-[100dvh] w-full p-2 flex flex-col">
                    <div className="flex-grow relative">
                        <video
                            className="absolute top-0 left-0 w-full h-full object-contain transform -scale-x-100 bg-neutral-800 rounded-md cursor-pointer"
                            autoPlay
                            playsInline
                            ref={(video) => {
                                if (video && remoteStreams[pinnedUser])
                                    video.srcObject = remoteStreams[pinnedUser];
                            }}
                            onClick={() => setPinnedUser(null)}
                        />
                    </div>
                </div>
            )}

            <video
                className="fixed z-50 bottom-2 right-2 w-40 transform -scale-x-100 bg-black object-cover aspect-video rounded-md outline outline-primary"
                playsInline
                autoPlay
                muted
                ref={myVideoRef}
            />

            <div className="fixed bottom-2 left-2 sm:left-1/2 sm:transform sm:-translate-x-1/2 p-2 bg-neutral-700/40 backdrop-blur-sm flex justify-center items-center gap-2 rounded-full">
                <button
                    className={clsx(
                        "rounded-full bg-neutral-600/80 p-1.5 cursor-pointer",
                        !isMicOn && "text-red-300"
                    )}
                    onClick={toggleMic}
                >
                    {isMicOn ? <Mic /> : <MicOff />}
                </button>

                <button
                    className={clsx(
                        "rounded-full bg-neutral-600/80 p-1.5 cursor-pointer",
                        !isCameraOn && "text-red-300"
                    )}
                    onClick={toggleCamera}
                >
                    {isCameraOn ? <Video /> : <VideoOff />}
                </button>

                <button
                    className="rounded-full bg-neutral-600/80 p-1.5 cursor-pointer"
                    title="Скопировать ссылку на комнату"
                    onClick={copyRoomLink}
                >
                    <UserPlus />
                </button>
            </div>
        </>
    );
}
