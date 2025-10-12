"use client";

import { useRouter } from "next/navigation";

export default function CreateRoomButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push(`/room/${crypto.randomUUID()}`)}
            className="bg-primary font-semibold text-lg px-2 py-1 text-fg rounded-md cursor-pointer"
        >
            Создать комнату
        </button>
    );
}
