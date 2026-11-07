import { NextResponse } from "next/server";
import { z } from "zod";
import { createRoom, toPublicRoom } from "@/lib/rooms";

const Body = z.object({
  name: z.string().min(1).max(24),
});

export async function POST(request: Request) {
  try {
    const body = Body.parse(await request.json());
    const { room, player } = createRoom(body.name);
    return NextResponse.json({
      playerId: player.id,
      room: toPublicRoom(room, player.id),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create room" }, { status: 500 });
  }
}
