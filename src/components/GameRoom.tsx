"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfidenceDial } from "@/components/ConfidenceDial";
import type { PublicRoom } from "@/lib/types";

type Props = {
  code: string;
  playerId: string;
  initialRoom: PublicRoom;
};

async function fetchRoom(code: string, playerId: string): Promise<PublicRoom> {
  const res = await fetch(`/api/rooms/${code}?playerId=${playerId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Room unavailable");
  const data = await res.json();
  return data.room as PublicRoom;
}

export function GameRoom({ code, playerId, initialRoom }: Props) {
  const [room, setRoom] = useState<PublicRoom>(initialRoom);
  const [guess, setGuess] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const me = room.players.find((p) => p.id === playerId);
  const isHost = room.hostId === playerId;
  const hasGuessed = Boolean(me?.hasGuessed);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const next = await fetchRoom(code, playerId);
        if (!cancelled) setRoom(next);
      } catch {
        /* keep last good state while polling */
      }
    };
    const id = window.setInterval(tick, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [code, playerId]);

  const post = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Request failed");
        setRoom(data.room as PublicRoom);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy code");
    }
  };

  return (
    <div className="room">
      <header className="room-top">
        <div>
          <p className="room-brand">Wavelength</p>
          <p className="room-meta">
            Room <button type="button" className="code-chip" onClick={copyCode}>{code}</button>
            {copied ? <span className="copied">Copied</span> : null}
          </p>
        </div>
        <p className="you-are">
          Playing as <strong>{me?.name ?? "…"}</strong>
          {isHost ? " · Host" : ""}
        </p>
      </header>

      {error ? <p className="banner-error" role="alert">{error}</p> : null}

      {room.phase === "lobby" ? (
        <section className="panel lobby-panel">
          <h1 className="panel-title">Waiting for the signal</h1>
          <p className="panel-copy">
            Share the room code. When everyone&apos;s in, the host tunes the first dilemma.
          </p>
          <ul className="player-list">
            {room.players.map((p) => (
              <li key={p.id}>
                <span>{p.name}</span>
                {p.id === room.hostId ? <em>host</em> : null}
              </li>
            ))}
          </ul>
          {isHost ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => post(`/api/rooms/${code}/start`, { playerId })}
            >
              {busy ? "Tuning…" : "Start round"}
            </button>
          ) : (
            <p className="waiting-note">Waiting for the host to start…</p>
          )}
        </section>
      ) : null}

      {room.phase === "guessing" && room.round ? (
        <section className="panel guess-panel">
          <p className="round-label">Round {room.round.index}</p>
          <h1 className="panel-title dilemma">{room.round.prompt}</h1>
          <p className="panel-copy">
            How confident will the AI be in its yes/no call? Lock your guess on the dial.
          </p>

          <ConfidenceDial
            value={hasGuessed ? (me?.guess ?? guess) : guess}
            onChange={hasGuessed ? undefined : setGuess}
            disabled={hasGuessed || busy}
            label="Your confidence guess"
          />

          {!hasGuessed ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() =>
                post(`/api/rooms/${code}/guess`, { playerId, guess })
              }
            >
              {busy ? "Locking…" : "Lock guess"}
            </button>
          ) : (
            <p className="waiting-note">Guess locked. Waiting for the others…</p>
          )}

          <ul className="guess-status">
            {room.players.map((p) => (
              <li key={p.id} data-ready={p.hasGuessed}>
                {p.name}
                <span>{p.hasGuessed ? "locked" : "tuning"}</span>
              </li>
            ))}
          </ul>

          {isHost ? (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => post(`/api/rooms/${code}/reveal`, { playerId })}
            >
              Reveal now
            </button>
          ) : null}
        </section>
      ) : null}

      {room.phase === "reveal" && room.round ? (
        <section className="panel reveal-panel">
          <p className="round-label">Round {room.round.index} · Reveal</p>
          <h1 className="panel-title dilemma">{room.round.prompt}</h1>
          <p className="ai-call">
            AI said <strong>{room.round.decision?.toUpperCase()}</strong> at{" "}
            <strong>{room.round.confidence}%</strong>
            {room.round.source === "mock" ? " (mock)" : ""}
          </p>
          {room.round.reasoning ? (
            <p className="ai-reason">{room.round.reasoning}</p>
          ) : null}

          <ConfidenceDial
            value={me?.guess ?? 50}
            target={room.round.confidence}
            disabled
            label="Your guess vs target"
          />

          <ol className="results">
            {(room.results ?? []).map((r) => (
              <li key={r.id} data-winner={r.winner}>
                <span className="results-name">
                  {r.winner ? "★ " : ""}
                  {r.name}
                </span>
                <span className="results-guess">{r.guess}%</span>
                <span className="results-dist">±{r.distance}</span>
              </li>
            ))}
          </ol>

          <ul className="scoreboard">
            {[...room.players]
              .sort((a, b) => b.score - a.score)
              .map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <strong>{p.score}</strong>
                </li>
              ))}
          </ul>

          {isHost ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => post(`/api/rooms/${code}/start`, { playerId })}
            >
              {busy ? "Tuning…" : "Next round"}
            </button>
          ) : (
            <p className="waiting-note">Waiting for the host…</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
