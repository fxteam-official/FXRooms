import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Страница не найдена"
};

export default function NotFound() {
    return (
        <main className="h-[100dvh] flex flex-col gap-2 justify-center items-center">
            <h2 className="text-3xl font-semibold">Страница не найдена</h2>
            <Link href="/" className="text-center text-lg block text-primary font-medium underline">
                Домой
            </Link>
        </main>
    );
}
