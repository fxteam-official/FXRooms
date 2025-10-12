import CreateRoomButton from "@/components/CreateRoomButton";

export default function Home() {
    return (
        <div className="h-[100dvh] flex justify-center items-center flex-col gap-1">
            <h1 className="font-semibold text-5xl bg-gradient-to-t from-fg to-primary-text text-transparent inline-block bg-clip-text">
                FXRooms
            </h1>
            <p>Простая видеосвязь для всех</p>
            <CreateRoomButton />
        </div>
    );
}
