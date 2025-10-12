import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "FXRooms",
        short_name: "FXRooms",
        description:
            "FXRooms - это видеосвязь, какой она должна быть. Приватная. Бесплатная. Без регистрации. Создайте комнату в один клик и наслаждайтесь общением.",
        start_url: "/",
        display: "standalone",
        background_color: "#141318",
        theme_color: "#141318",
        icons: [
            {
                src: "/web-app-manifest-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable"
            },
            {
                src: "/web-app-manifest-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable"
            }
        ]
    };
}
