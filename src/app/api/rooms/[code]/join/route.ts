import { NextResponse } from "next/server";
import { z } from "zod";
import { joinRoom, toPublicRoom } from "@/lib/rooms";

const Body = z.object({
  name: z.string().min(1).max(24),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const body = Body.parse(await request.json());
    const result = joinRoom(code, body.name);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      playerId: result.player.id,
      room: toPublicRoom(result.room, result.player.id),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not join room" }, { status: 500 });
  }
}
