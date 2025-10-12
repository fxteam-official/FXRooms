import { notFound } from "next/navigation";
import ClientPage from "./ClientPage";
import * as z from "zod";

type Props = {
    params: Promise<{ id: string }>;
};

const paramsSchema = z.object({
    id: z.uuid()
});

export default async function RoomPage({ params }: Readonly<Props>) {
    const parameters = await params;

    const { data, success } = paramsSchema.safeParse(parameters);

    if (!success) {
        notFound();
    }

    return <ClientPage roomId={data.id} />;
}
