import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
    title: "FXRooms",
    description:
        "FXRooms - это видеосвязь, какой она должна быть. Приватная. Бесплатная. Без регистрации. Создайте комнату в один клик и наслаждайтесь общением."
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru">
            <body className="antialiased">
                {children}
                <Toaster theme="dark" />
            </body>
        </html>
    );
}
