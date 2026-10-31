"use client";

import { useEffect, useState } from "react";
import { GameRoom } from "@/components/GameRoom";
import type { PublicRoom } from "@/lib/types";

type Props = {
  code: string;
};

export function RoomGate({ code }: Props) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; playerId: string; room: PublicRoom }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const playerId = window.sessionStorage.getItem(`wl:${code}:playerId`);
      if (!playerId) {
        if (!cancelled) {
          setState({
            status: "error",
            message: "No player session for this room. Go back and join again.",
          });
        }
        return;
      }
      try {
        const res = await fetch(`/api/rooms/${code}?playerId=${playerId}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Room not found");
        const room = data.room as PublicRoom;
        if (!room.players.some((p) => p.id === playerId)) {
          throw new Error("You're not in this room anymore. Join again from home.");
        }
        if (!cancelled) {
          setState({ status: "ready", playerId, room });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Could not load room",
          });
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (state.status === "loading") {
    return <p className="waiting-note center-note">Tuning into room {code}…</p>;
  }

  if (state.status === "error") {
    return (
      <div className="panel error-panel">
        <h1 className="panel-title">Signal lost</h1>
        <p className="panel-copy">{state.message}</p>
        <a className="btn btn-primary" href="/">
          Back home
        </a>
      </div>
    );
  }

  return (
    <GameRoom
      code={code}
      playerId={state.playerId}
      initialRoom={state.room}
    />
  );
}
