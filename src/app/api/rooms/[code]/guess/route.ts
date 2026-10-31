import { NextResponse } from "next/server";
import { z } from "zod";
import { submitGuess, toPublicRoom } from "@/lib/rooms";

const Body = z.object({
  playerId: z.string().uuid(),
  guess: z.number().min(0).max(100),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const body = Body.parse(await request.json());
    const result = submitGuess(code, body.playerId, body.guess);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      room: toPublicRoom(result.room, body.playerId),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid guess" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not submit guess" }, { status: 500 });
  }
}
