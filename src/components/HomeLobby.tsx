"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HomeLobby() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const persistAndGo = (roomCode: string, playerId: string) => {
    window.sessionStorage.setItem(`wl:${roomCode}:playerId`, playerId);
    router.push(`/room/${roomCode}`);
  };

  const createRoom = async () => {
    setBusy("create");
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Host" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create room");
      persistAndGo(data.room.code, data.playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create room");
      setBusy(null);
    }
  };

  const joinRoom = async () => {
    setBusy("join");
    setError(null);
    try {
      const roomCode = code.trim().toUpperCase();
      const res = await fetch(`/api/rooms/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Player" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not join");
      persistAndGo(data.room.code, data.playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
      setBusy(null);
    }
  };

  return (
    <div className="home-actions">
      <label className="field">
        <span>Your name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          placeholder="e.g. Motun"
          autoComplete="nickname"
        />
      </label>

      <div className="cta-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy !== null}
          onClick={createRoom}
        >
          {busy === "create" ? "Opening…" : "Host a room"}
        </button>
      </div>

      <div className="join-row">
        <label className="field field-code">
          <span>Room code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={4}
            placeholder="ABCD"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy !== null || code.trim().length < 4}
          onClick={joinRoom}
        >
          {busy === "join" ? "Joining…" : "Join"}
        </button>
      </div>

      {error ? (
        <p className="banner-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
