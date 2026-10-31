import { NextResponse } from "next/server";
import { z } from "zod";
import { revealRound, toPublicRoom } from "@/lib/rooms";

const Body = z.object({
  playerId: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const body = Body.parse(await request.json());
    const result = revealRound(code, body.playerId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      room: toPublicRoom(result.room, body.playerId),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not reveal" }, { status: 500 });
  }
}
