import { DECISION_PROMPTS } from "@/lib/prompts";
import { getDecisionConfidence } from "@/lib/openai";
import type { Player, PublicRoom, Room, Round } from "@/lib/types";

type GlobalRooms = {
  __wavelengthRooms?: Map<string, Room>;
};

function store(): Map<string, Room> {
  const g = globalThis as typeof globalThis & GlobalRooms;
  if (!g.__wavelengthRooms) {
    g.__wavelengthRooms = new Map();
  }
  return g.__wavelengthRooms;
}

function codeFrom(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function createRoom(hostName: string): { room: Room; player: Player } {
  const rooms = store();
  let code = codeFrom();
  while (rooms.has(code)) code = codeFrom();

  const player: Player = {
    id: crypto.randomUUID(),
    name: hostName.trim().slice(0, 24) || "Host",
    score: 0,
    guess: null,
  };

  const room: Room = {
    code,
    hostId: player.id,
    phase: "lobby",
    players: [player],
    round: null,
    createdAt: Date.now(),
    usedPromptIndexes: [],
  };

  rooms.set(code, room);
  return { room, player };
}

export function getRoom(code: string): Room | undefined {
  return store().get(code.toUpperCase());
}

export function joinRoom(
  code: string,
  name: string,
): { room: Room; player: Player } | { error: string } {
  const room = getRoom(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "lobby") return { error: "Game already started" };
  if (room.players.length >= 12) return { error: "Room is full" };

  const trimmed = name.trim().slice(0, 24) || "Player";
  if (room.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
    return { error: "That name is taken in this room" };
  }

  const player: Player = {
    id: crypto.randomUUID(),
    name: trimmed,
    score: 0,
    guess: null,
  };
  room.players.push(player);
  return { room, player };
}

function pickPromptIndex(room: Room): number {
  if (room.usedPromptIndexes.length >= DECISION_PROMPTS.length) {
    room.usedPromptIndexes = [];
  }
  const available = DECISION_PROMPTS.map((_, i) => i).filter(
    (i) => !room.usedPromptIndexes.includes(i),
  );
  const index = available[Math.floor(Math.random() * available.length)]!;
  room.usedPromptIndexes.push(index);
  return index;
}

export async function startRound(
  code: string,
  playerId: string,
): Promise<{ room: Room } | { error: string }> {
  const room = getRoom(code);
  if (!room) return { error: "Room not found" };
  if (room.hostId !== playerId) return { error: "Only the host can start a round" };
  if (room.players.length < 1) return { error: "Need at least one player" };
  if (room.phase === "guessing") return { error: "Round already in progress" };

  const promptIndex = pickPromptIndex(room);
  const prompt = DECISION_PROMPTS[promptIndex]!;
  const ai = await getDecisionConfidence(prompt);

  for (const p of room.players) {
    p.guess = null;
  }

  const round: Round = {
    index: (room.round?.index ?? 0) + 1,
    prompt,
    decision: ai.decision,
    confidence: ai.confidence,
    reasoning: ai.reasoning,
    source: ai.source,
  };

  room.round = round;
  room.phase = "guessing";
  return { room };
}

export function submitGuess(
  code: string,
  playerId: string,
  guess: number,
): { room: Room } | { error: string } {
  const room = getRoom(code);
  if (!room) return { error: "Room not found" };
  if (room.phase !== "guessing") return { error: "Not accepting guesses" };
  if (!Number.isFinite(guess) || guess < 0 || guess > 100) {
    return { error: "Guess must be between 0 and 100" };
  }

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: "Player not in room" };

  player.guess = Math.round(guess);

  // Auto-reveal when everyone has guessed.
  if (room.players.every((p) => p.guess !== null)) {
    revealRoundInternal(room);
  }

  return { room };
}

function revealRoundInternal(room: Room) {
  if (!room.round) return;
  const target = room.round.confidence;
  const scored = room.players
    .filter((p) => p.guess !== null)
    .map((p) => ({
      player: p,
      distance: Math.abs((p.guess as number) - target),
    }))
    .sort((a, b) => a.distance - b.distance);

  if (scored.length === 0) {
    room.phase = "reveal";
    return;
  }

  const best = scored[0]!.distance;
  for (const entry of scored) {
    if (entry.distance === best) {
      entry.player.score += 1;
    }
  }
  room.phase = "reveal";
}

export function revealRound(
  code: string,
  playerId: string,
): { room: Room } | { error: string } {
  const room = getRoom(code);
  if (!room) return { error: "Room not found" };
  if (room.hostId !== playerId) return { error: "Only the host can reveal early" };
  if (room.phase !== "guessing") return { error: "Nothing to reveal" };
  revealRoundInternal(room);
  return { room };
}

export function toPublicRoom(room: Room, viewerId?: string): PublicRoom {
  const isReveal = room.phase === "reveal";
  const canSeeOwnGuess = (playerId: string) =>
    isReveal || playerId === viewerId;

  let results: PublicRoom["results"] = null;
  if (isReveal && room.round) {
    const target = room.round.confidence;
    const ranked = room.players
      .filter((p) => p.guess !== null)
      .map((p) => ({
        id: p.id,
        name: p.name,
        guess: p.guess as number,
        distance: Math.abs((p.guess as number) - target),
        winner: false,
      }))
      .sort((a, b) => a.distance - b.distance);

    if (ranked.length > 0) {
      const best = ranked[0]!.distance;
      for (const r of ranked) {
        r.winner = r.distance === best;
      }
    }
    results = ranked;
  }

  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      hasGuessed: p.guess !== null,
      guess: canSeeOwnGuess(p.id) ? p.guess : null,
    })),
    round: room.round
      ? {
          index: room.round.index,
          prompt: room.round.prompt,
          decision: isReveal ? room.round.decision : null,
          confidence: isReveal ? room.round.confidence : null,
          reasoning: isReveal ? room.round.reasoning : null,
          source: room.round.source,
        }
      : null,
    results,
  };
}
