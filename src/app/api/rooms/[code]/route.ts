import { NextResponse } from "next/server";
import { getRoom, toPublicRoom } from "@/lib/rooms";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const viewerId = new URL(request.url).searchParams.get("playerId") ?? undefined;
  return NextResponse.json({ room: toPublicRoom(room, viewerId) });
}
